import { useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hideLabel?: boolean
  containerClassName?: string
}

export function Textarea({
  label,
  error,
  hideLabel = false,
  containerClassName,
  id,
  className,
  ...rest
}: TextareaProps) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const errorId = `${textareaId}-error`

  return (
    <div className={containerClassName}>
      <label
        htmlFor={textareaId}
        className={cn('mb-1.5 block text-sm font-medium text-text', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'min-h-28 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-[15px] text-text transition-[border-color,box-shadow] placeholder:text-text-muted/80 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className,
        )}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}