interface EmptyStateProps {
  title?: string
  description?: string
}

export function EmptyState({
  title = "No assets found",
  description = "Try a different search term or filter.",
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center border border-border-default bg-bg-surface px-6 py-16 text-center">
      <div className="mb-4 font-mono text-4xl text-border-strong">[ ]</div>
      <p className="text-lg font-medium text-text-primary">{title}</p>
      <p className="mt-2 max-w-md font-mono text-xs uppercase tracking-widest text-text-muted">
        {description}
      </p>
    </div>
  )
}
