import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean
}

export function FilterChip({ isActive, className, children, type = 'button', ...rest }: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={isActive}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
        isActive
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
