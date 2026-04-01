import { notFound } from "next/navigation"
import { SitePageView } from "@/components/store/SitePageView"

export const dynamic = "force-dynamic"

export default async function PublicSitePage({
  params,
}: {
  params: { slug: string }
}) {
  const { getSitePageBySlug, getSiteSettings } = await import("@/lib/site-settings")
  const { getVisibleAssets } = await import("@/lib/assets")
  const page = await getSitePageBySlug(params.slug)

  if (!page) {
    notFound()
  }

  const allAssets = await getVisibleAssets()
  const pageAssets = allAssets.filter((asset) => asset.sitePageIds?.includes(page.id))
  const siteSettings = await getSiteSettings().catch(() => null)

  return <SitePageView page={page} assets={pageAssets} siteSettings={siteSettings} />
}
