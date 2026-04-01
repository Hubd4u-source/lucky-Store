import { notFound } from "next/navigation"
import { AssetDetailView } from "@/components/store/AssetDetailView"
import { getRelatedAssets } from "@/lib/storefront"

export const dynamic = "force-dynamic"

export default async function AssetDetailPage({
  params,
}: {
  params: { assetId: string }
}) {
  const { getPublicAssetById, getVisibleAssets } = await import("@/lib/assets")
  const asset = await getPublicAssetById(params.assetId)

  if (!asset) {
    notFound()
  }

  const allAssets = await getVisibleAssets()
  const relatedAssets = getRelatedAssets(asset, allAssets, 6)

  return <AssetDetailView asset={asset} relatedAssets={relatedAssets} />
}
