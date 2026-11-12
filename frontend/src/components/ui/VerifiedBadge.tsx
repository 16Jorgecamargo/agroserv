import { BadgeCheck } from 'lucide-react'
import { cn } from '../../utils/cn'

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[11px] font-semibold text-info', className)}>
      <BadgeCheck className="size-3.5" aria-hidden />
      Verificado
    </span>
  )
}
