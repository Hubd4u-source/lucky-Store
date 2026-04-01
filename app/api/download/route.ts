import { FieldValue } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { getDownloadUrl } from '@/lib/blob'

export const runtime = 'nodejs'

const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20
const ASSET_ID_PATTERN = /^[a-zA-Z0-9_-]+$/

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const firstForwardedIp = forwardedFor?.split(',')[0]?.trim()

  return firstForwardedIp || realIp?.trim() || 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const current = rateLimitMap.get(ip)

  if (!current || current.resetAt <= now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    })
    return true
  }

  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }

  current.count += 1
  rateLimitMap.set(ip, current)
  return true
}

function isValidAssetId(assetId: string): boolean {
  return assetId.length >= 1 && assetId.length <= 128 && ASSET_ID_PATTERN.test(assetId)
}

async function handleDownload(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request)

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { assetId?: unknown }

  try {
    body = (await request.json()) as { assetId?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (typeof body.assetId !== 'string' || !isValidAssetId(body.assetId)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const assetId = body.assetId
  const { adminFirestore } =
    (await import('@/lib/firebase-admin')) as typeof import('@/lib/firebase-admin')
  const doc = await adminFirestore.collection('assets').doc(assetId).get()

  if (!doc.exists) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  const data = doc.data()

  if (!data?.visible) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  if (typeof data.fileStoragePath !== 'string' || !data.fileStoragePath) {
    return NextResponse.json({ error: 'Download unavailable' }, { status: 500 })
  }

  let url: string

  if (data.fileStoragePath.startsWith('blob-assets/')) {
    url = `/api/download/file/${assetId}`
  } else if (/^https?:\/\//i.test(data.fileStoragePath)) {
    url = getDownloadUrl(data.fileStoragePath)
  } else {
    const { adminStorage } =
      (await import('@/lib/firebase-admin')) as typeof import('@/lib/firebase-admin')
    const [signedUrl] = await adminStorage.file(data.fileStoragePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 60_000,
    })
    url = signedUrl
  }

  void adminFirestore
    .collection('assets')
    .doc(assetId)
    .update({
      downloadCount: FieldValue.increment(1),
    })
    .catch((error: unknown) => {
      console.error('Failed to increment download count:', error)
    })

  return NextResponse.json({ url })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    return await handleDownload(request)
  } catch (error: unknown) {
    console.error('Download API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
