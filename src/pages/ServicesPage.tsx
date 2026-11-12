import { motion } from 'framer-motion'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { CategoryIcon } from '../components/domain/CategoryIcon'
import { SearchBar, type SearchValues } from '../components/domain/SearchBar'
import { ServiceFiltersPanel, type AdvancedFilterKey, type AdvancedFilterValues } from '../components/domain/ServiceFiltersPanel'
import { ServiceCard } from '../components/domain/ServiceCard'
import { ServiceCardSkeleton } from '../components/domain/ServiceCardSkeleton'
import { Container } from '../components/layout/Container'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FilterChip } from '../components/ui/FilterChip'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCategories, useServicePages } from '../hooks/useServices'
import { paths } from '../routes/paths'
import type { ServiceFilters, ServiceSort } from '../types/api'
import type { PriceUnit } from '../types/entities'
import { cn } from '../utils/cn'
import { formatCount } from '../utils/format'
import { fadeUp, staggerContainer } from '../utils/motion'

const PAGE_SIZE = 9
const PRICE_UNITS: PriceUnit[] = ['hectare', 'hour', 'day', 'trip']
const SORT_OPTIONS: { value: ServiceSort; label: string }[] = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'rating', label: 'Melhor avaliação' },
]

type FilterKey = 'q' | 'location' | 'category' | 'sort' | AdvancedFilterKey

function toNumber(value: string): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function readAdvanced(params: URLSearchParams): AdvancedFilterValues {
  return {
    priceUnit: PRICE_UNITS.find((unit) => unit === params.get('priceUnit')) ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    minRating: params.get('minRating') ?? '',
    verified: params.get('verified') === 'true',
    date: params.get('date') ?? '',
  }
}

function countAdvanced(values: AdvancedFilterValues): number {
  return [values.priceUnit, values.minRating, values.verified, values.date].filter(Boolean).length
}

export function ServicesPage() {
  usePageTitle('Serviços')
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const location = searchParams.get('location') ?? ''
  const category = searchParams.get('category') ?? ''
  const filterKey = searchParams.toString()
  const [pagination, setPagination] = useState({ filterKey, pageCount: 1 })
  const pageCount = pagination.filterKey === filterKey ? pagination.pageCount : 1

  const advanced = readAdvanced(searchParams)
  const sort = SORT_OPTIONS.find((option) => option.value === searchParams.get('sort'))?.value ?? 'relevance'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const advancedCount = countAdvanced(advanced)

  const categories = useCategories()
  const filters: Omit<ServiceFilters, 'page' | 'pageSize'> = {
    q: query || undefined,
    location: location || undefined,
    category: category || undefined,
    priceUnit: advanced.priceUnit || undefined,
    minPrice: advanced.priceUnit ? toNumber(advanced.minPrice) : undefined,
    maxPrice: advanced.priceUnit ? toNumber(advanced.maxPrice) : undefined,
    minRating: toNumber(advanced.minRating),
    verified: advanced.verified || undefined,
    date: advanced.date || undefined,
    sort: sort === 'relevance' ? undefined : sort,
  }
  const { data, error, isLoading, refetch } = useServicePages(filters, PAGE_SIZE, pageCount)

  const services = data?.data ?? []
  const total = data?.meta.total ?? 0
  const hasFilters = Boolean(query || location || category || advancedCount || sort !== 'relevance')
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

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setIsDrawerOpen(true)}>
            <SlidersHorizontal className="size-4" aria-hidden />
            {advancedCount ? `Filtros (${advancedCount})` : 'Filtros'}
          </Button>
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
        <Select
          label="Ordenar por"
          value={sort}
          onChange={(event) => updateParams({ sort: event.target.value === 'relevance' ? '' : event.target.value })}
          containerClassName="w-full sm:w-56"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <Modal isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Filtros">
        <ServiceFiltersPanel idPrefix="drawer" values={advanced} onChange={updateParams} />
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setIsDrawerOpen(false)}>Ver resultados</Button>
        </div>
      </Modal>

      <div className="mt-5 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <aside aria-label="Filtros avançados" className="hidden lg:block">
          <div className="sticky top-24 rounded-card border border-border bg-surface p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-text">Filtros</h2>
            <ServiceFiltersPanel idPrefix="panel" values={advanced} onChange={updateParams} />
          </div>
        </aside>
        <div>
        {error && !data ? (
          <ErrorState message={error.message} onRetry={refetch} />
        ) : !data ? (
          <div role="status" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
              className={cn('grid gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3', isLoading && 'opacity-60')}
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
      </div>
    </Container>
  )
}
