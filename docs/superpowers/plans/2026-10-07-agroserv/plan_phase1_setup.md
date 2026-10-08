# Phase 1 — Setup

> Part of `plan_index.md`. Read its Global Constraints first.

### Task 1.1: Scaffold Vite project, Tailwind tokens and test setup

**Files:**
- Create (scaffold): `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Create: `public/favicon.svg`, `src/index.css`, `src/test/setup.ts`
- Delete: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`

**Interfaces:**
- Produces: Tailwind utilities `bg-bg`, `bg-surface`, `bg-surface-muted`, `border-border`, `text-text`, `text-text-muted`, `bg-primary`, `text-primary`, `bg-primary-strong`, `text-primary-strong`, `text-primary-light`, `bg-primary-soft`, `text-warning`, `text-danger`, `text-info`, `shadow-card`, `shadow-card-hover`, `rounded-card`; `npm test` / `npm run test:run` scripts.

- [ ] **Step 1: Scaffold into a temp folder and merge (the project folder already holds `docs/` and `.git/`)**

```bash
cd "/Users/jorgecamargo/Desktop/Mesa - MacBook Air de Jorge/web"
npm create vite@latest agroserv-scaffold -- --template react-ts
rsync -a agroserv-scaffold/ agroserv/
rm -rf agroserv-scaffold
cd agroserv
npm install
```

If create-vite asks to install/start immediately, answer **No**.

- [ ] **Step 2: Install dependencies**

```bash
npm install react-router framer-motion lucide-react @fontsource-variable/manrope
npm install -D tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
npm pkg set scripts.test="vitest" scripts.test:run="vitest run" scripts.typecheck="tsc -b"
```

- [ ] **Step 3: Remove template leftovers**

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

If `src/vite-env.d.ts` exists and contains a `/// <reference ...>` directive, delete the file and make sure `tsconfig.app.json` has `"types": ["vite/client"]` inside `compilerOptions`.

- [ ] **Step 4: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 5: Write `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
```

- [ ] **Step 6: Write `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AgroServ conecta produtores rurais a prestadores de serviços agrícolas." />
    <meta name="theme-color" content="#173F2A" />
    <title>AgroServ — Serviços agrícolas</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Write `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2F6B45"/><path d="M16 25V15m0 0c0-4.4 3.1-7.5 7.5-7.5 0 4.4-3.1 7.5-7.5 7.5Zm0 3c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

- [ ] **Step 8: Write `src/index.css`**

```css
@import 'tailwindcss';
@import '@fontsource-variable/manrope';

@theme {
  --font-sans: 'Manrope Variable', ui-sans-serif, system-ui, sans-serif;
  --color-bg: #f7f8f5;
  --color-surface: #ffffff;
  --color-surface-muted: #eef1ec;
  --color-border: #e4e8e1;
  --color-text: #17201a;
  --color-text-muted: #667085;
  --color-primary: #2f6b45;
  --color-primary-strong: #173f2a;
  --color-primary-light: #7fb685;
  --color-primary-soft: #e6f0e8;
  --color-warning: #b7791f;
  --color-danger: #b42318;
  --color-info: #2b5c8a;
  --shadow-card: 0 1px 2px rgb(16 24 20 / 0.04);
  --shadow-card-hover: 0 12px 28px -14px rgb(16 24 20 / 0.22);
  --radius-card: 10px;
}

@layer base {
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-bg font-sans text-text;
    font-size: 15px;
    line-height: 24px;
  }

  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  button:not(:disabled),
  [role='button']:not(:disabled) {
    cursor: pointer;
  }
}
```

- [ ] **Step 9: Write `src/App.tsx` and `src/main.tsx`**

`src/App.tsx`:

```tsx
export default function App() {
  return <main className="p-8 text-2xl font-bold text-primary">AgroServ</main>
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 10: Verify build, lint and test runner**

Run: `npm run build && npm run lint && npx vitest run --passWithNoTests`
Expected: build succeeds, lint has no errors, vitest reports "No test files found" and exits 0.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React TS project with Tailwind and Vitest"
```

---

### Task 1.2: Domain types and utilities

**Files:**
- Create: `src/types/entities.ts`, `src/types/api.ts`
- Create: `src/utils/cn.ts`, `src/utils/format.ts`, `src/utils/storage.ts`, `src/utils/searchParams.ts`, `src/utils/requestStatus.ts`, `src/utils/motion.ts`
- Test: `src/utils/format.test.ts`, `src/utils/storage.test.ts`, `src/utils/searchParams.test.ts`

