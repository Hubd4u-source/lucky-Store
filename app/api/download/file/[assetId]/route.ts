import { NextRequest, NextResponse } from 'next/server'
import { getBlobUrl, getDownloadUrl } from '@/lib/blob'

export const runtime = 'nodejs'

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

    return NextResponse.redirect(
      getDownloadUrl(
        getBlobUrl(fileStoragePath, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        })
      )
    )
  } catch (error) {
    console.error('Blob file download failed:', error)
    return NextResponse.json({ error: 'Download unavailable' }, { status: 500 })
  }
}
