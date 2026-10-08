import { Inbox } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { RequestsTable, RequestsTableSkeleton } from '../components/domain/RequestsTable'
import { Button } from '../components/ui/Button'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FilterChip } from '../components/ui/FilterChip'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequests } from '../hooks/useRequests'
import { paths } from '../routes/paths'
import type { RequestStatusFilter } from '../types/api'
import { cn } from '../utils/cn'
import { formatCount } from '../utils/format'
import { isRequestStatus } from '../utils/requestStatus'

const statusFilters: { value: RequestStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'accepted', label: 'Aceitas' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluídas' },
  { value: 'cancelled', label: 'Canceladas' },
]

function parseStatus(value: string | null): RequestStatusFilter {
  return value && isRequestStatus(value) ? value : 'all'
}

export function RequestsPage() {
  usePageTitle('Minhas solicitações')
  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseStatus(searchParams.get('status'))
  const { data, error, isLoading, refetch } = useRequests(status)

  function selectStatus(next: RequestStatusFilter) {
    setSearchParams(next === 'all' ? {} : { status: next })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Minhas solicitações</h1>
        <p className="mt-1 text-text-muted">Acompanhe o andamento de cada serviço solicitado.</p>
      </div>

      <div role="group" aria-label="Filtrar por status" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {statusFilters.map((filter) => (
          <FilterChip key={filter.value} isActive={status === filter.value} onClick={() => selectStatus(filter.value)}>
            {filter.label}
          </FilterChip>
        ))}
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <RequestsTableSkeleton />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma solicitação encontrada"
          description={
            status === 'all' ? 'Você ainda não fez nenhuma solicitação.' : 'Não há solicitações com este status no momento.'
          }
          action={
            status === 'all' ? (
              <Link to={paths.services} className={buttonClasses('primary', 'md')}>
                Buscar serviços
              </Link>
            ) : (
              <Button variant="secondary" onClick={() => selectStatus('all')}>
                Ver todas
              </Button>
            )
          }
        />
      ) : (
        <div aria-busy={isLoading} className={cn('transition-opacity', isLoading && 'opacity-60')}>
          <p className="mb-3 text-sm text-text-muted" aria-live="polite">
            {formatCount(data.length, 'solicitação', 'solicitações')}
          </p>
          <RequestsTable requests={data} caption="Lista de solicitações" showLocation />
        </div>
      )}
    </div>
  )
}
