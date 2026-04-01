"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/Badge"
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
}

export function AssetCard({ asset, onDownload }: AssetCardProps) {
  return (
    <article className="group flex flex-col border border-border-default bg-bg-surface transition-colors duration-150 hover:border-accent/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-bg-surface-2">
        <Image
          src={asset.previewUrl}
          alt={asset.title}
          fill
          className="object-cover opacity-95 transition-opacity duration-150 group-hover:opacity-100"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute left-2 top-2 z-10">
          <Badge variant={BADGE_VARIANTS[asset.format]}>{asset.format}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-medium leading-tight text-text-primary transition-colors duration-150 group-hover:text-accent">
          {asset.title}
        </h3>

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

        <button
          type="button"
          onClick={() => onDownload(asset)}
          className="w-full bg-accent py-3 text-xs font-semibold uppercase tracking-widest text-bg-base transition-colors duration-150 hover:bg-accent-dim"
        >
          Download
        </button>
      </div>
    </article>
  )
}
