"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { SearchBar } from "@/components/store/SearchBar"

interface HeaderProps {
  searchValue: string
  onSearchChange: (value: string) => void
}

export function Header({ searchValue, onSearchChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-bg-base">
      <div className="container-custom">
        <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6">
          <Link href="/" className="flex items-baseline gap-1">
            <span className="font-display text-xl font-black tracking-[0.04em] text-text-primary">
              LUCKY
            </span>
            <span className="font-display text-xl font-normal tracking-[0.04em] text-accent">
              STORE
            </span>
          </Link>

          <div className="hidden md:block">
            <SearchBar value={searchValue} onChange={onSearchChange} />
          </div>

          <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-widest">
            <Link href="/" className={cn("text-accent")}>
              Store
            </Link>
            <a
              href="https://amaitv.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary transition-colors duration-150 hover:text-text-primary"
            >
              Amai Tv
            </a>
          </nav>
        </div>

        <div className="border-t border-border-subtle py-3 md:hidden">
          <SearchBar value={searchValue} onChange={onSearchChange} />
        </div>
      </div>
    </header>
  )
}
