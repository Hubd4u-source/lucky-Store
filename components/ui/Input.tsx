"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
  helperText?: React.ReactNode
  icon?: LucideIcon
  error?: string | boolean
  containerClassName?: string
  labelClassName?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      labelClassName,
      label,
      helperText,
      type,
      icon: Icon,
      error,
      id,
      ...props
    },
    ref
  ) => {
    const reactId = React.useId()
    const inputId = id ?? reactId
    const hasError = Boolean(error)

    return (
      <div className={cn("w-full", containerClassName)}>
        {label ? (
          <label
            htmlFor={inputId}
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

          <input
            id={inputId}
            ref={ref}
            type={type}
            aria-invalid={hasError || undefined}
            className={cn(
              "flex w-full border border-border-strong bg-bg-surface-2 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150 focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              Icon ? "pl-11" : "",
              hasError && "border-danger focus:border-danger",
              className
            )}
            {...props}
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

Input.displayName = "Input"

export { Input }
