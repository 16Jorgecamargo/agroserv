import type { MapViewProps } from '../components/map/mapTypes'

export function LeafletMap({ label, markers, circle, selectedId }: MapViewProps) {
  return (
    <div role="region" aria-label={label}>
      <ul aria-label="Marcadores do mapa">
        {markers.map((marker) => (
          <li key={marker.id} aria-current={marker.id === selectedId ? 'true' : undefined}>
            {marker.count === undefined ? marker.label : `${marker.label}: ${marker.count}`}
          </li>
        ))}
      </ul>
      {circle && <p>Raio de {circle.radiusKm} km</p>}
    </div>
  )
}
