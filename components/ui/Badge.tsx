import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "png" | "jpg" | "svg" | "pack" | "default"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-bg-surface-3 text-text-muted border border-border-default",
    png: "bg-[#121c12] text-[#6e8f6e] border border-[#2a3a2a]",
    jpg: "bg-[#121722] text-[#5d84b5] border border-[#273242]",
    svg: "bg-[#1a1322] text-[#9f7abf] border border-[#37264a]",
    pack: "bg-[#201909] text-[#c49a4a] border border-[#3b2c12]",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
