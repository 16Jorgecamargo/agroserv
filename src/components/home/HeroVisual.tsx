import { motion, useScroll, useTransform } from 'framer-motion'
import { MapPin, Star } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import heroImage from '../../assets/images/service-machinery.jpg'
import type { Service } from '../../types/entities'
import { cn } from '../../utils/cn'
import { formatCount, formatLocation, formatPrice, formatRating } from '../../utils/format'
import { CategoryIcon } from '../domain/CategoryIcon'
import { EASE_OUT_EXPO } from './homeMotion'

interface HeroVisualProps {
  service?: Service
  categoryIcon?: string
  providersNearby?: number
}

interface FloatingCardProps {
  order: number
  className: string
  children: ReactNode
}

function FloatingCard({ order, className, children }: FloatingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.5 + order * 0.12, ease: EASE_OUT_EXPO }}
      className={cn('absolute', className)}
    >
      <div
        style={{ animationDelay: `${order * -1.6}s` }}
        className="flex items-center gap-3 rounded-2xl border border-white/70 bg-surface/95 p-3 pr-4 shadow-float backdrop-blur-md motion-safe:animate-float-soft"
      >
        {children}
      </div>
    </motion.div>
  )
}

export function HeroVisual({ service, categoryIcon, providersNearby }: HeroVisualProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: frameRef, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])

  return (
    <div className="relative" aria-hidden>
      <motion.div
        ref={frameRef}
        initial={{ clipPath: 'inset(100% 0% 0% 0% round 28px)' }}
        animate={{ clipPath: 'inset(0% 0% 0% 0% round 28px)' }}
        transition={{ duration: 0.8, delay: 0.15, ease: EASE_OUT_EXPO }}
        className="aspect-[4/3] overflow-hidden rounded-[28px] bg-surface-muted lg:aspect-[4/5]"
      >
        <motion.div style={{ y: imageY }} className="size-full">
          <motion.img
            src={heroImage}
            alt=""
            width={1400}
            height={922}
            initial={{ scale: 1.14 }}
            animate={{ scale: 1.04 }}
            transition={{ duration: 1.4, delay: 0.15, ease: EASE_OUT_EXPO }}
            className="size-full object-cover object-[42%_center]"
          />
        </motion.div>
      </motion.div>

      {service && (
        <>
          <FloatingCard order={0} className="top-5 left-3 lg:-left-6">
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <CategoryIcon name={categoryIcon ?? 'leaf'} className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium text-text-muted">Em destaque agora</p>
              <p className="text-sm font-semibold text-text">{service.title}</p>
              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className={cn('size-1.5 rounded-full', service.available ? 'bg-primary' : 'bg-text-muted/60')} />
                {service.available ? 'Disponível' : 'Indisponível'}
              </p>
            </div>
          </FloatingCard>

          <FloatingCard order={1} className="top-[42%] right-3 hidden sm:block lg:-right-5">
            <span className="grid size-10 place-items-center rounded-xl bg-warning/10 text-warning">
              <Star className="size-5 fill-current" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text tabular-nums">{formatRating(service.rating)} de 5</p>
              <p className="text-xs text-text-muted">{formatCount(service.reviewCount, 'avaliação', 'avaliações')}</p>
            </div>
          </FloatingCard>

          <FloatingCard order={2} className="bottom-5 left-3 lg:-left-6">
            <div>
              <p className="text-xs text-text-muted">A partir de</p>
              <p className="text-lg/6 font-bold text-text tabular-nums">{formatPrice(service.price, service.priceUnit)}</p>
            </div>
          </FloatingCard>

          {providersNearby !== undefined && (
            <FloatingCard order={3} className="right-3 bottom-8 hidden md:block lg:-right-4">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <MapPin className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">{formatLocation(service.city, service.state)}</p>
                <p className="text-xs text-text-muted">{formatCount(providersNearby, 'prestador na cidade', 'prestadores na cidade')}</p>
              </div>
            </FloatingCard>
          )}
        </>
      )}
    </div>
  )
}
