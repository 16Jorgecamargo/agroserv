import { ImagePlus, Loader2, X } from 'lucide-react'
import { useId, useState, type ChangeEvent } from 'react'
import { isApiError } from '../../services/apiError'
import { uploadService } from '../../services/uploadService'
import { cn } from '../../utils/cn'
import { ACCEPTED_IMAGE_TYPES } from '../../utils/validators'
import { ServiceImage } from '../domain/ServiceImage'

interface PhotoListFieldProps {
  label: string
  photos: string[]
  onChange: (photos: string[]) => void
  max?: number
  error?: string
  description?: string
}

export function PhotoListField({ label, photos, onChange, max = 8, error, description }: PhotoListFieldProps) {
  const id = useId()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>()
  const message = uploadError ?? error
  const remaining = max - photos.length

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, remaining)
    event.target.value = ''
    if (!files.length || isUploading) return

    setUploadError(undefined)
    setIsUploading(true)
    const added: string[] = []
    try {
      for (const file of files) {
        const upload = await uploadService.upload(file, 'public', ACCEPTED_IMAGE_TYPES)
        added.push(upload.url)
      }
    } catch (caught) {
      setUploadError(isApiError(caught) ? (caught.fields?.file ?? caught.message) : 'Não foi possível enviar a foto.')
    } finally {
      if (added.length) onChange([...photos, ...added])
      setIsUploading(false)
    }
  }

  return (
    <fieldset aria-describedby={message ? `${id}-error` : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-text">{label}</legend>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Fotos enviadas">
        {photos.map((photo, index) => (
          <li key={photo} className="group relative overflow-hidden rounded-lg border border-border bg-surface-muted">
            <ServiceImage src={photo} alt={`Foto ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
            {index === 0 && <span className="absolute top-2 left-2 rounded-full bg-text/80 px-2 py-0.5 text-[11px] font-semibold text-surface">Capa</span>}
            <button
              type="button"
              onClick={() => onChange(photos.filter((candidate) => candidate !== photo))}
              aria-label={`Remover foto ${index + 1}`}
              className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-surface/90 text-text shadow-card hover:text-danger"
            >
              <X className="size-4" aria-hidden />
            </button>
          </li>
        ))}
        {remaining > 0 && (
          <li>
            <label
              className={cn(
                'flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-sm font-medium text-text-muted transition-colors hover:border-primary hover:text-primary focus-within:border-primary focus-within:text-primary',
                isUploading && 'pointer-events-none opacity-60',
              )}
            >
              {isUploading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ImagePlus className="size-5" aria-hidden />}
              {isUploading ? 'Enviando…' : 'Adicionar fotos'}
              <input
                type="file"
                multiple
                className="sr-only"
                aria-label={`Adicionar fotos (${remaining} restantes)`}
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                disabled={isUploading}
                onChange={handleChange}
              />
            </label>
          </li>
        )}
      </ul>
      {description && <p className="mt-1.5 text-xs text-text-muted">{description}</p>}
      {message && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger">
          {message}
        </p>
      )}
    </fieldset>
  )
}
