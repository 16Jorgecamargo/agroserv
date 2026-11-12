import { BellRing, Inbox } from 'lucide-react'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { RequestsTable, RequestsTableSkeleton } from '../components/domain/RequestsTable'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FilterChip } from '../components/ui/FilterChip'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { providerRequestService } from '../services/providerRequestService'
import type { RequestStatusFilter } from '../types/api'
import { cn } from '../utils/cn'
import { formatCount } from '../utils/format'
import { parseStatusFilter, requestStatusFilters } from '../utils/requestStatus'

export function ProviderRequestsPage() {
  usePageTitle('Solicitações recebidas')
  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseStatusFilter(searchParams.get('status'))
  const fetcher = useCallback(() => providerRequestService.list(status), [status])
  const { data, error, isLoading, refetch } = useAsync(fetcher)
  const pending = status === 'all' && data ? data.filter((request) => request.status === 'pending') : []
  const others = status === 'all' && data ? data.filter((request) => request.status !== 'pending') : (data ?? [])

  function selectStatus(next: RequestStatusFilter) {
    setSearchParams(next === 'all' ? {} : { status: next })
  }

  return (
    <div className="space-y-8">
      <PageHeader icon={Inbox} title="Solicitações recebidas" description="Responda aos pedidos e acompanhe cada serviço até a conclusão." />

      <div role="group" aria-label="Filtrar por status" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {requestStatusFilters.map((filter) => (
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
          description={status === 'all' ? 'Quando um produtor pedir um serviço seu, o pedido aparece aqui.' : 'Não há solicitações com este status no momento.'}
          action={
            status !== 'all' ? (
              <Button variant="secondary" onClick={() => selectStatus('all')}>
                Ver todas
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div aria-busy={isLoading} className={cn('space-y-8 transition-opacity', isLoading && 'opacity-60')}>
          {pending.length > 0 && (
            <section aria-labelledby="pending-heading" className="space-y-3 rounded-card border-2 border-warning/30 bg-warning/5 p-4 sm:p-5">
              <h2 id="pending-heading" className="flex items-center gap-2 text-lg font-semibold text-text">
                <BellRing className="size-5 text-warning" aria-hidden />
                {formatCount(pending.length, 'nova solicitação aguardando resposta', 'novas solicitações aguardando resposta')}
              </h2>
              <RequestsTable requests={pending} caption="Solicitações pendentes" viewer="provider" showLocation />
            </section>
          )}
          {others.length > 0 && (
            <div>
              <p className="mb-3 text-sm text-text-muted" aria-live="polite">
                {formatCount(others.length, 'solicitação', 'solicitações')}
              </p>
              <RequestsTable requests={others} caption="Lista de solicitações recebidas" viewer="provider" showLocation />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
