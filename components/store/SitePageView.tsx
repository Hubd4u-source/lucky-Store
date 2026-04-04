"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/store/Header"
import { DownloadModal } from "@/components/store/DownloadModal"
import { EmptyState } from "@/components/store/EmptyState"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { formatAssetDate, formatCompactNumber } from "@/lib/storefront"
import type { AssetFormat, AssetPublic, SitePage, SiteSettings } from "@/types"

interface SitePageViewProps {
  page: SitePage
  assets: AssetPublic[]
  siteSettings: SiteSettings | null
}

const BADGE_VARIANTS: Record<AssetFormat, "png" | "jpg" | "svg" | "pack"> = {
  PNG: "png",
  JPG: "jpg",
  SVG: "svg",
  PACK: "pack",
}

function PageAssetCard({
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
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
        <div className="absolute left-3 top-3">
          <Badge variant={BADGE_VARIANTS[asset.format]}>{asset.format}</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-text-primary md:text-base">
            {asset.title}
          </h3>
          <p className="mt-2 text-xs text-text-secondary">
            Added {formatAssetDate(asset.createdAt)} • {formatCompactNumber(asset.downloadCount)} downloads
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {asset.tags.slice(0, 3).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="bg-bg-surface-3 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={`/assets/${asset.id}`}>
            <Button variant="outline" className="min-h-11 w-full">
              View Details
            </Button>
          </Link>
          <Button className="min-h-11 w-full" onClick={() => onDownload(asset)}>
            Download
          </Button>
        </div>
      </div>
    </article>
  )
}

export function SitePageView({ page, assets, siteSettings }: SitePageViewProps) {
  const currentYear = new Date().getFullYear()
  const [selectedAsset, setSelectedAsset] = React.useState<AssetPublic | null>(null)

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <Header showSearch={false} />

      <main className="container-custom py-8 md:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary transition-colors duration-150 hover:text-text-primary"
        >
          <ArrowLeft size={12} />
          Back To Store
        </Link>

        <section className="mt-6 border border-border-default bg-bg-surface p-5 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            Page
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.04em] text-text-primary md:text-5xl">
            {page.title}
          </h1>
          <p className="mt-4 text-sm text-text-secondary">
            {assets.length} item{assets.length === 1 ? "" : "s"} in this section
          </p>
        </section>

        <section className="mt-6">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                {page.title}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {assets.length} item{assets.length === 1 ? "" : "s"} in this page
              </p>
            </div>
          </div>

          {assets.length === 0 ? (
            <EmptyState
              title={`No items in ${page.title} yet`}
              description="Assign assets to this page from the admin panel and they will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => (
                <PageAssetCard key={asset.id} asset={asset} onDownload={setSelectedAsset} />
              ))}
            </div>
          )}
        </section>
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
