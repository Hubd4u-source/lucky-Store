"use client"

import * as React from "react"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type SelectOption = {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  error?: string | boolean
  containerClassName?: string
  labelClassName?: string
  options?: SelectOption[]
  icon?: LucideIcon
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      label,
      helperText,
      error,
      options,
      children,
      id,
      icon: Icon,
      ...props
    },
    ref
  ) => {
    const reactId = React.useId()
    const selectId = id ?? reactId
    const hasError = Boolean(error)

    return (
      <div className={cn("w-full", containerClassName)}>
        {label ? (
          <label
            htmlFor={selectId}
            className={cn(
              "mb-2 block font-mono text-xs uppercase tracking-widest text-text-secondary",
              labelClassName
            )}
          >
            {label}
          </label>
        ) : null}

        <div className="relative w-full">
          {Icon ? (
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              <Icon size={16} aria-hidden="true" />
            </div>
          ) : null}

          <select
            id={selectId}
            ref={ref}
            aria-invalid={hasError || undefined}
            className={cn(
              "flex h-12 w-full appearance-none border border-border-strong bg-bg-surface-2 px-4 py-3 pr-10 text-sm text-text-primary transition-colors duration-150 focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              Icon ? "pl-11" : "",
              hasError && "border-danger focus:border-danger",
              className
            )}
            {...props}
          >
            {options
              ? options.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))
              : children}
          </select>

          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>

        {typeof error === "string" ? (
          <p className="mt-2 border-l-2 border-danger pl-3 font-mono text-[11px] uppercase tracking-widest text-danger">
            {error}
          </p>
        ) : helperText ? (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-text-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = "Select"

export { Select }
