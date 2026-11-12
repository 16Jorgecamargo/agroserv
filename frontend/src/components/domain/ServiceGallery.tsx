import { useState } from 'react'
import { cn } from '../../utils/cn'
import { ServiceImage } from './ServiceImage'

interface ServiceGalleryProps {
  title: string
  photos: string[]
  fallback: string
}

export function ServiceGallery({ title, photos, fallback }: ServiceGalleryProps) {
  const images = photos.length ? photos : [fallback]
  const [selected, setSelected] = useState(0)
  const current = images[Math.min(selected, images.length - 1)]

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-card border border-border bg-surface-muted">
        <ServiceImage src={current} alt={images.length > 1 ? `${title}, foto ${selected + 1} de ${images.length}` : title} className="aspect-[16/9] w-full object-cover" />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Fotos do serviço">
          {images.map((photo, index) => (
            <li key={photo} className="shrink-0">
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-current={index === selected ? 'true' : undefined}
                className={cn(
                  'block overflow-hidden rounded-lg border-2 transition-colors',
                  index === selected ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <ServiceImage src={photo} alt="" className="h-16 w-24 object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
