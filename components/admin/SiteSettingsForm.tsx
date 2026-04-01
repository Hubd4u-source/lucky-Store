"use client"

import * as React from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { v4 as uuidv4 } from "uuid"
import { Eye, EyeOff, Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import type { MutationResult } from "@/components/admin/AssetForm"
import type { SitePage, SiteSettings } from "@/types"

type SiteSettingsFormValues = {
  sitePages: SitePage[]
  footerTagline: string
}

interface SiteSettingsFormProps {
  initialData: SiteSettings
  onSubmit: (payload: {
    sitePages: SitePage[]
    footerTagline: string
  }) => Promise<MutationResult>
  onSuccess: () => void
  onCancel: () => void
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function SiteSettingsForm({
  initialData,
  onSubmit,
  onSuccess,
  onCancel,
}: SiteSettingsFormProps) {
  const [submitError, setSubmitError] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SiteSettingsFormValues>({
    defaultValues: {
      sitePages: initialData.sitePages,
      footerTagline: initialData.footerTagline,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sitePages",
  })

  const sitePages = watch("sitePages")

  const submitForm = handleSubmit(async (values) => {
    setSubmitError("")
    setSubmitting(true)

    try {
      const result = await onSubmit({
        sitePages: values.sitePages
          .map((page) => ({
            ...page,
            id: page.id || uuidv4(),
            slug: normalizeSlug(page.slug || page.title),
            title: page.title.trim(),
            summary: page.summary.trim(),
            body: page.body.trim(),
            ctaLabel: page.ctaLabel.trim() || "Learn More",
            ctaUrl: page.ctaUrl.trim() || "#",
          }))
          .filter((page) => page.title && page.slug),
        footerTagline: values.footerTagline.trim() || "Assets for creators and designers.",
      })

      if ("error" in result) {
        throw new Error(result.error)
      }

      onSuccess()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save site pages.")
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form className="flex flex-col gap-6" onSubmit={submitForm}>
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
          Editable Public Pages
        </p>
        <p className="text-sm leading-6 text-text-secondary">
          Each item becomes a real public page. Your client can edit the page title, slug,
          content, CTA, and visibility from here.
        </p>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const isVisible = sitePages?.[index]?.visible ?? true

          return (
            <div key={field.id} className="border border-border-default bg-bg-surface-2 p-4 md:p-5">
              <input type="hidden" {...register(`sitePages.${index}.id`)} />

              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
                  Page {index + 1}
                </p>

                <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 w-full md:w-auto"
                    onClick={() =>
                      setValue(`sitePages.${index}.visible`, !isVisible, { shouldDirty: true })
                    }
                  >
                    {isVisible ? <Eye size={14} className="mr-2" /> : <EyeOff size={14} className="mr-2" />}
                    {isVisible ? "Visible" : "Hidden"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 w-full text-danger hover:border-danger hover:text-danger md:w-auto"
                    onClick={() => remove(index)}
                  >
                    <Trash size={14} className="mr-2" />
                    Remove
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Page Title"
                  placeholder="e.g. Free Assets"
                  error={errors.sitePages?.[index]?.title?.message}
                  {...register(`sitePages.${index}.title`, {
                    required: "Title is required.",
                  })}
                />

                <Input
                  label="Slug"
                  placeholder="free-assets"
                  error={errors.sitePages?.[index]?.slug?.message}
                  {...register(`sitePages.${index}.slug`, {
                    required: "Slug is required.",
                  })}
                />

                <Input
                  label="Summary"
                  placeholder="Short page intro"
                  error={errors.sitePages?.[index]?.summary?.message}
                  {...register(`sitePages.${index}.summary`, {
                    required: "Summary is required.",
                  })}
                />

                <Input
                  label="CTA Label"
                  placeholder="Learn More"
                  error={errors.sitePages?.[index]?.ctaLabel?.message}
                  {...register(`sitePages.${index}.ctaLabel`, {
                    required: "CTA label is required.",
                  })}
                />

                <Input
                  label="CTA URL"
                  placeholder="https://example.com or /contact"
                  containerClassName="md:col-span-2"
                  error={errors.sitePages?.[index]?.ctaUrl?.message}
                  {...register(`sitePages.${index}.ctaUrl`, {
                    required: "CTA URL is required.",
                  })}
                />
              </div>

              <div className="mt-4">
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                  Page Body
                </label>
                <textarea
                  rows={6}
                  className="w-full border border-border-strong bg-bg-base px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:border-accent focus:outline-none"
                  placeholder="Write the full content for this page."
                  {...register(`sitePages.${index}.body`, {
                    required: "Body is required.",
                  })}
                />
                {errors.sitePages?.[index]?.body?.message ? (
                  <p className="mt-2 border-l-2 border-danger pl-3 font-mono text-[11px] text-danger">
                    {errors.sitePages[index]?.body?.message}
                  </p>
                ) : null}
              </div>
            </div>
          )
        })}

        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full md:w-auto"
          onClick={() =>
            append({
              id: uuidv4(),
              slug: "",
              title: "",
              summary: "",
              body: "",
              ctaLabel: "Learn More",
              ctaUrl: "#",
              visible: true,
            })
          }
        >
          <Plus size={14} className="mr-2" />
          Add Page
        </Button>
      </div>

      <Input
        label="Footer Tagline"
        placeholder="Assets for creators and designers."
        error={errors.footerTagline?.message}
        {...register("footerTagline", {
          required: "Footer tagline is required.",
        })}
      />

      {submitError ? (
        <div className="border-l-2 border-danger pl-3">
          <p className="font-mono text-[11px] text-danger">{submitError}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-6 md:flex-row md:items-center md:justify-end">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="min-h-11 w-full md:w-auto"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={submitting}
          className="min-h-11 w-full md:w-auto"
        >
          Save Pages
        </Button>
      </div>
    </form>
  )
}
