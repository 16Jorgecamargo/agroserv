import type { ReactNode } from 'react'

interface SectionHeaderProps {
  id: string
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({ id, eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">{eyebrow}</p>}
        <h2 id={id} className="mt-2 text-[26px]/[34px] font-bold tracking-[-0.01em] text-text sm:text-3xl/[38px]">
          {title}
        </h2>
        {description && <p className="mt-2 text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
