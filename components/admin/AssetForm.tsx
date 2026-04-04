"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { v4 as uuidv4 } from "uuid"
import { File as FileIcon, Image as ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { Toggle } from "@/components/ui/Toggle"
import type { BlobPutResult } from "@/types/blob"
import type { Asset, AssetFormat, SitePage } from "@/types"
import { UploadProgress } from "@/components/admin/UploadProgress"
import { GalleryGrid } from "@/components/admin/GalleryGrid"

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
  description?: string
  sitePageIds?: string[]
  visible: boolean
  previewUrls: string[]
  fileStoragePath: string
  bundleSize?: string
  fileCount?: number
  previousPreviewUrls?: string[]
  previousFileStoragePath?: string
}

interface AssetFormValues {
  title: string
  tags: string
  format: AssetFormat
  description: string
  sitePageIds: string[]
  bundleSize: string
  fileCount: string
  visible: boolean
}

interface AssetFormProps {
  initialData?: AdminAssetView | null
  availableSitePages: SitePage[]
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
  availableSitePages,
  onSubmit,
  onSuccess,
  onCancel,
}: AssetFormProps) {
  const [assetId] = React.useState(() => initialData?.id ?? uuidv4())
  const [gallery, setGallery] = React.useState<(File | string)[]>(() => initialData?.previewUrls ?? [])
  const [assetFile, setAssetFile] = React.useState<File | null>(null)
  const [submitError, setSubmitError] = React.useState("")
  const [progress, setProgress] = React.useState(0)
  const [progressLabel, setProgressLabel] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssetFormValues>({
    defaultValues: {
      title: initialData?.title ?? "",
      tags: initialData?.tags.join(", ") ?? "",
      format: initialData?.format ?? "PNG",
      description: initialData?.description ?? "",
      sitePageIds: initialData?.sitePageIds ?? [],
      bundleSize: initialData?.bundleSize ?? "",
      fileCount:
        typeof initialData?.fileCount === "number" && Number.isFinite(initialData.fileCount)
          ? String(initialData.fileCount)
          : "",
      visible: initialData?.visible ?? true,
    },
  })

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
      const resolvedPreviewUrls: string[] = []
      let resolvedFileStoragePath = initialData?.fileStoragePath ?? ""

      if (gallery.length === 0) {
        throw new Error("At least one preview image is required.")
      }

      if (!initialData && !assetFile) {
        throw new Error("Asset file is required.")
      }

      // Upload gallery images
      setProgressLabel("Uploading gallery")
      for (let i = 0; i < gallery.length; i++) {
        const item = gallery[i]
        if (typeof item === "string") {
          resolvedPreviewUrls.push(item)
          continue
        }

        const progressBase = (i / gallery.length) * 50
        const blob = await uploadFile("preview", assetId, item, (percent) => {
          setProgress(Math.round(progressBase + (percent / gallery.length) * 0.5))
        })
        resolvedPreviewUrls.push(blob.url)
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
        description: values.description.trim() || undefined,
        sitePageIds: values.sitePageIds,
        visible: values.visible,
        previewUrls: resolvedPreviewUrls,
        fileStoragePath: resolvedFileStoragePath,
        bundleSize: values.bundleSize.trim() || undefined,
        fileCount: values.fileCount.trim() ? Number.parseInt(values.fileCount.trim(), 10) : undefined,
        previousPreviewUrls: initialData?.previewUrls,
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
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)]">
            <Select
              label="Format"
              options={[
                { value: "PNG", label: "PNG" },
                { value: "JPG", label: "JPG" },
                { value: "SVG", label: "SVG" },
                { value: "PACK", label: "PACK" },
              ]}
              {...register("format")}
            />

            <div className="flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                Visible
              </label>
              <div className="flex min-h-[88px] items-start border border-border-default bg-bg-surface-2 px-4 py-4">
                <Toggle
                  checked={watch("visible")}
                  onCheckedChange={(checked) => setValue("visible", checked, { shouldDirty: true })}
                  label="Visible on store"
                  description="Show this asset in the public catalog."
                />
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

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Product Description
            </label>
            <textarea
              rows={5}
              className="w-full border border-border-strong bg-bg-surface-2 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:border-accent focus:outline-none"
              placeholder="Describe what makes this asset useful, what it includes, and how creators might use it."
              {...register("description")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Show On Pages
            </label>
            <div className="grid max-h-[280px] gap-2 overflow-y-auto border border-border-default bg-bg-surface-2 p-4">
              {availableSitePages.map((page) => {
                const selected = watch("sitePageIds").includes(page.id)

                return (
                  <label key={page.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary">{page.title}</p>
                      <p className="break-all font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                        /pages/{page.slug}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => {
                        const current = watch("sitePageIds")
                        const next = event.target.checked
                          ? [...current, page.id]
                          : current.filter((value) => value !== page.id)

                        setValue("sitePageIds", next, { shouldDirty: true })
                      }}
                      className="h-4 w-4 accent-accent"
                    />
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Bundle Size"
              placeholder="e.g. 128 MB"
              helperText="Shown on product cards and detail pages."
              {...register("bundleSize")}
            />

            <Input
              label="Files Included"
              type="number"
              min={1}
              placeholder="e.g. 12"
              helperText="Used for bundle metadata."
              error={errors.fileCount?.message}
              {...register("fileCount", {
                validate: (value) => {
                  if (!value.trim()) {
                    return true
                  }

                  const parsed = Number.parseInt(value, 10)
                  return parsed > 0 || "File count must be greater than zero."
                },
              })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 xl:border-l xl:border-border-subtle xl:pl-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              Uploads
            </p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Add the preview image and source file here. This column stays focused on upload tasks
              so the form is easier to scan.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Product Images
            </label>
            <div className="border border-border-subtle bg-bg-surface-2 p-4">
              <GalleryGrid 
                images={gallery}
                onAdd={(files) => setGallery([...gallery, ...files])}
                onRemove={(index) => setGallery(gallery.filter((_, i) => i !== index))}
                onReorder={setGallery}
              />
            </div>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Images will be displayed in the order shown. First image is the main catalog thumbnail.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
              Asset File
            </label>
            <div className="relative flex min-h-[108px] cursor-pointer items-center justify-center border border-dashed border-border-strong bg-bg-surface-2 px-4 transition-colors hover:border-accent">
              <div className="flex items-center gap-3 text-text-muted transition-colors duration-150 hover:text-accent">
                <FileIcon size={20} />
                <span className="max-w-[240px] truncate font-mono text-[10px] uppercase tracking-widest">
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
