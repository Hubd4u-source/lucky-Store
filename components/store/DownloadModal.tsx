"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, X } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import {
  formatAssetDate,
  formatCompactNumber,
  getAssetBundleSize,
  getAssetFileCount,
  getAssetSummary,
  getPrimaryCollectionForAsset,
} from "@/lib/storefront"
import { cn } from "@/lib/utils"
import type { ApiError, AssetFormat, AssetPublic, DownloadResponse } from "@/types"

interface DownloadModalProps {
  asset: AssetPublic | null
  open: boolean
  onClose: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

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

  return "Failed to generate download link"
}

export function DownloadModal({
  asset,
  open,
  onClose,
  isFavorite = false,
  onToggleFavorite,
}: DownloadModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [downloaded, setDownloaded] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setLoading(false)
      setDownloaded(false)
      setError(null)
    }
  }, [open])

  const handleDownload = async () => {
    if (!asset) return

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
        throw new Error("Download URL missing")
      }

      window.open(data.url, "_blank", "noopener,noreferrer")
      setDownloaded(true)
    } catch (downloadError) {
      const message = downloadError instanceof Error ? downloadError.message : "Download failed"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (!asset) return null
  const collection = getPrimaryCollectionForAsset(asset)

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center bg-black/85 p-0 transition-opacity duration-200 sm:items-center sm:p-4",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close download modal"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto border border-border-default bg-bg-surface p-4 sm:max-w-[760px] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-text-secondary transition-colors duration-150 hover:text-text-primary"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="relative aspect-[4/3] w-full max-w-full overflow-hidden border border-border-default bg-bg-surface-2">
              <Image
                src={asset.previewUrls[0]}
                alt={asset.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-border-subtle bg-bg-surface-2 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Downloads
                </p>
                <p className="mt-2 text-sm text-text-primary">
                  {formatCompactNumber(asset.downloadCount)}
                </p>
              </div>
              <div className="border border-border-subtle bg-bg-surface-2 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Files
                </p>
                <p className="mt-2 text-sm text-text-primary">{getAssetFileCount(asset)}</p>
              </div>
              <div className="border border-border-subtle bg-bg-surface-2 p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                  Bundle Size
                </p>
                <p className="mt-2 text-sm text-text-primary">{getAssetBundleSize(asset)}</p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="break-words text-lg font-semibold text-text-primary sm:text-xl">{asset.title}</h3>
                <Badge variant={BADGE_VARIANTS[asset.format]}>{asset.format}</Badge>
              </div>

              <div className="grid gap-3 border-y border-border-subtle py-3 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    Collection
                  </p>
                  <p className="mt-1 text-sm text-text-primary">{collection?.title ?? asset.format}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    Downloads
                  </p>
                  <p className="mt-1 text-sm text-text-primary">
                    {formatCompactNumber(asset.downloadCount)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    Added
                  </p>
                  <p className="mt-1 text-sm text-text-primary">{formatAssetDate(asset.createdAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {asset.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="bg-bg-surface-2 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-text-muted"
                >
                  {tag}
                </span>
                ))}
              </div>

              <p className="text-sm leading-6 text-text-secondary">
                {getAssetSummary(asset)}
              </p>
            </div>

            {error ? (
              <p className="border-l-2 border-danger pl-3 font-mono text-xs text-danger">
                {error}
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
              <Link href={`/assets/${asset.id}`} onClick={onClose}>
                <Button variant="outline" className="min-h-11 w-full">
                  View Details
                </Button>
              </Link>

              <Button
                type="button"
                onClick={handleDownload}
                disabled={loading || downloaded}
                className="min-h-11 w-full"
              >
                {loading ? "Preparing..." : downloaded ? "Downloaded \u2713" : "Download"}
              </Button>

              {onToggleFavorite ? (
                <Button
                  variant={isFavorite ? "secondary" : "outline"}
                  onClick={onToggleFavorite}
                  className="min-h-11 w-full lg:w-auto"
                >
                  <Heart size={14} className={cn("mr-2", isFavorite && "fill-current")} />
                  {isFavorite ? "Saved" : "Save"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
