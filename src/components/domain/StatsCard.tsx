import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string
  description: string
  icon: LucideIcon
}

export function StatsCard({ label, value, description, icon: Icon }: StatsCardProps) {
  return (
    <article className="h-full rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-text-muted">{label}</h3>
        <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-[-0.01em] text-text tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{description}</p>
    </article>
  )
}
