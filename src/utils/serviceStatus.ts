import type { BadgeTone } from '../components/ui/Badge'
import type { ServiceStatus } from '../types/entities'

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  hidden: 'Oculto pela administração',
}

export const serviceStatusTones: Record<ServiceStatus, BadgeTone> = {
  active: 'primary',
  paused: 'neutral',
  hidden: 'danger',
}

export const priceUnitOptions = [
  { value: 'hectare', label: 'Por hectare' },
  { value: 'hour', label: 'Por hora' },
  { value: 'day', label: 'Por dia' },
  { value: 'trip', label: 'Por viagem' },
] as const
