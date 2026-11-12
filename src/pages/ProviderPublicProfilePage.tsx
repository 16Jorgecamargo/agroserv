import { motion } from 'framer-motion'
import { Award, MapPin, Radar, UserX } from 'lucide-react'
import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { ReviewItem } from '../components/domain/ReviewItem'
import { ReviewSummaryCard } from '../components/domain/ReviewSummaryCard'
import { ServiceCard } from '../components/domain/ServiceCard'
import { Container } from '../components/layout/Container'
import { Avatar } from '../components/ui/Avatar'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Rating } from '../components/ui/Rating'
import { Skeleton } from '../components/ui/Skeleton'
import { VerifiedBadge } from '../components/ui/VerifiedBadge'
import { useAsync } from '../hooks/useAsync'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { isApiError } from '../services/apiError'
import { providerService } from '../services/providerService'
import { formatCount, formatLocation } from '../utils/format'
import { fadeUp, staggerContainer } from '../utils/motion'
import { equipmentTypeLabels } from '../utils/serviceStatus'

export function ProviderPublicProfilePage() {
  const { id = '' } = useParams()
  const fetcher = useCallback(() => providerService.getPublicProfile(id), [id])
  const { data, error, refetch } = useAsync(fetcher)
  usePageTitle(data ? data.provider.name : 'Prestador')

  if (!data) {
    if (error && isApiError(error) && error.status === 404) {
      return (
        <Container className="py-16">
          <EmptyState
            icon={UserX}
            title={error.message}
            description="Veja outros prestadores na busca de serviços."
            action={
              <Link to={paths.services} className={buttonClasses('primary', 'md')}>
                Buscar serviços
              </Link>
            }
          />
        </Container>
      )
    }
    return (
      <Container className="py-10">
        {error ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : (
          <div role="status" className="space-y-6">
            <span className="sr-only">Carregando prestador…</span>
            <Skeleton className="h-40 rounded-card" />
            <Skeleton className="h-72 rounded-card" />
          </div>
        )}
      </Container>
    )
  }

  const { provider, services, equipment, recentReviews, reviewSummary } = data

  return (
    <Container className="py-8 lg:py-10">
      <Breadcrumbs items={[{ label: 'Início', to: paths.home }, { label: 'Serviços', to: paths.services }, { label: provider.name }]} />

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-6 space-y-10">
        <motion.header variants={fadeUp} className="flex flex-col gap-6 rounded-card border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-center">
          <Avatar name={provider.name} src={provider.avatarUrl} size="xl" />
          <div className="flex-1 space-y-2">
            <h1 className="flex flex-wrap items-center gap-2 text-3xl font-bold tracking-[-0.01em] text-text">
              {provider.name}
              {provider.verified && <VerifiedBadge />}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted">
              <Rating value={provider.rating} count={provider.reviewCount} />
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {formatLocation(provider.city, provider.state)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Award className="size-4" aria-hidden />
                {formatCount(provider.yearsOfExperience, 'ano de experiência', 'anos de experiência')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Radar className="size-4" aria-hidden />
                Atende até {provider.serviceRadiusKm} km
              </span>
            </div>
            {provider.description && <p className="max-w-3xl text-text">{provider.description}</p>}
          </div>
        </motion.header>

        <motion.section variants={fadeUp} aria-labelledby="provider-services-heading" className="space-y-4">
          <h2 id="provider-services-heading" className="text-xl font-semibold text-text">
            Serviços
          </h2>
          {services.length === 0 ? (
            <p className="rounded-card border border-dashed border-border p-6 text-center text-sm text-text-muted">Nenhum serviço ativo no momento.</p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li key={service.id}>
                  <ServiceCard service={service} />
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        {equipment.length > 0 && (
          <motion.section variants={fadeUp} aria-labelledby="provider-equipment-heading" className="space-y-4">
            <h2 id="provider-equipment-heading" className="text-xl font-semibold text-text">
              Equipamentos
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {equipment.map((item) => (
                <li key={item.id} className="rounded-card border border-border bg-surface p-4">
                  <p className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">{equipmentTypeLabels[item.type]}</p>
                  <p className="mt-1 font-semibold text-text">{item.model}</p>
                  <p className="text-sm text-text-muted">Ano {item.year}</p>
                  {item.specs && <p className="mt-2 text-sm text-text">{item.specs}</p>}
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        <motion.section variants={fadeUp} aria-labelledby="provider-reviews-heading" className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="space-y-4">
            <h2 id="provider-reviews-heading" className="text-xl font-semibold text-text">
              Avaliações
            </h2>
            <ReviewSummaryCard summary={reviewSummary} />
          </div>
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            {recentReviews.length === 0 ? (
              <p className="text-sm text-text-muted">Ainda sem avaliações escritas.</p>
            ) : (
              <div className="divide-y divide-border">
                {recentReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} showService />
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </motion.div>
    </Container>
  )
}
