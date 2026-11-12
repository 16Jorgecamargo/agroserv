import type { Coordinates } from '../../utils/cityCoordinates'

export interface MapMarker {
  id: string
  position: Coordinates
  label: string
  count?: number
}

export interface MapCircle {
  center: Coordinates
  radiusKm: number
}

export interface MapViewProps {
  label: string
  markers: MapMarker[]
  circle?: MapCircle
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
}
