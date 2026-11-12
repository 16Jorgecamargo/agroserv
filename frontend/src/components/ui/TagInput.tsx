import { X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { cn } from '../../utils/cn'

interface TagInputProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  error?: string
  description?: string
  placeholder?: string
  maxItems?: number
}

export function TagInput({ label, values, onChange, error, description, placeholder, maxItems = 10 }: TagInputProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const descriptionId = `${inputId}-description`
  const [draft, setDraft] = useState('')

  function addDraft() {
    const value = draft.trim().replace(/,$/, '').trim()
    if (!value) return
    if (values.some((item) => item.toLowerCase() === value.toLowerCase()) || values.length >= maxItems) {
      setDraft('')
      return
    }
    onChange([...values, value])
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addDraft()
    } else if (event.key === 'Backspace' && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }

  const describedBy = [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text">
        {label}
      </label>
      <div
        className={cn(
          'flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 transition-[border-color,box-shadow] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          error && 'border-danger focus-within:border-danger focus-within:ring-danger/20',
        )}
      >
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pr-1 pl-3 text-sm font-medium text-primary">
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              aria-label={`Remover ${value}`}
              className="grid size-5 place-items-center rounded-full hover:bg-primary/10"
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addDraft}
          placeholder={values.length ? undefined : placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-8 min-w-32 flex-1 bg-transparent px-1 text-[15px] text-text placeholder:text-text-muted/80 focus:outline-none"
        />
      </div>
      {description && (
        <p id={descriptionId} className="mt-1.5 text-xs text-text-muted">
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
