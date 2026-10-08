import type { LucideIcon } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: LucideIcon
  hideLabel?: boolean
  variant?: 'default' | 'bare'
  trailing?: ReactNode
  containerClassName?: string
}

export function Input({
  label,
  error,
  icon: Icon,
  hideLabel = false,
  variant = 'default',
  trailing,
  containerClassName,
  id,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className={containerClassName}>
      <label htmlFor={inputId} className={cn('mb-1.5 block text-sm font-medium text-text', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-11 w-full rounded-lg px-3 text-[15px] text-text transition-[border-color,box-shadow] placeholder:text-text-muted/80 focus:outline-none focus-visible:outline-none',
            variant === 'default'
              ? 'border border-border bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20'
              : 'border border-transparent bg-transparent focus:bg-surface-muted/60',
            Icon && 'pl-10',
            trailing ? 'pr-11' : undefined,
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className,
          )}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
