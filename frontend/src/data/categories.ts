import type { Category } from '../types/entities'

export const categories: Category[] = [
  { id: 'cat-planting', slug: 'plantio', name: 'Plantio', icon: 'sprout', active: true },
  { id: 'cat-harvest', slug: 'colheita', name: 'Colheita', icon: 'wheat', active: true },
  { id: 'cat-irrigation', slug: 'irrigacao', name: 'Irrigação', icon: 'droplets', active: true },
  { id: 'cat-spraying', slug: 'pulverizacao', name: 'Pulverização', icon: 'spray-can', active: true },
  { id: 'cat-fertilizing', slug: 'fertilizacao', name: 'Fertilização', icon: 'flask-conical', active: true },
  { id: 'cat-transport', slug: 'transporte', name: 'Transporte', icon: 'truck', active: true },
  { id: 'cat-maintenance', slug: 'manutencao', name: 'Manutenção', icon: 'wrench', active: true },
  { id: 'cat-machinery', slug: 'maquinas', name: 'Máquinas', icon: 'tractor', active: true },
]
