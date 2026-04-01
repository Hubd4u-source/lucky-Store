export const dynamic = "force-dynamic"

import { AssetGrid } from "@/components/store/AssetGrid"
import type { AssetPublic, SiteSettings } from "@/types"

export default async function StorePage() {
  let assets: AssetPublic[] = []
  let siteSettings: SiteSettings | null = null

  try {
    const { getVisibleAssets } = await import("@/lib/assets")
    assets = await getVisibleAssets(undefined, "latest")
  } catch (error) {
    console.error("Failed to load visible assets:", error)
  }

  try {
    const { getSiteSettings } = await import("@/lib/site-settings")
    siteSettings = await getSiteSettings()
  } catch (error) {
    console.error("Failed to load site settings:", error)
  }

  const initialAssets = assets.slice(0, 12)

  return <AssetGrid assets={assets} initialAssets={initialAssets} siteSettings={siteSettings} />
}
