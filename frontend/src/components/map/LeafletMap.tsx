import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { DEFAULT_MAP_CENTER } from '../../utils/cityCoordinates'
import { cn } from '../../utils/cn'
import type { MapViewProps } from './mapTypes'

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`)
}

function markerIcon(count: number | undefined, isSelected: boolean): L.DivIcon {
  const content = count === undefined ? '' : escapeHtml(String(count))
  return L.divIcon({
    className: '',
    html: `<span class="agro-map-pin${isSelected ? ' is-selected' : ''}${count === undefined ? ' is-dot' : ''}">${content}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

export function LeafletMap({ label, markers, circle, selectedId, onSelect, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const onSelectRef = useRef(onSelect)
  const fittedKeyRef = useRef('')

  useEffect(() => {
    onSelectRef.current = onSelect
  })

  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, { scrollWheelZoom: false, zoomSnap: 0.5, center: DEFAULT_MAP_CENTER, zoom: 8 })
    L.tileLayer(TILE_URL, { maxZoom: 18, attribution: ATTRIBUTION }).addTo(map)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
      fittedKeyRef.current = ''
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()

    let bounds: L.LatLngBounds | null = null
    if (circle) {
      const radius = L.circle(circle.center, { radius: circle.radiusKm * 1000, className: 'agro-map-radius', interactive: false }).addTo(layer)
      bounds = radius.getBounds()
    }

    markers.forEach((marker) => {
      const leafletMarker = L.marker(marker.position, {
        icon: markerIcon(marker.count, marker.id === selectedId),
        title: marker.count === undefined ? marker.label : `${marker.label}: ${marker.count}`,
        alt: marker.label,
        keyboard: true,
        riseOnHover: true,
      }).addTo(layer)
      leafletMarker.on('click', () => onSelectRef.current?.(marker.id))
      bounds = bounds ? bounds.extend(marker.position) : L.latLngBounds([marker.position, marker.position])
    })

    const fitKey = JSON.stringify([markers.map((marker) => marker.id), circle])
    if (fittedKeyRef.current === fitKey) return
    fittedKeyRef.current = fitKey
    if (bounds && (circle || markers.length > 1)) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 11 })
    else if (markers.length === 1) map.setView(markers[0].position, 10)
    else map.setView(DEFAULT_MAP_CENTER, 8)
  }, [markers, circle, selectedId])

  return <div ref={containerRef} role="region" aria-label={label} className={cn('agro-map z-0 overflow-hidden rounded-card border border-border', className)} />
}
