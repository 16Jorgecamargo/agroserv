import { History } from 'lucide-react'
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { AdminActionList } from '../components/admin/AdminActionList'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Input } from '../components/ui/Input'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { adminService } from '../services/adminService'
import type { AdminActionType } from '../types/entities'
import { adminActionLabels } from '../utils/adminLabels'
import { cn } from '../utils/cn'
import { formatCount } from '../utils/format'

const PAGE_SIZE = 20
const actionTypes = Object.keys(adminActionLabels) as AdminActionType[]
const loadAdmins = () => adminService.listUsers({ role: 'admin', pageSize: 100 })

export function AdminActionsPage() {
  usePageTitle('Histórico de ações')
  const [searchParams, setSearchParams] = useSearchParams()
  const adminId = searchParams.get('admin') ?? ''
  const action = actionTypes.find((type) => type === searchParams.get('acao'))
  const from = searchParams.get('de') ?? ''
  const to = searchParams.get('ate') ?? ''
  const page = Math.max(1, Number(searchParams.get('pagina')) || 1)
  const admins = useAsync(loadAdmins)
  const fetcher = useCallback(
    () => adminService.listActions({ adminId: adminId || undefined, action, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE }),
    [adminId, action, from, to, page],
  )
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
        <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Histórico de ações</h1>
        <p className="mt-1 text-text-muted">Tudo o que os administradores fizeram. Somente leitura.</p>
      </div>

      <div className="grid gap-4 rounded-card border border-border bg-surface p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Administrador" value={adminId} onChange={(event) => updateParams({ admin: event.target.value || undefined })}>
          <option value="">Todos</option>
          {(admins.data?.data ?? []).map((admin) => (
            <option key={admin.id} value={admin.id}>
              {admin.name}
            </option>
          ))}
        </Select>
        <Select label="Ação" value={action ?? ''} onChange={(event) => updateParams({ acao: event.target.value || undefined })}>
          <option value="">Todas</option>
          {actionTypes.map((type) => (
            <option key={type} value={type}>
              {adminActionLabels[type]}
            </option>
          ))}
        </Select>
        <Input label="De" type="date" value={from} max={to || undefined} onChange={(event) => updateParams({ de: event.target.value || undefined })} />
        <Input label="Até" type="date" value={to} min={from || undefined} onChange={(event) => updateParams({ ate: event.target.value || undefined })} />
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Carregando histórico…</span>
          <Skeleton className="h-48 rounded-card" />
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState icon={History} title="Nenhuma ação encontrada" description="Ajuste os filtros para ver outras ações." />
      ) : (
        <div aria-busy={isLoading} className={cn('space-y-4 transition-opacity', isLoading && 'opacity-60')}>
          <p className="text-sm text-text-muted" aria-live="polite">
            {formatCount(data.meta.total, 'ação', 'ações')}
          </p>
          <section aria-label="Ações administrativas" className="rounded-card border border-border bg-surface p-6 shadow-card">
            <AdminActionList actions={data.data} empty="Nenhuma ação encontrada." showTarget />
          </section>
          <Pagination meta={data.meta} onChange={(next) => updateParams({ pagina: String(next) })} />
        </div>
      )}
    </div>
  )
}
