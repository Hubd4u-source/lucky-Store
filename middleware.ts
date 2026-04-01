import { NextRequest, NextResponse } from 'next/server'
import { decodeProtectedHeader, importX509, jwtVerify, type JWTPayload } from 'jose'

const SESSION_COOKIE_NAME = '__session'
const CERTS_URL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys'
const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
  process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
  ''
const SESSION_ISSUER = PROJECT_ID ? `https://session.firebase.google.com/${PROJECT_ID}` : ''

type CachedCerts = {
  keys: Record<string, string>
  expiresAt: number
}

type FirebaseSessionClaims = JWTPayload & {
  email?: string
  user_id?: string
}

let cachedCerts: CachedCerts | null = null

function parseCsvEnv(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getAdminEmails(): string[] {
  const emails = [
    ...parseCsvEnv(process.env.ADMIN_EMAILS),
    ...parseCsvEnv(process.env.ADMIN_EMAIL),
  ]

  return Array.from(new Set(emails.map((email) => email.toLowerCase())))
}

function getAdminUids(): string[] {
  const uids = [
    ...parseCsvEnv(process.env.ADMIN_UIDS),
    ...parseCsvEnv(process.env.ADMIN_UID),
    ...parseCsvEnv(process.env.NEXT_PUBLIC_ADMIN_UID),
  ]

  return Array.from(new Set(uids))
}

function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}

function getRedirectResponse(request: NextRequest, path: string): NextResponse {
  return clearSessionCookie(NextResponse.redirect(new URL(path, request.url)))
}

function getSessionCookie(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null
}

function parseMaxAge(cacheControl: string | null): number {
  if (!cacheControl) {
    return 300
  }

  const match = cacheControl.match(/max-age=(\d+)/)
  if (!match) {
    return 300
  }

  const value = Number.parseInt(match[1], 10)
  return Number.isFinite(value) && value > 0 ? value : 300
}

async function getCerts(): Promise<Record<string, string>> {
  const now = Date.now()

  if (cachedCerts && cachedCerts.expiresAt > now) {
    return cachedCerts.keys
  }

  const response = await fetch(CERTS_URL, {
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Firebase public certificates')
  }

  const keys = (await response.json()) as Record<string, string>
  const maxAgeSeconds = parseMaxAge(response.headers.get('cache-control'))

  cachedCerts = {
    keys,
    expiresAt: now + maxAgeSeconds * 1000,
  }

  return keys
}

async function verifySessionCookie(cookie: string): Promise<FirebaseSessionClaims | null> {
  const adminEmails = getAdminEmails()
  const adminUids = getAdminUids()

  if (!PROJECT_ID || !SESSION_ISSUER || (adminEmails.length === 0 && adminUids.length === 0)) {
    return null
  }

  const header = decodeProtectedHeader(cookie)
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
    return null
  }

  const certs = await getCerts()
  const cert = certs[header.kid]

  if (!cert) {
    return null
  }

  const publicKey = await importX509(cert, 'RS256')
  const { payload } = await jwtVerify(cookie, publicKey, {
    audience: PROJECT_ID,
    issuer: SESSION_ISSUER,
  })

  const claims = payload as FirebaseSessionClaims
  const nowSeconds = Math.floor(Date.now() / 1000)

  if (typeof claims.sub !== 'string' || claims.sub.length === 0) {
    return null
  }

  if (typeof claims.iat !== 'number' || claims.iat > nowSeconds) {
    return null
  }

  const emailMatches =
    adminEmails.length > 0 &&
    typeof claims.email === 'string' &&
    adminEmails.includes(claims.email.trim().toLowerCase())
  const uidMatches =
    adminUids.length > 0 &&
    typeof claims.sub === 'string' &&
    adminUids.includes(claims.sub.trim())

  if (!emailMatches && !uidMatches) {
    return null
  }

  return claims
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/admin/login'
  const sessionCookie = getSessionCookie(request)
  const isDevelopment = process.env.NODE_ENV !== 'production'

  if (!sessionCookie) {
    if (isLoginPage) {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  try {
    if (isDevelopment) {
      if (isLoginPage) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }

      return NextResponse.next()
    }

    const claims = await verifySessionCookie(sessionCookie)

    if (!claims) {
      return getRedirectResponse(request, '/admin/login')
    }

    if (isLoginPage) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    return NextResponse.next()
  } catch {
    return getRedirectResponse(request, '/admin/login')
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
