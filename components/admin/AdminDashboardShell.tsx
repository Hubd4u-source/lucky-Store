"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AssetTable } from "@/components/admin/AssetTable"
import {
  AssetForm,
  type AdminAssetView,
  type AssetMutationPayload,
  type MutationResult,
} from "@/components/admin/AssetForm"
import { DeleteConfirm } from "@/components/admin/DeleteConfirm"
import { SiteSettingsForm } from "@/components/admin/SiteSettingsForm"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import type { SiteSettings } from "@/types"

type SaveAssetAction = (payload: AssetMutationPayload) => Promise<MutationResult>
type ToggleAssetAction = (assetId: string, currentVisible: boolean) => Promise<MutationResult>
type DeleteAssetAction = (payload: {
  assetId: string
  previewUrls: string[]
  fileStoragePath: string
}) => Promise<MutationResult>
type SaveSiteSettingsAction = (payload: {
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
}) => Promise<MutationResult>

interface AdminDashboardShellProps {
  assets: AdminAssetView[]
  siteSettings: SiteSettings
  onSaveAsset: SaveAssetAction
  onToggleAsset: ToggleAssetAction
  onDeleteAsset: DeleteAssetAction
  onSaveSiteSettings: SaveSiteSettingsAction
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="border border-border-default bg-bg-surface p-4 md:p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-black tracking-wider text-accent md:text-3xl">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-5 text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function AdminDashboardShell({
  assets,
  siteSettings,
  onSaveAsset,
  onToggleAsset,
  onDeleteAsset,
  onSaveSiteSettings,
}: AdminDashboardShellProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isSiteSettingsOpen, setIsSiteSettingsOpen] = React.useState(false)
  const [editingAsset, setEditingAsset] = React.useState<AdminAssetView | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<AdminAssetView | null>(null)
  const [pendingAssetId, setPendingAssetId] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState("")

  const totalDownloads = assets.reduce((sum, asset) => sum + asset.downloadCount, 0)
  const visibleAssets = assets.filter((asset) => asset.visible).length
  const hiddenAssets = assets.length - visibleAssets
  const pageCount = siteSettings.sitePages.length

  const openCreate = () => {
    setEditingAsset(null)
    setActionError("")
    setIsFormOpen(true)
  }

  const openEdit = (asset: AdminAssetView) => {
    setEditingAsset(asset)
    setActionError("")
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingAsset(null)
  }

  const handleFormSuccess = () => {
    closeForm()
    router.refresh()
  }

  const handleToggleVisibility = async (asset: AdminAssetView) => {
    setPendingAssetId(asset.id)
    setActionError("")

    try {
      const result = await onToggleAsset(asset.id, asset.visible)

      if ("error" in result) {
        setActionError(result.error)
        return
      }

      router.refresh()
    } finally {
      setPendingAssetId(null)
    }
  }

  const handleDeleteSuccess = () => {
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <AdminHeader onAdd={openCreate} onEditSite={() => setIsSiteSettingsOpen(true)} />

      <main className="container-custom flex flex-1 flex-col gap-8 py-6 md:gap-10 md:py-10">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Assets" value={assets.length} hint="Everything in the catalog." />
          <StatCard label="Visible Assets" value={visibleAssets} hint="Currently live on the store." />
          <StatCard label="Hidden Assets" value={hiddenAssets} hint="Drafts or paused items." />
          <StatCard label="Public Pages" value={pageCount} hint={`${totalDownloads} total downloads`} />
        </section>

        <section className="border border-border-default bg-bg-surface p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                Public Site Controls
              </p>
              <h2 className="mt-2 font-display text-xl font-bold uppercase tracking-widest text-text-primary">
                Editable Public Pages
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
                The client can edit each public page title, slug, summary, body, CTA, and footer
                tagline from the admin panel. No code changes needed after handoff.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setIsSiteSettingsOpen(true)}
              className="min-h-11 w-full md:w-auto"
            >
              Edit Site Content
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {siteSettings.sitePages.map((page) => (
              <span
                key={page.id}
                className="border border-border-default bg-bg-surface-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary"
              >
                {page.title}
              </span>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="font-display text-xl font-bold uppercase tracking-widest text-text-primary">
                Manage Assets
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                Upload, assign, and organize assets from a layout that works better on phones.
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              {totalDownloads} total downloads
            </p>
          </div>

          {actionError ? (
            <div className="border-l-2 border-danger pl-3">
              <p className="font-mono text-[11px] text-danger">{actionError}</p>
            </div>
          ) : null}

          <AssetTable
            assets={assets}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            onToggleVisibility={handleToggleVisibility}
            pendingAssetId={pendingAssetId}
          />
        </section>
      </main>

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={editingAsset ? "Edit Asset" : "Add Asset"}
        maxWidth="960px"
      >
        <AssetForm
          key={editingAsset?.id ?? "new-asset"}
          initialData={editingAsset}
          availableSitePages={siteSettings.sitePages}
          onSubmit={onSaveAsset}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
        />
      </Modal>

      <Modal
        open={isSiteSettingsOpen}
        onClose={() => setIsSiteSettingsOpen(false)}
        title="Site Settings"
        maxWidth="960px"
      >
        <SiteSettingsForm
          initialData={siteSettings}
          onSubmit={onSaveSiteSettings}
          onSuccess={() => {
            setIsSiteSettingsOpen(false)
            router.refresh()
          }}
          onCancel={() => setIsSiteSettingsOpen(false)}
        />
      </Modal>

      {deleteTarget ? (
        <DeleteConfirm
          open={Boolean(deleteTarget)}
          assetTitle={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() =>
            onDeleteAsset({
              assetId: deleteTarget.id,
              previewUrls: deleteTarget.previewUrls,
              fileStoragePath: deleteTarget.fileStoragePath,
            })
          }
          onSuccess={handleDeleteSuccess}
        />
      ) : null}
    </div>
  )
}
