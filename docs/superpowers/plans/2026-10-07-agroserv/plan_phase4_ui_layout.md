# Phase 4 — UI kit and layout components

> Part of `plan_index.md`. Read its Global Constraints first. Depends on Phases 1–3.

Visual rules (from the spec, matching `docs/reference/visual-reference.jpeg`): off-white page, white cards with 1px border and almost no shadow, 10px card radius, 8px inputs/buttons, green only for primary actions, active items, "Disponível" and focus.

### Task 4.1: UI primitives

**Files:**
- Create: `src/components/ui/buttonClasses.ts`, `Button.tsx`, `Input.tsx`, `Badge.tsx`, `StatusBadge.tsx`, `Rating.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Alert.tsx`, `Avatar.tsx`, `FilterChip.tsx`, `SectionHeader.tsx`, `Breadcrumbs.tsx` (all in `src/components/ui/`)
- Test: `src/components/ui/ui.test.tsx`

**Interfaces:**
- Consumes: `cn`, `formatRating`, `getInitials` (Task 1.2), `requestStatusLabels` (Task 1.2).
- Produces:
  - `type ButtonVariant = 'primary' | 'secondary' | 'ghost'`, `type ButtonSize = 'sm' | 'md' | 'lg'`, `buttonClasses(variant?, size?, className?): string`
  - `Button(props: ButtonHTMLAttributes & { variant?; size?; isLoading?: boolean })`
  - `Input(props: InputHTMLAttributes & { label: string; error?: string; icon?: LucideIcon; hideLabel?: boolean; variant?: 'default' | 'bare'; trailing?: ReactNode; containerClassName?: string })`
  - `type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'`, `Badge({ tone?, className?, children })`
  - `StatusBadge({ status: RequestStatus })`
  - `Rating({ value: number; count?: number })`
  - `Skeleton({ className? })`
  - `EmptyState({ icon: LucideIcon; title; description?; action?: ReactNode; tone?: 'neutral' | 'danger'; role?: 'alert' | 'status'; titleAs?: 'h1' | 'h2' | 'h3' })`
  - `ErrorState({ title?; message?; onRetry?: () => void; titleAs? })`
  - `Alert({ tone?: 'info' | 'warning' | 'danger'; children; className? })`
  - `Avatar({ name; src?; size?: 'sm' | 'md' | 'lg'; className? })`
  - `FilterChip(props: ButtonHTMLAttributes & { isActive: boolean })`
  - `SectionHeader({ id; eyebrow?; title; description?; action?: ReactNode })`
  - `Breadcrumbs({ items: { label: string; to?: string }[] })`

- [ ] **Step 1: Write the failing test `src/components/ui/ui.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Inbox } from 'lucide-react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Alert } from './Alert'
import { Breadcrumbs } from './Breadcrumbs'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { FilterChip } from './FilterChip'
import { Input } from './Input'
import { Rating } from './Rating'
import { StatusBadge } from './StatusBadge'

describe('UI primitives', () => {
  it('disables the button while loading', () => {
    render(<Button isLoading>Entrar</Button>)
    const button = screen.getByRole('button', { name: 'Entrar' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('links the input label and error message', () => {
    render(<Input label="E-mail" error="Informe seu e-mail." />)
    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Informe seu e-mail.')
  })

  it('renders status labels in Portuguese', () => {
    render(<StatusBadge status="in_progress" />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('gives the rating an accessible name', () => {
    render(<Rating value={4.9} count={128} />)
    expect(screen.getByRole('img', { name: 'Avaliação 4,9 de 5, 128 avaliações' })).toBeInTheDocument()
  })

  it('renders empty state with action', () => {
    render(<EmptyState icon={Inbox} title="Nada aqui" description="Tente outra busca." action={<button>Limpar</button>} />)
    expect(screen.getByRole('heading', { name: 'Nada aqui' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument()
  })

  it('calls onRetry from the error state', async () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('exposes pressed state on filter chips', () => {
    render(<FilterChip isActive>Todas</FilterChip>)
    expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses alert role for danger alerts', () => {
    render(<Alert tone="danger">Falhou</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou')
  })

  it('marks the last breadcrumb as current page', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Serviços' }]} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/')
    expect(screen.getByText('Serviços')).toHaveAttribute('aria-current', 'page')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `buttonClasses.ts` and `Button.tsx`**

`src/components/ui/buttonClasses.ts`:

```ts
import { cn } from '../../utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-strong',
  secondary: 'border border-border bg-surface text-text hover:border-text-muted/40 hover:bg-surface-muted',
  ghost: 'text-text-muted hover:bg-surface-muted hover:text-text',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )
}
```

`src/components/ui/Button.tsx`:

```tsx
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonClasses'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Write `Input.tsx`**

