import 'server-only'

import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminFirestore } from '@/lib/firebase-admin'
import type { ApiError, Asset, AssetFormat, AssetPublic, AssetSortBy } from '@/types'

const ASSETS_COLLECTION = 'assets'
const VALID_FORMATS: readonly AssetFormat[] = ['PNG', 'JPG', 'SVG', 'PACK']

type AssetDocumentData = {
  title?: unknown
  tags?: unknown
  format?: unknown
  description?: unknown
  sitePageIds?: unknown
  previewUrl?: unknown
  fileStoragePath?: unknown
  bundleSize?: unknown
  fileCount?: unknown
  visible?: unknown
  createdAt?: unknown
  updatedAt?: unknown
  downloadCount?: unknown
}

export type AssetUpdateData = Partial<Omit<Asset, 'id'>>

export class DataLayerError extends Error {
  readonly status: number
  readonly code:
    | 'invalid-argument'
    | 'not-found'
    | 'firestore-error'
    | 'serialization-error'

  constructor(
    message: string,
    status: number,
    code:
      | 'invalid-argument'
      | 'not-found'
      | 'firestore-error'
      | 'serialization-error',
    cause?: unknown
  ) {
    super(message)
    this.name = 'DataLayerError'
    this.status = status
    this.code = code
    if (cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = cause
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new DataLayerError(`Invalid ${field}`, 500, 'serialization-error')
  }

  const result = value.map((item) => {
    if (typeof item !== 'string') {
      throw new DataLayerError(`Invalid ${field}`, 500, 'serialization-error')
    }
    return item
  })

  return result
}

function toDate(value: unknown, field: string): Date {
  if (value instanceof Date) {
    return new Date(value.getTime())
  }

  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  throw new DataLayerError(`Invalid ${field}`, 500, 'serialization-error')
}

function toNumber(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  throw new DataLayerError(`Invalid ${field}`, 500, 'serialization-error')
}

function toOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value === 'string') {
    return value
  }

  throw new DataLayerError(`Invalid ${field}`, 500, 'serialization-error')
}

function toOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  throw new DataLayerError(`Invalid ${field}`, 500, 'serialization-error')
}

function toBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  throw new DataLayerError(`Invalid ${field}`, 500, 'serialization-error')
}

function toAssetFormat(value: unknown): AssetFormat {
  if (typeof value === 'string') {
    const format = value.toUpperCase()
    if ((VALID_FORMATS as readonly string[]).includes(format)) {
      return format as AssetFormat
    }
  }

  throw new DataLayerError('Invalid format', 500, 'serialization-error')
}

function normalizeId(id: string): string {
  const trimmed = id.trim()
  if (!trimmed) {
    throw new DataLayerError('Invalid asset id', 400, 'invalid-argument')
  }
  return trimmed
}

function normalizeAssetRecord(id: string, data: AssetDocumentData): Asset {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : (() => {
      throw new DataLayerError('Invalid title', 500, 'serialization-error')
    })(),
    tags: toStringArray(data.tags, 'tags'),
    format: toAssetFormat(data.format),
    description: toOptionalString(data.description, 'description'),
    sitePageIds: Array.isArray(data.sitePageIds) ? toStringArray(data.sitePageIds, 'sitePageIds') : undefined,
    previewUrl: typeof data.previewUrl === 'string' ? data.previewUrl : (() => {
      throw new DataLayerError('Invalid previewUrl', 500, 'serialization-error')
    })(),
    fileStoragePath:
      typeof data.fileStoragePath === 'string'
        ? data.fileStoragePath
        : (() => {
            throw new DataLayerError('Invalid fileStoragePath', 500, 'serialization-error')
          })(),
    bundleSize: toOptionalString(data.bundleSize, 'bundleSize'),
    fileCount: toOptionalNumber(data.fileCount, 'fileCount'),
    visible: toBoolean(data.visible, 'visible'),
    createdAt: toDate(data.createdAt, 'createdAt'),
    updatedAt: toDate(data.updatedAt, 'updatedAt'),
    downloadCount: toNumber(data.downloadCount, 'downloadCount'),
  }
}

