import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  description?: string
  containerClassName?: string
}

export function Checkbox({
  label,
  error,
  description,
  containerClassName,
  id,
  className,
  ...rest
}: CheckboxProps) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId
  const descriptionId = `${checkboxId}-description`
  const errorId = `${checkboxId}-error`
  const describedBy = [description ? descriptionId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClassName}>
      <label htmlFor={checkboxId} className="flex items-start gap-2 text-sm text-text">
        <input
          id={checkboxId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'mt-0.5 size-4 shrink-0 rounded border-border text-primary focus:ring-2 focus:ring-primary/20',
            error && 'border-danger',
            className,
          )}
          {...rest}
        />
        <span>{label}</span>
      </label>
      {description && (
        <p id={descriptionId} className="ml-6 mt-1 text-sm text-text-muted">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="ml-6 mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}