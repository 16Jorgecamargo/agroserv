import { motion } from 'framer-motion'
import { ArrowRight, Sprout } from 'lucide-react'
import { Link } from 'react-router'
import type { AsyncState } from '../../hooks/useAsync'
import { paths } from '../../routes/paths'
import type { Service } from '../../types/entities'
import { ServiceCard } from '../domain/ServiceCard'
import { ServiceCardSkeleton } from '../domain/ServiceCardSkeleton'
import { Container } from '../layout/Container'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { HomeSectionHeader } from './HomeSectionHeader'
import { revealOnScroll, riseIn, stagger } from './homeMotion'

const gridClasses = 'grid gap-x-6 gap-y-10 min-[520px]:grid-cols-2 lg:grid-cols-4'

interface FeaturedServicesProps {
  featured: AsyncState<Service[]>
  skeletonCount: number
}

export function FeaturedServices({ featured, skeletonCount }: FeaturedServicesProps) {
  return (
    <section aria-labelledby="featured-heading" className="py-14 lg:py-20">
      <Container>
        <HomeSectionHeader
          id="featured-heading"
          title="Serviços que fazem a diferença."
          description="Conheça algumas das oportunidades disponíveis na sua região."
          action={
            <Link
              to={paths.services}
              className="group inline-flex h-11 items-center gap-2 self-start rounded-full text-base font-semibold text-primary transition-colors duration-200 hover:text-primary-strong sm:self-auto"
            >
              Ver todos
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
          }
        />
        <div className="mt-10">
          {featured.error && !featured.data ? (
            <ErrorState message={featured.error.message} onRetry={featured.refetch} />
          ) : !featured.data ? (
            <div role="status" className={gridClasses}>
              <span className="sr-only">Carregando serviços…</span>
              {Array.from({ length: skeletonCount }, (_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
            </div>
          ) : featured.data.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title="Nenhum serviço em destaque no momento"
              description="Veja a lista completa para encontrar prestadores na sua região."
            />
          ) : (
            <motion.ul variants={stagger} {...revealOnScroll} className={gridClasses}>
              {featured.data.map((service) => (
                <motion.li key={service.id} variants={riseIn}>
                  <ServiceCard service={service} />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </Container>
    </section>
  )
}
