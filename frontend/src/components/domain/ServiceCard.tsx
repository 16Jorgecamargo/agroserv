import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import type { Service } from '../../types/entities'
import { cn } from '../../utils/cn'
import { formatLocation, formatPrice } from '../../utils/format'
import { cardHover } from '../../utils/motion'
import { Rating } from '../ui/Rating'
import { VerifiedBadge } from '../ui/VerifiedBadge'
import { FavoriteButton } from './FavoriteButton'
import { ServiceImage } from './ServiceImage'

export function ServiceCard({ service }: { service: Service }) {
  return (
    <motion.article whileHover={cardHover} className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-muted ring-1 ring-border transition-shadow duration-300 group-hover:ring-primary/45">
        <ServiceImage
          src={service.imageUrl}
          alt={service.title}
          className="size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-text shadow-card backdrop-blur">
          <span className={cn('size-1.5 rounded-full', service.available ? 'bg-primary' : 'bg-text-muted/60')} aria-hidden />
          {service.available ? 'Disponível' : 'Indisponível'}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-0.5 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base/6 font-semibold text-text">{service.title}</h3>
          <span className="shrink-0 pt-0.5">
            <Rating value={service.rating} count={service.reviewCount} />
          </span>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
          <span>
            por{' '}
            <Link
              to={paths.providerPublicProfile(service.providerId)}
              className="relative z-20 font-medium text-text transition-colors hover:text-primary hover:underline"
            >
              {service.providerName}
            </Link>
          </span>
          {service.providerVerified && <VerifiedBadge />}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-text-muted">
          <MapPin className="size-3.5" aria-hidden />
          {formatLocation(service.city, service.state)}
        </p>
        <p className="mt-auto pt-3 text-sm text-text-muted">
          A partir de{' '}
          <span className="text-base font-bold text-text tabular-nums">{formatPrice(service.price, service.priceUnit)}</span>
        </p>
      </div>
      <Link
        to={paths.serviceDetail(service.id)}
        aria-label={`Ver detalhes de ${service.title}`}
        className="absolute inset-0 z-10 rounded-2xl"
      />
      <FavoriteButton serviceId={service.id} serviceTitle={service.title} className="absolute top-3 right-3 z-20" />
    </motion.article>
  )
}
