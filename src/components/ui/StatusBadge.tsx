import type { RequestStatus } from '../../types/entities'
import { requestStatusLabels } from '../../utils/requestStatus'
import { Badge, type BadgeTone } from './Badge'

const statusTones: Record<RequestStatus, BadgeTone> = {
  pending: 'warning',
  accepted: 'primary',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge tone={statusTones[status]}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {requestStatusLabels[status]}
    </Badge>
  )
}
