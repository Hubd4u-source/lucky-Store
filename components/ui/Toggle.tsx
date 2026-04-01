"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: React.ReactNode
  description?: React.ReactNode
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onCheckedChange, label, description, className, disabled, id, ...props }, ref) => {
    const reactId = React.useId()
    const toggleId = id ?? reactId

    return (
      <div className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <button
          ref={ref}
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            "mt-0.5 inline-flex h-6 w-11 shrink-0 items-center border border-border-default bg-bg-surface-2 p-1 transition-colors duration-150 focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50",
            checked && "border-accent bg-accent/10",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              "block h-3.5 w-3.5 bg-text-muted",
              checked && "translate-x-5 bg-accent"
            )}
            aria-hidden="true"
          />
        </button>

        {(label || description) && (
          <label htmlFor={toggleId} className="min-w-0 cursor-pointer select-none">
            {label ? (
              <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
                {label}
              </span>
            ) : null}
            {description ? <span className="mt-1 block text-sm leading-6 text-text-muted">{description}</span> : null}
          </label>
        )}
      </div>
    )
  }
)

Toggle.displayName = "Toggle"

export { Toggle }
