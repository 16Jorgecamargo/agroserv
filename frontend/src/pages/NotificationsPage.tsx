import { Bell, CheckCheck } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FilterChip } from '../components/ui/FilterChip'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useToast } from '../hooks/useToast'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../types/entities'
import { cn } from '../utils/cn'
import { formatCount, formatDateTime } from '../utils/format'

const PAGE_SIZE = 20

export function NotificationsPage() {
  usePageTitle('Notificações')
  const toast = useToast()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('pagina')) || 1)
  const unreadOnly = searchParams.get('filtro') === 'nao-lidas'
  const fetcher = useCallback(() => notificationService.list(page, PAGE_SIZE, unreadOnly), [page, unreadOnly])
  const { data, error, isLoading, refetch } = useAsync(fetcher)
  const [isMarking, setIsMarking] = useState(false)

  function setQuery(next: { page?: number; unreadOnly?: boolean }) {
    const params: Record<string, string> = {}
    const nextPage = next.page ?? page
    const nextUnread = next.unreadOnly ?? unreadOnly
    if (nextPage > 1) params.pagina = String(nextPage)
    if (nextUnread) params.filtro = 'nao-lidas'
    setSearchParams(params)
  }

  async function open(notification: Notification) {
    if (!notification.read) await notificationService.markRead(notification.id).catch(() => undefined)
    navigate(notification.link)
  }

  async function markAll() {
    setIsMarking(true)
    try {
      await notificationService.markAllRead()
      toast.success('Todas as notificações foram marcadas como lidas.')
      refetch()
    } catch {
      toast.error('Não foi possível marcar as notificações.')
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Bell}
        title="Notificações"
        description={data ? formatCount(data.unreadCount, 'não lida', 'não lidas') : 'Avisos sobre suas solicitações e sua conta.'}
        action={
          data && data.unreadCount > 0 ? (
            <Button variant="secondary" isLoading={isMarking} onClick={markAll}>
              <CheckCheck className="size-4" aria-hidden />
              Marcar todas como lidas
            </Button>
          ) : undefined
        }
      />

      <div role="group" aria-label="Filtrar notificações" className="flex gap-2">
        <FilterChip isActive={!unreadOnly} onClick={() => setQuery({ page: 1, unreadOnly: false })}>
          Todas
        </FilterChip>
        <FilterChip isActive={unreadOnly} onClick={() => setQuery({ page: 1, unreadOnly: true })}>
          Não lidas
        </FilterChip>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" aria-label="Carregando notificações" className="space-y-3">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-16 rounded-card" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState icon={Bell} title="Nada por aqui" description={unreadOnly ? 'Você leu todas as notificações.' : 'Quando algo acontecer, você recebe um aviso aqui.'} />
      ) : (
        <div aria-busy={isLoading} className={cn('space-y-4 transition-opacity', isLoading && 'opacity-60')}>
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-card" aria-label="Lista de notificações">
            {data.data.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => void open(notification)}
                  className={cn('flex w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-muted', !notification.read && 'bg-primary-soft/40')}
                >
                  <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', notification.read ? 'bg-border' : 'bg-primary')} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-text">
                      {notification.title}
                      {!notification.read && <span className="sr-only"> (não lida)</span>}
                    </span>
                    {notification.body && <span className="mt-0.5 block text-sm text-text-muted">{notification.body}</span>}
                  </span>
                  <time dateTime={notification.createdAt} className="shrink-0 text-xs text-text-muted">
                    {formatDateTime(notification.createdAt)}
                  </time>
                </button>
              </li>
            ))}
          </ul>
          {data.meta.totalPages > 1 && (
            <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setQuery({ page: page - 1 })}>
                Anterior
              </Button>
              <p className="text-sm text-text-muted">
                Página {data.meta.page} de {data.meta.totalPages}
              </p>
              <Button variant="secondary" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setQuery({ page: page + 1 })}>
                Próxima
              </Button>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