function toPublicAsset(asset: Asset): AssetPublic {
  const { fileStoragePath: _fileStoragePath, ...publicAsset } = asset
  return publicAsset
}

function serializeAsset(asset: Omit<Asset, 'id'>): AssetDocumentData {
  const payload: AssetDocumentData = {
    title: asset.title,
    tags: [...asset.tags],
    format: asset.format,
    previewUrl: asset.previewUrl,
    fileStoragePath: asset.fileStoragePath,
    visible: asset.visible,
    createdAt: Timestamp.fromDate(asset.createdAt),
    updatedAt: Timestamp.fromDate(asset.updatedAt),
    downloadCount: asset.downloadCount,
  }

  if (asset.description !== undefined) {
    payload.description = asset.description
  }

  if (asset.sitePageIds !== undefined) {
    payload.sitePageIds = [...asset.sitePageIds]
  }

  if (asset.bundleSize !== undefined) {
    payload.bundleSize = asset.bundleSize
  }

  if (asset.fileCount !== undefined) {
    payload.fileCount = asset.fileCount
  }

  return payload
}

function serializeAssetUpdate(asset: AssetUpdateData): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  if (asset.title !== undefined) {
    payload.title = asset.title
  }

  if (asset.tags !== undefined) {
    payload.tags = [...asset.tags]
  }

  if (asset.format !== undefined) {
    payload.format = asset.format
  }

  if (asset.description !== undefined) {
    payload.description = asset.description
  }

  if (asset.sitePageIds !== undefined) {
    payload.sitePageIds = [...asset.sitePageIds]
  }

  if (asset.previewUrl !== undefined) {
    payload.previewUrl = asset.previewUrl
  }

  if (asset.fileStoragePath !== undefined) {
    payload.fileStoragePath = asset.fileStoragePath
  }

  if (asset.bundleSize !== undefined) {
    payload.bundleSize = asset.bundleSize
  }

  if (asset.fileCount !== undefined) {
    payload.fileCount = asset.fileCount
  }

  if (asset.visible !== undefined) {
    payload.visible = asset.visible
  }

  if (asset.createdAt !== undefined) {
    payload.createdAt = Timestamp.fromDate(asset.createdAt)
  }

  if (asset.updatedAt !== undefined) {
    payload.updatedAt = Timestamp.fromDate(asset.updatedAt)
  }

  if (asset.downloadCount !== undefined) {
    payload.downloadCount = asset.downloadCount
  }

  return payload
}

function toApiError(error: unknown): ApiError {
  if (error instanceof DataLayerError) {
    return { error: error.message }
  }

  if (error instanceof Error) {
    return { error: error.message }
  }

  return { error: 'Unknown error' }
}

export function isDataLayerError(error: unknown): error is DataLayerError {
  return error instanceof DataLayerError
}

export function mapDataLayerError(error: unknown): ApiError {
  return toApiError(error)
}

async function readAssetDoc(id: string): Promise<Asset | null> {
  const docSnapshot = await adminFirestore.collection(ASSETS_COLLECTION).doc(id).get()

  if (!docSnapshot.exists) {
    return null
  }

  const rawData = docSnapshot.data()
  if (!isRecord(rawData)) {
    throw new DataLayerError('Invalid asset record', 500, 'serialization-error')
  }

  return normalizeAssetRecord(docSnapshot.id, rawData)
}

