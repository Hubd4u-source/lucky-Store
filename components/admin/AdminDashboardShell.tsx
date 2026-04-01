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
import { Modal } from "@/components/ui/Modal"

type SaveAssetAction = (payload: AssetMutationPayload) => Promise<MutationResult>
type ToggleAssetAction = (assetId: string, currentVisible: boolean) => Promise<MutationResult>
type DeleteAssetAction = (payload: {
  assetId: string
  previewUrl: string
  fileStoragePath: string
}) => Promise<MutationResult>

interface AdminDashboardShellProps {
  assets: AdminAssetView[]
  onSaveAsset: SaveAssetAction
  onToggleAsset: ToggleAssetAction
  onDeleteAsset: DeleteAssetAction
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="border border-border-default bg-bg-surface p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-black tracking-wider text-accent">
        {value}
      </p>
    </div>
  )
}

export function AdminDashboardShell({
  assets,
  onSaveAsset,
  onToggleAsset,
  onDeleteAsset,
}: AdminDashboardShellProps) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingAsset, setEditingAsset] = React.useState<AdminAssetView | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<AdminAssetView | null>(null)
  const [pendingAssetId, setPendingAssetId] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState("")

  const totalDownloads = assets.reduce((sum, asset) => sum + asset.downloadCount, 0)
  const visibleAssets = assets.filter((asset) => asset.visible).length
  const hiddenAssets = assets.length - visibleAssets

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
      <AdminHeader onAdd={openCreate} />

      <main className="container-custom flex flex-1 flex-col gap-10 py-12">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Assets" value={assets.length} />
          <StatCard label="Visible Assets" value={visibleAssets} />
          <StatCard label="Hidden Assets" value={hiddenAssets} />
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold uppercase tracking-widest text-text-primary">
              Manage Assets
            </h1>
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
        maxWidth="800px"
      >
        <AssetForm
          key={editingAsset?.id ?? "new-asset"}
          initialData={editingAsset}
          onSubmit={onSaveAsset}
          onSuccess={handleFormSuccess}
          onCancel={closeForm}
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
              previewUrl: deleteTarget.previewUrl,
              fileStoragePath: deleteTarget.fileStoragePath,
            })
          }
          onSuccess={handleDeleteSuccess}
        />
      ) : null}
    </div>
  )
}
