import 'server-only'

export const ADMIN_SESSION_COOKIE_NAME = '__session'
export const ADMIN_SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5

export class AuthError extends Error {
  readonly status: number
  readonly code: 'missing-admin-identity' | 'forbidden'

  constructor(
    message: string,
    status: number,
    code: 'missing-admin-identity' | 'forbidden'
  ) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.code = code
  }
}

export function getAdminEmail(): string | null {
  const email = process.env.ADMIN_EMAIL?.trim()
  return email ? email : null
}

export function getAdminUid(): string | null {
  const uid = process.env.ADMIN_UID?.trim() ?? process.env.NEXT_PUBLIC_ADMIN_UID?.trim()
  return uid ? uid : null
}

export function hasAdminIdentityConfig(): boolean {
  return Boolean(getAdminEmail() || getAdminUid())
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmail = getAdminEmail()

  if (!adminEmail || !email) {
    return false
  }

  return email.trim().toLowerCase() === adminEmail.toLowerCase()
}

export function isAdminUid(uid: string | null | undefined): boolean {
  const adminUid = getAdminUid()

  if (!adminUid || !uid) {
    return false
  }

  return uid.trim() === adminUid
}

export function isAdminIdentity(identity: {
  email?: string | null
  uid?: string | null
}): boolean {
  return isAdminUid(identity.uid) || isAdminEmail(identity.email)
}

export function assertAdminIdentity(identity: {
  email?: string | null
  uid?: string | null
}): string {
  if (!isAdminIdentity(identity)) {
    throw new AuthError('Access denied.', 403, 'forbidden')
  }

  return identity.uid?.trim() || identity.email?.trim() || ''
}
