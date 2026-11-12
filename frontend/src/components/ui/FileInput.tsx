import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  description?: string
  containerClassName?: string
}

export function FileInput({
  label,
  error,
  description,
  containerClassName,
  id,
  className,
  ...rest
}: FileInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = `${inputId}-description`
  const errorId = `${inputId}-error`
  const describedBy = [description ? descriptionId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClassName}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        type="file"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'block w-full text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15',
          error && 'text-danger',
          className,
        )}
      />
      {description && (
        <p id={descriptionId} className="mt-1 text-sm text-text-muted">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}