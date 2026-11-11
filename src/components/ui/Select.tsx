import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hideLabel?: boolean
  containerClassName?: string
}

export function Select({
  label,
  error,
  hideLabel = false,
  containerClassName,
  id,
  className,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`

  return (
    <div className={containerClassName}>
      <label
        htmlFor={selectId}
        className={cn('mb-1.5 block text-sm font-medium text-text', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-11 w-full rounded-lg border border-border bg-surface px-3 text-[15px] text-text transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}