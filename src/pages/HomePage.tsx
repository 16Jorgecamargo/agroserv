import { CategorySection } from '../components/home/CategorySection'
import { FeaturedServices } from '../components/home/FeaturedServices'
import { HeroSection } from '../components/home/HeroSection'
import { SearchSection } from '../components/home/SearchSection'
import { useMarketplaceOverview } from '../hooks/useMarketplaceOverview'
import { usePageTitle } from '../hooks/usePageTitle'
import { useCategories, useFeaturedServices } from '../hooks/useServices'

const FEATURED_LIMIT = 4

export function HomePage() {
  usePageTitle('Serviços agrícolas')
  const categories = useCategories()
  const featured = useFeaturedServices(FEATURED_LIMIT)
  const marketplace = useMarketplaceOverview()
  const spotlight = featured.data?.[0]
  const spotlightIcon = categories.data?.find((category) => category.id === spotlight?.categoryId)?.icon

  return (
    <>
      <HeroSection
        overview={marketplace.overview}
        isOverviewLoading={marketplace.isLoading}
        spotlight={spotlight}
        spotlightIcon={spotlightIcon}
      />
      <SearchSection />
      <CategorySection categories={categories} />
      <FeaturedServices featured={featured} skeletonCount={FEATURED_LIMIT} />
    </>
  )
}
