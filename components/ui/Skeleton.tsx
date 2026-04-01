import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "asset-card"
}

function Skeleton({ className, variant = "asset-card", ...props }: SkeletonProps) {
  if (variant !== "asset-card") {
    return <div className={cn("bg-bg-surface-3", className)} aria-hidden="true" {...props} />
  }

  return (
    <div
      className={cn("flex flex-col border border-border-default bg-bg-surface", className)}
      aria-hidden="true"
      {...props}
    >
      <div className="aspect-[4/3] bg-bg-surface-3" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="h-3 w-3/4 bg-bg-surface-3" />
        <div className="h-3 w-1/2 bg-bg-surface-3" />
        <div className="mt-auto flex gap-2">
          <div className="h-5 w-12 bg-bg-surface-3" />
          <div className="h-5 w-10 bg-bg-surface-3" />
          <div className="h-5 w-14 bg-bg-surface-3" />
        </div>
        <div className="h-10 w-full bg-bg-surface-3" />
      </div>
    </div>
  )
}

export { Skeleton }
