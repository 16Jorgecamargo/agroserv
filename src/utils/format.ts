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

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatArea(hectares: number): string {
  return `${numberFormatter.format(hectares)} ha`
}

const quantityUnitLabels: Record<PriceUnit, [string, string]> = {
  hour: ['hora', 'horas'],
  hectare: ['hectare', 'hectares'],
  day: ['dia', 'dias'],
  trip: ['viagem', 'viagens'],
}

export function getQuantityUnitLabel(unit: PriceUnit, plural = true): string {
  return quantityUnitLabels[unit][plural ? 1 : 0]
}

export function formatQuantity(quantity: number, unit: PriceUnit): string {
  return `${numberFormatter.format(quantity)} ${quantityUnitLabels[unit][quantity === 1 ? 0 : 1]}`
}

export function formatMoney(value: number): string {
  return moneyFormatter.format(value)
}

const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

export const ESTIMATE_NOTICE = 'Valor estimado. O acerto é feito diretamente com o prestador.'

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
})

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

const relativeFormatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffSeconds = Math.round((Date.parse(iso) - now.getTime()) / 1000)
  const absolute = Math.abs(diffSeconds)
  if (absolute < 60) return 'agora'
  if (absolute < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), 'minute')
  if (absolute < 86400) return relativeFormatter.format(Math.round(diffSeconds / 3600), 'hour')
  if (absolute < 86400 * 30) return relativeFormatter.format(Math.round(diffSeconds / 86400), 'day')
  return formatDate(iso)
}
