# Phase 6 — Private area and login

> Part of `plan_index.md`. Read its Global Constraints first. Depends on Phases 1–5.

### Task 6.1: Private layout and dashboard

**Files:**
- Create: `src/components/domain/StatsCard.tsx`, `src/components/domain/RequestsTable.tsx`, `src/layouts/PrivateLayout.tsx`, `src/pages/DashboardPage.tsx`, `src/test/session.ts`
- Modify: `src/routes/AppRoutes.tsx`
- Test: `src/pages/DashboardPage.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 3.1), `ProtectedRoute`, `paths` (Task 3.2), `Sidebar`, `SkipLink` (Task 4.2), `useDashboard` (Task 2.5), UI kit (Task 4.1).
- Produces:
  - `StatsCard({ label: string; value: string; description: string; icon: LucideIcon })` — renders `<article>` with `<h3>{label}</h3>`
  - `RequestsTable({ requests: ServiceRequest[]; caption: string; showLocation?: boolean })` — `<table>` (md+) and card list (mobile); `RequestsTableSkeleton()`
  - `PrivateLayout()` — Sidebar + header + `<main id="main-content">` + `<Outlet />`; logout navigates to `/`
  - `DashboardPage()` at `/dashboard`
  - `signInAsDemoProducer()` test helper

- [ ] **Step 1: Write the test helper `src/test/session.ts`**

```ts
import { users } from '../data/users'
import { saveSession } from '../utils/storage'

export function signInAsDemoProducer() {
  saveSession('mock.usr-1', users[0])
}
```

- [ ] **Step 2: Write the failing test `src/pages/DashboardPage.test.tsx`**

```tsx
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'