**Interfaces:**
- Produces (types): `User`, `Category`, `Provider`, `PriceUnit`, `Service`, `ServiceDetail`, `RequestStatus`, `ServiceRequest`, `HttpMethod`, `QueryValue`, `QueryParams`, `RequestConfig`, `HttpAdapter`, `PaginationMeta`, `Paginated<T>`, `ApiErrorBody`, `LoginPayload`, `LoginResponse`, `ServiceFilters`, `RequestStatusFilter`, `ProducerDashboardStats`, `ProducerDashboard`.
- Produces (functions): `cn(...classes)`, `formatCurrency(value)`, `formatPrice(price, unit)`, `formatDate(iso)`, `formatLocation(city, state)`, `formatRating(rating)`, `formatCount(count, singular, plural)`, `getInitials(name)`, `getFirstName(name)`, `getToken()`, `getStoredUser()`, `saveSession(token, user)`, `clearSession()`, `toSearchString(values)`, `requestStatuses`, `requestStatusLabels`, `isRequestStatus(value)`, motion presets `fadeUp`, `staggerContainer`, `cardHover`, `pageTransition`.

- [ ] **Step 1: Write `src/types/entities.ts`**

```ts
export interface User {
  id: string
  name: string
  email: string
  role: 'producer'
  avatarUrl?: string
  city: string
  state: string
}

export interface Category {
  id: string
  slug: string
  name: string
  icon: string
}

export interface Provider {
  id: string
  name: string
  avatarUrl?: string
  city: string
  state: string
  rating: number
  yearsOfExperience: number
}

export type PriceUnit = 'hour' | 'hectare' | 'day' | 'trip'

export interface Service {
  id: string
  title: string
  description: string
  categoryId: string
  providerId: string
  providerName: string
  city: string
  state: string
  price: number
  priceUnit: PriceUnit
  rating: number
  reviewCount: number
  available: boolean
  imageUrl: string
}

export interface ServiceDetail extends Service {
  provider: Provider
  category: Category
}

export type RequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'

export interface ServiceRequest {
  id: string
  serviceId: string
  serviceTitle: string
  providerName: string
  scheduledDate: string
  location: string
  status: RequestStatus
  value: number
}
```

- [ ] **Step 2: Write `src/types/api.ts`**

```ts
import type { RequestStatus, ServiceRequest, User } from './entities'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type QueryValue = string | number | boolean | undefined

export type QueryParams = Record<string, QueryValue>

export interface RequestConfig {
  method: HttpMethod
  path: string
  query?: QueryParams
  body?: unknown
  token?: string | null
}

export interface HttpAdapter {
  request<T>(config: RequestConfig): Promise<T>
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorBody {
  status: number
  code: string
  message: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export type ServiceFilters = {
  q?: string
  location?: string
  category?: string
  page?: number
  pageSize?: number
}

export type RequestStatusFilter = RequestStatus | 'all'

export interface ProducerDashboardStats {
  open: number
  inProgress: number
  completed: number
  totalSpent: number
}

export interface ProducerDashboard {
  stats: ProducerDashboardStats
  recentRequests: ServiceRequest[]
}
```

- [ ] **Step 3: Write the failing tests**

`src/utils/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  formatCount,
  formatCurrency,
  formatDate,
  formatLocation,
  formatPrice,
  formatRating,
  getFirstName,
  getInitials,
} from './format'

const normalizeSpaces = (value: string) => value.replace(/\s/g, ' ')

describe('format', () => {
  it('formats BRL currency without cents', () => {
    expect(normalizeSpaces(formatCurrency(8420))).toBe('R$ 8.420')
  })

  it('formats price with unit suffix', () => {
    expect(normalizeSpaces(formatPrice(180, 'hour'))).toBe('R$ 180/h')
    expect(normalizeSpaces(formatPrice(95, 'hectare'))).toBe('R$ 95/ha')
    expect(normalizeSpaces(formatPrice(850, 'trip'))).toBe('R$ 850/viagem')
  })

  it('formats ISO dates in pt-BR without timezone shift', () => {
    expect(formatDate('2026-10-15')).toBe('15/10/2026')
    expect(formatDate('2026-10-01T00:00:00.000Z')).toBe('01/10/2026')
  })

  it('formats location', () => {
    expect(formatLocation('Santa Helena', 'PR')).toBe('Santa Helena - PR')
  })

  it('formats rating with comma and one decimal', () => {
    expect(formatRating(4.9)).toBe('4,9')
    expect(formatRating(5)).toBe('5,0')
  })

  it('pluralizes counts', () => {
    expect(formatCount(1, 'serviço', 'serviços')).toBe('1 serviço')
    expect(formatCount(0, 'serviço', 'serviços')).toBe('0 serviços')
    expect(formatCount(12, 'serviço', 'serviços')).toBe('12 serviços')
  })

  it('builds initials and first name', () => {
    expect(getInitials('Carlos Henrique Souza')).toBe('CH')
    expect(getInitials('ana')).toBe('A')
    expect(getInitials('  ')).toBe('')
    expect(getFirstName('Carlos Henrique Souza')).toBe('Carlos')
  })
})
```

