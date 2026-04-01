"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { v4 as uuidv4 } from "uuid"
import { File as FileIcon, Image as ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import type { BlobPutResult } from "@/types/blob"
import type { Asset, AssetFormat } from "@/types"
import { UploadProgress } from "@/components/admin/UploadProgress"

export type AdminAssetView = Omit<Asset, "createdAt" | "updatedAt"> & {
  createdAt: string
  updatedAt: string
}

export type MutationResult = { ok: true } | { error: string }

export type AssetMutationPayload = {
  id: string
  title: string
  tags: string[]
  format: AssetFormat
  visible: boolean
  previewUrl: string
  fileStoragePath: string
  previousPreviewUrl?: string
  previousFileStoragePath?: string
}

interface AssetFormValues {
  title: string
  tags: string
  format: AssetFormat
  visible: boolean
}

interface AssetFormProps {
  initialData?: AdminAssetView | null
  onSubmit: (data: AssetMutationPayload) => Promise<MutationResult>
  onSuccess: () => void
  onCancel: () => void
}

function isUploadErrorResponse(
  value: BlobPutResult | { error?: string }
): value is { error?: string } {
  return "error" in value
}

function uploadFile(
  kind: "preview" | "asset",
  assetId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<BlobPutResult> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    const params = new URLSearchParams({
      assetId,
      filename: file.name,
      kind,
    })

    request.open("POST", `/api/upload?${params.toString()}`)

    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total === 0) {
        return
      }

      onProgress(Math.round((event.loaded / event.total) * 100))
    })

    request.addEventListener("load", () => {
      try {
        const response = JSON.parse(request.responseText) as BlobPutResult | { error?: string }

        if (request.status < 200 || request.status >= 300) {
          const message = isUploadErrorResponse(response) ? response.error : undefined
          reject(new Error(message || "Upload failed."))
          return
        }

        if (isUploadErrorResponse(response)) {
          reject(new Error(response.error || "Upload failed."))
          return
        }

        resolve(response)
      } catch {
        reject(new Error("Upload failed."))
      }
    })

    request.addEventListener("error", () => {
      reject(new Error("Upload failed."))
    })

    request.send(file)
  })
}

function getStoredFileName(pathValue?: string): string {
  if (!pathValue) {
    return ""
  }

  const segments = pathValue.split("/")
  return segments[segments.length - 1] ?? pathValue
}

