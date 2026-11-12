import { Eye, Megaphone, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { ServiceImage } from '../components/domain/ServiceImage'
import { PageHeader } from '../components/layout/PageHeader'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { buttonClasses } from '../components/ui/buttonClasses'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequestAction } from '../hooks/useRequestAction'
import { paths } from '../routes/paths'
import { categoryService } from '../services/categoryService'
import { myServicesService } from '../services/myServicesService'
import type { Category, Service } from '../types/entities'
import { formatLocation, formatPrice } from '../utils/format'
import { serviceStatusLabels, serviceStatusTones } from '../utils/serviceStatus'

function loadPage(): Promise<[Service[], Category[]]> {
  return Promise.all([myServicesService.list(), categoryService.list()])
}

export function MyServicesPage() {
  usePageTitle('Meus serviços')
  const { data, error, refetch } = useAsync(loadPage)
  const [removing, setRemoving] = useState<Service | null>(null)
  const settle = useCallback(() => refetch(), [refetch])
  const { run, isRunning } = useRequestAction(settle)

  const newButton = (
    <Link to={paths.providerServiceNew} className={buttonClasses('primary', 'md')}>
      <Plus className="size-4" aria-hidden />
      Novo serviço
    </Link>
  )

  if (error && !data) return <ErrorState titleAs="h1" message={error.message} onRetry={refetch} />

  const [services, categories] = data ?? [null, []]
  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? 'Categoria inativa'

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Megaphone}
        title="Meus serviços"
        description="Publique, pause e edite seus anúncios."
        action={services && services.length > 0 ? newButton : undefined}
      />

      {!services ? (
        <div role="status" aria-label="Carregando serviços" className="space-y-4">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-36 rounded-card" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhum serviço publicado"
          description="Crie seu primeiro anúncio. Ele aparece na busca assim que for publicado."
          action={newButton}
        />
      ) : (
        <ul className="space-y-4" aria-label="Lista de serviços">
          {services.map((service) => (
            <li key={service.id} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card sm:flex-row sm:p-5">
              <ServiceImage src={service.imageUrl} alt={service.title} className="aspect-[4/3] w-full shrink-0 rounded-lg object-cover sm:w-44" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={serviceStatusTones[service.status]}>
                    <span className="size-1.5 rounded-full bg-current" aria-hidden />
                    {serviceStatusLabels[service.status]}
                  </Badge>
                  {!service.available && service.status === 'active' && <Badge tone="neutral">Sem novas solicitações</Badge>}
                </div>
                <h2 className="text-lg font-semibold text-text">{service.title}</h2>
                <p className="text-sm text-text-muted">
                  {categoryName(service.categoryId)} · {formatLocation(service.city, service.state)} ·{' '}
                  <span className="font-semibold text-text tabular-nums">{formatPrice(service.price, service.priceUnit)}</span>
                </p>
                {service.status === 'hidden' && service.hiddenReason && (
                  <p className="rounded-lg bg-danger/5 p-2.5 text-sm text-danger">Motivo: {service.hiddenReason}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:w-44 sm:flex-col">
                <Link to={paths.providerServiceEdit(service.id)} className={buttonClasses('secondary', 'sm')} aria-label={`Editar ${service.title}`}>
                  <Pencil className="size-4" aria-hidden />
                  Editar
                </Link>
                {service.status === 'active' && (
                  <Button variant="secondary" size="sm" disabled={isRunning} aria-label={`Pausar ${service.title}`} onClick={() => void run(() => myServicesService.pause(service.id), 'Anúncio pausado. Ele saiu da busca.')}>
                    <Pause className="size-4" aria-hidden />
                    Pausar
                  </Button>
                )}
                {service.status === 'paused' && (
                  <Button variant="secondary" size="sm" disabled={isRunning} aria-label={`Reativar ${service.title}`} onClick={() => void run(() => myServicesService.activate(service.id), 'Anúncio reativado. Ele voltou para a busca.')}>
                    <Play className="size-4" aria-hidden />
                    Reativar
                  </Button>
                )}
                <Link to={paths.serviceDetail(service.id)} className={buttonClasses('ghost', 'sm')} aria-label={`Ver anúncio ${service.title}`}>
                  <Eye className="size-4" aria-hidden />
                  Ver anúncio
                </Link>
                <Button variant="ghost" size="sm" className="text-danger" disabled={isRunning} aria-label={`Excluir ${service.title}`} onClick={() => setRemoving(service)}>
                  <Trash2 className="size-4" aria-hidden />
                  Excluir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) await run(() => myServicesService.remove(removing.id), 'Anúncio excluído.')
        }}
        title="Excluir anúncio?"
        description="O anúncio some da busca. Solicitações e avaliações antigas continuam mostrando o serviço como removido."
        confirmLabel="Excluir"
        cancelLabel="Voltar"
        showReason={false}
        isLoading={isRunning}
      />
    </div>
  )
}
