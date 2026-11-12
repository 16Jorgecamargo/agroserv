import { lazy, Suspense } from 'react'
import { cn } from '../../utils/cn'
import { Skeleton } from '../ui/Skeleton'
import type { MapViewProps } from './mapTypes'

const LeafletMap = lazy(() => import('./LeafletMap').then((module) => ({ default: module.LeafletMap })))

export function MapView(props: MapViewProps) {
  return (
    <Suspense
      fallback={
        <div role="status" className={cn('relative', props.className)}>
          <span className="sr-only">Carregando mapa…</span>
          <Skeleton className="absolute inset-0 rounded-card" />
        </div>
      }
    >
      <LeafletMap {...props} />
    </Suspense>
  )
}
