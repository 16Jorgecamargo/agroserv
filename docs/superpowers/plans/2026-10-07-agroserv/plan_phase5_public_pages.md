# Phase 5 — Public pages

> Part of `plan_index.md`. Read its Global Constraints first. Depends on Phases 1–4.

### Task 5.1: Domain components (cards and search)

**Files:**
- Create: `src/components/domain/CategoryIcon.tsx`, `ServiceImage.tsx`, `ServiceCard.tsx`, `ServiceCardSkeleton.tsx`, `CategoryCard.tsx`, `SearchBar.tsx` (all in `src/components/domain/`)
- Test: `src/components/domain/domain.test.tsx`

**Interfaces:**
- Consumes: UI kit (Task 4.1), `paths` (Task 3.2), `formatPrice`, `formatLocation`, `toSearchString`, `cardHover`, `cn` (Task 1.2).
- Produces:
  - `CategoryIcon({ name: string; className?: string })` — maps `sprout | wheat | droplets | spray-can | flask-conical | truck | wrench | tractor` to Lucide icons, `Leaf` as fallback
  - `ServiceImage({ src: string; alt: string; className?: string })` — falls back to a neutral placeholder on load error
  - `ServiceCard({ service: Service })` — `<article>`, link "Ver detalhes" to `paths.serviceDetail(id)`
  - `ServiceCardSkeleton()`
  - `CategoryCard({ category: Category })` — link to `/servicos?category=<slug>`
  - `interface SearchValues { q: string; location: string }`, `SearchBar({ initialQuery?; initialLocation?; onSearch: (values: SearchValues) => void; className? })`

- [ ] **Step 1: Write the failing test `src/components/domain/domain.test.tsx`**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { Category, Service } from '../../types/entities'
import { CategoryCard } from './CategoryCard'
import { SearchBar } from './SearchBar'
import { ServiceCard } from './ServiceCard'
import { ServiceImage } from './ServiceImage'

const service: Service = {
  id: 'svc-1',
  title: 'Pulverização Agrícola',
  description: 'Descrição',
  categoryId: 'cat-spraying',
  providerId: 'prv-1',
  providerName: 'Agro Máquinas Paraná',
  city: 'Santa Helena',
  state: 'PR',
  price: 180,
  priceUnit: 'hour',
  rating: 4.9,
  reviewCount: 128,
  available: true,
  imageUrl: '/spraying.jpg',
}

const category: Category = { id: 'cat-spraying', slug: 'pulverizacao', name: 'Pulverização', icon: 'spray-can' }

