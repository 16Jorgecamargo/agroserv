import { Flag } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FilterChip } from '../components/ui/FilterChip'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { adminService } from '../services/adminService'
import type { ReportStatus } from '../types/entities'
import { cn } from '../utils/cn'
import { formatCount, formatDateTime } from '../utils/format'
import { reportReasonLabels, reportStatusLabels, reportStatusTones, reportTargetLabels, reportTargetTypes } from '../utils/reportLabels'

const PAGE_SIZE = 20
type StatusFilter = ReportStatus | 'all'
const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'open', label: 'Abertas' },
  { value: 'resolved', label: 'Resolvidas' },
  { value: 'dismissed', label: 'Arquivadas' },
  { value: 'all', label: 'Todas' },
]

export function AdminReportsPage() {
  usePageTitle('Denúncias')
  const [searchParams, setSearchParams] = useSearchParams()
  const status = statusFilters.find((filter) => filter.value === searchParams.get('situacao'))?.value ?? 'open'
  const targetType = reportTargetTypes.find((type) => type === searchParams.get('tipo'))
  const page = Math.max(1, Number(searchParams.get('pagina')) || 1)
  const fetcher = useCallback(() => adminService.listReports({ status, targetType, page, pageSize: PAGE_SIZE }), [status, targetType, page])
  const { data, error, isLoading, refetch } = useAsync(fetcher)

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)))
    if (!('pagina' in next)) params.delete('pagina')
    setSearchParams(params)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Denúncias</h1>
        <p className="mt-1 text-text-muted">Abertas aparecem das mais antigas para as mais novas.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <FilterChip key={filter.value} isActive={status === filter.value} onClick={() => updateParams({ situacao: filter.value === 'open' ? undefined : filter.value })}>
              {filter.label}
            </FilterChip>
          ))}
        </div>
        <Select label="Tipo de alvo" value={targetType ?? ''} onChange={(event) => updateParams({ tipo: event.target.value || undefined })} containerClassName="sm:w-56">
          <option value="">Todos</option>
          {reportTargetTypes.map((type) => (
            <option key={type} value={type}>
              {reportTargetLabels[type]}
            </option>
          ))}
        </Select>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Carregando denúncias…</span>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-card" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState icon={Flag} title="Nenhuma denúncia" description={status === 'open' ? 'A fila está vazia.' : 'Nenhuma denúncia com estes filtros.'} />
      ) : (
        <div aria-busy={isLoading} className={cn('space-y-4 transition-opacity', isLoading && 'opacity-60')}>
          <p className="text-sm text-text-muted" aria-live="polite">
            {formatCount(data.meta.total, 'denúncia', 'denúncias')}
          </p>
          <ul aria-label="Lista de denúncias" className="space-y-3">
            {data.data.map((report) => (
              <li key={report.id} className="rounded-card border border-border bg-surface p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{reportTargetLabels[report.targetType]}</Badge>
                    <Badge tone={reportStatusTones[report.status]}>{reportStatusLabels[report.status]}</Badge>
                  </div>
                  <time dateTime={report.createdAt} className="text-xs text-text-muted">
                    {formatDateTime(report.createdAt)}
                  </time>
                </div>
                <Link to={paths.adminReportDetail(report.id)} className="mt-2 block font-semibold text-text hover:text-primary">
                  {report.targetLabel}
                </Link>
                <p className="mt-1 text-sm text-text-muted">
                  {reportReasonLabels[report.reason]} · por {report.reporterName}
                </p>
              </li>
            ))}
          </ul>
          <Pagination meta={data.meta} onChange={(next) => updateParams({ pagina: String(next) })} />
        </div>
      )}
    </div>
  )
}
