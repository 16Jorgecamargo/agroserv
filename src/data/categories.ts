import type { Category } from '../types/entities'

export const categories: Category[] = [
  { id: 'cat-planting', slug: 'plantio', name: 'Plantio', icon: 'sprout' },
  { id: 'cat-harvest', slug: 'colheita', name: 'Colheita', icon: 'wheat' },
  { id: 'cat-irrigation', slug: 'irrigacao', name: 'Irrigação', icon: 'droplets' },
  { id: 'cat-spraying', slug: 'pulverizacao', name: 'Pulverização', icon: 'spray-can' },
  { id: 'cat-fertilizing', slug: 'fertilizacao', name: 'Fertilização', icon: 'flask-conical' },
  { id: 'cat-transport', slug: 'transporte', name: 'Transporte', icon: 'truck' },
  { id: 'cat-maintenance', slug: 'manutencao', name: 'Manutenção', icon: 'wrench' },
  { id: 'cat-machinery', slug: 'maquinas', name: 'Máquinas', icon: 'tractor' },
]
