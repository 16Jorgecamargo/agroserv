import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { Link } from 'react-router'
import { ServiceCard } from '../components/domain/ServiceCard'
import { ServiceCardSkeleton } from '../components/domain/ServiceCardSkeleton'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useAsync } from '../hooks/useAsync'
import { useFavorites } from '../hooks/useFavorites'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'
import { favoriteService } from '../services/favoriteService'
import { formatCount } from '../utils/format'
import { fadeUp, staggerContainer } from '../utils/motion'

export function FavoritesPage() {
  usePageTitle('Favoritos')
  const { data, error, refetch } = useAsync(favoriteService.list)
  const favorites = useFavorites()
  const services = data?.filter((service) => !favorites?.isReady || favorites.isFavorite(service.id)) ?? null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Favoritos</h1>
        <p className="mt-1 text-text-muted">Serviços que você salvou para contratar depois.</p>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !services ? (
        <div role="status" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <span className="sr-only">Carregando favoritos…</span>
          {Array.from({ length: 3 }, (_, index) => (
            <ServiceCardSkeleton key={index} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nenhum favorito ainda"
          description="Toque no coração de um serviço para guardar aqui."
          action={
            <Link to={paths.services} className={buttonClasses('primary', 'md')}>
              Buscar serviços
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm text-text-muted" aria-live="polite">
            {formatCount(services.length, 'serviço salvo', 'serviços salvos')}
          </p>
          <motion.ul variants={staggerContainer} initial="hidden" animate="visible" aria-label="Serviços favoritos" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <motion.li key={service.id} variants={fadeUp}>
                <ServiceCard service={service} />
              </motion.li>
            ))}
          </motion.ul>
        </>
      )}
    </div>
  )
}
