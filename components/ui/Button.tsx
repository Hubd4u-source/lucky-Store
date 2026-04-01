"use client"

import * as React from "react"
import { Loader2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type ButtonVariant = "primary" | "ghost" | "danger" | "outline" | "secondary"
export type ButtonSize = "sm" | "md" | "lg" | "icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      icon: Icon,
      loading = false,
      children,
      type,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants: Record<ButtonVariant, string> = {
      primary: "bg-accent text-bg-base hover:bg-accent-dim",
      ghost: "bg-transparent border border-transparent text-text-secondary hover:text-text-primary hover:border-border-default",
      danger: "bg-danger text-white hover:bg-danger-dim",
      outline: "bg-transparent border border-border-strong text-text-secondary hover:border-accent hover:text-accent",
      secondary: "bg-bg-surface-2 text-text-secondary border border-border-default hover:bg-bg-surface-3 hover:border-border-strong",
    }

    const sizes: Record<ButtonSize, string> = {
      sm: "px-4 py-2 text-[10px]",
      md: "px-6 py-3 text-xs",
      lg: "px-10 py-4 text-sm",
      icon: "h-10 w-10 p-0",
    }

    const content = loading ? (
      <Loader2 className={cn("h-4 w-4 animate-spin", children ? "mr-2" : "")} aria-hidden="true" />
    ) : Icon ? (
      <Icon className={cn("h-4 w-4", children ? "mr-2" : "")} aria-hidden="true" />
    ) : null

    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "inline-flex items-center justify-center border font-mono uppercase tracking-widest transition-colors duration-150 focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50",
          variants[variant],
          sizes[size],
          variant === "primary" && "font-semibold",
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {content}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
