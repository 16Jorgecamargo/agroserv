import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  tone?: 'neutral' | 'danger'
  role?: 'alert' | 'status'
  titleAs?: 'h1' | 'h2' | 'h3'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  role,
  titleAs: Heading = 'h3',
}: EmptyStateProps) {
  return (
    <div
      role={role}
      className="flex flex-col items-center rounded-card border border-dashed border-border bg-surface px-6 py-14 text-center"
    >
      <span
        className={cn(
          'grid size-12 place-items-center rounded-full',
          tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary-soft text-primary',
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <Heading className="mt-4 text-lg font-semibold text-text">{title}</Heading>
      {description && <p className="mt-1 max-w-md text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
