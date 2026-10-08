import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import type { ServiceRequest } from '../../types/entities'
import { formatCurrency, formatDate } from '../../utils/format'
import { Skeleton } from '../ui/Skeleton'
import { StatusBadge } from '../ui/StatusBadge'

interface RequestsTableProps {
  requests: ServiceRequest[]
  caption: string
  showLocation?: boolean
}

const cellClasses = 'px-5 py-4'

export function RequestsTable({ requests, caption, showLocation = false }: RequestsTableProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-card md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-border bg-surface-muted/60 text-xs font-semibold tracking-[0.06em] text-text-muted uppercase">
            <tr>
              <th scope="col" className="px-5 py-3">Serviço</th>
              <th scope="col" className="px-5 py-3">Prestador</th>
              <th scope="col" className="px-5 py-3">Data</th>
              {showLocation && <th scope="col" className="px-5 py-3">Local</th>}
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((request) => (
              <tr key={request.id} className="transition-colors hover:bg-surface-muted/50">
                <td className={cellClasses}>
                  <Link to={paths.serviceDetail(request.serviceId)} className="font-semibold text-text hover:text-primary">
                    {request.serviceTitle}
                  </Link>
                </td>
                <td className={`${cellClasses} text-text-muted`}>{request.providerName}</td>
                <td className={`${cellClasses} text-text-muted tabular-nums`}>{formatDate(request.scheduledDate)}</td>
                {showLocation && <td className={`${cellClasses} text-text-muted`}>{request.location}</td>}
                <td className={cellClasses}>
                  <StatusBadge status={request.status} />
                </td>
                <td className={`${cellClasses} text-right font-semibold text-text tabular-nums`}>
                  {formatCurrency(request.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={caption} className="space-y-3 md:hidden">
        {requests.map((request) => (
          <li key={request.id} className="rounded-card border border-border bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <Link to={paths.serviceDetail(request.serviceId)} className="font-semibold text-text hover:text-primary">
                {request.serviceTitle}
              </Link>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-1 text-sm text-text-muted">{request.providerName}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-text-muted">Data</dt>
                <dd className="tabular-nums">{formatDate(request.scheduledDate)}</dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-text-muted">Valor</dt>
                <dd className="font-semibold tabular-nums">{formatCurrency(request.value)}</dd>
              </div>
              {showLocation && (
                <div className="col-span-2">
                  <dt className="text-xs text-text-muted">Local</dt>
                  <dd>{request.location}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

export function RequestsTableSkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Carregando solicitações…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-16 rounded-card" />
      ))}
    </div>
  )
}
