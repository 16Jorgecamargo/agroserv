import { MapPin, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Service } from '../../types/entities'
import { cn } from '../../utils/cn'
import { formatCount, formatLocation } from '../../utils/format'
import { groupServicesByCity } from '../../utils/serviceCities'
import { MapView } from '../map/MapView'
import type { MapMarker } from '../map/mapTypes'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'
import { ServiceCard } from './ServiceCard'

interface ServicesMapPanelProps {
  services: Service[] | null
  error: Error | null
  onRetry: () => void
  onClearFilters: () => void
}

export function ServicesMapPanel({ services, error, onRetry, onClearFilters }: ServicesMapPanelProps) {
  const [selectedId, setSelectedId] = useState<string>()
  const { groups, unmappedCount } = useMemo(() => groupServicesByCity(services ?? []), [services])
  const markers = useMemo<MapMarker[]>(
    () => groups.map((group) => ({ id: group.id, position: group.position, label: formatLocation(group.city, group.state), count: group.services.length })),
    [groups],
  )

  if (error && !services) return <ErrorState message={error.message} onRetry={onRetry} />

  if (!services) {
    return (
      <div role="status">
        <span className="sr-only">Carregando mapa…</span>
        <Skeleton className="h-80 rounded-card sm:h-[28rem]" />
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Não encontramos serviços para essa busca."
        description="Tente outro termo, outra localização ou remova a categoria selecionada."
        action={<Button onClick={onClearFilters}>Limpar filtros</Button>}
      />
    )
  }

  const selected = groups.find((group) => group.id === selectedId)

  function toggle(id: string) {
    setSelectedId((current) => (current === id ? undefined : id))
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_16rem]">
        <MapView label="Mapa de serviços por cidade" markers={markers} selectedId={selected?.id} onSelect={toggle} className="h-80 sm:h-[28rem]" />
        <div>
          <h2 className="text-sm font-semibold text-text">Cidades</h2>
          <ul aria-label="Cidades com serviços" className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {groups.map((group) => {
              const isSelected = group.id === selected?.id
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggle(group.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                      isSelected ? 'border-primary bg-primary-soft text-text' : 'border-border bg-surface text-text hover:border-primary/40',
                    )}
                  >
                    <MapPin className={cn('size-4 shrink-0', isSelected ? 'text-primary' : 'text-text-muted')} aria-hidden />
                    <span className="flex-1 font-medium">{formatLocation(group.city, group.state)}</span>
                    <span className="text-xs text-text-muted tabular-nums">{formatCount(group.services.length, 'serviço', 'serviços')}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {unmappedCount > 0 && (
            <p className="mt-3 text-xs text-text-muted">
              {formatCount(unmappedCount, 'serviço está', 'serviços estão')} em cidades fora do mapa.
            </p>
          )}
        </div>
      </div>

      {selected ? (
        <section aria-labelledby="map-city-heading" className="space-y-4">
          <h2 id="map-city-heading" className="text-xl font-semibold text-text">
            Serviços em {formatLocation(selected.city, selected.state)}
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {selected.services.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-text-muted">Escolha uma cidade no mapa ou na lista para ver os serviços dela.</p>
      )}
    </div>
  )
}
