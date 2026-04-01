import { cn } from "@/lib/utils"

interface StoreSectionProps {
  eyebrow: string
  title: string
  description: string
  className?: string
}

export function StoreSection({
  eyebrow,
  title,
  description,
  className,
}: StoreSectionProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-black uppercase tracking-[0.04em] text-text-primary md:text-4xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-6 text-text-secondary md:text-base">
        {description}
      </p>
    </div>
  )
}
