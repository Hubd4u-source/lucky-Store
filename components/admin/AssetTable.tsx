"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Edit, Eye, EyeOff, Trash } from "lucide-react"
import type { AssetFormat } from "@/types"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import type { AdminAssetView } from "@/components/admin/AssetForm"

interface AssetTableProps {
  assets: AdminAssetView[]
  onEdit: (asset: AdminAssetView) => void
  onDelete: (asset: AdminAssetView) => void
  onToggleVisibility: (asset: AdminAssetView) => void
  pendingAssetId?: string | null
}

function getBadgeVariant(format: AssetFormat): "png" | "jpg" | "svg" | "pack" {
  switch (format) {
    case "PNG":
      return "png"
    case "JPG":
      return "jpg"
    case "SVG":
      return "svg"
    case "PACK":
      return "pack"
  }
}

export function AssetTable({
  assets,
  onEdit,
  onDelete,
  onToggleVisibility,
  pendingAssetId,
}: AssetTableProps) {
  return (
    <div className="w-full overflow-hidden border border-border-default bg-bg-surface">
      <div className="flex flex-col gap-2 border-b border-border-default p-4 md:flex-row md:items-center md:justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
          {assets.length} assets
        </span>
        <p className="text-xs leading-5 text-text-secondary md:text-right">
          Tap a card to manage visibility, edit details, or jump to the public asset page.
        </p>
      </div>

      <div className="hidden md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border-default bg-bg-surface-2/30">
              <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Preview
              </th>
              <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Title
              </th>
              <th className="px-6 py-4 text-center font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Format
              </th>
              <th className="px-6 py-4 text-center font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Status
              </th>
              <th className="px-6 py-4 text-right font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Downloads
              </th>
              <th className="px-6 py-4 text-right font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {assets.map((asset) => {
              const isPending = pendingAssetId === asset.id

              return (
                <tr key={asset.id} className="group transition-colors duration-150 hover:bg-bg-surface-2">
                  <td className="px-6 py-4">
                    <div className="relative h-9 w-12 overflow-hidden border border-border-subtle bg-bg-surface-3">
                      <Image
                        src={asset.previewUrls[0]}
                        alt={asset.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  </td>
                  <td className="max-w-[280px] px-6 py-4">
                    <p className="line-clamp-1 font-body text-sm font-medium text-text-primary">
                      {asset.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {asset.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-bg-surface-3 px-1.5 py-0.5 font-mono text-[9px] text-text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={getBadgeVariant(asset.format)}>{asset.format}</Badge>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onToggleVisibility(asset)}
                      className={cn(
                        "inline-flex items-center gap-2 border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                        asset.visible
                          ? "border-success/30 bg-success/15 text-success"
                          : "border-border-default bg-bg-surface-3 text-text-muted",
                        isPending && "opacity-50"
                      )}
                    >
                      {asset.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                      {asset.visible ? "Visible" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-text-secondary">
                    {asset.downloadCount}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(asset)}
                        disabled={isPending}
                        title="Edit Asset"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(asset)}
                        disabled={isPending}
                        className="text-danger hover:text-danger"
                        title="Delete Asset"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {assets.map((asset) => {
          const isPending = pendingAssetId === asset.id

          return (
            <article key={asset.id} className="overflow-hidden border border-border-default bg-bg-surface-2">
              <div className="flex gap-3 p-3">
                <div className="relative h-[72px] w-[96px] shrink-0 overflow-hidden border border-border-default bg-bg-surface-3">
                  <Image
                    src={asset.previewUrls[0]}
                    alt={asset.title}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-body text-sm font-medium text-text-primary">
                    {asset.title}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={getBadgeVariant(asset.format)}>{asset.format}</Badge>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                      {asset.downloadCount} downloads
                    </span>
                    {asset.sitePageIds?.length ? (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                        {asset.sitePageIds.length} page{asset.sitePageIds.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-border-default">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onToggleVisibility(asset)}
                  className={cn(
                    "border-b border-r border-border-default px-3 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors",
                    asset.visible ? "text-success" : "text-text-muted",
                    isPending && "opacity-50"
                  )}
                >
                  {asset.visible ? "Visible" : "Hidden"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onEdit(asset)}
                  className="border-b border-border-default px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:text-accent"
                >
                  Edit
                </button>
                <Link
                  href={`/assets/${asset.id}`}
                  className="border-r border-border-default px-3 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:text-accent"
                >
                  View
                </Link>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onDelete(asset)}
                  className="px-3 py-3 font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
