# ARCHITECTURE — LogiCrowned Asset Store
**Stack:** Next.js 14 (App Router) + Firebase + Vercel
**Version:** 1.0

---

## 1. TECH STACK

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR + static + API routes |
| Database | Firebase Firestore | Asset metadata storage |
| File Storage | Firebase Storage | Images + downloadable files |
| Auth | Firebase Auth | Admin-only authentication |
| Hosting | Vercel | Deployment + Edge middleware |
| Styling | CSS Modules + CSS Variables | Scoped styles, design tokens |
| Icons | Lucide React | UI icons |

---

## 2. DIRECTORY STRUCTURE

```
logicrowned-assets/
├── app/
│   ├── layout.tsx                  # Root layout, fonts, global CSS
│   ├── page.tsx                    # Public store (/)
│   ├── globals.css                 # CSS variables, resets
│   ├── admin/
│   │   ├── layout.tsx              # Admin layout — auth guard
│   │   ├── login/
│   │   │   └── page.tsx            # /admin/login
│   │   └── dashboard/
│   │       └── page.tsx            # /admin/dashboard
│   └── api/
│       └── download/
│           └── route.ts            # Signed URL generation endpoint
├── components/
│   ├── store/
│   │   ├── Header.tsx
│   │   ├── FilterBar.tsx
│   │   ├── AssetGrid.tsx
│   │   ├── AssetCard.tsx
│   │   ├── DownloadModal.tsx
│   │   └── EmptyState.tsx
│   ├── admin/
│   │   ├── AdminHeader.tsx
│   │   ├── AssetTable.tsx
│   │   ├── AssetForm.tsx
│   │   └── DeleteConfirm.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Modal.tsx
├── lib/
│   ├── firebase.ts                 # Firebase client init
│   ├── firebase-admin.ts           # Firebase Admin SDK (server-side)
│   ├── assets.ts                   # Firestore CRUD functions
│   └── auth.ts                     # Auth helpers
├── middleware.ts                   # Vercel Edge — admin route protection
├── public/
│   └── fonts/                      # Self-hosted fonts (optional)
├── .env.local                      # Firebase config (NEVER commit)
└── next.config.js
```

---

## 3. FIREBASE DATA SCHEMA

### Collection: `assets`

```typescript
interface Asset {
  id: string;                    // Firestore auto-ID
  title: string;                 // "Hand Holding Robot"
  tags: string[];                // ["hand", "robot", "png", "3d"]
  format: "PNG" | "JPG" | "SVG" | "PACK";
  previewUrl: string;            // Firebase Storage public URL (thumbnail)
  fileStoragePath: string;       // Storage path — NEVER exposed to client directly
                                 // e.g. "assets/abc123/file.png"
  visible: boolean;              // true = shown on store
  createdAt: Timestamp;
  updatedAt: Timestamp;
  downloadCount: number;         // increment on each download
}
```

### Collection: `admin_config` (single doc)
```typescript
interface AdminConfig {
  allowedEmail: string;          // Only this email can log in as admin
}
```

---

## 4. FIREBASE SECURITY RULES

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // PUBLIC: read visible assets only
    match /assets/{assetId} {
      allow read: if resource.data.visible == true;
      allow write: if request.auth != null
                   && request.auth.token.email == 'YOUR_ADMIN_EMAIL';
    }

    // ADMIN ONLY: full access
    match /admin_config/{doc} {
      allow read, write: if request.auth != null
                         && request.auth.token.email == 'YOUR_ADMIN_EMAIL';
    }
  }
}
```

### Firebase Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Preview images: public read
    match /previews/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.token.email == 'YOUR_ADMIN_EMAIL';
    }

    // Asset files: NO direct public access — signed URLs only
    match /assets/{assetId}/{fileName} {
      allow read: if false;      // Blocked. Signed URLs bypass this rule server-side.
      allow write: if request.auth != null
                   && request.auth.token.email == 'YOUR_ADMIN_EMAIL';
    }
  }
}
```

---

## 5. SIGNED URL DOWNLOAD FLOW

This is critical. Raw file URLs must NEVER be exposed to the client.

```
User clicks Download
        ↓
Client calls: POST /api/download  { assetId: "abc123" }
        ↓
API Route (server-side, uses Firebase Admin SDK):
  1. Verify assetId exists in Firestore
  2. Verify asset.visible === true
  3. Generate signed URL (expires in 60 seconds)
  4. Increment asset.downloadCount
  5. Return { url: signedUrl }
        ↓
Client opens signed URL → file downloads
Signed URL expires in 60s — cannot be shared or reused
```

### `/app/api/download/route.ts` Logic
```typescript
import { adminStorage, adminFirestore } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  const { assetId } = await req.json();

  // 1. Validate input
  if (!assetId || typeof assetId !== 'string') {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  // 2. Fetch asset from Firestore
  const doc = await adminFirestore.collection('assets').doc(assetId).get();
  if (!doc.exists || !doc.data()?.visible) {
    return Response.json({ error: 'Asset not found' }, { status: 404 });
  }

  // 3. Generate signed URL (60 seconds expiry)
  const [url] = await adminStorage
    .file(doc.data()!.fileStoragePath)
    .getSignedUrl({ action: 'read', expires: Date.now() + 60_000 });

  // 4. Increment download count (non-blocking)
  adminFirestore.collection('assets').doc(assetId).update({
    downloadCount: adminFirestore.FieldValue.increment(1)
  });

  return Response.json({ url });
}
```

---

## 6. ADMIN AUTH FLOW

```
/admin/dashboard hit
        ↓
middleware.ts checks Firebase Auth session cookie
        ↓
No valid cookie → redirect to /admin/login
        ↓
Login form → Firebase Auth signInWithEmailAndPassword
        ↓
Check: auth.currentUser.email === ADMIN_EMAIL (env var)
        ↓
If mismatch → sign out immediately + show error
        ↓
Set session cookie → redirect to /admin/dashboard
```

### middleware.ts
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  const sessionCookie = request.cookies.get('__session');

  if (isAdminRoute && !isLoginPage && !sessionCookie) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

---

## 7. ENVIRONMENT VARIABLES

### `.env.local` — NEVER commit to Git
```bash
# Firebase Client (public — safe to expose via NEXT_PUBLIC_)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK (server-only — NEVER prefix with NEXT_PUBLIC_)
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PROJECT_ID=

# Admin access control
ADMIN_EMAIL=your@email.com
```

---

## 8. RATE LIMITING (Vercel Edge)

Add to `/app/api/download/route.ts`:
```typescript
// Simple IP-based rate limit: max 20 downloads per minute per IP
// Use Vercel KV or Upstash Redis in production
const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
// Check rate limit before processing
```

For production: integrate **Upstash Redis** with `@upstash/ratelimit` — free tier covers this use case.

---

## 9. DEPLOYMENT CHECKLIST

```
[ ] Firebase project created
[ ] Firestore database enabled (production mode)
[ ] Firebase Storage enabled
[ ] Firebase Auth enabled (Email/Password provider)
[ ] Admin user created in Firebase Auth console
[ ] Firestore Security Rules deployed
[ ] Storage Security Rules deployed
[ ] All .env.local vars added to Vercel Environment Variables
[ ] ADMIN_EMAIL set in Vercel env
[ ] Git repo connected to Vercel
[ ] Custom domain configured (assets.logicrowned.store)
```

---

*File: ARCHITECTURE.md | LogiCrowned Asset Store v1.0*
