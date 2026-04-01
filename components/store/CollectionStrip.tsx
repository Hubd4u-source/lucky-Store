"use client"

import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AssetPublic } from "@/types"
import type { StoreCollection } from "@/lib/storefront"

interface CollectionSummary {
  collection: StoreCollection
  count: number
  sample: AssetPublic | null
}

interface CollectionStripProps {
  collections: CollectionSummary[]
  activeCollectionSlug: string | null
  onSelectCollection: (collectionSlug: string | null) => void
}

export function CollectionStrip({
  collections,
  activeCollectionSlug,
  onSelectCollection,
}: CollectionStripProps) {
  if (collections.length === 0) {
    return null
  }

  return (
    <section className="container-custom py-16">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
            Collections
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-[0.04em] text-text-primary">
            Browse By Intent
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary md:text-base">
            Jump into grouped drops built for branding, launch graphics, interface mockups, and creator kits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectCollection(null)}
          className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary transition-colors duration-150 hover:text-text-primary md:block"
        >
          Show All
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {collections.map(({ collection, count, sample }) => {
          const isActive = activeCollectionSlug === collection.slug

          return (
            <button
              key={collection.slug}
              type="button"
              onClick={() => onSelectCollection(isActive ? null : collection.slug)}
              className={cn(
                "group flex min-h-[220px] flex-col justify-between border bg-bg-surface p-5 text-left transition-colors duration-150",
                isActive
                  ? "border-accent bg-accent/5"
                  : "border-border-default hover:border-accent/40"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
                    {collection.eyebrow}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    {count} drops
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-black uppercase tracking-[0.04em] text-text-primary">
                  {collection.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {collection.description}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 border-t border-border-subtle pt-4">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    Spotlight
                  </p>
                  <p className="mt-1 truncate text-sm text-text-primary">
                    {sample?.title ?? "Ready to browse"}
                  </p>
                </div>

                <ArrowRight
                  size={16}
                  className={cn(
                    "shrink-0 text-text-secondary transition-colors duration-150",
                    isActive ? "text-accent" : "group-hover:text-accent"
                  )}
                />
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
