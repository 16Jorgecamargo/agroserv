import { motion } from 'framer-motion'
import { MapPin, SprayCan, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import heroImage from '../../assets/images/hero-field.jpg'
import { cn } from '../../utils/cn'

const areaBars = [42, 58, 50, 72, 64, 88]

function FloatingCard({ delay, className, children }: { delay: number; className: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'absolute flex items-center gap-3 rounded-card border border-border bg-surface/95 p-3 pr-4 shadow-card-hover backdrop-blur',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export function HeroVisual() {
  return (
    <div className="relative" aria-hidden>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-card border border-border bg-surface-muted shadow-card"
      >
        <img src={heroImage} alt="" className="aspect-[4/3] w-full object-cover lg:aspect-[4/5]" />
      </motion.div>

      <FloatingCard delay={0.25} className="top-4 left-3 sm:-left-6">
        <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
          <SprayCan className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text">Pulverização Agrícola</p>
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="size-1.5 rounded-full bg-primary" />
            Disponível hoje
          </p>
        </div>
      </FloatingCard>

      <FloatingCard delay={0.35} className="top-1/2 right-3 hidden sm:-right-6 sm:flex">
        <span className="grid size-10 place-items-center rounded-lg bg-warning/10 text-warning">
          <Star className="size-5 fill-current" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text tabular-nums">4,9 de 5</p>
          <p className="text-xs text-text-muted">128 serviços avaliados</p>
        </div>
      </FloatingCard>

      <FloatingCard delay={0.45} className="bottom-4 left-3 sm:-left-6">
        <div>
          <p className="text-xs text-text-muted">Área atendida no mês</p>
          <p className="text-lg font-bold text-text tabular-nums">1.240 ha</p>
        </div>
        <div className="flex h-10 items-end gap-1">
          {areaBars.map((height, index) => (
            <span
              key={index}
              className={cn('w-2 rounded-sm', index === areaBars.length - 1 ? 'bg-primary' : 'bg-primary-light/60')}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </FloatingCard>

      <FloatingCard delay={0.55} className="right-3 bottom-4 hidden sm:-right-4 md:flex">
        <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
          <MapPin className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text">Santa Helena - PR</p>
          <p className="text-xs text-text-muted">12 prestadores próximos</p>
        </div>
      </FloatingCard>
    </div>
  )
}
