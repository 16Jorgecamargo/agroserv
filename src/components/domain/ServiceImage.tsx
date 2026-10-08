import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'

interface ServiceImageProps {
  src: string
  alt: string
  className?: string
}

export function ServiceImage({ src, alt, className }: ServiceImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (failedSrc === src) {
    return (
      <div role="img" aria-label={alt} className={cn('grid place-items-center bg-surface-muted text-text-muted', className)}>
        <ImageOff className="size-6" aria-hidden />
      </div>
    )
  }

  return <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} className={className} />
}
