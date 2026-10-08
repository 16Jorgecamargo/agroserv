import type { PriceUnit } from '../types/entities'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

const priceUnitLabels: Record<PriceUnit, string> = {
  hour: 'h',
  hectare: 'ha',
  day: 'dia',
  trip: 'viagem',
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatPrice(price: number, unit: PriceUnit): string {
  return `${formatCurrency(price)}/${priceUnitLabels[unit]}`
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatLocation(city: string, state: string): string {
  return `${city} - ${state}`
}

export function formatRating(rating: number): string {
  return rating.toFixed(1).replace('.', ',')
}

export function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function getFirstName(name: string): string {
  return name.trim().split(' ')[0] ?? ''
}
