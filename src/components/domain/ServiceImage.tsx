import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { useFileUrl } from '../../hooks/useFileUrl'
import { cn } from '../../utils/cn'

interface ServiceImageProps {
  src: string
  alt: string
  className?: string
}

export function ServiceImage({ src, alt, className }: ServiceImageProps) {
  const { url, isResolving, failed } = useFileUrl(src)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (isResolving) return <div role="img" aria-label={alt} aria-busy className={cn('animate-pulse bg-surface-muted', className)} />

  if (failed || !url || failedSrc === url) {
    return (
      <div role="img" aria-label={alt} className={cn('grid place-items-center bg-surface-muted text-text-muted', className)}>
        <ImageOff className="size-6" aria-hidden />
      </div>
    )
  }

  return <img src={url} alt={alt} loading="lazy" onError={() => setFailedSrc(url)} className={className} />
}