describe('DashboardPage', () => {
  it('shows greeting, stats and recent requests', async () => {
    signInAsDemoProducer()
    renderApp('/dashboard')
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
    expect(await screen.findByText(/R\$\s10\.260/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Solicitações abertas' }).closest('article')).toHaveTextContent('3')
    expect(screen.getByRole('heading', { name: 'Em andamento' }).closest('article')).toHaveTextContent('1')
    const table = screen.getByRole('table', { name: 'Solicitações recentes' })
    expect(within(table).getAllByRole('row')).toHaveLength(6)
    expect(within(table).getByRole('link', { name: 'Pulverização com Drone' })).toHaveAttribute('href', '/servicos/svc-10')
  })

  it('logs out to the homepage', async () => {
    signInAsDemoProducer()
    renderApp('/dashboard')
    await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Encontre o serviço agrícola certo para sua propriedade.' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Faça login para acessar esta área.')).not.toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBeNull()
  })

  it('recovers the user from the token when the stored profile is missing', async () => {
    localStorage.setItem('agroserv_token', 'mock.usr-1')
    renderApp('/dashboard')
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/pages/DashboardPage.test.tsx`
Expected: FAIL — `/dashboard` renders the 404 page.

- [ ] **Step 4: Write `src/components/domain/StatsCard.tsx`**

```tsx
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string
  description: string
  icon: LucideIcon
}

export function StatsCard({ label, value, description, icon: Icon }: StatsCardProps) {
  return (
    <article className="h-full rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-text-muted">{label}</h3>
        <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-[-0.01em] text-text tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{description}</p>
    </article>
  )
}
```

- [ ] **Step 5: Write `src/components/domain/RequestsTable.tsx`**

```tsx
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import type { ServiceRequest } from '../../types/entities'
import { formatCurrency, formatDate } from '../../utils/format'
import { Skeleton } from '../ui/Skeleton'
import { StatusBadge } from '../ui/StatusBadge'

interface RequestsTableProps {
  requests: ServiceRequest[]
  caption: string
  showLocation?: boolean
}

const cellClasses = 'px-5 py-4'

export function RequestsTable({ requests, caption, showLocation = false }: RequestsTableProps) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-card border border-border bg-surface shadow-card md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-border bg-surface-muted/60 text-xs font-semibold tracking-[0.06em] text-text-muted uppercase">
            <tr>
              <th scope="col" className="px-5 py-3">Serviço</th>
              <th scope="col" className="px-5 py-3">Prestador</th>
              <th scope="col" className="px-5 py-3">Data</th>
              {showLocation && <th scope="col" className="px-5 py-3">Local</th>}
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((request) => (
              <tr key={request.id} className="transition-colors hover:bg-surface-muted/50">
                <td className={cellClasses}>
                  <Link to={paths.serviceDetail(request.serviceId)} className="font-semibold text-text hover:text-primary">
                    {request.serviceTitle}
                  </Link>
                </td>
                <td className={`${cellClasses} text-text-muted`}>{request.providerName}</td>
                <td className={`${cellClasses} text-text-muted tabular-nums`}>{formatDate(request.scheduledDate)}</td>
                {showLocation && <td className={`${cellClasses} text-text-muted`}>{request.location}</td>}
                <td className={cellClasses}>
                  <StatusBadge status={request.status} />
                </td>
                <td className={`${cellClasses} text-right font-semibold text-text tabular-nums`}>
                  {formatCurrency(request.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={caption} className="space-y-3 md:hidden">
        {requests.map((request) => (
          <li key={request.id} className="rounded-card border border-border bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <Link to={paths.serviceDetail(request.serviceId)} className="font-semibold text-text hover:text-primary">
                {request.serviceTitle}
              </Link>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-1 text-sm text-text-muted">{request.providerName}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-text-muted">Data</dt>
                <dd className="tabular-nums">{formatDate(request.scheduledDate)}</dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-text-muted">Valor</dt>
                <dd className="font-semibold tabular-nums">{formatCurrency(request.value)}</dd>
              </div>
              {showLocation && (
                <div className="col-span-2">
                  <dt className="text-xs text-text-muted">Local</dt>
                  <dd>{request.location}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

export function RequestsTableSkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Carregando solicitações…</span>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-16 rounded-card" />
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Write `src/layouts/PrivateLayout.tsx`**

```tsx
import { motion } from 'framer-motion'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Sidebar } from '../components/layout/Sidebar'
import { SkipLink } from '../components/layout/SkipLink'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../hooks/useAuth'
import { paths } from '../routes/paths'
import { formatLocation } from '../utils/format'
import { pageTransition } from '../utils/motion'

export function PrivateLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate(paths.home, { replace: true })
  }

  return (
    <div className="min-h-dvh bg-bg lg:pl-64">
      <SkipLink />
      <Sidebar onLogout={handleLogout} />
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-text-muted">Painel do produtor</p>
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-semibold text-text">{user.name}</p>
                <p className="text-xs text-text-muted">{formatLocation(user.city, user.state)}</p>
              </div>
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            </div>
          )}
        </header>
        <motion.main
          id="main-content"
          key={location.pathname}
          {...pageTransition}
          className="flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
        >
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Write `src/pages/DashboardPage.tsx`**

```tsx
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, ClipboardList, Inbox, Search, Timer, Wallet, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { RequestsTable, RequestsTableSkeleton } from '../components/domain/RequestsTable'
import { StatsCard } from '../components/domain/StatsCard'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { useDashboard } from '../hooks/useRequests'
import { paths } from '../routes/paths'
import type { ProducerDashboardStats } from '../types/api'
import { formatCurrency, getFirstName } from '../utils/format'
import { fadeUp, staggerContainer } from '../utils/motion'

interface StatItem {
  label: string
  value: string
  description: string
  icon: LucideIcon
}

function buildStatItems(stats: ProducerDashboardStats): StatItem[] {
  return [
    { label: 'Solicitações abertas', value: String(stats.open), description: 'Pendentes ou aceitas', icon: ClipboardList },
    { label: 'Em andamento', value: String(stats.inProgress), description: 'Serviços em execução', icon: Timer },
    { label: 'Concluídos', value: String(stats.completed), description: 'Finalizados com sucesso', icon: CheckCircle2 },
    {
      label: 'Total contratado',
      value: formatCurrency(stats.totalSpent),
      description: 'Aceitos, em andamento e concluídos',
      icon: Wallet,
    },
  ]
}

export function DashboardPage() {
  usePageTitle('Dashboard')
  const { user } = useAuth()
  const { data, error, refetch } = useDashboard()

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">
            Olá, {user ? getFirstName(user.name) : 'produtor'}
          </h1>
          <p className="mt-1 text-text-muted">Acompanhe suas solicitações e serviços contratados.</p>
        </div>
        <Link to={paths.services} className={buttonClasses('primary', 'md', 'self-start sm:self-auto')}>
          <Search className="size-4" aria-hidden />
          Buscar serviços
        </Link>
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <>
          <section aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="sr-only">
              Resumo
            </h2>
            {data ? (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                {buildStatItems(data.stats).map((item) => (
                  <motion.div key={item.label} variants={fadeUp}>
                    <StatsCard {...item} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <span className="sr-only">Carregando resumo…</span>
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-32 rounded-card" />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="recent-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="recent-heading" className="text-xl font-semibold text-text">
                Solicitações recentes
              </h2>
              <Link to={paths.requests} className={buttonClasses('ghost', 'sm')}>
                Ver todas
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            {!data ? (
              <RequestsTableSkeleton />
            ) : data.recentRequests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Nenhuma solicitação ainda"
                description="Encontre um serviço e acompanhe tudo por aqui."
                action={
                  <Link to={paths.services} className={buttonClasses('primary', 'md')}>
                    Buscar serviços
                  </Link>
                }
              />
            ) : (
              <RequestsTable requests={data.recentRequests} caption="Solicitações recentes" />
            )}
          </section>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Update `src/routes/AppRoutes.tsx`**

```tsx
import { Route, Routes } from 'react-router'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { ServicesPage } from '../pages/ServicesPage'
import { paths, routePatterns } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.services} element={<ServicesPage />} />
        <Route path={routePatterns.serviceDetail} element={<ServiceDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 9: Run tests, typecheck and lint**

Run: `npx vitest run && npx tsc -b && npm run lint`
Expected: all PASS. If the logout test lands on the login page instead of the homepage, the auth state update rendered before navigation: in `PrivateLayout.handleLogout`, call `navigate(paths.home, { replace: true })` first and `logout()` second, then re-run.

- [ ] **Step 10: Commit**

```bash
git add src/components/domain/StatsCard.tsx src/components/domain/RequestsTable.tsx src/layouts/PrivateLayout.tsx src/pages/DashboardPage.tsx src/pages/DashboardPage.test.tsx src/test/session.ts src/routes/AppRoutes.tsx
git commit -m "feat: add protected producer dashboard with stats and recent requests"
```

---

### Task 6.2: Login page

**Files:**
- Create: `src/utils/validators.ts`, `src/pages/LoginPage.tsx`
- Modify: `src/routes/AppRoutes.tsx`
- Test: `src/utils/validators.test.ts`, `src/pages/LoginPage.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 3.1), `demoAccount` (Task 2.4), `isApiError` (Task 2.2), `LoginLocationState`, `paths` (Task 3.2), `Input`, `Button`, `Alert`, `Badge` (Task 4.1), `Logo` (Task 4.2).
- Produces: `interface LoginFormValues { email: string; password: string }`, `type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>`, `isValidEmail(value)`, `validateLoginForm(values): LoginFormErrors`; `LoginPage()` at `/login`.

- [ ] **Step 1: Write the failing tests**

`src/utils/validators.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isValidEmail, validateLoginForm } from './validators'

describe('validators', () => {
  it('checks email format', () => {
    expect(isValidEmail('produtor@agroserv.com')).toBe(true)
    expect(isValidEmail(' produtor@agroserv.com ')).toBe(true)
    expect(isValidEmail('produtor@agroserv')).toBe(false)
    expect(isValidEmail('abc')).toBe(false)
  })

  it('validates the login form', () => {
    expect(validateLoginForm({ email: '', password: '' })).toEqual({
      email: 'Informe seu e-mail.',
      password: 'Informe sua senha.',
    })
    expect(validateLoginForm({ email: 'abc', password: '1' })).toEqual({ email: 'Informe um e-mail válido.' })
    expect(validateLoginForm({ email: 'produtor@agroserv.com', password: '123456' })).toEqual({})
  })
})
```

`src/pages/LoginPage.test.tsx`:

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'

async function submitLogin(email: string, password: string) {
  if (email) await userEvent.type(screen.getByLabelText('E-mail'), email)
  if (password) await userEvent.type(screen.getByLabelText('Senha'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPage', () => {
  it('redirects visitors from private pages with a warning', async () => {
    renderApp('/dashboard')
    expect(await screen.findByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.getByText('Faça login para acessar esta área.')).toBeInTheDocument()
  })

  it('does not show the warning when opened directly', () => {
    renderApp('/login')
    expect(screen.queryByText('Faça login para acessar esta área.')).not.toBeInTheDocument()
  })

  it('validates required fields and email format', async () => {
    renderApp('/login')
    await submitLogin('', '')
    expect(screen.getByText('Informe seu e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
    await submitLogin('abc', '1')
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
  })

  it('shows the API message for wrong credentials', async () => {
    renderApp('/login')
    await submitLogin('produtor@agroserv.com', 'errada')
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
    expect(localStorage.getItem('agroserv_token')).toBeNull()
  })

  it('logs in with the demo account and opens the dashboard', async () => {
    renderApp('/login')
    await userEvent.click(screen.getByRole('button', { name: 'Usar conta demo' }))
    expect(screen.getByLabelText('E-mail')).toHaveValue('produtor@agroserv.com')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
    expect(localStorage.getItem('agroserv_token')).toBe('mock.usr-1')
  })

  it('returns to the service after logging in from its detail page', async () => {
    renderApp('/servicos/svc-1')
    await userEvent.click(await screen.findByRole('link', { name: 'Entrar para contratar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.queryByText('Faça login para acessar esta área.')).not.toBeInTheDocument()
    await submitLogin('produtor@agroserv.com', '123456')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pulverização Agrícola' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Acompanhar no painel' })).toBeInTheDocument()
  })

  it('toggles password visibility', async () => {
    renderApp('/login')
    const password = screen.getByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(password).toHaveAttribute('type', 'text')
  })

  it('sends authenticated users to the dashboard', async () => {
    signInAsDemoProducer()
    renderApp('/login')
    expect(await screen.findByRole('heading', { level: 1, name: 'Olá, Carlos' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/validators.test.ts src/pages/LoginPage.test.tsx`
Expected: FAIL — `./validators` missing; `/login` renders the 404 page.

- [ ] **Step 3: Write `src/utils/validators.ts`**

```ts
export interface LoginFormValues {
  email: string
  password: string
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function validateLoginForm({ email, password }: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {}
  if (!email.trim()) errors.email = 'Informe seu e-mail.'
  else if (!isValidEmail(email)) errors.email = 'Informe um e-mail válido.'
  if (!password) errors.password = 'Informe sua senha.'
  return errors
}
```

- [ ] **Step 4: Write `src/pages/LoginPage.tsx`**

```tsx
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import loginImage from '../assets/images/login-field.jpg'
import { Logo } from '../components/layout/Logo'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths, type LoginLocationState } from '../routes/paths'
import { isApiError } from '../services/api/apiError'
import { demoAccount } from '../services/authService'
import { validateLoginForm, type LoginFormErrors } from '../utils/validators'

const loginHighlights = [
  { value: '120+', label: 'prestadores' },
  { value: '4,8', label: 'avaliação média' },
  { value: '35', label: 'cidades' },
]

export function LoginPage() {
  usePageTitle('Entrar')
  const { login, isAuthenticated } = useAuth()
  const location = useLocation()
  const state = (location.state ?? null) as LoginLocationState | null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    const redirectTo = state?.from ? `${state.from.pathname}${state.from.search}` : paths.dashboard
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return
    const errors = validateLoginForm({ email, password })
    setFieldErrors(errors)
    setFormError(null)
    if (Object.keys(errors).length > 0) return
    setIsSubmitting(true)
    try {
      await login(email, password)
    } catch (error) {
      setFormError(isApiError(error) ? error.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function fillDemoAccount() {
    if (!demoAccount) return
    setEmail(demoAccount.email)
    setPassword(demoAccount.password)
    setFieldErrors({})
    setFormError(null)
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={loginImage} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-primary-strong/80" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo tone="light" />
          <div className="max-w-md">
            <p className="text-3xl/[40px] font-bold tracking-[-0.01em]">
              Contrate serviços agrícolas com a segurança de quem entende do campo.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-white/20 pt-6">
              {loginHighlights.map((highlight) => (
                <div key={highlight.label} className="flex flex-col-reverse">
                  <dt className="text-xs text-white/70">{highlight.label}</dt>
                  <dd className="text-2xl font-bold tabular-nums">{highlight.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </aside>

      <main id="main-content" className="flex items-center justify-center bg-bg px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Link to={paths.home} className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text">
            <ArrowLeft className="size-4" aria-hidden />
            Voltar para o site
          </Link>
          <h1 className="mt-6 text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Bem-vindo de volta</h1>
          <p className="mt-2 text-text-muted">Entre para acompanhar suas solicitações de serviço.</p>

          {state?.reason === 'protected' && (
            <Alert tone="warning" className="mt-6">
              Faça login para acessar esta área.
            </Alert>
          )}

          <form
            noValidate
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-card border border-border bg-surface p-6 shadow-card"
          >
            {formError && <Alert tone="danger">{formError}</Alert>}
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              icon={Mail}
              placeholder="voce@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldErrors.email}
            />
            <Input
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              icon={Lock}
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className="grid size-9 place-items-center rounded-md text-text-muted transition-colors hover:text-text"
                >
                  {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              }
            />
            <p className="flex items-center justify-end gap-2 text-sm text-text-muted">
              Esqueci minha senha
              <Badge>Em breve</Badge>
            </p>
            <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
              Entrar
            </Button>
            {demoAccount && (
              <>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="h-px flex-1 bg-border" />
                  ou
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Button variant="secondary" size="lg" className="w-full" onClick={fillDemoAccount}>
                  Usar conta demo
                </Button>
                <p className="text-center text-xs text-text-muted">
                  {demoAccount.email} · {demoAccount.password}
                </p>
              </>
            )}
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-text-muted">
            Ainda não tem conta?
            <span className="font-medium text-text">Criar conta</span>
            <Badge>Em breve</Badge>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
```

- [ ] **Step 5: Add the login route to `src/routes/AppRoutes.tsx`**

```tsx
import { Route, Routes } from 'react-router'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { ServicesPage } from '../pages/ServicesPage'
import { paths, routePatterns } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.services} element={<ServicesPage />} />
        <Route path={routePatterns.serviceDetail} element={<ServiceDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path={paths.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 6: Run tests, typecheck and lint**

Run: `npx vitest run && npx tsc -b && npm run lint`
Expected: all PASS.

- [ ] **Step 7: Check it in the browser**

With `npm run dev`, open `/dashboard` logged out (redirect + warning), log in with "Usar conta demo", reload the page (session persists), log out from the sidebar, then open `/login` at 375px (image hidden, card only).

- [ ] **Step 8: Commit**

```bash
git add src/utils/validators.ts src/utils/validators.test.ts src/pages/LoginPage.tsx src/pages/LoginPage.test.tsx src/routes/AppRoutes.tsx
git commit -m "feat: add login page with validation, demo account and return-to redirect"
```

---

### Task 6.3: Requests page

**Files:**
- Create: `src/pages/RequestsPage.tsx`
- Modify: `src/routes/AppRoutes.tsx`
- Test: `src/pages/RequestsPage.test.tsx`

**Interfaces:**
- Consumes: `useRequests` (Task 2.5), `isRequestStatus` (Task 1.2), `RequestsTable`, `RequestsTableSkeleton` (Task 6.1), `FilterChip`, `EmptyState`, `ErrorState`, `Button` (Task 4.1), `formatCount` (Task 1.2).
- Produces: `RequestsPage()` at `/solicitacoes`, status filter in `?status=`.

- [ ] **Step 1: Write the failing test `src/pages/RequestsPage.test.tsx`**

```tsx
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/renderApp'
import { signInAsDemoProducer } from '../test/session'

describe('RequestsPage', () => {
  it('lists all requests and filters by status', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes')
    expect(await screen.findByRole('heading', { level: 1, name: 'Minhas solicitações' })).toBeInTheDocument()
    expect(await screen.findByText('8 solicitações')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Concluídas' }))
    expect(await screen.findByText('3 solicitações')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Concluídas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('reads the status from the URL', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes?status=cancelled')
    expect(await screen.findByText('1 solicitação')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Canceladas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('falls back to all requests for an invalid status', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes?status=invalido')
    expect(await screen.findByText('8 solicitações')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows the location column', async () => {
    signInAsDemoProducer()
    renderApp('/solicitacoes')
    expect(await screen.findByRole('columnheader', { name: 'Local' })).toBeInTheDocument()
  })

  it('returns to the filtered page after login', async () => {
    renderApp('/solicitacoes?status=completed')
    expect(await screen.findByText('Faça login para acessar esta área.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('E-mail'), 'produtor@agroserv.com')
    await userEvent.type(screen.getByLabelText('Senha'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Minhas solicitações' })).toBeInTheDocument()
    expect(await screen.findByText('3 solicitações')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/pages/RequestsPage.test.tsx`
Expected: FAIL — `/solicitacoes` renders the 404 page.

- [ ] **Step 3: Write `src/pages/RequestsPage.tsx`**

```tsx
import { Inbox } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { RequestsTable, RequestsTableSkeleton } from '../components/domain/RequestsTable'
import { Button } from '../components/ui/Button'
import { buttonClasses } from '../components/ui/buttonClasses'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FilterChip } from '../components/ui/FilterChip'
import { usePageTitle } from '../hooks/usePageTitle'
import { useRequests } from '../hooks/useRequests'
import { paths } from '../routes/paths'
import type { RequestStatusFilter } from '../types/api'
import { cn } from '../utils/cn'
import { formatCount } from '../utils/format'
import { isRequestStatus } from '../utils/requestStatus'

const statusFilters: { value: RequestStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'accepted', label: 'Aceitas' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluídas' },
  { value: 'cancelled', label: 'Canceladas' },
]

function parseStatus(value: string | null): RequestStatusFilter {
  return value && isRequestStatus(value) ? value : 'all'
}

export function RequestsPage() {
  usePageTitle('Minhas solicitações')
  const [searchParams, setSearchParams] = useSearchParams()
  const status = parseStatus(searchParams.get('status'))
  const { data, error, isLoading, refetch } = useRequests(status)

  function selectStatus(next: RequestStatusFilter) {
    setSearchParams(next === 'all' ? {} : { status: next })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">Minhas solicitações</h1>
        <p className="mt-1 text-text-muted">Acompanhe o andamento de cada serviço solicitado.</p>
      </div>

      <div role="group" aria-label="Filtrar por status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {statusFilters.map((filter) => (
          <FilterChip key={filter.value} isActive={status === filter.value} onClick={() => selectStatus(filter.value)}>
            {filter.label}
          </FilterChip>
        ))}
      </div>

      {error && !data ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : !data ? (
        <RequestsTableSkeleton />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma solicitação encontrada"
          description={
            status === 'all' ? 'Você ainda não fez nenhuma solicitação.' : 'Não há solicitações com este status no momento.'
          }
          action={
            status === 'all' ? (
              <Link to={paths.services} className={buttonClasses('primary', 'md')}>
                Buscar serviços
              </Link>
            ) : (
              <Button variant="secondary" onClick={() => selectStatus('all')}>
                Ver todas
              </Button>
            )
          }
        />
      ) : (
        <div aria-busy={isLoading} className={cn('transition-opacity', isLoading && 'opacity-60')}>
          <p className="mb-3 text-sm text-text-muted" aria-live="polite">
            {formatCount(data.length, 'solicitação', 'solicitações')}
          </p>
          <RequestsTable requests={data} caption="Lista de solicitações" showLocation />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Add the route to `src/routes/AppRoutes.tsx`**

```tsx
import { Route, Routes } from 'react-router'
import { PrivateLayout } from '../layouts/PrivateLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RequestsPage } from '../pages/RequestsPage'
import { ServiceDetailPage } from '../pages/ServiceDetailPage'
import { ServicesPage } from '../pages/ServicesPage'
import { paths, routePatterns } from './paths'
import { ProtectedRoute } from './ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path={paths.services} element={<ServicesPage />} />
        <Route path={routePatterns.serviceDetail} element={<ServiceDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path={paths.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path={paths.dashboard} element={<DashboardPage />} />
          <Route path={paths.requests} element={<RequestsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 5: Run tests, typecheck and lint**

Run: `npx vitest run && npx tsc -b && npm run lint`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/RequestsPage.tsx src/pages/RequestsPage.test.tsx src/routes/AppRoutes.tsx
git commit -m "feat: add requests page with URL-synced status filter"
```
