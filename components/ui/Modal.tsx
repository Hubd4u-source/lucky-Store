"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  className?: string
  maxWidth?: string
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  "400px": "max-w-[400px]",
  "480px": "max-w-[480px]",
  "560px": "max-w-[560px]",
  "640px": "max-w-[640px]",
  "800px": "max-w-[800px]",
}

function Modal({ open, onClose, title, children, className, maxWidth = "480px" }: ModalProps) {
  const [shouldRender, setShouldRender] = React.useState(open)
  const [isVisible, setIsVisible] = React.useState(open)
  const titleId = React.useId()

  React.useEffect(() => {
    if (open) {
      setShouldRender(true)
      const frame = window.requestAnimationFrame(() => setIsVisible(true))
      document.body.style.overflow = "hidden"

      return () => window.cancelAnimationFrame(frame)
    }

    setIsVisible(false)
    const timeout = window.setTimeout(() => {
      setShouldRender(false)
      document.body.style.overflow = ""
    }, 200)

    return () => {
      window.clearTimeout(timeout)
      document.body.style.overflow = ""
    }
  }, [open])

  if (!shouldRender) {
    return null
  }

  const widthClass = MAX_WIDTH_CLASSES[maxWidth] ?? "max-w-[480px]"

  return (
    <div
      className={cn(
        "fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 p-4 transition-opacity duration-200",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "relative w-full border border-border-default bg-bg-surface p-8",
          widthClass,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:text-text-primary"
          aria-label="Close modal"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {title ? (
          <h2 id={titleId} className="mb-6 font-display text-xl font-bold text-text-primary">
            {title}
          </h2>
        ) : null}

        <div>{children}</div>
      </div>
    </div>
  )
}

export { Modal }
