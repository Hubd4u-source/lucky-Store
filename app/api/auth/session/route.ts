import { NextRequest, NextResponse } from 'next/server'

import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_DURATION_MS,
  getAdminUid,
  getAdminEmail,
  hasAdminIdentityConfig,
} from '@/lib/auth'

export const runtime = 'nodejs'

function buildAccessDeniedMessage(
  decodedEmail: string | null,
  decodedUid: string | null,
  adminEmail: string | null,
  adminUid: string | null
): string {
  if (process.env.NODE_ENV === 'production') {
    return 'Access denied.'
  }

  const actual = decodedEmail ?? 'unknown'
  const expectedParts = [adminEmail, adminUid].filter(Boolean).join(' or ')
  return `Access denied. Signed in as ${actual} (uid ${decodedUid ?? 'unknown'}), expected ${expectedParts}.`
}

function createSessionResponse(sessionCookie: string): NextResponse {
  const response = NextResponse.json({ status: 'ok' })
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_DURATION_MS / 1000,
  })

  return response
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: { idToken?: unknown }

    try {
      body = (await request.json()) as { idToken?: unknown }
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (typeof body.idToken !== 'string' || !body.idToken) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const adminEmail = getAdminEmail()
    const adminUid = getAdminUid()
    if (!hasAdminIdentityConfig()) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const { adminAuth } =
      (await import('@/lib/firebase-admin')) as typeof import('@/lib/firebase-admin')
    const decoded = await adminAuth.verifyIdToken(body.idToken, false)
    const decodedEmail = decoded.email?.trim().toLowerCase()
    const decodedUid = decoded.uid?.trim() ?? null

    const emailMatches =
      Boolean(adminEmail) && Boolean(decodedEmail) && decodedEmail === adminEmail!.toLowerCase()
    const uidMatches = Boolean(adminUid) && Boolean(decodedUid) && decodedUid === adminUid

    if (!emailMatches && !uidMatches) {
      return NextResponse.json(
        { error: buildAccessDeniedMessage(decodedEmail ?? null, decodedUid, adminEmail, adminUid) },
        { status: 403 }
      )
    }

    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: ADMIN_SESSION_DURATION_MS,
    })

    return createSessionResponse(sessionCookie)
  } catch (error: unknown) {
    console.error('Session API Error:', error)
    return NextResponse.json({ error: 'Failed to set session' }, { status: 500 })
  }
}

export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json({ status: 'signed out' })
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}
