import { Sprout } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import { cn } from '../../utils/cn'

interface LogoProps {
  tone?: 'default' | 'light'
  className?: string
}

export function Logo({ tone = 'default', className }: LogoProps) {
  const isLight = tone === 'light'
  return (
    <Link to={paths.home} aria-label="AgroServ, página inicial" className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid size-9 place-items-center rounded-lg',
          isLight ? 'bg-white/15 text-white' : 'bg-primary text-white',
        )}
      >
        <Sprout className="size-5" aria-hidden />
      </span>
      <span className={cn('text-[17px] font-extrabold tracking-[0.08em]', isLight ? 'text-white' : 'text-primary-strong')}>
        AGROSERV
      </span>
    </Link>
  )
}
