"use client"

import * as React from "react"

const FAVORITES_STORAGE_KEY = "lucky-store-favorites"

function readFavorites(): string[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored) as unknown
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : []
  } catch {
    return []
  }
}

export function useFavoriteAssets() {
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([])

  React.useEffect(() => {
    setFavoriteIds(readFavorites())
  }, [])

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds))
  }, [favoriteIds])

  const toggleFavorite = React.useCallback((assetId: string) => {
    setFavoriteIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId]
    )
  }, [])

  return {
    favoriteIds,
    favoriteSet: new Set(favoriteIds),
    toggleFavorite,
  }
}