export function AssetForm({
  initialData,
  onSubmit,
  onSuccess,
  onCancel,
}: AssetFormProps) {
  const [assetId] = React.useState(() => initialData?.id ?? uuidv4())
  const [previewFile, setPreviewFile] = React.useState<File | null>(null)
  const [assetFile, setAssetFile] = React.useState<File | null>(null)
  const [objectPreviewUrl, setObjectPreviewUrl] = React.useState<string | null>(null)
  const [submitError, setSubmitError] = React.useState("")
  const [progress, setProgress] = React.useState(0)
  const [progressLabel, setProgressLabel] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetFormValues>({
    defaultValues: {
      title: initialData?.title ?? "",
      tags: initialData?.tags.join(", ") ?? "",
      format: initialData?.format ?? "PNG",
      visible: initialData?.visible ?? true,
    },
  })

  const previewUrl = objectPreviewUrl ?? initialData?.previewUrl ?? ""

  React.useEffect(() => {
    return () => {
      if (objectPreviewUrl) {
        URL.revokeObjectURL(objectPreviewUrl)
      }
    }
  }, [objectPreviewUrl])

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    if (objectPreviewUrl) {
      URL.revokeObjectURL(objectPreviewUrl)
    }

    setPreviewFile(file)
    setObjectPreviewUrl(URL.createObjectURL(file))
  }

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      setAssetFile(file)
    }
  }

  const submitForm = handleSubmit(async (values) => {
    setSubmitError("")
    setSubmitting(true)

    try {
      const nextPreviewUrl = initialData?.previewUrl ?? ""
      let resolvedPreviewUrl = nextPreviewUrl
      let resolvedFileStoragePath = initialData?.fileStoragePath ?? ""

      if (!initialData && !previewFile) {
        throw new Error("Preview image is required.")
      }

      if (!initialData && !assetFile) {
        throw new Error("Asset file is required.")
      }

      if (previewFile) {
        setProgressLabel("Uploading preview")
        const previewBlob = await uploadFile("preview", assetId, previewFile, (value) => {
          setProgress(Math.max(1, Math.round(value * 0.45)))
        })
        resolvedPreviewUrl = previewBlob.url
      }

      if (assetFile) {
        setProgressLabel("Uploading asset")
        const assetBlob = await uploadFile("asset", assetId, assetFile, (value) => {
          setProgress(45 + Math.round(value * 0.45))
        })
        resolvedFileStoragePath = assetBlob.pathname
      }

      setProgressLabel("Saving metadata")
      setProgress(92)

      const result = await onSubmit({
        id: assetId,
        title: values.title.trim(),
        tags: values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        format: values.format,
        visible: values.visible,
        previewUrl: resolvedPreviewUrl,
        fileStoragePath: resolvedFileStoragePath,
        previousPreviewUrl: initialData?.previewUrl,
        previousFileStoragePath: initialData?.fileStoragePath,
      })

      if ("error" in result) {
        throw new Error(result.error)
      }

      setProgress(100)
      onSuccess()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save asset.")
      setProgress(0)
      setProgressLabel("")
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form className="flex flex-col gap-6" onSubmit={submitForm}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Asset Title
            </label>
            <Input
              placeholder="e.g. Hand Holding Robot 3D"
              error={errors.title?.message}
              {...register("title", {
                required: "Title is required.",
                maxLength: {
                  value: 100,
                  message: "Title must be 100 characters or less.",
                },
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                Format
              </label>
              <select
                className="border border-border-default bg-bg-surface-2 px-4 py-3 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
                {...register("format")}
              >
                <option value="PNG">PNG</option>
                <option value="JPG">JPG</option>
                <option value="SVG">SVG</option>
                <option value="PACK">PACK</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                Visible
              </label>
              <div className="flex h-[50px] items-center border border-border-default bg-bg-surface-2 px-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 accent-accent" {...register("visible")} />
                  <span className="font-mono text-xs uppercase tracking-wider text-text-primary">
                    Visible on store
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Tags (comma separated)
            </label>
            <Input
              placeholder="robot, hand, 3d"
              error={errors.tags?.message}
              {...register("tags", {
                required: "At least one tag is required.",
              })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Preview Image
            </label>
            <div className="relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden border border-dashed border-border-strong bg-bg-surface-2 transition-colors hover:border-accent">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-text-muted transition-colors duration-150 hover:text-accent">
                  <ImageIcon size={24} />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    Upload Preview
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePreviewChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
            <p className="text-right font-mono text-[9px] uppercase tracking-wider text-text-muted">
              JPG or PNG, max 2MB
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Asset File
            </label>
            <div className="relative flex h-[80px] cursor-pointer items-center justify-center border border-dashed border-border-strong bg-bg-surface-2 px-4 transition-colors hover:border-accent">
              <div className="flex items-center gap-3 text-text-muted transition-colors duration-150 hover:text-accent">
                <FileIcon size={20} />
                <span className="max-w-[220px] truncate font-mono text-[10px] uppercase tracking-widest">
                  {assetFile ? assetFile.name : getStoredFileName(initialData?.fileStoragePath) || "Upload Asset File"}
                </span>
              </div>
              <input type="file" onChange={handleAssetChange} className="absolute inset-0 cursor-pointer opacity-0" />
            </div>
            <p className="text-right font-mono text-[9px] uppercase tracking-wider text-text-muted">
              Any format, max 50MB
            </p>
          </div>
        </div>
      </div>

      {progress > 0 ? <UploadProgress progress={progress} label={progressLabel} /> : null}

      {submitError ? (
        <div className="border-l-2 border-danger pl-3">
          <p className="font-mono text-[11px] text-danger">{submitError}</p>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-end gap-3 border-t border-border-subtle pt-6">
        <Button variant="outline" type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={submitting}>
          {initialData ? "Save Changes" : "Create Asset"}
        </Button>
      </div>
    </form>
  )
}