```tsx
import type { LucideIcon } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: LucideIcon
  hideLabel?: boolean
  variant?: 'default' | 'bare'
  trailing?: ReactNode
  containerClassName?: string
}

export function Input({
  label,
  error,
  icon: Icon,
  hideLabel = false,
  variant = 'default',
  trailing,
  containerClassName,
  id,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  return (
    <div className={containerClassName}>
      <label htmlFor={inputId} className={cn('mb-1.5 block text-sm font-medium text-text', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
        )}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-11 w-full rounded-lg px-3 text-[15px] text-text transition-[border-color,box-shadow] placeholder:text-text-muted/80 focus:outline-none focus-visible:outline-none',
            variant === 'default'
              ? 'border border-border bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20'
              : 'border border-transparent bg-transparent focus:bg-surface-muted/60',
            Icon && 'pl-10',
            trailing && 'pr-11',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className,
          )}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Write `Badge.tsx`, `StatusBadge.tsx`, `Rating.tsx`, `Skeleton.tsx`**

`src/components/ui/Badge.tsx`:

```tsx
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-primary-strong/10 text-primary-strong',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
}

interface BadgeProps {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
```

`src/components/ui/StatusBadge.tsx`:

```tsx
import type { RequestStatus } from '../../types/entities'
import { requestStatusLabels } from '../../utils/requestStatus'
import { Badge, type BadgeTone } from './Badge'

const statusTones: Record<RequestStatus, BadgeTone> = {
  pending: 'warning',
  accepted: 'primary',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge tone={statusTones[status]}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {requestStatusLabels[status]}
    </Badge>
  )
}
```

`src/components/ui/Rating.tsx`:

```tsx
import { Star } from 'lucide-react'
import { formatRating } from '../../utils/format'

interface RatingProps {
  value: number
  count?: number
}

