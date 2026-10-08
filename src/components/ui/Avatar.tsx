import { cn } from '../../utils/cn'
import { getInitials } from '../../utils/format'

type AvatarSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
}

interface AvatarProps {
  name: string
  src?: string
  size?: AvatarSize
  className?: string
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const classes = cn(
    'inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary',
    sizeClasses[size],
    className,
  )
  if (src) return <img src={src} alt={name} className={cn(classes, 'object-cover')} />
  return (
    <span className={classes} aria-hidden>
      {getInitials(name)}
    </span>
  )
}
