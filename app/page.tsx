export const dynamic = "force-dynamic"

import { AssetGrid } from "@/components/store/AssetGrid"
import type { AssetPublic } from "@/types"

export default async function StorePage() {
  let assets: AssetPublic[] = []

  try {
    const { getVisibleAssets } = await import("@/lib/assets")
    assets = await getVisibleAssets(undefined, "latest")
  } catch (error) {
    console.error("Failed to load visible assets:", error)
  }

  const initialAssets = assets.slice(0, 12)

  return <AssetGrid assets={assets} initialAssets={initialAssets} />
}
