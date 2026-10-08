import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { CategoryCard } from '../components/domain/CategoryCard'
import { HeroVisual } from '../components/domain/HeroVisual'
import { SearchBar, type SearchValues } from '../components/domain/SearchBar'
import { ServiceCard } from '../components/domain/ServiceCard'
import { ServiceCardSkeleton } from '../components/domain/ServiceCardSkeleton'
import { Container } from '../components/layout/Container'
import { buttonClasses } from '../components/ui/buttonClasses'
import { ErrorState } from '../components/ui/ErrorState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCategories, useFeaturedServices } from '../hooks/useServices'
import { paths } from '../routes/paths'
import { fadeUp, staggerContainer } from '../utils/motion'
import { toSearchString } from '../utils/searchParams'

const FEATURED_LIMIT = 4

const heroHighlights = [
  { value: '120+', label: 'prestadores verificados' },
  { value: '4,8', label: 'avaliação média' },
  { value: '35', label: 'cidades atendidas' },
]

const revealOnScroll = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, margin: '-60px' },
} as const

export function HomePage() {
  usePageTitle('Serviços agrícolas')
  const navigate = useNavigate()
  const categories = useCategories()
  const featured = useFeaturedServices(FEATURED_LIMIT)

  function handleSearch(values: SearchValues) {
    navigate(`${paths.services}${toSearchString({ q: values.q, location: values.location })}`)
  }

  return (
    <>
      <section className="pt-10 pb-14 lg:pt-16 lg:pb-20">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-xl">
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-primary"
            >
              <ShieldCheck className="size-3.5" aria-hidden />
              Prestadores verificados na sua região
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="mt-5 text-4xl/[44px] font-extrabold tracking-[-0.02em] text-text sm:text-5xl/[56px]"
            >
              Encontre o serviço agrícola certo para sua propriedade.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 text-lg/7 text-text-muted">
              Conecte-se a profissionais, máquinas e serviços agrícolas disponíveis na sua região.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link to={paths.services} className={buttonClasses('primary', 'lg')}>
                Encontrar serviços
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link to={paths.dashboard} className={buttonClasses('secondary', 'lg')}>
                Acessar meu painel
              </Link>
            </motion.div>
            <motion.dl variants={fadeUp} className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
              {heroHighlights.map((highlight) => (
                <div key={highlight.label} className="flex flex-col-reverse">
                  <dt className="text-xs text-text-muted">{highlight.label}</dt>
                  <dd className="text-2xl font-bold text-text tabular-nums">{highlight.value}</dd>
                </div>
              ))}
            </motion.dl>
          </motion.div>
          <HeroVisual />
        </Container>
      </section>

      <section aria-labelledby="search-heading" className="pb-6">
        <Container>
          <motion.div variants={fadeUp} {...revealOnScroll}>
            <h2 id="search-heading" className="text-lg font-semibold text-text">
              Busque por serviço e localização
            </h2>
            <p className="mt-1 text-sm text-text-muted">Exemplo: Pulverização em Santa Helena - PR</p>
            <SearchBar onSearch={handleSearch} className="mt-4" />
          </motion.div>
        </Container>
      </section>

      <section aria-labelledby="categories-heading" className="py-16">
        <Container>
          <SectionHeader
            id="categories-heading"
            eyebrow="Categorias"
            title="Encontre o serviço que precisa"
            description="Do preparo do solo ao transporte da colheita."
          />
          <div className="mt-8">
            {categories.error && !categories.data ? (
              <ErrorState message={categories.error.message} onRetry={categories.refetch} />
            ) : categories.data ? (
              <motion.ul variants={staggerContainer} {...revealOnScroll} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {categories.data.map((category) => (
                  <motion.li key={category.id} variants={fadeUp}>
                    <CategoryCard category={category} />
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <div role="status" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <span className="sr-only">Carregando categorias…</span>
                {Array.from({ length: 8 }, (_, index) => (
                  <Skeleton key={index} className="h-28 rounded-card" />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      <section aria-labelledby="featured-heading" className="py-16">
        <Container>
          <SectionHeader
            id="featured-heading"
            eyebrow="Destaques"
            title="Serviços em destaque"
            description="Prestadores bem avaliados e com agenda disponível."
            action={
              <Link to={paths.services} className={buttonClasses('ghost', 'sm', 'self-start sm:self-auto')}>
                Ver todos
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          <div className="mt-8">
            {featured.error && !featured.data ? (
              <ErrorState message={featured.error.message} onRetry={featured.refetch} />
            ) : featured.data ? (
              <motion.ul
                variants={staggerContainer}
                {...revealOnScroll}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
              >
                {featured.data.map((service) => (
                  <motion.li key={service.id} variants={fadeUp}>
                    <ServiceCard service={service} />
                  </motion.li>
                ))}
              </motion.ul>
            ) : (
              <div role="status" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <span className="sr-only">Carregando serviços…</span>
                {Array.from({ length: FEATURED_LIMIT }, (_, index) => (
                  <ServiceCardSkeleton key={index} />
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  )
}
