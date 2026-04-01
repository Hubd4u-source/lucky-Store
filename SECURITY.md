# SECURITY — LogiCrowned Asset Store
**Stack:** Next.js 14 + Firebase + Vercel
**Threat Model:** Public asset store with single admin
**Version:** 1.0

---

## 1. THREAT MODEL

| Threat | Risk | Mitigation |
|---|---|---|
| Unauthenticated write to Firestore | HIGH | Firebase Security Rules block all writes without auth |
| Scraping raw asset file URLs | HIGH | Signed URLs (60s TTL) — never expose storage paths |
| Admin credential brute force | HIGH | Firebase Auth + rate limiting + single allowed email |
| XSS via asset titles/tags | MEDIUM | React escapes all output by default; no dangerouslySetInnerHTML |
| Admin session hijack | MEDIUM | HttpOnly session cookie, short TTL |
| Unauthorized admin access | HIGH | Middleware + email whitelist double-check |
| Mass download abuse | MEDIUM | Signed URL expiry + Vercel rate limiting |
| File upload abuse (admin) | LOW | Admin-only upload path; Firebase Storage size rules |
| Exposed API keys | LOW | Firebase client keys are safe to expose; Storage Rules are the lock |

---

## 2. FIREBASE SECURITY RULES (FINAL)

### Firestore — Deploy via Firebase Console

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function
    function isAdmin() {
      return request.auth != null
          && request.auth.token.email == 'YOUR_ADMIN_EMAIL_HERE';
    }

    // ASSETS COLLECTION
    match /assets/{assetId} {
      // Public: read ONLY if visible = true
      // This prevents hidden/draft assets from being fetched
      allow read: if resource.data.visible == true;

      // Admin: full CRUD
      allow create, update, delete: if isAdmin();

      // Admin: also read hidden assets
      allow read: if isAdmin();
    }

    // ADMIN CONFIG — admin only
    match /admin_config/{doc} {
      allow read, write: if isAdmin();
    }

    // DENY ALL OTHER PATHS
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Firebase Storage Rules — Deploy via Firebase Console

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAdmin() {
      return request.auth != null
          && request.auth.token.email == 'YOUR_ADMIN_EMAIL_HERE';
    }

    // PREVIEW IMAGES — public read, admin write only
    match /previews/{fileName} {
      allow read: if true;
      allow write: if isAdmin()
                   && request.resource.size < 2 * 1024 * 1024       // 2MB max
                   && request.resource.contentType.matches('image/.*');
      allow delete: if isAdmin();
    }

    // ASSET FILES — NO public access (signed URLs only), admin write only
    match /assets/{assetId}/{fileName} {
      allow read: if false;          // BLOCKED. Server-side signed URL bypasses this.
      allow write: if isAdmin()
                   && request.resource.size < 50 * 1024 * 1024;     // 50MB max
      allow delete: if isAdmin();
    }

    // DENY EVERYTHING ELSE
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. SIGNED URL SYSTEM

### Why Signed URLs
- Raw Firebase Storage URLs (getDownloadURL) are permanent and scrapable
- Signed URLs expire — they cannot be shared, bookmarked, or scraped en masse
- Even if someone intercepts a signed URL, it expires in 60 seconds
- File storage paths are never sent to the client — only via server-side Admin SDK

### Full Server-Side Flow

