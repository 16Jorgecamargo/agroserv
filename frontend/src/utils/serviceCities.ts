import type { Service } from '../types/entities'
import { findCityCoordinates, normalizeCityKey, type Coordinates } from './cityCoordinates'

export interface ServiceCityGroup {
  id: string
  city: string
  state: string
  position: Coordinates
  services: Service[]
}

export function groupServicesByCity(services: Service[]): { groups: ServiceCityGroup[]; unmappedCount: number } {
  const groups = new Map<string, ServiceCityGroup>()
  let unmappedCount = 0
  services.forEach((service) => {
    const position = findCityCoordinates(service.city, service.state)
    if (!position) {
      unmappedCount += 1
      return
    }
    const id = normalizeCityKey(service.city, service.state)
    const group = groups.get(id)
    if (group) group.services.push(service)
    else groups.set(id, { id, city: service.city, state: service.state, position, services: [service] })
  })
  const sorted = [...groups.values()].sort((first, second) => second.services.length - first.services.length || first.city.localeCompare(second.city, 'pt-BR'))
  return { groups: sorted, unmappedCount }
}
