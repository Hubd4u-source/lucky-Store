const TRUST_POINTS = [
  {
    label: "Instant Downloads",
    description: "Fast access for every visible asset with direct delivery from the storefront.",
  },
  {
    label: "Curated Catalog",
    description: "Each drop is organized for launches, branding, social content, and product visuals.",
  },
  {
    label: "Creator-Ready Files",
    description: "Formats are clearly labeled so teams can move from preview to production quickly.",
  },
  {
    label: "Fresh Weekly Picks",
    description: "New drops, popular downloads, and staff picks keep the catalog feeling alive.",
  },
]

export function TrustBar() {
  return (
    <section className="border-y border-border-default bg-bg-surface">
      <div className="container-custom grid gap-px bg-border-default md:grid-cols-2 xl:grid-cols-4">
        {TRUST_POINTS.map((point) => (
          <div key={point.label} className="bg-bg-surface px-5 py-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              {point.label}
            </p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{point.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
