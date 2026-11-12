import { Eye, EyeOff, Megaphone, Search, Trash2 } from 'lucide-react'
import { useCallback, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ServiceImage } from '../components/domain/ServiceImage'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Input } from '../components/ui/Input'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequestAction } from '../hooks/useRequestAction'
import { paths } from '../routes/paths'
import { adminService } from '../services/adminService'
import { categoryService } from '../services/categoryService'
import type { Service, ServiceStatus } from '../types/entities'
import { cn } from '../utils/cn'
import { formatCount, formatPrice } from '../utils/format'
import { serviceStatusLabels, serviceStatusTones } from '../utils/serviceStatus'

const PAGE_SIZE = 20
const statuses: ServiceStatus[] = ['active', 'paused', 'hidden']

type PendingAction = { kind: 'hide' | 'show' | 'delete'; service: Service }

export function AdminServicesPage() {
  usePageTitle('Anúncios')
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('categoria') ?? ''
  const status = statuses.find((candidate) => candidate === searchParams.get('situacao'))
  const page = Math.max(1, Number(searchParams.get('pagina')) || 1)
  const [term, setTerm] = useState(q)
  const [pending, setPending] = useState<PendingAction | null>(null)
  const categories = useAsync(categoryService.list)
  const fetcher = useCallback(
    () => adminService.listServices({ q: q || undefined, category: category || undefined, status, page, pageSize: PAGE_SIZE }),
    [q, category, status, page],
  )
  const { data, error, isLoading, refetch } = useAsync(fetcher)
  const { run, isRunning } = useRequestAction(refetch)

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)))
    if (!('pagina' in next)) params.delete('pagina')
    setSearchParams(params)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateParams({ q: term.trim() || undefined })
  }

  async function confirm(reason: string) {
    if (!pending) return
    const { kind, service } = pending
    if (kind === 'hide') await run(() => adminService.hideService(service.id, reason), 'Anúncio ocultado. O prestador foi avisado.')
    if (kind === 'show') await run(() => adminService.showService(service.id), 'Anúncio visível de novo.')
    if (kind === 'delete') await run(() => adminService.deleteService(service.id), 'Anúncio removido.')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Anúncios</h1>
        <p className="mt-1 text-text-muted">Todos os anúncios, em qualquer situação.</p>
      </div>

      <div className="grid gap-4 rounded-card border border-border bg-surface p-4 shadow-card md:grid-cols-[1fr_12rem_12rem]">
        <form role="search" onSubmit={submitSearch} className="flex items-end gap-2">
          <Input label="Buscar anúncios" icon={Search} value={term} onChange={(event) => setTerm(event.target.value)} containerClassName="flex-1" />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>
        <Select label="Categoria" value={category} onChange={(event) => updateParams({ categoria: event.target.value || undefined })}>
          <option value="">Todas</option>
          {(categories.data ?? []).map((option) => (
            <option key={option.id} value={option.slug}>
              {option.name}
            </option>
          ))}
        </Select>
        <Select label="Situação" value={status ?? ''} onChange={(event) => updateParams({ situacao: event.target.value || undefined })}>
          <option value="">Todas</option>
          {statuses.map((option) => (
            <option key={option} value={option}>
              {serviceStatusLabels[option]}
            </option>
          ))}
        </Select>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <div role="status" className="space-y-3">
          <span className="sr-only">Carregando anúncios…</span>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-card" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nenhum anúncio encontrado" description="Ajuste a busca ou os filtros." />
      ) : (
        <div aria-busy={isLoading} className={cn('space-y-4 transition-opacity', isLoading && 'opacity-60')}>
          <p className="text-sm text-text-muted" aria-live="polite">
            {formatCount(data.meta.total, 'anúncio', 'anúncios')}
          </p>
          <ul aria-label="Lista de anúncios" className="space-y-3">
            {data.data.map((service) => (
              <li key={service.id} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center">
                <ServiceImage src={service.imageUrl} alt={service.title} className="h-20 w-full rounded-lg object-cover sm:w-28" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={paths.serviceDetail(service.id)} className="font-semibold text-text hover:text-primary">
                      {service.title}
                    </Link>
                    <Badge tone={serviceStatusTones[service.status]}>{serviceStatusLabels[service.status]}</Badge>
                  </div>
                  <p className="text-sm text-text-muted">
                    <Link to={paths.adminUserDetail(service.providerId)} className="hover:text-primary">
                      {service.providerName}
                    </Link>{' '}
                    · {formatPrice(service.price, service.priceUnit)}
                  </p>
                  {service.hiddenReason && <p className="text-sm text-danger">Motivo: {service.hiddenReason}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {service.status === 'hidden' ? (
                    <Button variant="secondary" size="sm" onClick={() => setPending({ kind: 'show', service })} disabled={isRunning}>
                      <Eye className="size-4" aria-hidden />
                      Mostrar
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setPending({ kind: 'hide', service })} disabled={isRunning}>
                      <EyeOff className="size-4" aria-hidden />
                      Ocultar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setPending({ kind: 'delete', service })} disabled={isRunning} aria-label={`Remover ${service.title}`}>
                    <Trash2 className="size-4" aria-hidden />
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <Pagination meta={data.meta} onChange={(next) => updateParams({ pagina: String(next) })} />
        </div>
      )}

      <ConfirmDialog
        isOpen={pending?.kind === 'hide'}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        title={pending ? `Ocultar "${pending.service.title}"?` : 'Ocultar anúncio?'}
        description="O anúncio sai da busca e o prestador recebe o motivo."
        confirmLabel="Ocultar anúncio"
        reasonLabel="Motivo do ocultamento"
        reasonRequired
        isLoading={isRunning}
      />
      <ConfirmDialog
        isOpen={pending?.kind === 'show'}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        title={pending ? `Mostrar "${pending.service.title}"?` : 'Mostrar anúncio?'}
        description="O anúncio volta à situação em que estava antes de ser ocultado."
        confirmLabel="Mostrar anúncio"
        showReason={false}
        isLoading={isRunning}
      />
      <ConfirmDialog
        isOpen={pending?.kind === 'delete'}
        onClose={() => setPending(null)}
        onConfirm={confirm}
        title={pending ? `Remover "${pending.service.title}"?` : 'Remover anúncio?'}
        description="A remoção não pode ser desfeita. Anúncios com solicitações em aberto não podem ser removidos."
        confirmLabel="Remover anúncio"
        showReason={false}
        isLoading={isRunning}
      />
    </div>
  )
}