describe('ServiceCard', () => {
  it('shows the service summary and links to the detail page', () => {
    render(
      <MemoryRouter>
        <ServiceCard service={service} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(screen.getByText('por Agro Máquinas Paraná')).toBeInTheDocument()
    expect(screen.getByText('Santa Helena - PR')).toBeInTheDocument()
    expect(screen.getByText('Disponível')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s180\/h/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver detalhes de Pulverização Agrícola' })).toHaveAttribute(
      'href',
      '/servicos/svc-1',
    )
  })

  it('marks unavailable services', () => {
    render(
      <MemoryRouter>
        <ServiceCard service={{ ...service, available: false }} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Indisponível')).toBeInTheDocument()
  })
})

describe('ServiceImage', () => {
  it('falls back to a placeholder when the image fails', () => {
    render(<ServiceImage src="/broken.jpg" alt="Foto do serviço" />)
    fireEvent.error(screen.getByRole('img', { name: 'Foto do serviço' }))
    expect(screen.getByRole('img', { name: 'Foto do serviço' }).tagName).toBe('DIV')
  })
})

describe('CategoryCard', () => {
  it('links to the services page filtered by slug', () => {
    render(
      <MemoryRouter>
        <CategoryCard category={category} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Pulverização' })).toHaveAttribute('href', '/servicos?category=pulverizacao')
  })
})

describe('SearchBar', () => {
  it('submits trimmed values', async () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} initialLocation="Cascavel" />)
    await userEvent.type(screen.getByLabelText('Qual serviço você precisa?'), '  colheita ')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onSearch).toHaveBeenCalledWith({ q: 'colheita', location: 'Cascavel' })
  })

  it('submits with Enter', async () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    await userEvent.type(screen.getByLabelText('Localização'), 'Toledo{Enter}')
    expect(onSearch).toHaveBeenCalledWith({ q: '', location: 'Toledo' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/domain`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `CategoryIcon.tsx` and `ServiceImage.tsx`**

`src/components/domain/CategoryIcon.tsx`:

```tsx
import {
  Droplets,
  FlaskConical,
  Leaf,
  SprayCan,
  Sprout,
  Tractor,
  Truck,
  Wheat,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  sprout: Sprout,
  wheat: Wheat,
  droplets: Droplets,
  'spray-can': SprayCan,
  'flask-conical': FlaskConical,
  truck: Truck,
  wrench: Wrench,
  tractor: Tractor,
}

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Leaf
  return <Icon className={className} aria-hidden />
}
```

`src/components/domain/ServiceImage.tsx`:

```tsx
import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'

interface ServiceImageProps {
  src: string
  alt: string
  className?: string
}

export function ServiceImage({ src, alt, className }: ServiceImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (failedSrc === src) {
    return (
      <div role="img" aria-label={alt} className={cn('grid place-items-center bg-surface-muted text-text-muted', className)}>
        <ImageOff className="size-6" aria-hidden />
      </div>
    )
  }

  return <img src={src} alt={alt} loading="lazy" onError={() => setFailedSrc(src)} className={className} />
}
```

- [ ] **Step 4: Write `ServiceCard.tsx` and `ServiceCardSkeleton.tsx`**

`src/components/domain/ServiceCard.tsx`:

```tsx
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
```

`src/components/domain/ServiceCardSkeleton.tsx`:

```tsx
import { Skeleton } from '../ui/Skeleton'

export function ServiceCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface" aria-hidden>
      <Skeleton className="aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write `CategoryCard.tsx` and `SearchBar.tsx`**

`src/components/domain/CategoryCard.tsx`:

```tsx
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import type { Category } from '../../types/entities'
import { cardHover } from '../../utils/motion'
import { toSearchString } from '../../utils/searchParams'
import { CategoryIcon } from './CategoryIcon'

export function CategoryCard({ category }: { category: Category }) {
  return (
    <motion.div whileHover={cardHover} className="h-full">
      <Link
        to={`${paths.services}${toSearchString({ category: category.slug })}`}
        className="group flex h-full flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-card-hover"
      >
        <span className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <CategoryIcon name={category.icon} className="size-5" />
        </span>
        <span className="font-semibold text-text">{category.name}</span>
      </Link>
    </motion.div>
  )
}
```

`src/components/domain/SearchBar.tsx`:

```tsx
import { MapPin, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export interface SearchValues {
  q: string
  location: string
}

interface SearchBarProps {
  initialQuery?: string
  initialLocation?: string
  onSearch: (values: SearchValues) => void
  className?: string
}

export function SearchBar({ initialQuery = '', initialLocation = '', onSearch, className }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearch({ q: query.trim(), location: location.trim() })
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        'grid gap-1 rounded-card border border-border bg-surface p-2 shadow-card sm:grid-cols-[1.3fr_1fr_auto] sm:items-center sm:divide-x sm:divide-border',
        className,
      )}
    >
      <Input
        label="Qual serviço você precisa?"
        hideLabel
        variant="bare"
        icon={Search}
        placeholder="Qual serviço você precisa?"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        containerClassName="sm:pr-1"
      />
      <Input
        label="Localização"
        hideLabel
        variant="bare"
        icon={MapPin}
        placeholder="Localização"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        containerClassName="border-t border-border pt-1 sm:border-t-0 sm:px-1 sm:pt-0"
      />
      <div className="sm:pl-2">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <Search className="size-4" aria-hidden />
          Buscar
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: Run tests, typecheck and lint**

Run: `npx vitest run src/components/domain && npx tsc -b && npm run lint`
Expected: PASS; tsc exit 0; no lint errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/domain
git commit -m "feat: add service card, category card and search bar"
```

---

### Task 5.2: Public layout, homepage, 404 and app routing

**Files:**
- Create: `src/layouts/PublicLayout.tsx`, `src/components/domain/HeroVisual.tsx`, `src/pages/HomePage.tsx`, `src/pages/NotFoundPage.tsx`, `src/routes/AppRoutes.tsx`, `src/test/renderApp.tsx`
- Modify: `src/App.tsx`
- Test: `src/pages/HomePage.test.tsx`

**Interfaces:**
- Consumes: layout components (Task 4.2), domain components (Task 5.1), `useCategories`, `useFeaturedServices` (Task 2.5), `AuthProvider` (Task 3.1).
- Produces: `PublicLayout()` (Navbar + `<main id="main-content">` + Footer, `<Outlet />`), `HeroVisual()`, `HomePage()`, `NotFoundPage()`, `AppRoutes()`, `renderApp(entry?: InitialEntry)` test helper. Later tasks add routes to `AppRoutes`.

- [ ] **Step 1: Write the test helper `src/test/renderApp.tsx`**

```tsx
import { render } from '@testing-library/react'
import { MemoryRouter, type InitialEntry } from 'react-router'
import { AuthProvider } from '../contexts/AuthProvider'
import { AppRoutes } from '../routes/AppRoutes'

export function renderApp(entry: InitialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  )
}
```

- [ ] **Step 2: Write the failing test `src/pages/HomePage.test.tsx`**

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

describe('HomePage', () => {
  it('renders hero, categories and featured services', async () => {
    renderApp('/')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Encontre o serviço agrícola certo para sua propriedade.' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Plantio' })).toHaveAttribute('href', '/servicos?category=plantio')
    expect(await screen.findByRole('heading', { name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(4)
  })

  it('has navigation to the other areas', () => {
    renderApp('/')
    const mainNav = screen.getByRole('navigation', { name: 'Principal' })
    expect(mainNav).toHaveTextContent('Serviços')
    expect(screen.getByRole('link', { name: 'Encontrar serviços' })).toHaveAttribute('href', '/servicos')
    expect(screen.getByRole('link', { name: 'Acessar meu painel' })).toHaveAttribute('href', '/dashboard')
  })

  it('searches from the hero search bar', async () => {
    renderApp('/')
    await userEvent.type(screen.getByLabelText('Qual serviço você precisa?'), 'colheita')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument()
  })

  it('shows the 404 page for unknown routes', () => {
    renderApp('/rota-inexistente')
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument()
  })
})
```

The third test temporarily expects the 404 because `/servicos` does not exist yet; Task 5.3 changes this assertion.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/pages/HomePage.test.tsx`
Expected: FAIL — cannot resolve `../routes/AppRoutes`.

- [ ] **Step 4: Write `src/layouts/PublicLayout.tsx`**

```tsx
import { motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router'
import { Footer } from '../components/layout/Footer'
import { Navbar } from '../components/layout/Navbar'
import { SkipLink } from '../components/layout/SkipLink'
import { pageTransition } from '../utils/motion'

export function PublicLayout() {
  const location = useLocation()
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <SkipLink />
      <Navbar />
      <motion.main id="main-content" key={location.pathname} {...pageTransition} className="flex-1">
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}
```

- [ ] **Step 5: Write `src/components/domain/HeroVisual.tsx`**

```tsx
import { motion } from 'framer-motion'
import { MapPin, SprayCan, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import heroImage from '../../assets/images/hero-field.jpg'
import { cn } from '../../utils/cn'

const areaBars = [42, 58, 50, 72, 64, 88]

function FloatingCard({ delay, className, children }: { delay: number; className: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'absolute flex items-center gap-3 rounded-card border border-border bg-surface/95 p-3 pr-4 shadow-card-hover backdrop-blur',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export function HeroVisual() {
  return (
    <div className="relative" aria-hidden>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-card border border-border bg-surface-muted shadow-card"
      >
        <img src={heroImage} alt="" className="aspect-[4/3] w-full object-cover lg:aspect-[4/5]" />
      </motion.div>

      <FloatingCard delay={0.25} className="top-4 left-3 sm:-left-6">
        <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
          <SprayCan className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text">Pulverização Agrícola</p>
          <p className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="size-1.5 rounded-full bg-primary" />
            Disponível hoje
          </p>
        </div>
      </FloatingCard>

      <FloatingCard delay={0.35} className="top-1/2 right-3 hidden sm:-right-6 sm:flex">
        <span className="grid size-10 place-items-center rounded-lg bg-warning/10 text-warning">
          <Star className="size-5 fill-current" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text tabular-nums">4,9 de 5</p>
          <p className="text-xs text-text-muted">128 serviços avaliados</p>
        </div>
      </FloatingCard>

      <FloatingCard delay={0.45} className="bottom-4 left-3 sm:-left-6">
        <div>
          <p className="text-xs text-text-muted">Área atendida no mês</p>
          <p className="text-lg font-bold text-text tabular-nums">1.240 ha</p>
        </div>
        <div className="flex h-10 items-end gap-1">
          {areaBars.map((height, index) => (
            <span
              key={index}
              className={cn('w-2 rounded-sm', index === areaBars.length - 1 ? 'bg-primary' : 'bg-primary-light/60')}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </FloatingCard>

      <FloatingCard delay={0.55} className="right-3 bottom-4 hidden sm:-right-4 md:flex">
        <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
          <MapPin className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text">Santa Helena - PR</p>
          <p className="text-xs text-text-muted">12 prestadores próximos</p>
        </div>
      </FloatingCard>
    </div>
  )
}
```

- [ ] **Step 6: Write `src/pages/HomePage.tsx`**

```tsx
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
```

- [ ] **Step 7: Write `src/pages/NotFoundPage.tsx`**

```tsx
import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { Container } from '../components/layout/Container'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'

export function NotFoundPage() {
  usePageTitle('Página não encontrada')
  return (
    <Container className="py-20">
      <EmptyState
        icon={Compass}
        titleAs="h1"
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi alterado."
        action={
          <Link to={paths.home} className={buttonClasses('primary', 'md')}>
            Voltar para o início
          </Link>
        }
      />
    </Container>
  )
}
```

- [ ] **Step 8: Write `src/routes/AppRoutes.tsx`**

```tsx
import { Route, Routes } from 'react-router'
import { PublicLayout } from '../layouts/PublicLayout'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 9: Replace `src/App.tsx`**

```tsx
import { MotionConfig } from 'framer-motion'
import { BrowserRouter } from 'react-router'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { AuthProvider } from './contexts/AuthProvider'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ScrollToTop />
          <AppRoutes />
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  )
}
```

- [ ] **Step 10: Run tests, typecheck, lint and build**

Run: `npx vitest run && npx tsc -b && npm run lint && npm run build`
Expected: all PASS; no errors.

- [ ] **Step 11: Look at it in the browser**

Run `npm run dev` (background) and open `http://localhost:5173/` with Playwright (`browser_navigate`, `browser_take_screenshot`) at 1440px and 375px wide. Compare with `docs/reference/visual-reference.jpeg`: off-white background, white bordered cards, green only on actions/highlights, no horizontal scroll at 375px. Fix spacing issues before committing.

- [ ] **Step 12: Commit**

```bash
git add src/layouts src/pages src/routes/AppRoutes.tsx src/components/domain/HeroVisual.tsx src/test/renderApp.tsx src/App.tsx
git commit -m "feat: add public layout and homepage"
```

---

### Task 5.3: Services listing page

**Files:**
- Create: `src/pages/ServicesPage.tsx`
- Modify: `src/routes/AppRoutes.tsx`, `src/pages/HomePage.test.tsx` (third test)
- Test: `src/pages/ServicesPage.test.tsx`

**Interfaces:**
- Consumes: `useServices`, `useCategories` (Task 2.5), `SearchBar`, `ServiceCard`, `ServiceCardSkeleton`, `CategoryIcon` (Task 5.1), `FilterChip`, `Breadcrumbs`, `EmptyState`, `ErrorState`, `Button` (Task 4.1), `formatCount` (Task 1.2).
- Produces: `ServicesPage()` at `/servicos`, reading/writing `q`, `location`, `category` search params.

- [ ] **Step 1: Write the failing test `src/pages/ServicesPage.test.tsx`**

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

describe('ServicesPage', () => {
  it('lists the first page and loads more', async () => {
    renderApp('/servicos')
    expect(screen.getByRole('heading', { level: 1, name: 'Encontre serviços agrícolas' })).toBeInTheDocument()
    expect(await screen.findByText('Encontramos 12 serviços')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(9)
    await userEvent.click(screen.getByRole('button', { name: 'Carregar mais' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(12))
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })

  it('filters by category chip', async () => {
    renderApp('/servicos')
    await userEvent.click(await screen.findByRole('button', { name: 'Pulverização' }))
    expect(await screen.findByText('Encontramos 2 serviços')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pulverização' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('reads filters from the URL', async () => {
    renderApp('/servicos?q=colheita&location=cascavel')
    expect(await screen.findByText('Encontramos 1 serviço')).toBeInTheDocument()
    expect(screen.getByLabelText('Qual serviço você precisa?')).toHaveValue('colheita')
  })

  it('shows the empty state and clears filters', async () => {
    renderApp('/servicos?q=xyzabc')
    expect(await screen.findByText('Não encontramos serviços para essa busca.')).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0])
    expect(await screen.findByText('Encontramos 12 serviços')).toBeInTheDocument()
    expect(screen.getByLabelText('Qual serviço você precisa?')).toHaveValue('')
  })

  it('shows the empty state for an unknown category', async () => {
    renderApp('/servicos?category=inexistente')
    expect(await screen.findByText('Não encontramos serviços para essa busca.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Update the third test in `src/pages/HomePage.test.tsx`**

Replace the `searches from the hero search bar` test with:

```tsx
  it('searches from the hero search bar', async () => {
    renderApp('/')
    await userEvent.type(screen.getByLabelText('Qual serviço você precisa?'), 'colheita')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Encontre serviços agrícolas' })).toBeInTheDocument()
    expect(await screen.findByText('Encontramos 2 serviços')).toBeInTheDocument()
  })
```

`colheita` matches "Colheita de Soja e Milho" and "Manutenção de Colheitadeiras".

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/pages`
Expected: FAIL — `ServicesPage` missing, `/servicos` renders the 404.

- [ ] **Step 4: Write `src/pages/ServicesPage.tsx`**

```tsx
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
        className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
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
```

- [ ] **Step 5: Add the route to `src/routes/AppRoutes.tsx`**

```tsx
import { Route, Routes } from 'react-router'
import { PublicLayout } from '../layouts/PublicLayout'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ServicesPage } from '../pages/ServicesPage'
import { paths } from './paths'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.services} element={<ServicesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 6: Run tests, typecheck and lint**

Run: `npx vitest run && npx tsc -b && npm run lint`
Expected: all PASS.

- [ ] **Step 7: Check it in the browser**

With `npm run dev` running, open `http://localhost:5173/servicos` in Playwright at 1440px and 375px. Click a category chip, search "pulverizacao", search "xyz" (empty state), click "Limpar filtros", open `/servicos?mockError=1` (error state with "Tentar novamente"). Confirm no horizontal page scroll at 375px (chips scroll inside their row).

- [ ] **Step 8: Commit**

```bash
git add src/pages/ServicesPage.tsx src/pages/ServicesPage.test.tsx src/pages/HomePage.test.tsx src/routes/AppRoutes.tsx
git commit -m "feat: add services listing with URL-synced filters and load more"
```

---

### Task 5.4: Service detail page

**Files:**
- Create: `src/pages/ServiceDetailPage.tsx`
- Modify: `src/routes/AppRoutes.tsx`
- Test: `src/pages/ServiceDetailPage.test.tsx`

**Interfaces:**
- Consumes: `useService` (Task 2.5), `useAuth` (Task 3.1), `isApiError` (Task 2.2), `routePatterns`, `LoginLocationState` (Task 3.2), UI kit and domain components.
- Produces: `ServiceDetailPage()` at `/servicos/:id`. The CTA "Entrar para contratar" links to `/login` with state `{ from: { pathname, search } }` (no `reason`), so Phase 6 login returns here.

- [ ] **Step 1: Write the failing test `src/pages/ServiceDetailPage.test.tsx`**

```tsx
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'

describe('ServiceDetailPage', () => {
  it('shows the service, provider and price', async () => {
    renderApp('/servicos/svc-1')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(screen.getByText('Agro Máquinas Paraná')).toBeInTheDocument()
    expect(screen.getByText(/R\$\s180\/h/)).toBeInTheDocument()
    expect(screen.getByText('12 anos')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Trilha de navegação' })).toHaveTextContent('Serviços')
  })

  it('offers login to visitors', async () => {
    renderApp('/servicos/svc-1')
    expect(await screen.findByRole('link', { name: 'Entrar para contratar' })).toHaveAttribute('href', '/login')
  })

  it('shows a not found state for unknown ids', async () => {
    renderApp('/servicos/nao-existe')
    expect(await screen.findByRole('heading', { level: 1, name: 'Serviço não encontrado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver serviços' })).toHaveAttribute('href', '/servicos')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/ServiceDetailPage.test.tsx`
Expected: FAIL — page missing.

- [ ] **Step 3: Write `src/pages/ServiceDetailPage.tsx`**

```tsx
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
```

- [ ] **Step 4: Add the route to `src/routes/AppRoutes.tsx`**

```tsx
import { Route, Routes } from 'react-router'
import { PublicLayout } from '../layouts/PublicLayout'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { ServicesPage } from '../pages/ServicesPage'
import { paths, routePatterns } from './paths'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.services} element={<ServicesPage />} />
        <Route path={routePatterns.serviceDetail} element={<ServiceDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 5: Run tests, typecheck and lint**

Run: `npx vitest run && npx tsc -b && npm run lint`
Expected: all PASS.

- [ ] **Step 6: Check it in the browser**

Open `/servicos/svc-1`, `/servicos/svc-4` (unavailable) and `/servicos/nao-existe` with Playwright at 1440px and 375px. From `/servicos`, click "Ver detalhes" on a card and confirm the page scrolls to the top.

- [ ] **Step 7: Commit**

```bash
git add src/pages/ServiceDetailPage.tsx src/pages/ServiceDetailPage.test.tsx src/routes/AppRoutes.tsx
git commit -m "feat: add service detail page with provider summary"
```
