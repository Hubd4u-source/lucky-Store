"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Header } from "@/components/store/Header"
import { Button } from "@/components/ui/Button"
import type { SitePage, SiteSettings } from "@/types"

interface SitePagesIndexViewProps {
  pages: SitePage[]
  siteSettings: SiteSettings | null
}

export function SitePagesIndexView({ pages, siteSettings }: SitePagesIndexViewProps) {
  const currentYear = new Date().getFullYear()

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
            Explore Pages
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-[0.04em] text-text-primary md:text-5xl">
            All Lucky Store Pages
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary md:text-base">
            Browse every editable public page from one place. Each page can be managed from the
            admin panel by the client.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <article key={page.id} className="border border-border-default bg-bg-surface p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                Page
              </p>
              <h2 className="mt-3 text-xl font-semibold text-text-primary">{page.title}</h2>
              <p className="mt-3 text-sm leading-7 text-text-secondary">{page.summary}</p>

              <div className="mt-6">
                <Link href={`/pages/${page.slug}`}>
                  <Button className="min-h-11 w-full">
                    Open Page
                    <ArrowRight size={14} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </article>
          ))}
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
    </div>
  )
}
