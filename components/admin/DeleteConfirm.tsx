"use client"

import * as React from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import type { MutationResult } from "@/components/admin/AssetForm"

interface DeleteConfirmProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<MutationResult>
  onSuccess: () => void
  assetTitle: string
}

export function DeleteConfirm({
  open,
  onClose,
  onConfirm,
  onSuccess,
  assetTitle,
}: DeleteConfirmProps) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleConfirm = async () => {
    setLoading(true)
    setError("")

    try {
      const result = await onConfirm()

      if ("error" in result) {
        setError(result.error)
        return
      }

      onSuccess()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Delete failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete Asset" maxWidth="400px">
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <p className="font-body text-sm text-text-primary">Delete "{assetTitle}"?</p>
          <p className="text-sm font-body leading-normal text-text-secondary">
            This will permanently remove the asset record and its files from storage. This action
            cannot be undone.
          </p>
        </div>

        {error ? (
          <div className="border-l-2 border-danger pl-3">
            <p className="font-mono text-[11px] text-danger">{error}</p>
          </div>
        ) : null}

        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Confirm carefully
        </p>

        <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-6 md:flex-row md:items-center md:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="min-h-11 w-full md:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            loading={loading}
            className="min-h-11 w-full md:w-auto"
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  )
}
