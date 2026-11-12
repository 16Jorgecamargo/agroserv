import { motion } from 'framer-motion'
import { Shapes } from 'lucide-react'
import type { AsyncState } from '../../hooks/useAsync'
import type { Category } from '../../types/entities'
import { CategoryCard } from '../domain/CategoryCard'
import { Container } from '../layout/Container'
import { EmptyState } from '../ui/EmptyState'
import { ErrorState } from '../ui/ErrorState'
import { Skeleton } from '../ui/Skeleton'
import { HomeSectionHeader } from './HomeSectionHeader'
import { revealOnScroll, riseIn, stagger } from './homeMotion'

const listClasses =
  'no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] sm:overflow-visible sm:px-0 sm:pb-0'

export function CategorySection({ categories }: { categories: AsyncState<Category[]> }) {
  return (
    <section aria-labelledby="categories-heading" className="py-14 lg:py-20">
      <Container>
        <HomeSectionHeader
          id="categories-heading"
          title="Encontre exatamente o que precisa."
          description="Explore as principais categorias de serviços agrícolas."
        />
        <div className="mt-10">
          {categories.error && !categories.data ? (
            <ErrorState message={categories.error.message} onRetry={categories.refetch} />
          ) : !categories.data ? (
            <div role="status" className={listClasses}>
              <span className="sr-only">Carregando categorias…</span>
              {Array.from({ length: 8 }, (_, index) => (
                <Skeleton key={index} className="h-16 w-56 shrink-0 rounded-full sm:w-auto" />
              ))}
            </div>
          ) : categories.data.length === 0 ? (
            <EmptyState icon={Shapes} title="Nenhuma categoria disponível" description="Volte em breve para explorar os serviços." />
          ) : (
            <motion.ul variants={stagger} {...revealOnScroll} className={listClasses}>
              {categories.data.map((category) => (
                <motion.li key={category.id} variants={riseIn} className="shrink-0 snap-start">
                  <CategoryCard category={category} />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </Container>
    </section>
  )
}
