import 'server-only'

const DEFAULT_BLOB_API_URL = 'https://vercel.com/api/blob'
const BLOB_API_VERSION = '12'

export type BlobAccess = 'public' | 'private'

export type BlobPutResult = {
  url: string
  downloadUrl: string
  pathname: string
  contentType: string
  contentDisposition: string
  etag: string
}

function getToken(token?: string): string {
  const resolvedToken = token || process.env.BLOB_READ_WRITE_TOKEN

  if (!resolvedToken) {
    throw new Error('Missing BLOB_READ_WRITE_TOKEN.')
  }

  return resolvedToken
}

function getStoreId(token: string): string {
  const [, , , storeId = ''] = token.split('_')

  if (!storeId) {
    throw new Error('Invalid Vercel Blob token.')
  }

  return storeId
}

function getApiUrl(pathname = ''): string {
  return `${process.env.VERCEL_BLOB_API_URL || DEFAULT_BLOB_API_URL}${pathname}`
}

function getApiHeaders(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    'x-api-version': process.env.VERCEL_BLOB_API_VERSION_OVERRIDE || BLOB_API_VERSION,
  }
}

function isBlobUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function constructBlobUrl(
  pathname: string,
  access: BlobAccess,
  token: string
): string {
  return `https://${getStoreId(token)}.${access}.blob.vercel-storage.com/${pathname}`
}

function inferAccessFromPathname(pathnameOrUrl: string): BlobAccess {
  if (
    pathnameOrUrl.startsWith('blob-assets/') ||
    pathnameOrUrl.startsWith('blob-previews/')
  ) {
    return 'public'
  }

  return 'public'
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } | string }

    if (typeof data.error === 'string') {
      return data.error
    }

    if (typeof data.error?.message === 'string') {
      return data.error.message
    }
  } catch {
    const text = await response.text().catch(() => '')
    if (text) {
      return text
    }
  }

  return `${response.status} ${response.statusText}`.trim()
}

export async function put(
  pathname: string,
  body: BodyInit,
  options: {
    access: BlobAccess
    contentType?: string
    addRandomSuffix?: boolean
    token?: string
    contentLength?: number
  }
): Promise<BlobPutResult> {
  const token = getToken(options.token)
  const params = new URLSearchParams({ pathname })
  const response = await fetch(getApiUrl(`/?${params.toString()}`), {
    method: 'PUT',
    body,
    headers: {
      ...getApiHeaders(token),
      'x-vercel-blob-access': options.access,
      ...(options.contentType ? { 'x-content-type': options.contentType } : {}),
      ...(options.addRandomSuffix !== undefined
        ? { 'x-add-random-suffix': options.addRandomSuffix ? '1' : '0' }
        : {}),
      ...(typeof options.contentLength === 'number'
        ? { 'x-content-length': String(options.contentLength) }
        : {}),
    },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  return (await response.json()) as BlobPutResult
}

export function getDownloadUrl(blobUrl: string): string {
  const url = new URL(blobUrl)
  url.searchParams.set('download', '1')
  return url.toString()
}

export function getBlobUrl(
  pathname: string,
  options?: {
    access?: BlobAccess
    token?: string
  }
): string {
  const token = getToken(options?.token)
  return constructBlobUrl(pathname, options?.access ?? inferAccessFromPathname(pathname), token)
}

export async function del(
  urlOrPathname: string,
  options?: {
    token?: string
  }
): Promise<void> {
  const token = getToken(options?.token)
  const url = isBlobUrl(urlOrPathname)
    ? urlOrPathname
    : constructBlobUrl(urlOrPathname, inferAccessFromPathname(urlOrPathname), token)

  const response = await fetch(getApiUrl('/delete'), {
    method: 'POST',
    headers: {
      ...getApiHeaders(token),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ urls: [url] }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }
}
