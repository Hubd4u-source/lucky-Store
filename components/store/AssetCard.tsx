"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, Search } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import {
  formatAssetDate,
  formatCompactNumber,
  getAssetBundleSize,
  getAssetFileCount,
  getPrimaryCollectionForAsset,
} from "@/lib/storefront"
import type { AssetFormat, AssetPublic } from "@/types"

const BADGE_VARIANTS: Record<AssetFormat, "png" | "jpg" | "svg" | "pack"> = {
  PNG: "png",
  JPG: "jpg",
  SVG: "svg",
  PACK: "pack",
}

interface AssetCardProps {
  asset: AssetPublic
  onDownload: (asset: AssetPublic) => void
  onQuickLook?: (asset: AssetPublic) => void
  isFavorite?: boolean
  onToggleFavorite?: (assetId: string) => void
}

export function AssetCard({
  asset,
  onDownload,
  onQuickLook,
  isFavorite = false,
  onToggleFavorite,
}: AssetCardProps) {
  const collection = getPrimaryCollectionForAsset(asset)

  return (
    <article className="group flex flex-col border border-border-default bg-bg-surface transition-colors duration-150 hover:border-accent/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-surface-2">
        <Link href={`/assets/${asset.id}`} className="absolute inset-0">
          <Image
            src={asset.previewUrls[0]}
            alt={asset.title}
            fill
            className="object-cover opacity-95 transition-opacity duration-150 group-hover:opacity-100"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </Link>
        <div className="absolute left-2 top-2 z-10">
          <Badge variant={BADGE_VARIANTS[asset.format]}>{asset.format}</Badge>
        </div>

        <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
          {onQuickLook ? (
            <button
              type="button"
              onClick={() => onQuickLook(asset)}
              className="flex h-9 w-9 items-center justify-center border border-border-default bg-bg-base/90 text-text-secondary transition-colors duration-150 hover:border-accent hover:text-accent"
              aria-label={`Quick look ${asset.title}`}
            >
              <Search size={14} />
            </button>
          ) : null}

          {onToggleFavorite ? (
            <button
              type="button"
              onClick={() => onToggleFavorite(asset.id)}
              className={cn(
                "flex h-9 w-9 items-center justify-center border bg-bg-base/90 transition-colors duration-150",
                isFavorite
                  ? "border-accent text-accent"
                  : "border-border-default text-text-secondary hover:border-accent hover:text-accent"
              )}
              aria-label={isFavorite ? `Remove ${asset.title} from favorites` : `Save ${asset.title} to favorites`}
            >
              <Heart size={14} className={cn(isFavorite && "fill-current")} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={`/assets/${asset.id}`}>
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-medium leading-tight text-text-primary transition-colors duration-150 group-hover:text-accent">
            {asset.title}
          </h3>
        </Link>

        <p className="line-clamp-2 text-sm leading-6 text-text-secondary">
          {asset.description?.trim() ||
            `${collection?.title ?? asset.format} drop for quick creator workflows and polished storefront delivery.`}
        </p>

        <div className="flex items-center justify-between gap-3 border-y border-border-subtle py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
            {collection?.title ?? asset.format}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
            {formatCompactNumber(asset.downloadCount)} downloads
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-text-secondary">
          <div className="border border-border-subtle bg-bg-surface-2 px-3 py-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
              Files
            </p>
            <p className="mt-1 text-text-primary">{getAssetFileCount(asset)}</p>
          </div>
          <div className="border border-border-subtle bg-bg-surface-2 px-3 py-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted">
              Bundle Size
            </p>
            <p className="mt-1 truncate text-text-primary">{getAssetBundleSize(asset)}</p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-1">
          {asset.tags.slice(0, 3).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="bg-bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px] text-text-secondary">
          <span>Added {formatAssetDate(asset.createdAt)}</span>
          <span>{asset.tags.length} tags</span>
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto] gap-3">
          <Link href={`/assets/${asset.id}`}>
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>

          <Button variant="primary" className="w-full" onClick={() => onDownload(asset)}>
            Download
          </Button>
        </div>
      </div>
    </article>
  )
}
