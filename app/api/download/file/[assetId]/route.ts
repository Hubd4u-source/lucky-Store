import { NextRequest, NextResponse } from 'next/server'
import { getPrivateBlob } from '@/lib/blob'

export const runtime = 'nodejs'

function getDownloadName(pathname: string): string {
  const segments = pathname.split('/')
  return segments[segments.length - 1] || 'download'
}

async function getAssetFilePath(assetId: string): Promise<string | null> {
  const { adminFirestore } = await import('@/lib/firebase-admin')
  const doc = await adminFirestore.collection('assets').doc(assetId).get()

  if (!doc.exists) {
    return null
  }

  const data = doc.data()

  if (!data?.visible || typeof data.fileStoragePath !== 'string' || !data.fileStoragePath) {
    return null
  }

  return data.fileStoragePath
}

export async function GET(
  _request: NextRequest,
  context: { params: { assetId: string } }
): Promise<NextResponse> {
  try {
    const fileStoragePath = await getAssetFilePath(context.params.assetId)

    if (!fileStoragePath || !fileStoragePath.startsWith('blob-assets/')) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const blob = await getPrivateBlob(fileStoragePath, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    if (!blob || !blob.body) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return new NextResponse(blob.body, {
      status: 200,
      headers: {
        'content-type': blob.headers.get('content-type') || 'application/octet-stream',
        'content-disposition':
          blob.headers.get('content-disposition') ||
          `attachment; filename="${getDownloadName(fileStoragePath)}"`,
        'cache-control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('Blob file download failed:', error)
    return NextResponse.json({ error: 'Download unavailable' }, { status: 500 })
  }
}
