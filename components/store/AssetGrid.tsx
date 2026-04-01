"use client"

import * as React from "react"
import { Header } from "@/components/store/Header"
import { FilterBar } from "@/components/store/FilterBar"
import { AssetCard } from "@/components/store/AssetCard"
import { DownloadModal } from "@/components/store/DownloadModal"
import { EmptyState } from "@/components/store/EmptyState"
import { cn } from "@/lib/utils"
import type { AssetFormat, AssetPublic, AssetSortBy } from "@/types"

interface AssetGridProps {
  assets: AssetPublic[]
  initialAssets: AssetPublic[]
}

const PAGE_SIZE = 12

function hashString(value: string): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash)
}

function scoreAsset(asset: AssetPublic, searchValue: string): number {
  if (!searchValue) {
    return 0
  }

  const term = searchValue.toLowerCase()
  const title = asset.title.toLowerCase()
  const tagMatch = asset.tags.some((tag) => tag.toLowerCase().includes(term))

  if (title === term) return 100
  if (title.includes(term) && tagMatch) return 80
  if (title.includes(term)) return 60
  if (tagMatch) return 40
  return 0
}

function sortAssets(
  assets: AssetPublic[],
  sortBy: AssetSortBy,
  searchValue: string,
  activeFormat: "All" | AssetFormat
): AssetPublic[] {
  const items = [...assets]

  if (sortBy === "random") {
    return items.sort((left, right) => {
      const leftScore = hashString(`${left.id}-${searchValue}-${activeFormat}`)
      const rightScore = hashString(`${right.id}-${searchValue}-${activeFormat}`)
      return leftScore - rightScore
    })
  }

  if (sortBy === "relevance" && searchValue.trim()) {
    return items.sort((left, right) => {
      const scoreDelta = scoreAsset(right, searchValue) - scoreAsset(left, searchValue)
      if (scoreDelta !== 0) return scoreDelta

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
  }

  return items.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

export function AssetGrid({ assets, initialAssets }: AssetGridProps) {
  const [searchValue, setSearchValue] = React.useState("")
  const [activeFormat, setActiveFormat] = React.useState<"All" | AssetFormat>("All")
  const [activeSort, setActiveSort] = React.useState<AssetSortBy>("latest")
  const [visibleCount, setVisibleCount] = React.useState(
    Math.max(initialAssets.length, PAGE_SIZE)
  )
  const [selectedAsset, setSelectedAsset] = React.useState<AssetPublic | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const filteredAssets = React.useMemo(() => {
    const trimmedSearch = searchValue.trim().toLowerCase()

    const matched = assets.filter((asset) => {
      const matchesFormat = activeFormat === "All" || asset.format === activeFormat
      const matchesSearch =
        !trimmedSearch ||
        asset.title.toLowerCase().includes(trimmedSearch) ||
        asset.tags.some((tag) => tag.toLowerCase().includes(trimmedSearch))

      return matchesFormat && matchesSearch
    })

    return sortAssets(matched, activeSort, trimmedSearch, activeFormat)
  }, [assets, activeFormat, activeSort, searchValue])

  React.useEffect(() => {
    setVisibleCount(Math.max(initialAssets.length, PAGE_SIZE))
  }, [activeFormat, activeSort, initialAssets.length, searchValue])

  const visibleAssets = filteredAssets.slice(0, visibleCount)
  const hasMore = visibleCount < filteredAssets.length

  const handleDownload = (asset: AssetPublic) => {
    setSelectedAsset(asset)
    setIsModalOpen(true)
  }

  const loadMore = () => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, filteredAssets.length))
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <Header searchValue={searchValue} onSearchChange={setSearchValue} />

      <FilterBar
        activeFormat={activeFormat}
        activeSort={activeSort}
        onFormatChange={setActiveFormat}
        onSortChange={setActiveSort}
      />

      <main className="container-custom py-8">
        {filteredAssets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} onDownload={handleDownload} />
            ))}
          </div>
        )}

        {hasMore && filteredAssets.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              className={cn(
                "border border-border-strong bg-transparent px-8 py-3 font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors duration-150 hover:border-accent hover:text-accent"
              )}
            >
              Load More
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-border-subtle">
        <div className="container-custom flex flex-col items-start justify-between gap-4 py-8 md:flex-row md:items-center">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-black tracking-[0.04em] text-text-primary">
              LUCKY
            </span>
            <span className="font-display text-xl font-normal tracking-[0.04em] text-accent">
              STORE
            </span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {currentYear} Lucky Store
          </p>

          <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
            Assets for creators and designers.
          </p>
        </div>
      </footer>

      <DownloadModal
        open={isModalOpen}
        asset={selectedAsset}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
