import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { ADMIN_SESSION_COOKIE_NAME, assertAdminIdentity } from '@/lib/auth'
import { put } from '@/lib/blob'
import type { BlobPutResult } from '@/types/blob'

export const runtime = 'nodejs'

const MAX_PREVIEW_BYTES = 2 * 1024 * 1024
const MAX_ASSET_BYTES = 50 * 1024 * 1024

type UploadKind = 'preview' | 'asset'

function getUploadKind(value: string | null): UploadKind | null {
  if (value === 'preview' || value === 'asset') {
    return value
  }

  return null
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getPathname(kind: UploadKind, assetId: string, filename: string): string {
  const safeAssetId = sanitizeSegment(assetId)
  const safeFilename = sanitizeSegment(filename) || 'file'

  if (!safeAssetId) {
    throw new Error('Invalid asset id.')
  }

  if (kind === 'preview') {
    return `blob-previews/${safeAssetId}/${Date.now()}-${safeFilename}`
  }

  return `blob-assets/${safeAssetId}/${Date.now()}-${safeFilename}`
}

async function assertAdminSession(request: NextRequest): Promise<void> {
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    throw new Error('Authentication required.')
  }

  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
  assertAdminIdentity({
    email: decoded.email,
    uid: decoded.uid ?? decoded.sub,
  })
}

function getMaxBytes(kind: UploadKind): number {
  return kind === 'preview' ? MAX_PREVIEW_BYTES : MAX_ASSET_BYTES
}

function getAllowedContentType(kind: UploadKind, contentType: string): boolean {
  if (kind === 'preview') {
    return contentType.startsWith('image/')
  }

  return true
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await assertAdminSession(request)

    const filename = request.nextUrl.searchParams.get('filename')
    const assetId = request.nextUrl.searchParams.get('assetId')
    const kind = getUploadKind(request.nextUrl.searchParams.get('kind'))
    const contentType = request.headers.get('content-type')?.trim() || 'application/octet-stream'
    const contentLength = Number.parseInt(request.headers.get('content-length') ?? '', 10)

    if (!filename || !assetId || !kind) {
      return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 })
    }

    if (Number.isFinite(contentLength) && contentLength > getMaxBytes(kind)) {
      return NextResponse.json({ error: 'File is too large.' }, { status: 400 })
    }

    if (!getAllowedContentType(kind, contentType)) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 })
    }

    if (!request.body) {
      return NextResponse.json({ error: 'Missing upload body.' }, { status: 400 })
    }

    const body = new Uint8Array(await request.arrayBuffer())
    const blob = (await put(getPathname(kind, assetId, filename), body, {
      access: kind === 'preview' ? 'public' : 'private',
      addRandomSuffix: false,
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentLength: body.byteLength,
    })) as BlobPutResult

    return NextResponse.json(blob)
  } catch (error) {
    console.error('Blob upload failed:', error)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
