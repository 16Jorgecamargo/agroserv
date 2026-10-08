import { motion } from 'framer-motion'
import { MapPin, SearchX } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { CategoryIcon } from '../components/domain/CategoryIcon'
import { ServiceImage } from '../components/domain/ServiceImage'
import { Container } from '../components/layout/Container'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Rating } from '../components/ui/Rating'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { useService } from '../hooks/useServices'
import { paths, type LoginLocationState } from '../routes/paths'
import { isApiError } from '../services/api/apiError'
import { formatCount, formatLocation, formatPrice, formatRating } from '../utils/format'
import { fadeUp, staggerContainer } from '../utils/motion'

function DetailSkeleton() {
  return (
    <div role="status" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <span className="sr-only">Carregando serviço…</span>
      <div className="space-y-6">
        <Skeleton className="aspect-[16/9] rounded-card" />
        <Skeleton className="h-9 w-2/3 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </div>
      <Skeleton className="h-96 rounded-card" />
    </div>
  )
}

export function ServiceDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { data, error, isLoading, refetch } = useService(id)
  const service = data?.id === id ? data : null
  usePageTitle(service?.title ?? 'Serviço')

  if (!service) {
    return (
      <Container className="py-10">
        {isLoading ? (
          <DetailSkeleton />
        ) : isApiError(error) && error.status === 404 ? (
          <EmptyState
            icon={SearchX}
            titleAs="h1"
            title="Serviço não encontrado"
            description="O serviço pode ter sido removido ou o endereço está incorreto."
            action={
              <Link to={paths.services} className={buttonClasses('primary', 'md')}>
                Ver serviços
              </Link>
            }
          />
        ) : (
          <ErrorState titleAs="h1" message={error?.message} onRetry={refetch} />
        )}
      </Container>
    )
  }

  const loginState: LoginLocationState = { from: { pathname: location.pathname, search: location.search } }
  const { provider, category } = service

  return (
    <Container className="py-8 lg:py-10">
      <Breadcrumbs items={[{ label: 'Início', to: paths.home }, { label: 'Serviços', to: paths.services }, { label: service.title }]} />

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} className="overflow-hidden rounded-card border border-border bg-surface-muted">
            <ServiceImage src={service.imageUrl} alt={service.title} className="aspect-[16/9] w-full object-cover" />
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8">
            <Badge tone="primary">
              <CategoryIcon name={category.icon} className="size-3.5" />
              {category.name}
            </Badge>
            <h1 className="mt-3 text-3xl/[38px] font-bold tracking-[-0.01em] text-text sm:text-4xl/[44px]">
              {service.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted">
              <Rating value={service.rating} count={service.reviewCount} />
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {formatLocation(service.city, service.state)}
              </span>
            </div>
          </motion.div>

          <motion.section variants={fadeUp} aria-labelledby="about-heading" className="mt-8 border-t border-border pt-8">
            <h2 id="about-heading" className="text-xl font-semibold text-text">
              Sobre o serviço
            </h2>
            <p className="mt-3 max-w-2xl text-text-muted">{service.description}</p>
          </motion.section>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Contratação"
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <div className="rounded-card border border-border bg-surface p-6 shadow-card">
            <p className="text-sm text-text-muted">A partir de</p>
            <p className="text-3xl font-bold text-text tabular-nums">{formatPrice(service.price, service.priceUnit)}</p>
            <div className="mt-3">
              <Badge tone={service.available ? 'primary' : 'neutral'}>
                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                {service.available ? 'Disponível' : 'Indisponível no momento'}
              </Badge>
            </div>

            {isAuthenticated ? (
              <Link to={paths.dashboard} className={buttonClasses('primary', 'lg', 'mt-6 w-full')}>
                Acompanhar no painel
              </Link>
            ) : (
              <Link to={paths.login} state={loginState} className={buttonClasses('primary', 'lg', 'mt-6 w-full')}>
                Entrar para contratar
              </Link>
            )}
            <p className="mt-3 text-center text-xs text-text-muted">
              A contratação online estará disponível na próxima versão.
            </p>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-xs font-semibold tracking-[0.12em] text-text-muted uppercase">Prestador</p>
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={provider.name} src={provider.avatarUrl} />
                <div>
                  <p className="font-semibold text-text">{provider.name}</p>
                  <p className="text-sm text-text-muted">{formatLocation(provider.city, provider.state)}</p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-surface-muted p-3">
                  <dt className="text-text-muted">Avaliação</dt>
                  <dd className="font-semibold text-text">{formatRating(provider.rating)} de 5</dd>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <dt className="text-text-muted">Experiência</dt>
                  <dd className="font-semibold text-text">{formatCount(provider.yearsOfExperience, 'ano', 'anos')}</dd>
                </div>
              </dl>
            </div>
          </div>
        </motion.aside>
      </div>
    </Container>
  )
}
