import type { AssetFormat, AssetPublic, AssetSortBy } from "@/types"

export type StoreCollection = {
  slug: string
  eyebrow: string
  title: string
  description: string
  formats?: AssetFormat[]
  keywords: string[]
}

export const STORE_COLLECTIONS: StoreCollection[] = [
  {
    slug: "bundles",
    eyebrow: "Bundles",
    title: "Bundles",
    description: "Multi-file drops assembled for launches, content kits, and ready-to-use campaign systems.",
    formats: ["PACK"],
    keywords: ["pack", "bundle", "kit", "starter", "drop"],
  },
  {
    slug: "logos",
    eyebrow: "Identity",
    title: "Logos",
    description: "Marks, seals, and emblem-style pieces ready for branding decks, packaging, and launch boards.",
    keywords: ["logo", "brand", "mark", "badge", "seal", "emblem"],
  },
  {
    slug: "ui-kits",
    eyebrow: "Interface",
    title: "UI Kits",
    description: "Panels, widgets, and interface-ready drops for product mockups, dashboards, and landing pages.",
    keywords: ["ui", "dashboard", "interface", "button", "panel", "card"],
  },
  {
    slug: "3d-elements",
    eyebrow: "Depth",
    title: "3D Elements",
    description: "Rendered assets with volume and texture for hero sections, promos, and scenes.",
    keywords: ["3d", "render", "mockup", "depth", "object", "scene"],
  },
  {
    slug: "overlays",
    eyebrow: "Broadcast",
    title: "Overlays",
    description: "Frames, lower-thirds, and visual accents for streams, clips, short-form edits, and campaigns.",
    keywords: ["overlay", "stream", "social", "frame", "broadcast", "banner"],
  },
  {
    slug: "graphics",
    eyebrow: "Graphics",
    title: "Graphic Drops",
    description: "Icons, stickers, and illustration-first assets that add energy and character to any layout.",
    keywords: ["illustration", "character", "icon", "sticker", "mascot", "graphic"],
  },
]

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function getAssetTime(asset: AssetPublic): number {
  return new Date(asset.createdAt).getTime()
}

function getSearchHaystack(asset: AssetPublic): string {
  return `${asset.title} ${asset.tags.join(" ")}`.toLowerCase()
}

export function formatAssetDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value)
}

export function scoreAssetSearch(asset: AssetPublic, term: string): number {
  if (!term) {
    return 0
  }

  const normalizedTerm = normalizeText(term)
  const title = asset.title.toLowerCase()
  const haystack = getSearchHaystack(asset)
  const exactTagMatch = asset.tags.some((tag) => normalizeText(tag) === normalizedTerm)
  const fuzzyTagMatch = asset.tags.some((tag) => normalizeText(tag).includes(normalizedTerm))

  if (title === normalizedTerm) return 120
  if (exactTagMatch) return 90
  if (title.startsWith(normalizedTerm)) return 80
  if (title.includes(normalizedTerm) && fuzzyTagMatch) return 70
  if (title.includes(normalizedTerm)) return 60
  if (fuzzyTagMatch) return 40
  if (haystack.includes(normalizedTerm)) return 20
  return 0
}

export function sortCatalogAssets(
  assets: AssetPublic[],
  sortBy: AssetSortBy,
  term: string,
  activeFormats: AssetFormat[]
): AssetPublic[] {
  const items = [...assets]

  if (sortBy === "relevance" && term) {
    return items.sort((left, right) => {
      const scoreDelta = scoreAssetSearch(right, term) - scoreAssetSearch(left, term)
      if (scoreDelta !== 0) {
        return scoreDelta
      }

      const downloadDelta = right.downloadCount - left.downloadCount
      if (downloadDelta !== 0) {
        return downloadDelta
      }

      return getAssetTime(right) - getAssetTime(left)
    })
  }

  if (sortBy === "downloads") {
    return items.sort((left, right) => {
      const downloadDelta = right.downloadCount - left.downloadCount
      if (downloadDelta !== 0) {
        return downloadDelta
      }

      return getAssetTime(right) - getAssetTime(left)
    })
  }

  if (sortBy === "featured") {
    return items.sort((left, right) => {
      const leftScore = merchandisingScore(left) + Math.abs(
        Array.from(`${left.id}-${term}-${activeFormats.join(",")}`).reduce(
          (hash, character) => (hash << 5) - hash + character.charCodeAt(0),
          0
        )
      ) / 10_000
      const rightScore = merchandisingScore(right) + Math.abs(
        Array.from(`${right.id}-${term}-${activeFormats.join(",")}`).reduce(
          (hash, character) => (hash << 5) - hash + character.charCodeAt(0),
          0
        )
      ) / 10_000

      return rightScore - leftScore
    })
  }

  return items.sort((left, right) => getAssetTime(right) - getAssetTime(left))
}