`src/utils/storage.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { User } from '../types/entities'
import { clearSession, getStoredUser, getToken, saveSession } from './storage'

const user: User = {
  id: 'usr-1',
  name: 'Carlos Henrique Souza',
  email: 'produtor@agroserv.com',
  role: 'producer',
  city: 'Santa Helena',
  state: 'PR',
}

describe('storage', () => {
  it('returns null when there is no session', () => {
    expect(getToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
  })

  it('saves and reads the session', () => {
    saveSession('mock.usr-1', user)
    expect(getToken()).toBe('mock.usr-1')
    expect(getStoredUser()).toEqual(user)
    expect(localStorage.getItem('agroserv_token')).toBe('mock.usr-1')
  })

  it('clears the session', () => {
    saveSession('mock.usr-1', user)
    clearSession()
    expect(getToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
  })

  it('ignores a corrupted stored user', () => {
    localStorage.setItem('agroserv_user', '{oops')
    expect(getStoredUser()).toBeNull()
  })
})
```

`src/utils/searchParams.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { toSearchString } from './searchParams'

describe('toSearchString', () => {
  it('returns empty string when every value is empty', () => {
    expect(toSearchString({ q: '', location: '   ', category: undefined })).toBe('')
  })

  it('trims values and encodes them', () => {
    expect(toSearchString({ q: ' soja milho ', location: '' })).toBe('?q=soja+milho')
    expect(toSearchString({ category: 'pulverizacao' })).toBe('?category=pulverizacao')
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run src/utils`
Expected: FAIL — cannot resolve `./format`, `./storage`, `./searchParams`.

- [ ] **Step 5: Write `src/utils/format.ts`**

```ts
import type { PriceUnit } from '../types/entities'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

const priceUnitLabels: Record<PriceUnit, string> = {
  hour: 'h',
  hectare: 'ha',
  day: 'dia',
  trip: 'viagem',
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

export function formatPrice(price: number, unit: PriceUnit): string {
  return `${formatCurrency(price)}/${priceUnitLabels[unit]}`
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatLocation(city: string, state: string): string {
  return `${city} - ${state}`
}

export function formatRating(rating: number): string {
  return rating.toFixed(1).replace('.', ',')
}

export function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function getFirstName(name: string): string {
  return name.trim().split(' ')[0] ?? ''
}
```

- [ ] **Step 6: Write `src/utils/storage.ts`**

```ts
import type { User } from '../types/entities'

const TOKEN_KEY = 'agroserv_token'
const USER_KEY = 'agroserv_user'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function saveSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
```

- [ ] **Step 7: Write `src/utils/searchParams.ts`**

```ts
export function toSearchString(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    const trimmed = value?.trim()
    if (trimmed) params.set(key, trimmed)
  })
  const query = params.toString()
  return query ? `?${query}` : ''
}
```

- [ ] **Step 8: Write `src/utils/cn.ts`, `src/utils/requestStatus.ts`, `src/utils/motion.ts`**

`src/utils/cn.ts`:

```ts
type ClassValue = string | false | null | undefined

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
```

`src/utils/requestStatus.ts`:

```ts
import type { RequestStatus } from '../types/entities'

export const requestStatuses: RequestStatus[] = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled']

export const requestStatusLabels: Record<RequestStatus, string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export function isRequestStatus(value: string): value is RequestStatus {
  return (requestStatuses as string[]).includes(value)
}
```

`src/utils/motion.ts`:

```ts
import type { Variants } from 'framer-motion'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

export const cardHover = { y: -4, transition: { duration: 0.2 } }

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.25 },
}
```

- [ ] **Step 9: Run tests and typecheck**

Run: `npx vitest run src/utils && npx tsc -b`
Expected: all tests PASS; tsc exits 0.

- [ ] **Step 10: Commit**

```bash
git add src/types src/utils
git commit -m "feat: add domain types and formatting, storage and search utilities"
```
