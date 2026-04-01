"use client"

import * as React from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import type { ApiError, AssetFormat, AssetPublic, DownloadResponse } from "@/types"

interface DownloadModalProps {
  asset: AssetPublic | null
  open: boolean
  onClose: () => void
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

export function DownloadModal({ asset, open, onClose }: DownloadModalProps) {
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

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close download modal"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[480px] border border-border-default bg-bg-surface p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-text-secondary transition-colors duration-150 hover:text-text-primary"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col gap-6">
          <div className="relative aspect-video w-full overflow-hidden border border-border-default bg-bg-surface-2">
            <Image
              src={asset.previewUrl}
              alt={asset.title}
              fill
              className="object-contain"
              sizes="(max-width: 480px) 100vw, 480px"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold text-text-primary">{asset.title}</h3>
              <Badge variant={BADGE_VARIANTS[asset.format]}>{asset.format}</Badge>
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

            <p className="text-sm text-text-secondary">
              This asset is ready to download. The signed link will expire in 60 seconds.
            </p>
          </div>

          {error && (
            <p className="border-l-2 border-danger pl-3 font-mono text-xs text-danger">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={loading || downloaded}
            className="w-full bg-accent py-3 text-xs font-semibold uppercase tracking-widest text-bg-base transition-colors duration-150 hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Preparing..." : downloaded ? "Downloaded \u2713" : "Download"}
          </button>
        </div>
      </div>
    </div>
  )
}
