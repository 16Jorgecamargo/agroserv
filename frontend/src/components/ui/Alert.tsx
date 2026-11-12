import { AlertCircle, Info, LockKeyhole } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type AlertTone = 'info' | 'warning' | 'danger'

const toneStyles: Record<AlertTone, { className: string; icon: typeof Info }> = {
  info: { className: 'border-info/20 bg-info/5 text-info', icon: Info },
  warning: { className: 'border-warning/25 bg-warning/5 text-warning', icon: LockKeyhole },
  danger: { className: 'border-danger/20 bg-danger/5 text-danger', icon: AlertCircle },
}

interface AlertProps {
  tone?: AlertTone
  className?: string
  children: ReactNode
}

export function Alert({ tone = 'info', className, children }: AlertProps) {
  const { className: toneClassName, icon: Icon } = toneStyles[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium', toneClassName, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
