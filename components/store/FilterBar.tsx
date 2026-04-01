"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AssetFormat, AssetSortBy } from "@/types"

const FORMATS: Array<"All" | AssetFormat> = ["All", "PNG", "JPG", "SVG", "PACK"]
const SORTS: Array<{ label: string; value: AssetSortBy }> = [
  { label: "Latest", value: "latest" },
  { label: "Most Downloaded", value: "downloads" },
  { label: "Search Match", value: "relevance" },
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
      <div className="container-custom flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
          {FORMATS.map((format) => {
            const isActive = activeFormat === format

            return (
              <button
                key={format}
                type="button"
                onClick={() => onFormatChange(format)}
                className={cn(
                  "shrink-0 border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-150 md:px-5 md:text-xs",
                  isActive
                    ? "border-text-primary bg-transparent text-text-primary"
                    : "border-border-default bg-bg-surface-2 text-text-secondary hover:border-border-strong hover:text-text-primary"
                )}
              >
                {format}
              </button>
            )
          })}
        </div>

        <div className="relative self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsSortOpen((value) => !value)}
            className="flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-text-secondary transition-colors duration-150 hover:text-text-primary md:text-xs"
            aria-haspopup="menu"
            aria-expanded={isSortOpen}
          >
            Sort:
            <span className="text-text-primary">{activeSortLabel}</span>
            <ChevronDown size={14} />
          </button>

          {isSortOpen ? (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10 cursor-default"
                aria-label="Close sort menu"
                onClick={() => setIsSortOpen(false)}
              />
              <div className="absolute left-0 top-full z-20 mt-2 min-w-[180px] border border-border-default bg-bg-surface md:left-auto md:right-0">
                {SORTS.map((sort) => (
                  <button
                    key={sort.value}
                    type="button"
                    onClick={() => {
                      onSortChange(sort.value)
                      setIsSortOpen(false)
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-150 hover:bg-bg-surface-2",
                      activeSort === sort.value ? "text-text-primary" : "text-text-secondary"
                    )}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}
