import { AdminDashboardShell } from "@/components/admin/AdminDashboardShell"
import type {
  AdminAssetView,
  AssetMutationPayload,
  MutationResult,
} from "@/components/admin/AssetForm"
import { del } from "@/lib/blob"
import type { Asset, SiteSettings } from "@/types"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

export const dynamic = "force-dynamic"

function toAdminAssetView(asset: Asset): AdminAssetView {
  return {
    ...asset,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  }
}

function getDefaultSiteSettings(): SiteSettings {
  return {
    sitePages: [],
    footerTagline: "Assets for creators and designers.",
    updatedAt: new Date(0),
  }
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Request failed."
}

function getStoragePathFromDownloadUrl(downloadUrl: string): string | null {
  const match = downloadUrl.match(/\/o\/([^?]+)/)

  if (!match) {
    return null
  }

  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

async function deleteStorageObject(storagePath?: string | null) {
  if (!storagePath) {
    return
  }

  try {
    if (storagePath.startsWith("blob-") || /^https?:\/\//i.test(storagePath)) {
      await del(storagePath, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      return
    }

    const { adminStorage } = await import("@/lib/firebase-admin")
    await adminStorage.file(storagePath).delete({ ignoreNotFound: true })
  } catch (error) {
    console.error("Storage cleanup failed:", error)
  }
}

async function deletePreviewByUrl(previewUrl?: string | null) {
  if (!previewUrl) {
    return
  }

  if (previewUrl.includes("blob.vercel-storage.com")) {
    await deleteStorageObject(previewUrl)
    return
  }

  await deleteStorageObject(getStoragePathFromDownloadUrl(previewUrl))
}

export default async function AdminDashboardPage() {
  const { getAllAssets } = await import("@/lib/assets")
  const { getSiteSettings } = await import("@/lib/site-settings")
  const assets = await getAllAssets()
  const siteSettings = await getSiteSettings().catch(() => getDefaultSiteSettings())
  const initialAssets = assets.map(toAdminAssetView)

  async function saveAssetAction(
    payload: AssetMutationPayload
  ): Promise<MutationResult> {
    "use server"

    try {
      const { adminFirestore } = await import("@/lib/firebase-admin")
      const assetRef = adminFirestore.collection("assets").doc(payload.id)
      const snapshot = await assetRef.get()
      const now = Timestamp.now()
      const existingData = snapshot.exists ? snapshot.data() : null

      await assetRef.set(
        {
          title: payload.title,
          tags: payload.tags,
          format: payload.format,
          description: payload.description ?? null,
          sitePageIds: payload.sitePageIds ?? [],
          previewUrls: payload.previewUrls,
          fileStoragePath: payload.fileStoragePath,
          bundleSize: payload.bundleSize ?? null,
          fileCount: payload.fileCount ?? null,
          visible: payload.visible,
          createdAt: existingData?.createdAt ?? now,
          updatedAt: now,
          downloadCount: existingData?.downloadCount ?? 0,
        },
        { merge: true }
      )

      if (!payload.description) {
        await assetRef.set({ description: FieldValue.delete() }, { merge: true })
      }

      if (!payload.sitePageIds || payload.sitePageIds.length === 0) {
        await assetRef.set({ sitePageIds: FieldValue.delete() }, { merge: true })
      }

      if (!payload.bundleSize) {
        await assetRef.set({ bundleSize: FieldValue.delete() }, { merge: true })
      }

      if (payload.fileCount === undefined) {
        await assetRef.set({ fileCount: FieldValue.delete() }, { merge: true })
      }

      // Handle cleanup of old preview images if they were replaced
      if (payload.previousPreviewUrls) {
        const currentUrls = new Set(payload.previewUrls)
        const deletedUrls = payload.previousPreviewUrls.filter(url => !currentUrls.has(url))
        
        for (const url of deletedUrls) {
          await deletePreviewByUrl(url)
        }
      }

      if (
        payload.previousFileStoragePath &&
        payload.previousFileStoragePath !== payload.fileStoragePath
      ) {
        await deleteStorageObject(payload.previousFileStoragePath)
      }

      return { ok: true }
    } catch (error) {
      return { error: readErrorMessage(error) }
    }
  }

  async function toggleAssetAction(
    assetId: string,
    currentVisible: boolean
  ): Promise<MutationResult> {
    "use server"

    try {
      const { toggleVisibility } = await import("@/lib/assets")
      await toggleVisibility(assetId, currentVisible)
      return { ok: true }
    } catch (error) {
      return { error: readErrorMessage(error) }
    }
  }

  async function deleteAssetAction(payload: {
    assetId: string
    previewUrls: string[]
    fileStoragePath: string
  }): Promise<MutationResult> {
    "use server"

    try {
      const { deleteAsset } = await import("@/lib/assets")
      for (const url of payload.previewUrls) {
        await deletePreviewByUrl(url)
      }
      await deleteStorageObject(payload.fileStoragePath)
      await deleteAsset(payload.assetId)
      return { ok: true }
    } catch (error) {
      return { error: readErrorMessage(error) }
    }
  }

  async function saveSiteSettingsAction(payload: {
    sitePages: Array<{
      id: string
      slug: string
      title: string
      summary: string
      body: string
      ctaLabel: string
      ctaUrl: string
      visible: boolean
    }>
    footerTagline: string
  }): Promise<MutationResult> {
    "use server"

    try {
      const { saveSiteSettings } = await import("@/lib/site-settings")
      await saveSiteSettings(payload)
      return { ok: true }
    } catch (error) {
      return { error: readErrorMessage(error) }
    }
  }

  return (
    <AdminDashboardShell
      assets={initialAssets}
      siteSettings={siteSettings}
      onSaveAsset={saveAssetAction}
      onToggleAsset={toggleAssetAction}
      onDeleteAsset={deleteAssetAction}
      onSaveSiteSettings={saveSiteSettingsAction}
    />
  )
}
