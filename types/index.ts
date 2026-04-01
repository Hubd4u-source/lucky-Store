export type AssetFormat = 'PNG' | 'JPG' | 'SVG' | 'PACK'
export type AssetSortBy = 'featured' | 'latest' | 'downloads' | 'relevance'

export interface Asset {
  id: string
  title: string
  tags: string[]
  format: AssetFormat
  description?: string
  sitePageIds?: string[]
  previewUrl: string
  fileStoragePath: string
  bundleSize?: string
  fileCount?: number
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

export interface SiteLink {
  id: string
  label: string
  url: string
}

export interface SitePage {
  id: string
  slug: string
  title: string
  summary: string
  body: string
  ctaLabel: string
  ctaUrl: string
  visible: boolean
}

export interface SiteSettings {
  sitePages: SitePage[]
  footerTagline: string
  updatedAt: Date
}
