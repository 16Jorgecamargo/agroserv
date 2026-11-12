import { useState } from 'react'
import { useFileUrl } from '../../hooks/useFileUrl'
import { cn } from '../../utils/cn'
import { getInitials } from '../../utils/format'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-20 text-2xl',
}

interface AvatarProps {
  name: string
  src?: string
  size?: AvatarSize
  className?: string
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const { url } = useFileUrl(src)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const classes = cn(
    'inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary',
    sizeClasses[size],
    className,
  )
  if (url && failedUrl !== url) return <img src={url} alt={name} onError={() => setFailedUrl(url)} className={cn(classes, 'object-cover')} />
  return (
    <span className={classes} aria-hidden>
      {getInitials(name)}
    </span>
  )
}
