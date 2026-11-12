import { Link } from 'react-router'
import logoHorizontal from '../../assets/brand/logo-horizontal.png'
import logoHorizontalWhite from '../../assets/brand/logo-horizontal-white.png'
import { paths } from '../../routes/paths'
import { cn } from '../../utils/cn'

interface LogoProps {
  tone?: 'default' | 'light'
  className?: string
}

export function Logo({ tone = 'default', className }: LogoProps) {
  return (
    <Link to={paths.home} aria-label="AgroServ, página inicial" className={cn('inline-flex shrink-0 items-center', className)}>
      <img
        src={tone === 'light' ? logoHorizontalWhite : logoHorizontal}
        alt=""
        width={155}
        height={40}
        className="h-10 w-auto"
      />
    </Link>
  )
}
