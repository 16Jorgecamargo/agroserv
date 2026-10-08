import { motion } from 'framer-motion'
import { SearchX, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { CategoryIcon } from '../components/domain/CategoryIcon'
import { SearchBar, type SearchValues } from '../components/domain/SearchBar'
import { ServiceCard } from '../components/domain/ServiceCard'
import { ServiceCardSkeleton } from '../components/domain/ServiceCardSkeleton'
import { Container } from '../components/layout/Container'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FilterChip } from '../components/ui/FilterChip'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCategories, useServices } from '../hooks/useServices'
import { paths } from '../routes/paths'
import { cn } from '../utils/cn'
import { formatCount } from '../utils/format'
import { fadeUp, staggerContainer } from '../utils/motion'

const PAGE_SIZE = 9

type FilterKey = 'q' | 'location' | 'category'

export function ServicesPage() {
  usePageTitle('Serviços')
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const location = searchParams.get('location') ?? ''
  const category = searchParams.get('category') ?? ''
  const filterKey = searchParams.toString()
  const [pagination, setPagination] = useState({ filterKey, pageCount: 1 })
  const pageCount = pagination.filterKey === filterKey ? pagination.pageCount : 1

  const categories = useCategories()
  const { data, error, isLoading, refetch } = useServices({
    q: query || undefined,
    location: location || undefined,
    category: category || undefined,
    page: 1,
    pageSize: PAGE_SIZE * pageCount,
  })

  const services = data?.data ?? []
  const total = data?.meta.total ?? 0
  const hasFilters = Boolean(query || location || category)
  const hasMore = services.length < total

  function updateParams(next: Partial<Record<FilterKey, string>>) {
    const params = new URLSearchParams(searchParams)
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    setSearchParams(params)
  }

  function handleSearch(values: SearchValues) {
    updateParams({ q: values.q, location: values.location })
  }

  function clearFilters() {
    setSearchParams(new URLSearchParams())
  }

  function loadMore() {
    setPagination({ filterKey, pageCount: pageCount + 1 })
  }

  return (
    <Container className="py-8 lg:py-10">
      <Breadcrumbs items={[{ label: 'Início', to: paths.home }, { label: 'Serviços' }]} />

      <div className="mt-5 max-w-2xl">
        <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text sm:text-4xl/[44px]">
          Encontre serviços agrícolas
        </h1>
        <p className="mt-2 text-text-muted">Compare prestadores, preços e disponibilidade na sua região.</p>
      </div>

      <SearchBar
        key={`${query}|${location}`}
        initialQuery={query}
        initialLocation={location}
        onSearch={handleSearch}
        className="mt-6"
      />

      <div
        role="group"
        aria-label="Filtrar por categoria"
        className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        <FilterChip isActive={!category} onClick={() => updateParams({ category: '' })}>
          Todas
        </FilterChip>
        {categories.data?.map((item) => (
          <FilterChip key={item.id} isActive={category === item.slug} onClick={() => updateParams({ category: item.slug })}>
            <CategoryIcon name={item.icon} className="size-4" />
            {item.name}
          </FilterChip>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <p className="text-sm text-text-muted" aria-live="polite">
          {data ? `Encontramos ${formatCount(total, 'serviço', 'serviços')}` : 'Buscando serviços…'}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" aria-hidden />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="mt-5">
        {error && !data ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : !data ? (
          <div role="status" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <span className="sr-only">Carregando serviços…</span>
            {Array.from({ length: 6 }, (_, index) => (
              <ServiceCardSkeleton key={index} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Não encontramos serviços para essa busca."
            description="Tente outro termo, outra localização ou remova a categoria selecionada."
            action={<Button onClick={clearFilters}>Limpar filtros</Button>}
          />
        ) : (
          <>
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              aria-busy={isLoading}
              className={cn('grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3', isLoading && 'opacity-60')}
            >
              {services.map((service) => (
                <motion.li key={service.id} variants={fadeUp}>
                  <ServiceCard service={service} />
                </motion.li>
              ))}
            </motion.ul>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Button variant="secondary" size="lg" isLoading={isLoading} onClick={loadMore}>
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  )
}