export function assetMatchesCollection(asset: AssetPublic, collection: StoreCollection): boolean {
  const haystack = getSearchHaystack(asset)
  const formatMatch =
    !collection.formats || collection.formats.length === 0
      ? false
      : collection.formats.includes(asset.format)
  const keywordMatch = collection.keywords.some((keyword) => haystack.includes(keyword))

  return formatMatch || keywordMatch
}

export function getCollectionAssets(
  assets: AssetPublic[],
  collection: StoreCollection
): AssetPublic[] {
  return assets.filter((asset) => assetMatchesCollection(asset, collection))
}

export function getCollectionBySlug(slug: string | null | undefined): StoreCollection | null {
  if (!slug) {
    return null
  }

  return STORE_COLLECTIONS.find((collection) => collection.slug === slug) ?? null
}

export function getPrimaryCollectionForAsset(asset: AssetPublic): StoreCollection | null {
  return STORE_COLLECTIONS.find((collection) => assetMatchesCollection(asset, collection)) ?? null
}

export function getAssetSummary(asset: AssetPublic): string {
  if (asset.description?.trim()) {
    return asset.description
  }

  const collection = getPrimaryCollectionForAsset(asset)
  const tags = asset.tags.slice(0, 3).join(", ")

  return `${collection?.title ?? asset.format} asset built for fast creator workflows, polished previews, and immediate production use${tags ? ` across ${tags}` : ""}.`
}

export function getAssetFileCount(asset: AssetPublic): number {
  if (typeof asset.fileCount === "number" && Number.isFinite(asset.fileCount) && asset.fileCount > 0) {
    return asset.fileCount
  }

  return asset.format === "PACK" ? Math.max(asset.tags.length, 6) : 1
}

export function getAssetBundleSize(asset: AssetPublic): string {
  if (asset.bundleSize?.trim()) {
    return asset.bundleSize
  }

  return asset.format === "PACK" ? "Multi-file pack" : "Single-file asset"
}

export function getTopTags(assets: AssetPublic[], limit = 10): string[] {
  const counts = new Map<string, number>()

  for (const asset of assets) {
    for (const tag of asset.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .sort((left, right) => {
      const countDelta = right[1] - left[1]
      if (countDelta !== 0) {
        return countDelta
      }

      return left[0].localeCompare(right[0])
    })
    .slice(0, limit)
    .map(([tag]) => tag)
}

function merchandisingScore(asset: AssetPublic): number {
  const packBonus = asset.format === "PACK" ? 12 : 0
  const freshness = Math.max(0, 30 - Math.floor((Date.now() - getAssetTime(asset)) / 86_400_000))
  return asset.downloadCount * 4 + asset.tags.length * 3 + packBonus + freshness
}

export function getFeaturedAssets(assets: AssetPublic[], limit = 6): AssetPublic[] {
  return [...assets]
    .sort((left, right) => merchandisingScore(right) - merchandisingScore(left))
    .slice(0, limit)
}

export function getPopularAssets(assets: AssetPublic[], limit = 6): AssetPublic[] {
  return [...assets]
    .sort((left, right) => {
      const delta = right.downloadCount - left.downloadCount
      if (delta !== 0) {
        return delta
      }

      return getAssetTime(right) - getAssetTime(left)
    })
    .slice(0, limit)
}

export function getNewestAssets(assets: AssetPublic[], limit = 6): AssetPublic[] {
  return [...assets]
    .sort((left, right) => getAssetTime(right) - getAssetTime(left))
    .slice(0, limit)
}

export function getStaffPickAssets(assets: AssetPublic[], limit = 6): AssetPublic[] {
  return [...assets]
    .sort((left, right) => {
      const leftWeight = (left.id.length * 7 + left.tags.length * 11) % 97
      const rightWeight = (right.id.length * 7 + right.tags.length * 11) % 97
      const delta = rightWeight - leftWeight

      if (delta !== 0) {
        return delta
      }

      return merchandisingScore(right) - merchandisingScore(left)
    })
    .slice(0, limit)
}

export function getRelatedAssets(
  asset: AssetPublic,
  assets: AssetPublic[],
  limit = 6
): AssetPublic[] {
  const sourceTagSet = new Set(asset.tags.map((tag) => normalizeText(tag)))

  return assets
    .filter((candidate) => candidate.id !== asset.id)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => sourceTagSet.has(normalizeText(tag))).length
      const formatBonus = candidate.format === asset.format ? 4 : 0
      const score = sharedTags * 10 + formatBonus + Math.min(candidate.downloadCount, 25)

      return { candidate, score }
    })
    .sort((left, right) => {
      const scoreDelta = right.score - left.score
      if (scoreDelta !== 0) {
        return scoreDelta
      }

      return getAssetTime(right.candidate) - getAssetTime(left.candidate)
    })
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}
