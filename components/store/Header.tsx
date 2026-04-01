"use client"

import Link from "next/link"
import { SearchBar } from "@/components/store/SearchBar"

interface HeaderProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  showSearch?: boolean
}

export function Header({
  searchValue = "",
  onSearchChange,
  showSearch = true,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-bg-base">
      <div className="container-custom">
        <div className="grid min-h-16 grid-cols-[auto_1fr] items-center gap-4 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6 md:py-0">
          <Link href="/" className="flex items-baseline gap-1">
            <span className="font-display text-lg font-black tracking-[0.04em] text-text-primary md:text-xl">
              LUCKY
            </span>
            <span className="font-display text-lg font-normal tracking-[0.04em] text-accent md:text-xl">
              STORE
            </span>
          </Link>

          <div className="hidden md:block">
            {showSearch && onSearchChange ? (
              <SearchBar
                value={searchValue}
                onChange={onSearchChange}
                placeholder="Search assets..."
              />
            ) : null}
          </div>

          <nav className="col-span-2 flex items-center justify-end gap-5 font-mono text-[10px] uppercase tracking-[0.22em] md:col-span-1 md:gap-6 md:text-xs md:tracking-widest">
            <a href="/" className="text-accent transition-colors duration-150 hover:text-text-primary">
              Store
            </a>
          </nav>
        </div>

        {showSearch && onSearchChange ? (
          <div className="border-t border-border-subtle py-3 md:hidden">
            <SearchBar value={searchValue} onChange={onSearchChange} />
          </div>
        ) : null}
      </div>
    </header>
  )
}