export function Rating({ value, count }: RatingProps) {
  const label = `Avaliação ${formatRating(value)} de 5${count === undefined ? '' : `, ${count} avaliações`}`
  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-1 text-sm">
      <Star className="size-4 fill-warning text-warning" aria-hidden />
      <span className="font-semibold text-text">{formatRating(value)}</span>
      {count !== undefined && <span className="text-text-muted">({count})</span>}
    </span>
  )
}
```

`src/components/ui/Skeleton.tsx`:

```tsx
import { cn } from '../../utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-surface-muted', className)} aria-hidden />
}
```

- [ ] **Step 6: Write `EmptyState.tsx`, `ErrorState.tsx`, `Alert.tsx`**

`src/components/ui/EmptyState.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  tone?: 'neutral' | 'danger'
  role?: 'alert' | 'status'
  titleAs?: 'h1' | 'h2' | 'h3'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = 'neutral',
  role,
  titleAs: Heading = 'h3',
}: EmptyStateProps) {
  return (
    <div
      role={role}
      className="flex flex-col items-center rounded-card border border-dashed border-border bg-surface px-6 py-14 text-center"
    >
      <span
        className={cn(
          'grid size-12 place-items-center rounded-full',
          tone === 'danger' ? 'bg-danger/10 text-danger' : 'bg-primary-soft text-primary',
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <Heading className="mt-4 text-lg font-semibold text-text">{title}</Heading>
      {description && <p className="mt-1 max-w-md text-sm text-text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
```

`src/components/ui/ErrorState.tsx`:

```tsx
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  titleAs?: 'h1' | 'h2' | 'h3'
}

export function ErrorState({
  title = 'Algo deu errado',
  message = 'Não foi possível carregar as informações.',
  onRetry,
  titleAs,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      tone="danger"
      role="alert"
      title={title}
      description={message}
      titleAs={titleAs}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden />
            Tentar novamente
          </Button>
        )
      }
    />
  )
}
```

`src/components/ui/Alert.tsx`:

```tsx
import { AlertCircle, Info, LockKeyhole } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type AlertTone = 'info' | 'warning' | 'danger'

const toneStyles: Record<AlertTone, { className: string; icon: typeof Info }> = {
  info: { className: 'border-info/20 bg-info/5 text-info', icon: Info },
  warning: { className: 'border-warning/25 bg-warning/5 text-warning', icon: LockKeyhole },
  danger: { className: 'border-danger/20 bg-danger/5 text-danger', icon: AlertCircle },
}

interface AlertProps {
  tone?: AlertTone
  className?: string
  children: ReactNode
}

export function Alert({ tone = 'info', className, children }: AlertProps) {
  const { className: toneClassName, icon: Icon } = toneStyles[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium', toneClassName, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
```

- [ ] **Step 7: Write `Avatar.tsx`, `FilterChip.tsx`, `SectionHeader.tsx`, `Breadcrumbs.tsx`**

`src/components/ui/Avatar.tsx`:

```tsx
import { cn } from '../../utils/cn'
import { getInitials } from '../../utils/format'

type AvatarSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
}

interface AvatarProps {
  name: string
  src?: string
  size?: AvatarSize
  className?: string
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const classes = cn(
    'inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary',
    sizeClasses[size],
    className,
  )
  if (src) return <img src={src} alt={name} className={cn(classes, 'object-cover')} />
  return (
    <span className={classes} aria-hidden>
      {getInitials(name)}
    </span>
  )
}
```

`src/components/ui/FilterChip.tsx`:

```tsx
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean
}

export function FilterChip({ isActive, className, children, type = 'button', ...rest }: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={isActive}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors',
        isActive
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-text',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
```

`src/components/ui/SectionHeader.tsx`:

```tsx
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  id: string
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({ id, eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">{eyebrow}</p>}
        <h2 id={id} className="mt-2 text-[26px]/[34px] font-bold tracking-[-0.01em] text-text sm:text-3xl/[38px]">
          {title}
        </h2>
        {description && <p className="mt-2 text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}
```

`src/components/ui/Breadcrumbs.tsx`:

```tsx
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

interface BreadcrumbItem {
  label: string
  to?: string
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-text-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
            {item.to ? (
              <Link to={item.to} className="transition-colors hover:text-text">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="max-w-[16rem] truncate font-medium text-text">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
```

- [ ] **Step 8: Run tests, typecheck and lint**

Run: `npx vitest run src/components/ui && npx tsc -b && npm run lint`
Expected: PASS; tsc exit 0; no lint errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/ui
git commit -m "feat: add accessible UI primitives"
```

---

### Task 4.2: Layout components

**Files:**
- Create: `src/components/layout/Container.tsx`, `Logo.tsx`, `SkipLink.tsx`, `ScrollToTop.tsx`, `Navbar.tsx`, `Footer.tsx`, `Sidebar.tsx` (all in `src/components/layout/`)
- Create: `src/hooks/usePageTitle.ts`
- Modify: `src/test/setup.ts` (stub `window.scrollTo` and `IntersectionObserver`)
- Test: `src/components/layout/layout.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 3.1), `paths` (Task 3.2), `buttonClasses`, `Avatar` (Task 4.1).
- Produces: `Container({ className?, children })`, `Logo({ tone?: 'default' | 'light'; className? })`, `SkipLink()`, `ScrollToTop()`, `Navbar()`, `Footer()`, `Sidebar({ onLogout: () => void })`, `usePageTitle(title: string)`.

- [ ] **Step 1: Update `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

class IntersectionObserverStub {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

afterEach(() => {
  cleanup()
  localStorage.clear()
})
```

- [ ] **Step 2: Write the failing test `src/components/layout/layout.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { AuthContextValue } from '../../contexts/AuthContext'
import { useAuth } from '../../hooks/useAuth'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

function mockAuth(overrides: Partial<AuthContextValue>) {
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  })
}

describe('Navbar', () => {
  it('shows the login link for visitors', () => {
    mockAuth({})
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Serviços' })).toHaveAttribute('href', '/servicos')
    expect(screen.queryByRole('link', { name: 'Meu painel' })).not.toBeInTheDocument()
  })

  it('shows the dashboard link and logout for authenticated users', async () => {
    const logout = vi.fn()
    mockAuth({
      isAuthenticated: true,
      logout,
      user: { id: 'usr-1', name: 'Carlos Souza', email: 'a@b.c', role: 'producer', city: 'X', state: 'PR' },
    })
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Meu painel' })).toHaveAttribute('href', '/dashboard')
    await userEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('toggles the mobile menu', async () => {
    mockAuth({})
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )
    const toggle = screen.getByRole('button', { name: 'Abrir menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Menu móvel' })).toBeInTheDocument()
  })
})

describe('Sidebar', () => {
  it('lists private links and calls onLogout', async () => {
    const onLogout = vi.fn()
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar onLogout={onLogout} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Solicitações' })).toHaveAttribute('href', '/solicitacoes')
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/layout`
Expected: FAIL — modules not found.

- [ ] **Step 4: Write `Container.tsx`, `Logo.tsx`, `SkipLink.tsx`, `ScrollToTop.tsx`, `usePageTitle.ts`**

`src/components/layout/Container.tsx`:

```tsx
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
}
```

`src/components/layout/Logo.tsx`:

```tsx
import { Sprout } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import { cn } from '../../utils/cn'

interface LogoProps {
  tone?: 'default' | 'light'
  className?: string
}

export function Logo({ tone = 'default', className }: LogoProps) {
  const isLight = tone === 'light'
  return (
    <Link to={paths.home} aria-label="AgroServ, página inicial" className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid size-9 place-items-center rounded-lg',
          isLight ? 'bg-white/15 text-white' : 'bg-primary text-white',
        )}
      >
        <Sprout className="size-5" aria-hidden />
      </span>
      <span className={cn('text-[17px] font-extrabold tracking-[0.08em]', isLight ? 'text-white' : 'text-primary-strong')}>
        AGROSERV
      </span>
    </Link>
  )
}
```

`src/components/layout/SkipLink.tsx`:

```tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
    >
      Pular para o conteúdo
    </a>
  )
}
```

`src/components/layout/ScrollToTop.tsx`:

```tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router'

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
```

`src/hooks/usePageTitle.ts`:

```ts
import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · AgroServ`
  }, [title])
}
```

- [ ] **Step 5: Write `Navbar.tsx`**

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { paths } from '../../routes/paths'
import { cn } from '../../utils/cn'
import { Avatar } from '../ui/Avatar'
import { buttonClasses } from '../ui/buttonClasses'
import { Container } from './Container'
import { Logo } from './Logo'

const navItems = [
  { label: 'Início', to: paths.home, end: true },
  { label: 'Serviços', to: paths.services, end: false },
  { label: 'Painel', to: paths.dashboard, end: false },
]

function navLinkClasses({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-primary' : 'text-text-muted hover:text-text',
  )
}

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function closeMenu() {
    setIsMenuOpen(false)
  }

  function handleLogout() {
    closeMenu()
    logout()
    navigate(paths.home)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-200',
        isScrolled || isMenuOpen ? 'border-border bg-bg/80 backdrop-blur-md' : 'border-transparent bg-bg',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={navLinkClasses}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <>
              <Link to={paths.dashboard} className={buttonClasses('primary', 'sm')}>
                Meu painel
              </Link>
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sair da conta"
                className="grid size-9 place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </>
          ) : (
            <Link to={paths.login} className={buttonClasses('secondary', 'sm')}>
              Entrar
            </Link>
          )}
        </div>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-lg text-text md:hidden"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </Container>
      <AnimatePresence initial={false}>
        {isMenuOpen && (
          <motion.nav
            id="mobile-menu"
            aria-label="Menu móvel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <Container className="flex flex-col gap-1 py-3">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={closeMenu} className={navLinkClasses}>
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-border pt-3">
                {isAuthenticated ? (
                  <button type="button" onClick={handleLogout} className={buttonClasses('secondary', 'md', 'w-full')}>
                    Sair
                  </button>
                ) : (
                  <Link to={paths.login} onClick={closeMenu} className={buttonClasses('primary', 'md', 'w-full')}>
                    Entrar
                  </Link>
                )}
              </div>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
```

- [ ] **Step 6: Write `Footer.tsx` and `Sidebar.tsx`**

`src/components/layout/Footer.tsx`:

```tsx
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import { Container } from './Container'
import { Logo } from './Logo'

const footerLinks = [
  { label: 'Início', to: paths.home },
  { label: 'Serviços', to: paths.services },
  { label: 'Entrar', to: paths.login },
  { label: 'Painel do produtor', to: paths.dashboard },
]

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm text-text-muted">
            Conectamos produtores rurais a prestadores de serviços agrícolas com mais agilidade e transparência.
          </p>
        </div>
        <nav aria-label="Rodapé">
          <ul className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-text-muted transition-colors hover:text-text">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-border">
        <Container className="py-5 text-xs text-text-muted">© 2026 AgroServ · Projeto acadêmico de desenvolvimento web</Container>
      </div>
    </footer>
  )
}
```

`src/components/layout/Sidebar.tsx`:

```tsx
import { ClipboardList, LayoutDashboard, LogOut, Search } from 'lucide-react'
import { NavLink } from 'react-router'
import { paths } from '../../routes/paths'
import { cn } from '../../utils/cn'
import { Logo } from './Logo'

const sidebarItems = [
  { label: 'Dashboard', to: paths.dashboard, icon: LayoutDashboard },
  { label: 'Solicitações', to: paths.requests, icon: ClipboardList },
  { label: 'Ver serviços', to: paths.services, icon: Search },
]

const itemClasses = 'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'

export function Sidebar({ onLogout }: { onLogout: () => void }) {
  return (
    <aside className="border-b border-border bg-surface lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex h-16 items-center px-4 lg:px-6">
        <Logo />
      </div>
      <nav aria-label="Área do produtor" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:px-3 lg:pt-4 lg:pb-4">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              cn(itemClasses, isActive ? 'bg-primary-soft text-primary' : 'text-text-muted hover:bg-surface-muted hover:text-text')
            }
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className={cn(itemClasses, 'text-text-muted hover:bg-danger/5 hover:text-danger lg:mt-auto')}
        >
          <LogOut className="size-4" aria-hidden />
          Sair
        </button>
      </nav>
    </aside>
  )
}
```

- [ ] **Step 7: Run tests, typecheck and lint**

Run: `npx vitest run && npx tsc -b && npm run lint`
Expected: all tests PASS; tsc exit 0; no lint errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/layout src/hooks/usePageTitle.ts src/test/setup.ts
git commit -m "feat: add navbar, footer, sidebar and layout helpers"
```
