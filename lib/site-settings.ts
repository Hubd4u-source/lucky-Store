import "server-only"

import { Timestamp } from "firebase-admin/firestore"
import { adminFirestore } from "@/lib/firebase-admin"
import type { SiteLink, SitePage, SiteSettings } from "@/types"

const SITE_SETTINGS_COLLECTION = "site_config"
const SITE_SETTINGS_DOC = "main"

const DEFAULT_SITE_PAGES: SitePage[] = [
  {
    id: "free-assets",
    slug: "free-assets",
    title: "Free Assets",
    summary: "Download free assets and sample drops from Lucky Store.",
    body: "Use this page to share what is included in the free assets section, how often it updates, and where visitors should start.",
    ctaLabel: "Explore Free Assets",
    ctaUrl: "/#",
    visible: true,
  },
  {
    id: "paid-assets",
    slug: "paid-assets",
    title: "Paid Assets",
    summary: "Premium assets, bundles, and creator-ready drops.",
    body: "Use this page to explain what makes the paid assets worth it, what formats are included, and how customers should buy or request them.",
    ctaLabel: "View Paid Assets",
    ctaUrl: "/#",
    visible: true,
  },
  {
    id: "course",
    slug: "course",
    title: "Course",
    summary: "Course details, lessons, outcomes, and enrollment info.",
    body: "Use this page to explain what the course covers, who it is for, how long it takes, and what students get after joining.",
    ctaLabel: "Join Course",
    ctaUrl: "/#",
    visible: true,
  },
  {
    id: "ebook",
    slug: "ebook",
    title: "E-book",
    summary: "Guide readers through the value of the e-book before they buy or download.",
    body: "Use this page for the e-book overview, chapter highlights, target audience, and checkout or contact link.",
    ctaLabel: "Get E-book",
    ctaUrl: "/#",
    visible: true,
  },
  {
    id: "paid-collab",
    slug: "paid-collab-with-lucky-breakdown-unseenluckyy",
    title: "Paid Collab with Lucky Breakdown/ Unseenluckyy",
    summary: "Collaboration details, deliverables, and how to reach out.",
    body: "Use this page to explain collaboration options, what is included, timelines, and the best way for brands or creators to contact you.",
    ctaLabel: "Request Collab",
    ctaUrl: "/#",
    visible: true,
  },
  {
    id: "xml",
    slug: "xml",
    title: "XML",
    summary: "Describe the XML offer, setup help, and how users can access it.",
    body: "Use this page to explain what the XML includes, who it is for, and what the next step should be.",
    ctaLabel: "Get XML",
    ctaUrl: "/#",
    visible: true,
  },
  {
    id: "personal-guide",
    slug: "personal-guide",
    title: "Personal Guide",
    summary: "One place for your custom guide offer and what clients receive.",
    body: "Use this page to explain the personal guide service, what is personalized, delivery timing, and the CTA destination.",
    ctaLabel: "Get Personal Guide",
    ctaUrl: "/#",
    visible: true,
  },
]

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  sitePages: DEFAULT_SITE_PAGES,
  footerTagline: "Assets for creators and designers.",
  updatedAt: new Date(0),
}

type SiteSettingsDocument = {
  sitePages?: unknown
  offerLinks?: unknown
  footerTagline?: unknown
  updatedAt?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizeDate(value: unknown): Date {
  if (value instanceof Date) {
    return value
  }

  if (value instanceof Timestamp) {
    return value.toDate()
  }

  if (typeof value === "string") {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date()
}

function normalizeLegacyOfferLinks(value: unknown): SitePage[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SITE_PAGES
  }

  const pages = value
    .map((entry, index) => {
      if (!isRecord(entry)) {
        return null
      }

      const label = typeof entry.label === "string" ? entry.label.trim() : ""
      const id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `page-${index + 1}`
      const url = typeof entry.url === "string" && entry.url.trim() ? entry.url.trim() : "#"

      if (!label) {
        return null
      }

      const slug =
        label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || `page-${index + 1}`

      const page: SitePage = {
        id,
        slug,
        title: label,
        summary: `Edit this page from the admin panel.`,
        body: `Add the full ${label} details here from the admin dashboard.`,
        ctaLabel: label,
        ctaUrl: url,
        visible: true,
      }

      return page
    })
    .filter((entry): entry is SitePage => entry !== null)

  return pages.length > 0 ? pages : DEFAULT_SITE_PAGES
}

function normalizeSitePages(value: unknown): SitePage[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SITE_PAGES
  }

  const pages = value
    .map((entry, index) => {
      if (!isRecord(entry)) {
        return null
      }

      const id = typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `page-${index + 1}`
      const slug =
        typeof entry.slug === "string" && entry.slug.trim() ? entry.slug.trim() : `page-${index + 1}`
      const title = typeof entry.title === "string" ? entry.title.trim() : ""

      if (!title) {
        return null
      }

      const page: SitePage = {
        id,
        slug,
        title,
        summary: typeof entry.summary === "string" ? entry.summary.trim() : "",
        body: typeof entry.body === "string" ? entry.body.trim() : "",
        ctaLabel:
          typeof entry.ctaLabel === "string" && entry.ctaLabel.trim()
            ? entry.ctaLabel.trim()
            : "Learn More",
        ctaUrl: typeof entry.ctaUrl === "string" && entry.ctaUrl.trim() ? entry.ctaUrl.trim() : "#",
        visible: typeof entry.visible === "boolean" ? entry.visible : true,
      }

      return page
    })
    .filter((entry): entry is SitePage => entry !== null)

  return pages.length > 0 ? pages : DEFAULT_SITE_PAGES
}

function normalizeSiteSettings(data: SiteSettingsDocument | null | undefined): SiteSettings {
  if (!data) {
    return DEFAULT_SITE_SETTINGS
  }

  const sitePages = data.sitePages
    ? normalizeSitePages(data.sitePages)
    : normalizeLegacyOfferLinks(data.offerLinks)

  return {
    sitePages,
    footerTagline:
      typeof data.footerTagline === "string" && data.footerTagline.trim()
        ? data.footerTagline.trim()
        : DEFAULT_SITE_SETTINGS.footerTagline,
    updatedAt: normalizeDate(data.updatedAt),
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const snapshot = await adminFirestore
    .collection(SITE_SETTINGS_COLLECTION)
    .doc(SITE_SETTINGS_DOC)
    .get()

  if (!snapshot.exists) {
    return DEFAULT_SITE_SETTINGS
  }

  return normalizeSiteSettings(snapshot.data() as SiteSettingsDocument)
}

export async function getVisibleSitePages(): Promise<SitePage[]> {
  const settings = await getSiteSettings()
  return settings.sitePages.filter((page) => page.visible)
}

export async function getSitePageBySlug(slug: string): Promise<SitePage | null> {
  const settings = await getSiteSettings()
  return settings.sitePages.find((page) => page.slug === slug && page.visible) ?? null
}

export async function saveSiteSettings(payload: {
  sitePages: SitePage[]
  footerTagline: string
}): Promise<void> {
  await adminFirestore
    .collection(SITE_SETTINGS_COLLECTION)
    .doc(SITE_SETTINGS_DOC)
    .set(
      {
        sitePages: payload.sitePages.map((page) => ({
          id: page.id,
          slug: page.slug,
          title: page.title,
          summary: page.summary,
          body: page.body,
          ctaLabel: page.ctaLabel,
          ctaUrl: page.ctaUrl,
          visible: page.visible,
        })),
        footerTagline: payload.footerTagline,
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    )
}

export function getDefaultSitePages(): SitePage[] {
  return DEFAULT_SITE_PAGES
}
