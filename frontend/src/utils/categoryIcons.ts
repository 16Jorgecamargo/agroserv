import type { CategoryIcon } from '../types/entities'

export const categoryIcons: CategoryIcon[] = [
  'sprout',
  'wheat',
  'droplets',
  'spray-can',
  'flask-conical',
  'truck',
  'wrench',
  'tractor',
  'leaf',
  'shovel',
  'warehouse',
  'sun',
  'tree-pine',
  'beef',
]

export const categoryIconLabels: Record<CategoryIcon, string> = {
  sprout: 'Broto',
  wheat: 'Trigo',
  droplets: 'Gotas',
  'spray-can': 'Pulverizador',
  'flask-conical': 'Frasco',
  truck: 'Caminhão',
  wrench: 'Chave',
  tractor: 'Trator',
  leaf: 'Folha',
  shovel: 'Pá',
  warehouse: 'Armazém',
  sun: 'Sol',
  'tree-pine': 'Árvore',
  beef: 'Gado',
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
