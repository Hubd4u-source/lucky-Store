"use client"

import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search assets...",
  className,
}: SearchBarProps) {
  return (
    <label className={cn("relative block w-full", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="block h-12 w-full border border-border-default bg-bg-surface-2 py-3 pl-10 pr-4 font-body text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 focus:border-accent md:h-auto"
      />
    </label>
  )
}