**File:** `app/api/download/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminStorage, adminFirestore } from '@/lib/firebase-admin';

// Rate limiting (basic — upgrade to Upstash Redis for production)
const downloadAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = downloadAttempts.get(ip);

  if (!entry || entry.resetAt < now) {
    downloadAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 20) return false; // Max 20 downloads per minute per IP

  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // 1. Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // 2. Parse and validate body
  let body: { assetId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { assetId } = body;

  if (!assetId || typeof assetId !== 'string' || assetId.length > 128) {
    return NextResponse.json({ error: 'Invalid asset ID' }, { status: 400 });
  }

  // 3. Fetch asset from Firestore (server-side — bypasses client rules)
  const docRef = adminFirestore.collection('assets').doc(assetId);
  const doc = await docRef.get();

  if (!doc.exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const asset = doc.data()!;

  // 4. Check visibility — hidden assets cannot be downloaded
  if (!asset.visible) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 5. Validate fileStoragePath exists
  if (!asset.fileStoragePath || typeof asset.fileStoragePath !== 'string') {
    return NextResponse.json({ error: 'File not available' }, { status: 500 });
  }

  // 6. Generate signed URL — expires in 60 seconds
  try {
    const [signedUrl] = await adminStorage
      .file(asset.fileStoragePath)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + 60_000,  // 60 seconds
      });

    // 7. Increment download count (fire and forget — non-blocking)
    docRef.update({
      downloadCount: adminFirestore.FieldValue.increment(1),
    }).catch(console.error);

    // 8. Return signed URL
    return NextResponse.json({ url: signedUrl });

  } catch (err) {
    console.error('Signed URL generation failed:', err);
    return NextResponse.json({ error: 'Download unavailable' }, { status: 500 });
  }
}

// Block all other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
```

---

## 4. ADMIN AUTH FLOW (Full Implementation)

### Session Cookie API Route

**File:** `app/api/auth/session/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 days in ms

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  if (!idToken) {
    return NextResponse.json({ error: 'No token' }, { status: 400 });
  }

  // Verify token with Admin SDK
  const decoded = await adminAuth.verifyIdToken(idToken);

  // Whitelist check — only one email allowed
  if (decoded.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Create session cookie
  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION,
  });

  const response = NextResponse.json({ status: 'ok' });
  response.cookies.set('__session', sessionCookie, {
    httpOnly: true,           // JS cannot read this cookie
    secure: true,             // HTTPS only
    sameSite: 'strict',       // CSRF protection
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'signed out' });
  response.cookies.delete('__session');
  return response;
}
```

### Middleware — Route Protection

**File:** `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin/login)
  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Final email check in middleware
    if (decoded.email !== process.env.ADMIN_EMAIL) {
      throw new Error('Unauthorized email');
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('__session');
    return response;
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

---

## 5. FIREBASE ADMIN SDK INIT (Server-Only)

**File:** `lib/firebase-admin.ts`

```typescript
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Prevent duplicate initialization in Next.js dev
let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  adminApp = getApps()[0];
}

export const adminFirestore = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp).bucket();
export const adminAuth = getAuth(adminApp);
```

---

## 6. ENVIRONMENT VARIABLE RULES

```
✅ NEXT_PUBLIC_*    → Client-safe Firebase config (API key, project ID etc.)
                     Firebase client keys are designed to be public.
                     Security is enforced by Firebase Rules, NOT by hiding keys.

❌ FIREBASE_ADMIN_* → Server-only. NEVER prefix with NEXT_PUBLIC_
                     If leaked, attacker gets full DB/Storage access.

❌ ADMIN_EMAIL      → Server-only. Controls who can be admin.
```

### .gitignore — Mandatory
```
.env.local
.env*.local
*.pem
firebase-adminsdk-*.json
```

---

## 7. SECURITY CHECKLIST

### Firebase
```
[ ] Firestore rules deployed and tested (not in "test mode")
[ ] Storage rules deployed (asset files NOT publicly readable)
[ ] Firebase Auth has only 1 user (admin)
[ ] No service account key JSON file committed to repo
```

### API Routes
```
[ ] /api/download validates assetId type + length
[ ] /api/download checks asset.visible before generating URL
[ ] /api/download never returns fileStoragePath to client
[ ] /api/auth/session uses httpOnly + secure + sameSite=strict cookies
[ ] All API routes return 405 for unsupported methods
```

### Admin
```
[ ] Admin email check in: Firebase Rules + middleware + login handler (triple check)
[ ] Session cookie expires in 5 days
[ ] Sign out deletes __session cookie server-side
[ ] Admin panel routes return 302 → /admin/login if cookie missing/invalid
```

### Frontend
```
[ ] No dangerouslySetInnerHTML used anywhere
[ ] No raw fileStoragePath or signed URLs cached in client state
[ ] Download modal requests fresh signed URL on each click
[ ] Asset IDs sanitized before passing to API
```

---

*File: SECURITY.md | LogiCrowned Asset Store v1.0*