export async function getVisibleAssets(
  format?: string,
  sortBy: AssetSortBy = 'latest'
): Promise<AssetPublic[]> {
  try {
    const normalizedFormat = format?.trim().toUpperCase()

    if (normalizedFormat && !VALID_FORMATS.includes(normalizedFormat as AssetFormat)) {
      throw new DataLayerError('Invalid format filter', 400, 'invalid-argument')
    }

    let query = adminFirestore
      .collection(ASSETS_COLLECTION)
      .where('visible', '==', true)

    if (normalizedFormat) {
      query = query.where('format', '==', normalizedFormat)
    }

    if (sortBy === 'relevance') {
      query = query.orderBy('downloadCount', 'desc').orderBy('createdAt', 'desc')
    } else {
      query = query.orderBy('createdAt', 'desc')
    }

    const snapshot = await query.get()
    const assets = snapshot.docs.map((docSnapshot) => {
      const rawData = docSnapshot.data()
      if (!isRecord(rawData)) {
        throw new DataLayerError('Invalid asset record', 500, 'serialization-error')
      }
      return normalizeAssetRecord(docSnapshot.id, rawData)
    })

    const publicAssets = assets.map(toPublicAsset)

    return publicAssets
  } catch (error) {
    if (error instanceof DataLayerError) {
      throw error
    }
    throw new DataLayerError('Failed to load visible assets', 500, 'firestore-error', error)
  }
}

export async function getPublicAssetById(id: string): Promise<AssetPublic | null> {
  const asset = await getAssetById(id)
  if (!asset || !asset.visible) {
    return null
  }

  return toPublicAsset(asset)
}

export async function getAssetById(id: string): Promise<Asset | null> {
  try {
    return await readAssetDoc(normalizeId(id))
  } catch (error) {
    if (error instanceof DataLayerError) {
      throw error
    }
    throw new DataLayerError('Failed to load asset', 500, 'firestore-error', error)
  }
}

export async function getAllAssets(): Promise<Asset[]> {
  try {
    const snapshot = await adminFirestore
      .collection(ASSETS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map((docSnapshot) => {
      const rawData = docSnapshot.data()
      if (!isRecord(rawData)) {
        throw new DataLayerError('Invalid asset record', 500, 'serialization-error')
      }
      return normalizeAssetRecord(docSnapshot.id, rawData)
    })
  } catch (error) {
    if (error instanceof DataLayerError) {
      throw error
    }
    throw new DataLayerError('Failed to load assets', 500, 'firestore-error', error)
  }
}

export async function createAsset(data: Omit<Asset, 'id'>): Promise<string> {
  try {
    const docRef = adminFirestore.collection(ASSETS_COLLECTION).doc()
    await docRef.set(serializeAsset(data))
    return docRef.id
  } catch (error) {
    throw new DataLayerError('Failed to create asset', 500, 'firestore-error', error)
  }
}

export async function updateAsset(id: string, data: AssetUpdateData): Promise<void> {
  try {
    const docRef = adminFirestore.collection(ASSETS_COLLECTION).doc(normalizeId(id))
    const payload = serializeAssetUpdate(data)
    payload.updatedAt = Timestamp.now()

    await docRef.update(payload)
  } catch (error) {
    if (error instanceof DataLayerError) {
      throw error
    }
    throw new DataLayerError('Failed to update asset', 500, 'firestore-error', error)
  }
}

export async function deleteAsset(id: string): Promise<void> {
  try {
    const docRef = adminFirestore.collection(ASSETS_COLLECTION).doc(normalizeId(id))
    const snapshot = await docRef.get()

    if (!snapshot.exists) {
      throw new DataLayerError('Asset not found', 404, 'not-found')
    }

    await docRef.delete()
  } catch (error) {
    if (error instanceof DataLayerError) {
      throw error
    }
    throw new DataLayerError('Failed to delete asset', 500, 'firestore-error', error)
  }
}

export async function toggleVisibility(id: string, current: boolean): Promise<void> {
  try {
    await updateAsset(id, {
      visible: !current,
      updatedAt: new Date(),
    })
  } catch (error) {
    if (error instanceof DataLayerError) {
      throw error
    }
    throw new DataLayerError('Failed to toggle visibility', 500, 'firestore-error', error)
  }
}

export async function incrementDownloadCount(id: string): Promise<void> {
  try {
    const docRef = adminFirestore.collection(ASSETS_COLLECTION).doc(normalizeId(id))
    await docRef.update({
      downloadCount: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    if (error instanceof DataLayerError) {
      throw error
    }
    throw new DataLayerError('Failed to increment download count', 500, 'firestore-error', error)
  }
}
