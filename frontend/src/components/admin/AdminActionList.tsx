import type { AdminAction } from '../../types/entities'
import { adminActionLabels } from '../../utils/adminLabels'
import { formatDateTime } from '../../utils/format'

export function AdminActionList({ actions, empty, showTarget = false }: { actions: AdminAction[]; empty: string; showTarget?: boolean }) {
  if (actions.length === 0) return <p className="text-sm text-text-muted">{empty}</p>

  return (
    <ol className="divide-y divide-border">
      {actions.map((action) => (
        <li key={action.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
          <p className="text-sm font-semibold text-text">
            {adminActionLabels[action.action]}
            {showTarget && <span className="font-normal text-text-muted"> · {action.targetLabel}</span>}
          </p>
          <p className="text-xs text-text-muted">
            {action.adminName} · <time dateTime={action.createdAt}>{formatDateTime(action.createdAt)}</time>
          </p>
          {action.reason && <p className="text-sm text-text">Motivo: {action.reason}</p>}
        </li>
      ))}
    </ol>
  )
}
