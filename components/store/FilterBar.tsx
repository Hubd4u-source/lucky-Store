"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AssetFormat, AssetSortBy } from "@/types"

const FORMATS: Array<"All" | AssetFormat> = ["All", "PNG", "JPG", "SVG", "PACK"]
const SORTS: Array<{ label: string; value: AssetSortBy }> = [
  { label: "Latest", value: "latest" },
  { label: "Relevance", value: "relevance" },
  { label: "Random", value: "random" },
]

interface FilterBarProps {
  activeFormat: "All" | AssetFormat
  activeSort: AssetSortBy
  onFormatChange: (format: "All" | AssetFormat) => void
  onSortChange: (sort: AssetSortBy) => void
}

export function FilterBar({
  activeFormat,
  activeSort,
  onFormatChange,
  onSortChange,
}: FilterBarProps) {
  const [isSortOpen, setIsSortOpen] = React.useState(false)
  const activeSortLabel = SORTS.find((sort) => sort.value === activeSort)?.label ?? "Latest"

  return (
    <section className="border-b border-border-default bg-bg-base">
      <div className="container-custom flex flex-col justify-between gap-4 py-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
          {FORMATS.map((format) => {
            const isActive = activeFormat === format

            return (
              <button
                key={format}
                type="button"
                onClick={() => onFormatChange(format)}
                className={cn(
                  "border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-150",
                  isActive
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-border-default bg-bg-surface-2 text-text-secondary hover:border-border-strong hover:bg-bg-surface-3 hover:text-text-primary"
                )}
              >
                {format}
              </button>
            )
          })}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSortOpen((value) => !value)}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-text-secondary transition-colors duration-150 hover:text-text-primary"
            aria-haspopup="menu"
            aria-expanded={isSortOpen}
          >
            Sort: <span className="text-text-primary">{activeSortLabel}</span>
            <ChevronDown size={14} />
          </button>

          {isSortOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Close sort menu"
                onClick={() => setIsSortOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-40 border border-border-default bg-bg-surface">
                {SORTS.map((sort) => (
                  <button
                    key={sort.value}
                    type="button"
                    onClick={() => {
                      onSortChange(sort.value)
                      setIsSortOpen(false)
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left font-mono text-xs uppercase tracking-widest transition-colors duration-150 hover:bg-bg-surface-2",
                      activeSort === sort.value ? "bg-accent/10 text-accent" : "text-text-secondary"
                    )}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
