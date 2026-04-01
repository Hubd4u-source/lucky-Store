"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Download, Heart, Layers3, ShieldCheck, Sparkles } from "lucide-react"
import { Header } from "@/components/store/Header"
import { AssetCard } from "@/components/store/AssetCard"
import { DownloadModal } from "@/components/store/DownloadModal"
import { TrustBar } from "@/components/store/TrustBar"
import { StoreSection } from "@/components/store/StoreSection"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { useFavoriteAssets } from "@/components/store/useFavoriteAssets"
import {
  formatAssetDate,
  formatCompactNumber,
  getAssetBundleSize,
  getAssetFileCount,
  getAssetSummary,
  getPrimaryCollectionForAsset,
} from "@/lib/storefront"
import type { ApiError, AssetFormat, AssetPublic, DownloadResponse } from "@/types"
import { cn } from "@/lib/utils"

const BADGE_VARIANTS: Record<AssetFormat, "png" | "jpg" | "svg" | "pack"> = {
  PNG: "png",
  JPG: "jpg",
  SVG: "svg",
  PACK: "pack",
}

function parseError(data: DownloadResponse | ApiError): string {
  if ("error" in data) {
    return data.error
  }

  return "Failed to generate download link."
}

interface AssetDetailViewProps {
  asset: AssetPublic
  relatedAssets: AssetPublic[]
}

export function AssetDetailView({ asset, relatedAssets }: AssetDetailViewProps) {
  const { favoriteSet, toggleFavorite } = useFavoriteAssets()
  const [loading, setLoading] = React.useState(false)
  const [downloaded, setDownloaded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = React.useState<AssetPublic | null>(null)
  const collection = getPrimaryCollectionForAsset(asset)
  const isFavorite = favoriteSet.has(asset.id)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assetId: asset.id }),
      })

      const data = (await response.json()) as DownloadResponse | ApiError

      if (!response.ok) {
        throw new Error(parseError(data))
      }

      if (!("url" in data)) {
        throw new Error("Download URL missing.")
      }

      window.open(data.url, "_blank", "noopener,noreferrer")
      setDownloaded(true)
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Download failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <Header showSearch={false} />

      <main>
        <section className="border-b border-border-default bg-[radial-gradient(circle_at_top_left,rgba(74,144,217,0.14),transparent_35%),linear-gradient(180deg,#0c0f14_0%,#080808_78%)]">
          <div className="container-custom py-10 md:py-14">
            <Link
              href="/#catalog"
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary transition-colors duration-150 hover:text-text-primary"
            >
              <ArrowLeft size={12} />
              Back To Catalog
            </Link>

            <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
              <div className="space-y-5">
                <div className="relative aspect-[4/3] overflow-hidden border border-border-default bg-bg-surface-2">
                  <Image
                    src={asset.previewUrl}
                    alt={asset.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 60vw"
                    priority
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="border border-border-default bg-bg-surface p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                      Instant Download
                    </p>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                      Delivery is handled directly from the storefront, so creators move from preview to files fast.
                    </p>
                  </div>
                  <div className="border border-border-default bg-bg-surface p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                      Commercial Use
                    </p>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                      Clear format labeling and production-ready metadata make the asset easy to route into real work.
                    </p>
                  </div>
                  <div className="border border-border-default bg-bg-surface p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                      Curated Preview
                    </p>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                      Rich metadata, related assets, and quick view keep the product page feeling editorial instead of bare.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 border border-border-default bg-bg-surface p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={BADGE_VARIANTS[asset.format]}>{asset.format}</Badge>
                  {collection ? <Badge>{collection.title}</Badge> : null}
                </div>

                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
                    Asset Detail
                  </p>
                  <h1 className="mt-3 text-4xl font-black uppercase tracking-[0.04em] text-text-primary">
                    {asset.title}
                  </h1>
                  <p className="mt-5 text-base leading-7 text-text-secondary">
                    {getAssetSummary(asset)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border border-border-subtle bg-bg-surface-2 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                      Downloads
                    </p>
                    <p className="mt-2 text-lg text-text-primary">
                      {formatCompactNumber(asset.downloadCount)}
                    </p>
                  </div>
                  <div className="border border-border-subtle bg-bg-surface-2 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                      Added
                    </p>
                    <p className="mt-2 text-lg text-text-primary">{formatAssetDate(asset.createdAt)}</p>
                  </div>
                  <div className="border border-border-subtle bg-bg-surface-2 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                      Files Included
                    </p>
                    <p className="mt-2 text-lg text-text-primary">{getAssetFileCount(asset)}</p>
                  </div>
                  <div className="border border-border-subtle bg-bg-surface-2 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                      Bundle Size
                    </p>
                    <p className="mt-2 text-lg text-text-primary">{getAssetBundleSize(asset)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-border-default bg-bg-surface-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {error ? (
                  <p className="border-l-2 border-danger pl-3 font-mono text-xs text-danger">{error}</p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={handleDownload}
                    loading={loading}
                    disabled={downloaded}
                    icon={loading ? undefined : Download}
                  >
                    {downloaded ? "Downloaded" : "Download Asset"}
                  </Button>
                  <Button
                    variant={isFavorite ? "secondary" : "outline"}
                    onClick={() => toggleFavorite(asset.id)}
                  >
                    <Heart size={14} className={cn("mr-2", isFavorite && "fill-current")} />
                    {isFavorite ? "Saved To Wishlist" : "Save To Wishlist"}
                  </Button>
                </div>

                <div className="grid gap-4 border-t border-border-subtle pt-6 md:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                      <ShieldCheck size={12} />
                      Trust Signal
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                      This product page mirrors the storefront experience with clear metadata, proof of demand, and direct delivery.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                      <Sparkles size={12} />
                      Editorial Note
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-secondary">
                      Pair it with related items below to build a fuller pack, launch theme, or brand-ready collection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TrustBar />

        <section className="container-custom py-16">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="border border-border-default bg-bg-surface p-6">
              <StoreSection
                eyebrow="Usage"
                title="What this asset adds to the catalog"
                description="Product pages now carry richer editorial framing, better metadata, and stronger trust language so each item reads like a proper sellable product."
              />
            </div>

            <div className="border border-border-default bg-bg-surface p-6">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                <Layers3 size={12} />
                Delivery Snapshot
              </div>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                Format: {asset.format}
                <br />
                Collection: {collection?.title ?? "General catalog"}
                <br />
                Files: {getAssetFileCount(asset)}
                <br />
                Size: {getAssetBundleSize(asset)}
              </p>
            </div>
          </div>
        </section>

        <section className="container-custom pb-20">
          <StoreSection
            eyebrow="Related Assets"
            title="Keep browsing the catalog"
            description="Related products carry the same quick-view, favorites, and download actions so the detail page feeds naturally back into discovery."
          />

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {relatedAssets.map((relatedAsset) => (
              <AssetCard
                key={relatedAsset.id}
                asset={relatedAsset}
                onDownload={setSelectedAsset}
                onQuickLook={setSelectedAsset}
                isFavorite={favoriteSet.has(relatedAsset.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      </main>

      <DownloadModal
        open={Boolean(selectedAsset)}
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
        isFavorite={selectedAsset ? favoriteSet.has(selectedAsset.id) : false}
        onToggleFavorite={
          selectedAsset ? () => toggleFavorite(selectedAsset.id) : undefined
        }
      />
    </div>
  )
}
