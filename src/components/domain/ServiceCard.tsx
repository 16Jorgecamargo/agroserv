import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import type { Service } from '../../types/entities'
import { formatLocation, formatPrice } from '../../utils/format'
import { cardHover } from '../../utils/motion'
import { Badge } from '../ui/Badge'
import { buttonClasses } from '../ui/buttonClasses'
import { Rating } from '../ui/Rating'
import { ServiceImage } from './ServiceImage'

export function ServiceCard({ service }: { service: Service }) {
  return (
    <motion.article
      whileHover={cardHover}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        <ServiceImage
          src={service.imageUrl}
          alt={service.title}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute top-3 left-3">
          <Badge tone={service.available ? 'primary' : 'neutral'}>
            <span className="size-1.5 rounded-full bg-current" aria-hidden />
            {service.available ? 'Disponível' : 'Indisponível'}
          </Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-lg/[26px] font-semibold text-text">{service.title}</h3>
          <p className="text-sm text-text-muted">por {service.providerName}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="inline-flex items-center gap-1 text-text-muted">
            <MapPin className="size-4" aria-hidden />
            {formatLocation(service.city, service.state)}
          </span>
          <Rating value={service.rating} count={service.reviewCount} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
          <p className="text-xs text-text-muted">
            A partir de
            <span className="block text-base font-bold text-text tabular-nums">
              {formatPrice(service.price, service.priceUnit)}
            </span>
          </p>
          <Link
            to={paths.serviceDetail(service.id)}
            aria-label={`Ver detalhes de ${service.title}`}
            className={buttonClasses('secondary', 'sm')}
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
