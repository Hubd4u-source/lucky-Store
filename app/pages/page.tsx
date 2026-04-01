import { SitePagesIndexView } from "@/components/store/SitePagesIndexView"

export const dynamic = "force-dynamic"

export default async function PublicPagesIndex() {
  const { getVisibleSitePages, getSiteSettings } = await import("@/lib/site-settings")
  const pages = await getVisibleSitePages()
  const siteSettings = await getSiteSettings().catch(() => null)

  return <SitePagesIndexView pages={pages} siteSettings={siteSettings} />
}
