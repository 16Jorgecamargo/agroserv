import {
  Beef,
  Droplets,
  FlaskConical,
  Leaf,
  Shovel,
  SprayCan,
  Sprout,
  Sun,
  Tractor,
  TreePine,
  Truck,
  Warehouse,
  Wheat,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  sprout: Sprout,
  wheat: Wheat,
  droplets: Droplets,
  'spray-can': SprayCan,
  'flask-conical': FlaskConical,
  truck: Truck,
  wrench: Wrench,
  tractor: Tractor,
  leaf: Leaf,
  shovel: Shovel,
  warehouse: Warehouse,
  sun: Sun,
  'tree-pine': TreePine,
  beef: Beef,
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Leaf
  return <Icon className={className} aria-hidden />
}
