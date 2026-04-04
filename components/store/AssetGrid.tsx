"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Header } from "@/components/store/Header"
import { FilterBar } from "@/components/store/FilterBar"
import { DownloadModal } from "@/components/store/DownloadModal"
import { EmptyState } from "@/components/store/EmptyState"
import { formatAssetDate, formatCompactNumber } from "@/lib/storefront"
import type { AssetFormat, AssetPublic, AssetSortBy, SiteSettings } from "@/types"

interface AssetGridProps {
  assets: AssetPublic[]
  initialAssets: AssetPublic[]
  siteSettings: SiteSettings | null
}

const PAGE_SIZE = 12

const BADGE_VARIANTS: Record<AssetFormat, "png" | "jpg" | "svg" | "pack"> = {
  PNG: "png",
  JPG: "jpg",
  SVG: "svg",
  PACK: "pack",
}

function scoreAsset(asset: AssetPublic, searchValue: string): number {
  if (!searchValue) {
    return 0
  }

  const term = searchValue.toLowerCase()
  const haystack = `${asset.title} ${asset.description ?? ""} ${asset.tags.join(" ")}`.toLowerCase()

  if (asset.title.toLowerCase() === term) return 100
  if (asset.title.toLowerCase().includes(term)) return 75
  if (asset.tags.some((tag) => tag.toLowerCase().includes(term))) return 50
  if (haystack.includes(term)) return 20
  return 0
}

function sortAssets(
  assets: AssetPublic[],
  sortBy: AssetSortBy,
  searchValue: string
): AssetPublic[] {
  const items = [...assets]

  if (sortBy === "downloads") {
    return items.sort((left, right) => {
      const delta = right.downloadCount - left.downloadCount
      if (delta !== 0) {
        return delta
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
  }

  if (sortBy === "relevance" && searchValue.trim()) {
    return items.sort((left, right) => {
      const scoreDelta = scoreAsset(right, searchValue) - scoreAsset(left, searchValue)
      if (scoreDelta !== 0) {
        return scoreDelta
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
  }

  return items.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  )
}

function HomeAssetCard({
  asset,
  onDownload,
}: {
  asset: AssetPublic
  onDownload: (asset: AssetPublic) => void
}) {
  return (
    <article className="overflow-hidden border border-border-default bg-bg-surface">
      <div className="relative aspect-[4/3] border-b border-border-default bg-bg-surface-2">
        <Image
          src={asset.previewUrls[0]}
          alt={asset.title}
          fill
          className="object-cover"
          sizes="(max-width: 480px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute left-3 top-3">
          <Badge variant={BADGE_VARIANTS[asset.format]}>{asset.format}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 md:gap-4 md:p-4">
        <div>
          <h3 className="line-clamp-2 min-h-[42px] text-[13px] font-semibold leading-5 text-text-primary md:min-h-[44px] md:text-[15px] md:leading-7">
            {asset.title}
          </h3>
          <p className="mt-2 text-[10px] leading-4 text-text-secondary md:text-xs md:leading-5">
            Added {formatAssetDate(asset.createdAt)} • {formatCompactNumber(asset.downloadCount)} downloads
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {asset.tags.slice(0, 3).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="bg-bg-surface-3 px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.15em] text-text-muted md:px-2 md:text-[9px]"
            >
              {tag}
            </span>
          ))}
        </div>

        <Button className="min-h-11 w-full" onClick={() => onDownload(asset)}>
          Download
        </Button>
      </div>
    </article>
  )
}

export function AssetGrid({ assets, initialAssets, siteSettings }: AssetGridProps) {
  const [searchValue, setSearchValue] = React.useState("")
  const [activeFormat, setActiveFormat] = React.useState<"All" | AssetFormat>("All")
  const [activeSort, setActiveSort] = React.useState<AssetSortBy>("latest")
  const [visibleCount, setVisibleCount] = React.useState(
    Math.max(initialAssets.length, PAGE_SIZE)
  )
  const [selectedAsset, setSelectedAsset] = React.useState<AssetPublic | null>(null)

  const filteredAssets = React.useMemo(() => {
    const trimmedSearch = searchValue.trim().toLowerCase()

    const matched = assets.filter((asset) => {
      const matchesFormat = activeFormat === "All" || asset.format === activeFormat
      const haystack = `${asset.title} ${asset.description ?? ""} ${asset.tags.join(" ")}`.toLowerCase()
      const matchesSearch = !trimmedSearch || haystack.includes(trimmedSearch)

      return matchesFormat && matchesSearch
    })

    return sortAssets(matched, activeSort, trimmedSearch)
  }, [activeFormat, activeSort, assets, searchValue])

  React.useEffect(() => {
    setVisibleCount(Math.max(initialAssets.length, PAGE_SIZE))
  }, [activeFormat, activeSort, initialAssets.length, searchValue])

  const visibleAssets = filteredAssets.slice(0, visibleCount)
  const hasMore = visibleCount < filteredAssets.length
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <Header searchValue={searchValue} onSearchChange={setSearchValue} />

      {siteSettings?.sitePages?.length ? (
        <section className="border-b border-border-default bg-bg-surface">
          <div className="container-custom py-4 md:py-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                  Pages
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  Explore the other Lucky Store sections.
                </p>
              </div>

              <Link href="/pages">
                <Button variant="outline" className="min-h-11">
                  Explore Pages
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {siteSettings.sitePages
                .filter((page) => page.visible)
                .map((page) => (
                  <Link
                    key={page.id}
                    href={`/pages/${page.slug}`}
                    className="border border-border-default bg-bg-base p-4 transition-colors duration-150 hover:border-border-strong hover:text-text-primary"
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                      Page
                    </p>
                    <h2 className="mt-2 text-sm font-semibold leading-6 text-text-primary">
                      {page.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-secondary">
                      {page.summary}
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      ) : null}

      <FilterBar
        activeFormat={activeFormat}
        activeSort={activeSort}
        onFormatChange={setActiveFormat}
        onSortChange={setActiveSort}
      />

      <main className="container-custom py-6 md:py-8">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
              Asset Catalog
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {filteredAssets.length} result{filteredAssets.length === 1 ? "" : "s"}
            </p>
          </div>

          {searchValue.trim() ? (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary transition-colors duration-150 hover:text-text-primary"
            >
              Clear Search
            </button>
          ) : null}
        </div>

        {filteredAssets.length === 0 ? (
          <EmptyState
            title="No assets found"
            description="Try a different search term or switch the format filter."
          />
        ) : (
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(158px,1fr))] gap-4 md:gap-6 xl:[grid-template-columns:repeat(3,minmax(0,1fr))]">
            {visibleAssets.map((asset) => (
              <HomeAssetCard key={asset.id} asset={asset} onDownload={setSelectedAsset} />
            ))}
          </div>
        )}

        {hasMore ? (
          <div className="mt-10 flex justify-center">
            <Button
              variant="outline"
              className="min-h-11 w-full max-w-[220px]"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
            >
              Load More
            </Button>
          </div>
        ) : null}
      </main>

      <footer className="border-t border-border-default">
        <div className="container-custom flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-black tracking-[0.04em] text-text-primary">
              LUCKY
            </span>
            <span className="font-display text-xl font-normal tracking-[0.04em] text-accent">
              STORE
            </span>
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted">
            {currentYear} Lucky Store
          </p>

          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-text-secondary">
            {siteSettings?.footerTagline || "Assets for creators and designers."}
          </p>
        </div>
      </footer>

      <DownloadModal
        open={Boolean(selectedAsset)}
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  )
}
