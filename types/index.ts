export type AssetFormat = 'PNG' | 'JPG' | 'SVG' | 'PACK'
export type AssetSortBy = 'latest' | 'relevance' | 'random'

export interface Asset {
  id: string
  title: string
  tags: string[]
  format: AssetFormat
  previewUrl: string
  fileStoragePath: string
  visible: boolean
  createdAt: Date
  updatedAt: Date
  downloadCount: number
}

export interface AssetPublic extends Omit<Asset, 'fileStoragePath'> {}

export interface AssetFormData {
  title: string
  tags: string
  format: AssetFormat
  visible: boolean
  previewFile: FileList
  assetFile: FileList
}

export interface DownloadResponse {
  url: string
}

export interface ApiError {
  error: string
}
