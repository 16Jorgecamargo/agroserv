import {
  Droplets,
  FlaskConical,
  Leaf,
  SprayCan,
  Sprout,
  Tractor,
  Truck,
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
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Leaf
  return <Icon className={className} aria-hidden />
}
