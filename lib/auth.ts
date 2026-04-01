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

function parseCsvEnv(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getAdminEmails(): string[] {
  const emails = [
    ...parseCsvEnv(process.env.ADMIN_EMAILS),
    ...parseCsvEnv(process.env.ADMIN_EMAIL),
  ]

  return Array.from(new Set(emails.map((email) => email.toLowerCase())))
}

export function getAdminEmail(): string | null {
  return getAdminEmails()[0] ?? null
}

export function getAdminUids(): string[] {
  const uids = [
    ...parseCsvEnv(process.env.ADMIN_UIDS),
    ...parseCsvEnv(process.env.ADMIN_UID),
    ...parseCsvEnv(process.env.NEXT_PUBLIC_ADMIN_UID),
  ]

  return Array.from(new Set(uids))
}

export function getAdminUid(): string | null {
  return getAdminUids()[0] ?? null
}

export function hasAdminIdentityConfig(): boolean {
  return getAdminEmails().length > 0 || getAdminUids().length > 0
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const adminEmails = getAdminEmails()

  if (adminEmails.length === 0 || !email) {
    return false
  }

  return adminEmails.includes(email.trim().toLowerCase())
}

export function isAdminUid(uid: string | null | undefined): boolean {
  const adminUids = getAdminUids()

  if (adminUids.length === 0 || !uid) {
    return false
  }

  return adminUids.includes(uid.trim())
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
