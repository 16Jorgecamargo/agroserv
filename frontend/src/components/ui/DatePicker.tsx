import { useId, type ChangeEvent, type InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'min' | 'onChange'> {
  label: string
  error?: string
  hideLabel?: boolean
  minDate?: string
  disabledDates?: readonly string[]
  containerClassName?: string
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

export function DatePicker({
  label,
  error,
  hideLabel = false,
  minDate,
  disabledDates = [],
  containerClassName,
  id,
  className,
  onChange,
  ...rest
}: DatePickerProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedDate = event.currentTarget.value
    const isBeforeMinimum = Boolean(minDate && selectedDate && selectedDate < minDate)
    const isDisabledDate = Boolean(selectedDate && disabledDates.includes(selectedDate))

    if (isBeforeMinimum || isDisabledDate) {
      event.currentTarget.value = ''
      return
    }

    onChange?.(event)
  }

  return (
    <div className={containerClassName}>
      <label htmlFor={inputId} className={cn('mb-1.5 block text-sm font-medium text-text', hideLabel && 'sr-only')}>
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        type="date"
        min={minDate}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-11 w-full rounded-lg border border-border bg-surface px-3 text-[15px] text-text transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className,
        )}
        onChange={handleChange}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}