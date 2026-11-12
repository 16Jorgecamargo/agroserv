import { FileText, Loader2, Upload as UploadIcon, X } from 'lucide-react'
import { useId, useState, type ChangeEvent } from 'react'
import { isApiError } from '../../services/apiError'
import { uploadService } from '../../services/uploadService'
import type { Upload, UploadPurpose } from '../../types/entities'
import { cn } from '../../utils/cn'
import { ACCEPTED_FILE_TYPES, ACCEPTED_IMAGE_TYPES } from '../../utils/validators'
import { ServiceImage } from '../domain/ServiceImage'
import { buttonClasses } from './buttonClasses'

export type UploadedFile = Pick<Upload, 'id' | 'url' | 'name' | 'contentType'>

interface FileUploadFieldProps {
  label: string
  value: UploadedFile | null
  onChange: (file: UploadedFile | null) => void
  purpose?: UploadPurpose
  imagesOnly?: boolean
  description?: string
  error?: string
  disabled?: boolean
}

export function FileUploadField({
  label,
  value,
  onChange,
  purpose = 'public',
  imagesOnly = false,
  description,
  error,
  disabled = false,
}: FileUploadFieldProps) {
  const inputId = useId()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>()
  const acceptedTypes = imagesOnly ? ACCEPTED_IMAGE_TYPES : ACCEPTED_FILE_TYPES
  const message = uploadError ?? error
  const describedBy = [description ? `${inputId}-description` : undefined, message ? `${inputId}-error` : undefined]
    .filter(Boolean)
    .join(' ')

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || isUploading) return

    setUploadError(undefined)
    setIsUploading(true)
    try {
      const upload = await uploadService.upload(file, purpose, acceptedTypes)
      onChange({ id: upload.id, url: upload.url, name: upload.name, contentType: upload.contentType })
    } catch (caught) {
      setUploadError(isApiError(caught) ? (caught.fields?.file ?? caught.message) : 'Não foi possível enviar o arquivo.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <p id={`${inputId}-label`} className="mb-1.5 text-sm font-medium text-text">
        {label}
      </p>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
          {value.contentType.startsWith('image/') ? (
            <ServiceImage src={value.url} alt={value.name} className="size-14 shrink-0 rounded-md object-cover" />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-md bg-surface-muted text-text-muted">
              <FileText className="size-6" aria-hidden />
            </span>
          )}
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-text">{value.name}</p>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label={`Remover ${value.name}`}
            className="grid size-9 place-items-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-danger"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            buttonClasses('secondary', 'md'),
            'cursor-pointer focus-within:ring-2 focus-within:ring-primary/40',
            (disabled || isUploading) && 'pointer-events-none opacity-60',
            message && 'border-danger',
          )}
        >
          {isUploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UploadIcon className="size-4" aria-hidden />}
          {isUploading ? 'Enviando…' : 'Escolher arquivo'}
          <input
            type="file"
            className="sr-only"
            accept={acceptedTypes.join(',')}
            aria-labelledby={`${inputId}-label`}
            aria-describedby={describedBy || undefined}
            aria-invalid={message ? true : undefined}
            disabled={disabled || isUploading}
            onChange={handleChange}
          />
        </label>
      )}
      {description && (
        <p id={`${inputId}-description`} className="mt-1.5 text-xs text-text-muted">
          {description}
        </p>
      )}
      {message && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-sm text-danger">
          {message}
        </p>
      )}
    </div>
  )
}
