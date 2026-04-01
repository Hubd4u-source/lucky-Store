"use client"

interface UploadProgressProps {
  progress: number
  label: string
}

export function UploadProgress({ progress, label }: UploadProgressProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          {label}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
          {clampedProgress}%
        </span>
      </div>
      <progress
        className="h-0.5 w-full overflow-hidden border-0 bg-bg-surface-3 accent-accent"
        value={clampedProgress}
        max={100}
      />
    </div>
  )
}
