# Phase 2 — Data layer

> Part of `plan_index.md`. Read its Global Constraints first. Depends on Phase 1.

### Task 2.1: Local images and seed data

**Files:**
- Create: `src/assets/images/*.jpg` (10 files)
- Create: `src/data/categories.ts`, `src/data/providers.ts`, `src/data/services.ts`, `src/data/users.ts`, `src/data/requests.ts`

**Interfaces:**
- Consumes: `Category`, `Provider`, `Service`, `User`, `ServiceRequest` from `src/types/entities.ts`.
- Produces: `categories: Category[]`, `providers: Provider[]`, `services: ServiceRecord[]` (`ServiceRecord = Omit<Service, 'providerName'>`), `users: User[]`, `userCredentials: UserCredential[]` (`{ userId: string; password: string }`), `requestRecords: RequestRecord[]` (`{ producerId: string; request: ServiceRequest }`). Image files `src/assets/images/hero-field.jpg` and `src/assets/images/login-field.jpg` are used by pages in Phases 5 and 6.

- [ ] **Step 1: Download the photos**

```bash
mkdir -p src/assets/images
download() { curl -fsSL "https://images.unsplash.com/$2?w=1400&q=72&fm=jpg&fit=crop" -o "src/assets/images/$1"; }
download hero-field.jpg photo-1500382017468-9049fed747ef
download login-field.jpg photo-1464226184884-fa280b87c399
download service-spraying.jpg photo-1592982537447-7440770cbfc9
download service-harvest.jpg photo-1574943320219-553eb213f72d
download service-planting.jpg photo-1523348837708-15d4a09cfac2
download service-irrigation.jpg photo-1563514227147-6d2ff665a6a0
download service-fertilizing.jpg photo-1625246333195-78d9c38ad449
download service-transport.jpg photo-1601584115197-04ecc0da31d7
download service-maintenance.jpg photo-1581092160562-40aa08e78837
download service-machinery.jpg photo-1530267981375-f0de937f5f13
file src/assets/images/*.jpg
```

Expected: every line says `JPEG image data`.

- [ ] **Step 2: Check every photo visually**

Open each file with the Read tool. Each must be a real, professional photo matching its theme:

| File | Theme |
|---|---|
| `hero-field.jpg` | wide crop field, warm light |
| `login-field.jpg` | aerial farmland |
| `service-spraying.jpg` | crop sprayer / spraying a field |
| `service-harvest.jpg` | combine harvester / harvest |
| `service-planting.jpg` | seedlings in rows / planting |
| `service-irrigation.jpg` | irrigation (pivot or sprinklers) |
| `service-fertilizing.jpg` | fertilizer application / soil |
| `service-transport.jpg` | grain truck / farm transport |
| `service-maintenance.jpg` | machinery repair / mechanic |
| `service-machinery.jpg` | tractor in a field |

If a download failed or the photo is off-theme, search `https://unsplash.com/s/photos/<theme>` (WebFetch), pick a landscape photo, take its `photo-…` id and re-run `download <file> <id>`. Keep each file under 400 KB (lower `q` if needed).

- [ ] **Step 3: Write `src/data/categories.ts`**

```ts
import type { Category } from '../types/entities'

export const categories: Category[] = [
  { id: 'cat-planting', slug: 'plantio', name: 'Plantio', icon: 'sprout' },
  { id: 'cat-harvest', slug: 'colheita', name: 'Colheita', icon: 'wheat' },
  { id: 'cat-irrigation', slug: 'irrigacao', name: 'Irrigação', icon: 'droplets' },
  { id: 'cat-spraying', slug: 'pulverizacao', name: 'Pulverização', icon: 'spray-can' },
  { id: 'cat-fertilizing', slug: 'fertilizacao', name: 'Fertilização', icon: 'flask-conical' },
  { id: 'cat-transport', slug: 'transporte', name: 'Transporte', icon: 'truck' },
  { id: 'cat-maintenance', slug: 'manutencao', name: 'Manutenção', icon: 'wrench' },
  { id: 'cat-machinery', slug: 'maquinas', name: 'Máquinas', icon: 'tractor' },
]
```

- [ ] **Step 4: Write `src/data/providers.ts`**

```ts
import type { Provider } from '../types/entities'

export const providers: Provider[] = [
  { id: 'prv-1', name: 'Agro Máquinas Paraná', city: 'Santa Helena', state: 'PR', rating: 4.9, yearsOfExperience: 12 },
  { id: 'prv-2', name: 'Campo Forte Serviços', city: 'Cascavel', state: 'PR', rating: 4.8, yearsOfExperience: 9 },
  { id: 'prv-3', name: 'Irriga Sul Tecnologia', city: 'Toledo', state: 'PR', rating: 4.7, yearsOfExperience: 7 },
  { id: 'prv-4', name: 'Transportes Vale Verde', city: 'Marechal Cândido Rondon', state: 'PR', rating: 4.6, yearsOfExperience: 15 },
  { id: 'prv-5', name: 'Mecânica Rural Oeste', city: 'Medianeira', state: 'PR', rating: 4.8, yearsOfExperience: 20 },
  { id: 'prv-6', name: 'Semear Agrícola', city: 'Palotina', state: 'PR', rating: 4.9, yearsOfExperience: 6 },
]
```

- [ ] **Step 5: Write `src/data/services.ts`**

Descriptions must not contain the words "pulverização" or "drone" except in `svc-1` and `svc-10` (tests in Task 2.2 rely on it).

```ts
import fertilizingImage from '../assets/images/service-fertilizing.jpg'
import harvestImage from '../assets/images/service-harvest.jpg'
import irrigationImage from '../assets/images/service-irrigation.jpg'
import machineryImage from '../assets/images/service-machinery.jpg'
import maintenanceImage from '../assets/images/service-maintenance.jpg'
import plantingImage from '../assets/images/service-planting.jpg'
import sprayingImage from '../assets/images/service-spraying.jpg'
import transportImage from '../assets/images/service-transport.jpg'
import type { Service } from '../types/entities'

export type ServiceRecord = Omit<Service, 'providerName'>

export const services: ServiceRecord[] = [
  {
    id: 'svc-1',
    title: 'Pulverização Agrícola',
    description:
      'Pulverização terrestre com barra de 30 metros, controle de vazão por GPS e relatório de aplicação por talhão. Equipe treinada e calibração antes de cada serviço.',
    categoryId: 'cat-spraying',
    providerId: 'prv-1',
    city: 'Santa Helena',
    state: 'PR',
    price: 180,
    priceUnit: 'hour',
    rating: 4.9,
    reviewCount: 128,
    available: true,
    imageUrl: sprayingImage,
  },
  {
    id: 'svc-2',
    title: 'Colheita de Soja e Milho',
    description:
      'Colheitadeira com plataforma de 35 pés e monitor de produtividade. Inclui operador experiente e apoio de transbordo durante toda a operação.',
    categoryId: 'cat-harvest',
    providerId: 'prv-2',
    city: 'Cascavel',
    state: 'PR',
    price: 250,
    priceUnit: 'hectare',
    rating: 4.8,
    reviewCount: 96,
    available: true,
    imageUrl: harvestImage,
  },
  {
    id: 'svc-3',
    title: 'Plantio Direto de Precisão',
    description:
      'Plantadeira de 13 linhas com taxa variável de sementes e corte de seção automático. Ideal para soja, milho e feijão em sistema de plantio direto.',
    categoryId: 'cat-planting',
    providerId: 'prv-6',
    city: 'Palotina',
    state: 'PR',
    price: 210,
    priceUnit: 'hectare',
    rating: 4.9,
    reviewCount: 74,
    available: true,
    imageUrl: plantingImage,
  },
  {
    id: 'svc-4',
    title: 'Instalação de Irrigação por Pivô',
    description:
      'Projeto e montagem de pivô central com automação remota, dimensionamento hidráulico e treinamento da equipe da propriedade.',
    categoryId: 'cat-irrigation',
    providerId: 'prv-3',
    city: 'Toledo',
    state: 'PR',
    price: 1500,
    priceUnit: 'day',
    rating: 4.7,
    reviewCount: 31,
    available: false,
    imageUrl: irrigationImage,
  },
  {
    id: 'svc-5',
    title: 'Aplicação de Fertilizantes a Taxa Variável',
    description:
      'Distribuição de adubo sólido guiada por mapa de fertilidade do solo, reduzindo desperdício e aumentando a uniformidade da lavoura.',
    categoryId: 'cat-fertilizing',
    providerId: 'prv-1',
    city: 'Santa Helena',
    state: 'PR',
    price: 95,
    priceUnit: 'hectare',
    rating: 4.8,
    reviewCount: 58,
    available: true,
    imageUrl: fertilizingImage,
  },
  {
    id: 'svc-6',
    title: 'Transporte de Grãos',
    description:
      'Frota de caminhões graneleiros com rastreamento em tempo real para escoamento da safra até armazéns e cooperativas da região.',
    categoryId: 'cat-transport',
    providerId: 'prv-4',
    city: 'Marechal Cândido Rondon',
    state: 'PR',
    price: 850,
    priceUnit: 'trip',
    rating: 4.6,
    reviewCount: 140,
    available: true,
    imageUrl: transportImage,
  },
  {
    id: 'svc-7',
    title: 'Manutenção de Colheitadeiras',
    description:
      'Revisão preventiva e corretiva de colheitadeiras no campo, com diagnóstico eletrônico e peças de reposição originais.',
    categoryId: 'cat-maintenance',
    providerId: 'prv-5',
    city: 'Medianeira',
    state: 'PR',
    price: 160,
    priceUnit: 'hour',
    rating: 4.8,
    reviewCount: 87,
    available: true,
    imageUrl: maintenanceImage,
  },
  {
    id: 'svc-8',
    title: 'Locação de Trator com Operador',
    description:
      'Trator de 180 cv com piloto automático e operador qualificado para preparo de solo, transporte interno e apoio em diversas operações.',
    categoryId: 'cat-machinery',
    providerId: 'prv-2',
    city: 'Cascavel',
    state: 'PR',
    price: 220,
    priceUnit: 'hour',
    rating: 4.7,
    reviewCount: 65,
    available: true,
    imageUrl: machineryImage,
  },
  {
    id: 'svc-9',
    title: 'Gradagem e Aragem',
    description:
      'Preparo de solo com grade aradora e arado de discos, deixando a área nivelada e pronta para o plantio da próxima safra.',
    categoryId: 'cat-machinery',
    providerId: 'prv-6',
    city: 'Palotina',
    state: 'PR',
    price: 190,
    priceUnit: 'hectare',
    rating: 4.6,
    reviewCount: 42,
    available: true,
    imageUrl: machineryImage,
  },
  {
    id: 'svc-10',
    title: 'Pulverização com Drone',
    description:
      'Aplicação aérea com drone agrícola de 40 litros, ideal para áreas de difícil acesso, com mapeamento prévio e relatório georreferenciado.',
    categoryId: 'cat-spraying',
    providerId: 'prv-3',
    city: 'Toledo',
    state: 'PR',
    price: 75,
    priceUnit: 'hectare',
    rating: 4.9,
    reviewCount: 53,
    available: true,
    imageUrl: sprayingImage,
  },
  {
    id: 'svc-11',
    title: 'Semeadura de Trigo',
    description:
      'Semeadora de fluxo contínuo para trigo e aveia, com regulagem de profundidade e acompanhamento técnico durante a operação.',
    categoryId: 'cat-planting',
    providerId: 'prv-6',
    city: 'Palotina',
    state: 'PR',
    price: 180,
    priceUnit: 'hectare',
    rating: 4.7,
    reviewCount: 29,
    available: false,
    imageUrl: plantingImage,
  },
  {
    id: 'svc-12',
    title: 'Manutenção de Sistemas de Irrigação',
    description:
      'Inspeção de aspersores, bombas e painéis elétricos de sistemas de irrigação, com ajuste de pressão e troca de componentes desgastados.',
    categoryId: 'cat-maintenance',
    providerId: 'prv-3',
    city: 'Toledo',
    state: 'PR',
    price: 140,
    priceUnit: 'hour',
    rating: 4.5,
    reviewCount: 22,
    available: true,
    imageUrl: maintenanceImage,
  },
]
```

- [ ] **Step 6: Write `src/data/users.ts`**

```ts
import type { User } from '../types/entities'

export interface UserCredential {
  userId: string
  password: string
}

export const users: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Henrique Souza',
    email: 'produtor@agroserv.com',
    role: 'producer',
    city: 'Santa Helena',
    state: 'PR',
  },
]

export const userCredentials: UserCredential[] = [{ userId: 'usr-1', password: '123456' }]
```

- [ ] **Step 7: Write `src/data/requests.ts`**

Totals the tests rely on: open (pending + accepted) = 3, in progress = 1, completed = 3, total contracted (accepted + in_progress + completed) = 10260.

```ts
import type { ServiceRequest } from '../types/entities'

export interface RequestRecord {
  producerId: string
  request: ServiceRequest
}

export const requestRecords: RequestRecord[] = [
  {
    producerId: 'usr-1',
    request: {
      id: 'req-1',
      serviceId: 'svc-1',
      serviceTitle: 'Pulverização Agrícola',
      providerName: 'Agro Máquinas Paraná',
      scheduledDate: '2026-10-15',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'pending',
      value: 1440,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-2',
      serviceId: 'svc-2',
      serviceTitle: 'Colheita de Soja e Milho',
      providerName: 'Campo Forte Serviços',
      scheduledDate: '2026-10-05',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'in_progress',
      value: 3750,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-3',
      serviceId: 'svc-3',
      serviceTitle: 'Plantio Direto de Precisão',
      providerName: 'Semear Agrícola',
      scheduledDate: '2026-10-20',
      location: 'Sítio São José, Santa Helena - PR',
      status: 'accepted',
      value: 2100,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-4',
      serviceId: 'svc-5',
      serviceTitle: 'Aplicação de Fertilizantes a Taxa Variável',
      providerName: 'Agro Máquinas Paraná',
      scheduledDate: '2026-09-12',
      location: 'Sítio São José, Santa Helena - PR',
      status: 'completed',
      value: 950,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-5',
      serviceId: 'svc-6',
      serviceTitle: 'Transporte de Grãos',
      providerName: 'Transportes Vale Verde',
      scheduledDate: '2026-09-03',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'completed',
      value: 1700,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-6',
      serviceId: 'svc-7',
      serviceTitle: 'Manutenção de Colheitadeiras',
      providerName: 'Mecânica Rural Oeste',
      scheduledDate: '2026-08-28',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'cancelled',
      value: 1280,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-7',
      serviceId: 'svc-8',
      serviceTitle: 'Locação de Trator com Operador',
      providerName: 'Campo Forte Serviços',
      scheduledDate: '2026-08-15',
      location: 'Sítio São José, Santa Helena - PR',
      status: 'completed',
      value: 1760,
    },
  },
  {
    producerId: 'usr-1',
    request: {
      id: 'req-8',
      serviceId: 'svc-10',
      serviceTitle: 'Pulverização com Drone',
      providerName: 'Irriga Sul Tecnologia',
      scheduledDate: '2026-10-25',
      location: 'Fazenda Boa Vista, Santa Helena - PR',
      status: 'pending',
      value: 1500,
    },
  },
]
```

- [ ] **Step 8: Typecheck**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/assets/images src/data
git commit -m "feat: add local photos and mock seed data"
```

---

### Task 2.2: ApiError and mock REST routes

**Files:**
- Create: `src/services/api/apiError.ts`, `src/services/api/mockRoutes.ts`
- Test: `src/services/api/mockRoutes.test.ts`

**Interfaces:**
- Consumes: seeds from Task 2.1; `RequestConfig`, `Paginated`, `LoginResponse`, `ProducerDashboard`, `QueryValue`, `HttpMethod` from `types/api.ts`; `isRequestStatus` from `utils/requestStatus.ts`.
- Produces: `class ApiError extends Error { status: number; code: string }` built with `new ApiError({ status, code, message })`; `isApiError(error: unknown): error is ApiError`; `matchPath(pattern: string, path: string): Record<string, string> | null`; `normalizeText(value: string): string`; `handleMockRequest(config: RequestConfig): unknown`.

- [ ] **Step 1: Write the failing test `src/services/api/mockRoutes.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import type { LoginResponse, Paginated, ProducerDashboard } from '../../types/api'
import type { Service, ServiceDetail, ServiceRequest, User } from '../../types/entities'
import { ApiError } from './apiError'
import { handleMockRequest, matchPath, normalizeText } from './mockRoutes'

const TOKEN = 'mock.usr-1'

function get<T>(path: string, query?: Record<string, string | number | undefined>, token: string | null = null) {
  return handleMockRequest({ method: 'GET', path, query, token }) as T
}

function captureError(action: () => unknown): ApiError {
  try {
    action()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('Expected ApiError to be thrown')
}

describe('matchPath', () => {
  it('extracts params and rejects mismatches', () => {
    expect(matchPath('/services/:id', '/services/svc-1')).toEqual({ id: 'svc-1' })
    expect(matchPath('/services', '/services')).toEqual({})
    expect(matchPath('/services/:id', '/services')).toBeNull()
    expect(matchPath('/services/:id', '/requests/1')).toBeNull()
  })
})

describe('normalizeText', () => {
  it('removes accents, case and punctuation', () => {
    expect(normalizeText('  Santa Helena, PR ')).toBe('santa helena pr')
    expect(normalizeText('PULVERIZAÇÃO')).toBe('pulverizacao')
  })
})

describe('GET /services', () => {
  it('paginates with default page size 9', () => {
    const result = get<Paginated<Service>>('/services')
    expect(result.data).toHaveLength(9)
    expect(result.meta).toEqual({ page: 1, pageSize: 9, total: 12, totalPages: 2 })
    expect(get<Paginated<Service>>('/services', { page: '2' }).data).toHaveLength(3)
  })

  it('includes the provider name', () => {
    const [first] = get<Paginated<Service>>('/services').data
    expect(first.providerName).toBe('Agro Máquinas Paraná')
  })

  it('filters by category slug', () => {
    const result = get<Paginated<Service>>('/services', { category: 'pulverizacao' })
    expect(result.meta.total).toBe(2)
    expect(result.data.every((service) => service.categoryId === 'cat-spraying')).toBe(true)
  })

  it('returns an empty page for an unknown category', () => {
    expect(get<Paginated<Service>>('/services', { category: 'inexistente' }).meta.total).toBe(0)
  })

  it('searches ignoring accents and case', () => {
    const ids = get<Paginated<Service>>('/services', { q: 'PULVERIZACAO' }).data.map((service) => service.id)
    expect(ids).toEqual(['svc-1', 'svc-10'])
  })

  it('requires every search term', () => {
    const ids = get<Paginated<Service>>('/services', { q: 'pulverizacao drone' }).data.map((service) => service.id)
    expect(ids).toEqual(['svc-10'])
  })

  it('filters by location ignoring punctuation', () => {
    const ids = get<Paginated<Service>>('/services', { location: 'Santa Helena, PR' }).data.map((service) => service.id)
    expect(ids).toEqual(['svc-1', 'svc-5'])
  })

  it('caps page size and ignores invalid numbers', () => {
    const result = get<Paginated<Service>>('/services', { page: 'abc', pageSize: '500' })
    expect(result.meta.page).toBe(1)
    expect(result.meta.pageSize).toBe(60)
    expect(result.data).toHaveLength(12)
  })
})

describe('GET /services/featured and /services/:id', () => {
  it('returns available services sorted by rating', () => {
    const featured = get<Service[]>('/services/featured', { limit: 4 })
    expect(featured.map((service) => service.id)).toEqual(['svc-1', 'svc-3', 'svc-10', 'svc-2'])
    expect(featured.every((service) => service.available)).toBe(true)
  })

  it('returns detail with provider and category', () => {
    const detail = get<ServiceDetail>('/services/svc-1')
    expect(detail.provider.name).toBe('Agro Máquinas Paraná')
    expect(detail.category.slug).toBe('pulverizacao')
  })

  it('throws 404 for an unknown service', () => {
    const error = captureError(() => get('/services/nao-existe'))
    expect(error.status).toBe(404)
    expect(error.code).toBe('service_not_found')
  })
})

describe('auth routes', () => {
  it('logs in with trimmed, case-insensitive email', () => {
    const result = handleMockRequest({
      method: 'POST',
      path: '/auth/login',
      body: { email: '  PRODUTOR@agroserv.com ', password: '123456' },
    }) as LoginResponse
    expect(result.token).toBe(TOKEN)
    expect(result.user.email).toBe('produtor@agroserv.com')
    expect(result.user).not.toHaveProperty('password')
  })

  it('rejects wrong password with 401', () => {
    const error = captureError(() =>
      handleMockRequest({ method: 'POST', path: '/auth/login', body: { email: 'produtor@agroserv.com', password: 'x' } }),
    )
    expect(error.status).toBe(401)
    expect(error.message).toBe('E-mail ou senha inválidos.')
  })

  it('rejects missing fields with 400', () => {
    expect(captureError(() => handleMockRequest({ method: 'POST', path: '/auth/login', body: {} })).status).toBe(400)
  })

  it('returns the current user for a valid token and 401 otherwise', () => {
    expect(get<User>('/auth/me', undefined, TOKEN).id).toBe('usr-1')
    expect(captureError(() => get('/auth/me', undefined, 'mock.usr-999')).status).toBe(401)
    expect(captureError(() => get('/auth/me')).status).toBe(401)
  })
})

describe('private routes', () => {
  it('requires a token for requests', () => {
    expect(captureError(() => get('/requests')).status).toBe(401)
  })

  it('lists requests sorted by date descending', () => {
    const ids = get<ServiceRequest[]>('/requests', undefined, TOKEN).map((request) => request.id)
    expect(ids).toEqual(['req-8', 'req-3', 'req-1', 'req-2', 'req-4', 'req-5', 'req-6', 'req-7'])
  })

  it('filters requests by status and rejects invalid status', () => {
    expect(get<ServiceRequest[]>('/requests', { status: 'completed' }, TOKEN)).toHaveLength(3)
    expect(get<ServiceRequest[]>('/requests', { status: 'all' }, TOKEN)).toHaveLength(8)
    expect(captureError(() => get('/requests', { status: 'invalido' }, TOKEN)).status).toBe(400)
  })

  it('builds the producer dashboard', () => {
    const dashboard = get<ProducerDashboard>('/dashboard', undefined, TOKEN)
    expect(dashboard.stats).toEqual({ open: 3, inProgress: 1, completed: 3, totalSpent: 10260 })
    expect(dashboard.recentRequests.map((request) => request.id)).toEqual(['req-8', 'req-3', 'req-1', 'req-2', 'req-4'])
  })
})

describe('unknown routes', () => {
  it('throws 404', () => {
    expect(captureError(() => get('/nada')).code).toBe('route_not_found')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/services/api/mockRoutes.test.ts`
Expected: FAIL — cannot resolve `./apiError` / `./mockRoutes`.

- [ ] **Step 3: Write `src/services/api/apiError.ts`**

```ts
import type { ApiErrorBody } from '../../types/api'

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
```

- [ ] **Step 4: Write `src/services/api/mockRoutes.ts`**

```ts
import { categories } from '../../data/categories'
import { providers } from '../../data/providers'
import { requestRecords } from '../../data/requests'
import { services, type ServiceRecord } from '../../data/services'
import { userCredentials, users } from '../../data/users'
import type {
  HttpMethod,
  LoginResponse,
  Paginated,
  ProducerDashboard,
  QueryValue,
  RequestConfig,
} from '../../types/api'
import type { RequestStatus, Service, ServiceDetail, ServiceRequest, User } from '../../types/entities'
import { isRequestStatus } from '../../utils/requestStatus'
import { ApiError } from './apiError'

interface RouteContext {
  params: Record<string, string>
  query: Record<string, QueryValue>
  body: unknown
  token: string | null
}

interface MockRoute {
  method: HttpMethod
  pattern: string
  handle: (context: RouteContext) => unknown
}

const TOKEN_PREFIX = 'mock.'
const DEFAULT_PAGE_SIZE = 9
const MAX_PAGE_SIZE = 60
const DEFAULT_FEATURED_LIMIT = 4
const MAX_FEATURED_LIMIT = 12
const RECENT_REQUESTS_LIMIT = 5
const OPEN_STATUSES: RequestStatus[] = ['pending', 'accepted']
const CONTRACTED_STATUSES: RequestStatus[] = ['accepted', 'in_progress', 'completed']

export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)
  if (patternParts.length !== pathParts.length) return null
  const params: Record<string, string> = {}
  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const pathPart = pathParts[index]
    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart)
    } else if (patternPart !== pathPart) {
      return null
    }
  }
  return params
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function matchesAllTerms(haystack: string, search: string): boolean {
  const normalizedHaystack = normalizeText(haystack)
  return normalizeText(search)
    .split(' ')
    .every((term) => normalizedHaystack.includes(term))
}

function toPositiveInt(value: QueryValue, fallback: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(Math.floor(parsed), max)
}

function toOptionalString(value: QueryValue): string | undefined {
  if (value === undefined) return undefined
  const text = String(value).trim()
  return text || undefined
}

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length
  const start = (page - 1) * pageSize
  return {
    data: items.slice(start, start + pageSize),
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  }
}

function findUserByToken(token: string | null): User {
  const userId = token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null
  const user = userId ? users.find((candidate) => candidate.id === userId) : undefined
  if (!user) {
    throw new ApiError({ status: 401, code: 'unauthorized', message: 'Sessão inválida. Faça login novamente.' })
  }
  return user
}

function toService(record: ServiceRecord): Service {
  const provider = providers.find((candidate) => candidate.id === record.providerId)
  return { ...record, providerName: provider?.name ?? 'Prestador' }
}

function getCategoryName(categoryId: string): string {
  return categories.find((category) => category.id === categoryId)?.name ?? ''
}

function getUserRequests(userId: string): ServiceRequest[] {
  return requestRecords
    .filter((record) => record.producerId === userId)
    .map((record) => record.request)
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
}

function login({ body }: RouteContext): LoginResponse {
  const { email, password } = (body ?? {}) as Record<string, unknown>
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw new ApiError({ status: 400, code: 'validation_error', message: 'Informe e-mail e senha.' })
  }
  const user = users.find((candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase())
  const credential = user ? userCredentials.find((candidate) => candidate.userId === user.id) : undefined
  if (!user || credential?.password !== password) {
    throw new ApiError({ status: 401, code: 'invalid_credentials', message: 'E-mail ou senha inválidos.' })
  }
  return { token: `${TOKEN_PREFIX}${user.id}`, user }
}

function listServices({ query }: RouteContext): Paginated<Service> {
  const search = toOptionalString(query.q)
  const location = toOptionalString(query.location)
  const categorySlug = toOptionalString(query.category)
  const page = toPositiveInt(query.page, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const category = categorySlug ? categories.find((candidate) => candidate.slug === categorySlug) : undefined
  if (categorySlug && !category) return paginate([], page, pageSize)

  const filtered = services.map(toService).filter((service) => {
    if (category && service.categoryId !== category.id) return false
    if (
      search &&
      !matchesAllTerms(
        `${service.title} ${service.description} ${service.providerName} ${getCategoryName(service.categoryId)} ${service.city}`,
        search,
      )
    ) {
      return false
    }
    if (location && !matchesAllTerms(`${service.city} ${service.state}`, location)) return false
    return true
  })
  return paginate(filtered, page, pageSize)
}

function listFeaturedServices({ query }: RouteContext): Service[] {
  const limit = toPositiveInt(query.limit, DEFAULT_FEATURED_LIMIT, MAX_FEATURED_LIMIT)
  return services
    .filter((service) => service.available)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, limit)
    .map(toService)
}

function getService({ params }: RouteContext): ServiceDetail {
  const record = services.find((service) => service.id === params.id)
  const provider = record ? providers.find((candidate) => candidate.id === record.providerId) : undefined
  const category = record ? categories.find((candidate) => candidate.id === record.categoryId) : undefined
  if (!record || !provider || !category) {
    throw new ApiError({ status: 404, code: 'service_not_found', message: 'Serviço não encontrado.' })
  }
  return { ...toService(record), provider, category }
}

function listRequests({ token, query }: RouteContext): ServiceRequest[] {
  const user = findUserByToken(token)
  const status = toOptionalString(query.status)
  if (status && status !== 'all' && !isRequestStatus(status)) {
    throw new ApiError({ status: 400, code: 'invalid_status', message: 'Status de solicitação inválido.' })
  }
  const userRequests = getUserRequests(user.id)
  return status && status !== 'all' ? userRequests.filter((request) => request.status === status) : userRequests
}

function getDashboard({ token }: RouteContext): ProducerDashboard {
  const user = findUserByToken(token)
  const userRequests = getUserRequests(user.id)
  const countBy = (statuses: RequestStatus[]) =>
    userRequests.filter((request) => statuses.includes(request.status)).length
  return {
    stats: {
      open: countBy(OPEN_STATUSES),
      inProgress: countBy(['in_progress']),
      completed: countBy(['completed']),
      totalSpent: userRequests
        .filter((request) => CONTRACTED_STATUSES.includes(request.status))
        .reduce((sum, request) => sum + request.value, 0),
    },
    recentRequests: userRequests.slice(0, RECENT_REQUESTS_LIMIT),
  }
}

const routes: MockRoute[] = [
  { method: 'POST', pattern: '/auth/login', handle: login },
  { method: 'GET', pattern: '/auth/me', handle: ({ token }) => findUserByToken(token) },
  { method: 'GET', pattern: '/categories', handle: () => categories },
  { method: 'GET', pattern: '/services/featured', handle: listFeaturedServices },
  { method: 'GET', pattern: '/services/:id', handle: getService },
  { method: 'GET', pattern: '/services', handle: listServices },
  { method: 'GET', pattern: '/requests', handle: listRequests },
  { method: 'GET', pattern: '/dashboard', handle: getDashboard },
]

export function handleMockRequest(config: RequestConfig): unknown {
  for (const route of routes) {
    if (route.method !== config.method) continue
    const params = matchPath(route.pattern, config.path)
    if (params) {
      return route.handle({ params, query: config.query ?? {}, body: config.body, token: config.token ?? null })
    }
  }
  throw new ApiError({
    status: 404,
    code: 'route_not_found',
    message: `Rota ${config.method} ${config.path} não encontrada.`,
  })
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/services/api/mockRoutes.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add src/services/api/apiError.ts src/services/api/mockRoutes.ts src/services/api/mockRoutes.test.ts
git commit -m "feat: add mock REST routes with filtering, pagination and auth"
```

---

### Task 2.3: Adapters and apiClient

**Files:**
- Create: `src/services/api/mockAdapter.ts`, `src/services/api/httpAdapter.ts`, `src/services/api/apiClient.ts`, `src/env.d.ts`, `.env.example`
- Test: `src/services/api/mockAdapter.test.ts`, `src/services/api/httpAdapter.test.ts`, `src/services/api/apiClient.test.ts`

**Interfaces:**
- Consumes: `handleMockRequest`, `ApiError` (Task 2.2); `getToken` (Task 1.2); `HttpAdapter`, `RequestConfig`, `QueryParams` (Task 1.2).
- Produces: `createMockAdapter(options?: { minDelayMs?: number; maxDelayMs?: number; shouldFail?: (config: RequestConfig) => boolean }): HttpAdapter`; `buildUrl(baseUrl, path, query?)`; `createHttpAdapter(baseUrl: string): HttpAdapter`; `createApiClient(adapter, getAuthToken?)` returning `{ get<T>(path, query?): Promise<T>; post<T>(path, body?): Promise<T> }`; singleton `apiClient`; `isMockMode: boolean`.

- [ ] **Step 1: Write the failing tests**

`src/services/api/mockAdapter.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Category } from '../../types/entities'
import { ApiError } from './apiError'
import { createMockAdapter } from './mockAdapter'

describe('createMockAdapter', () => {
  it('resolves routes and returns copies of the data', async () => {
    const adapter = createMockAdapter({ minDelayMs: 0, maxDelayMs: 0, shouldFail: () => false })
    const first = await adapter.request<Category[]>({ method: 'GET', path: '/categories' })
    first[0].name = 'Alterado'
    const second = await adapter.request<Category[]>({ method: 'GET', path: '/categories' })
    expect(second).toHaveLength(8)
    expect(second[0].name).toBe('Plantio')
  })

  it('rejects with ApiError when forced to fail', async () => {
    const adapter = createMockAdapter({ minDelayMs: 0, maxDelayMs: 0, shouldFail: () => true })
    await expect(adapter.request({ method: 'GET', path: '/categories' })).rejects.toMatchObject({
      status: 500,
      code: 'server_error',
    })
  })

  it('propagates route errors as ApiError', async () => {
    const adapter = createMockAdapter({ minDelayMs: 0, maxDelayMs: 0, shouldFail: () => false })
    await expect(adapter.request({ method: 'GET', path: '/services/x' })).rejects.toBeInstanceOf(ApiError)
  })
})
```

`src/services/api/httpAdapter.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildUrl, createHttpAdapter } from './httpAdapter'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildUrl', () => {
  it('joins base url, path and non-empty query values', () => {
    expect(buildUrl('http://localhost:3333', '/services', { q: 'soja', page: 2, category: undefined, location: '' })).toBe(
      'http://localhost:3333/services?q=soja&page=2',
    )
    expect(buildUrl('http://api.test/v1/', '/services')).toBe('http://api.test/v1/services')
  })
})

describe('createHttpAdapter', () => {
  it('sends method, auth header and JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)
    const adapter = createHttpAdapter('http://api.test')
    const result = await adapter.request({ method: 'POST', path: '/auth/login', body: { a: 1 }, token: 'abc' })
    expect(result).toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://api.test/auth/login')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer abc')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"a":1}')
  })

  it('converts error responses into ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ code: 'unauthorized', message: 'Sem acesso' }, 401)))
    await expect(createHttpAdapter('http://api.test').request({ method: 'GET', path: '/auth/me' })).rejects.toMatchObject({
      status: 401,
      code: 'unauthorized',
      message: 'Sem acesso',
    })
  })

  it('converts network failures into ApiError with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(createHttpAdapter('http://api.test').request({ method: 'GET', path: '/x' })).rejects.toMatchObject({
      status: 0,
      code: 'network_error',
    })
  })

  it('returns undefined for 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
    await expect(createHttpAdapter('http://api.test').request({ method: 'DELETE', path: '/x' })).resolves.toBeUndefined()
  })
})
```

`src/services/api/apiClient.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import type { HttpAdapter } from '../../types/api'
import { createApiClient } from './apiClient'

describe('createApiClient', () => {
  it('forwards requests with the current token', async () => {
    const request = vi.fn().mockResolvedValue('result')
    const adapter: HttpAdapter = { request }
    const client = createApiClient(adapter, () => 'token-1')
    await expect(client.get('/services', { q: 'soja' })).resolves.toBe('result')
    await client.post('/auth/login', { email: 'a' })
    expect(request).toHaveBeenNthCalledWith(1, { method: 'GET', path: '/services', query: { q: 'soja' }, token: 'token-1' })
    expect(request).toHaveBeenNthCalledWith(2, { method: 'POST', path: '/auth/login', body: { email: 'a' }, token: 'token-1' })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services/api`
Expected: the three new files FAIL (modules not found); `mockRoutes.test.ts` still PASS.

- [ ] **Step 3: Write `src/services/api/mockAdapter.ts`**

```ts
import type { HttpAdapter, RequestConfig } from '../../types/api'
import { ApiError } from './apiError'
import { handleMockRequest } from './mockRoutes'

export interface MockAdapterOptions {
  minDelayMs?: number
  maxDelayMs?: number
  shouldFail?: (config: RequestConfig) => boolean
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isErrorForcedByUrl(config: RequestConfig): boolean {
  return (
    config.method === 'GET' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('mockError')
  )
}

export function createMockAdapter({
  minDelayMs = 300,
  maxDelayMs = 600,
  shouldFail = isErrorForcedByUrl,
}: MockAdapterOptions = {}): HttpAdapter {
  return {
    async request<T>(config: RequestConfig): Promise<T> {
      await wait(minDelayMs + Math.random() * Math.max(0, maxDelayMs - minDelayMs))
      if (shouldFail(config)) {
        throw new ApiError({
          status: 500,
          code: 'server_error',
          message: 'Não foi possível carregar os dados. Tente novamente.',
        })
      }
      return JSON.parse(JSON.stringify(handleMockRequest(config))) as T
    },
  }
}
```

- [ ] **Step 4: Write `src/services/api/httpAdapter.ts`**

```ts
import type { ApiErrorBody, HttpAdapter, QueryParams, RequestConfig } from '../../types/api'
import { ApiError } from './apiError'

export function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const url = new URL(path.replace(/^\//, ''), base)
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  })
  return url.toString()
}

export function createHttpAdapter(baseUrl: string): HttpAdapter {
  return {
    async request<T>({ method, path, query, body, token }: RequestConfig): Promise<T> {
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (body !== undefined) headers['Content-Type'] = 'application/json'
      if (token) headers.Authorization = `Bearer ${token}`

      let response: Response
      try {
        response = await fetch(buildUrl(baseUrl, path, query), {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        })
      } catch {
        throw new ApiError({ status: 0, code: 'network_error', message: 'Não foi possível conectar ao servidor.' })
      }

      if (response.status === 204) return undefined as T
      const data: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const errorBody = (data ?? {}) as Partial<ApiErrorBody>
        throw new ApiError({
          status: response.status,
          code: errorBody.code ?? 'http_error',
          message: errorBody.message ?? 'Erro inesperado no servidor.',
        })
      }
      return data as T
    },
  }
}
```

- [ ] **Step 5: Write `src/services/api/apiClient.ts`, `src/env.d.ts`, `.env.example`**

`src/services/api/apiClient.ts`:

```ts
import type { HttpAdapter, QueryParams } from '../../types/api'
import { getToken } from '../../utils/storage'
import { createHttpAdapter } from './httpAdapter'
import { createMockAdapter } from './mockAdapter'

export function createApiClient(adapter: HttpAdapter, getAuthToken: () => string | null = getToken) {
  return {
    get<T>(path: string, query?: QueryParams): Promise<T> {
      return adapter.request<T>({ method: 'GET', path, query, token: getAuthToken() })
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return adapter.request<T>({ method: 'POST', path, body, token: getAuthToken() })
    },
  }
}

export const isMockMode = import.meta.env.VITE_API_MODE !== 'http'

function resolveAdapter(): HttpAdapter {
  if (!isMockMode) return createHttpAdapter(import.meta.env.VITE_API_URL ?? 'http://localhost:3333')
  return createMockAdapter(import.meta.env.MODE === 'test' ? { minDelayMs: 0, maxDelayMs: 0 } : {})
}

export const apiClient = createApiClient(resolveAdapter())
```

`src/env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_API_MODE?: 'mock' | 'http'
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

`.env.example`:

```
VITE_API_MODE=mock
VITE_API_URL=http://localhost:3333
```

- [ ] **Step 6: Run tests and typecheck**

Run: `npx vitest run src/services/api && npx tsc -b`
Expected: all PASS; tsc exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/services/api src/env.d.ts .env.example
git commit -m "feat: add swappable mock and http adapters behind apiClient"
```

---

### Task 2.4: Resource services and API contract document

**Files:**
- Create: `src/services/authService.ts`, `src/services/categoryService.ts`, `src/services/serviceService.ts`, `src/services/requestService.ts`
- Create: `docs/api-contract.md`

**Interfaces:**
- Consumes: `apiClient` (Task 2.3).
- Produces:
  - `authService.login(payload: LoginPayload): Promise<LoginResponse>`, `authService.me(): Promise<User>`, `demoAccount: LoginPayload | null` (null when `VITE_API_MODE=http`)
  - `categoryService.list(): Promise<Category[]>`
  - `serviceService.list(filters: ServiceFilters): Promise<Paginated<Service>>`, `serviceService.featured(limit: number): Promise<Service[]>`, `serviceService.getById(id: string): Promise<ServiceDetail>`
  - `requestService.list(status: RequestStatusFilter): Promise<ServiceRequest[]>`, `requestService.getDashboard(): Promise<ProducerDashboard>`

- [ ] **Step 1: Write the services**

`src/services/authService.ts`:

```ts
import type { LoginPayload, LoginResponse } from '../types/api'
import type { User } from '../types/entities'
import { apiClient, isMockMode } from './api/apiClient'

export const demoAccount: LoginPayload | null = isMockMode
  ? { email: 'produtor@agroserv.com', password: '123456' }
  : null

export const authService = {
  login(payload: LoginPayload): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', payload)
  },
  me(): Promise<User> {
    return apiClient.get<User>('/auth/me')
  },
}
```

`src/services/categoryService.ts`:

```ts
import type { Category } from '../types/entities'
import { apiClient } from './api/apiClient'

export const categoryService = {
  list(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories')
  },
}
```

`src/services/serviceService.ts`:

```ts
import type { Paginated, ServiceFilters } from '../types/api'
import type { Service, ServiceDetail } from '../types/entities'
import { apiClient } from './api/apiClient'

export const serviceService = {
  list(filters: ServiceFilters): Promise<Paginated<Service>> {
    return apiClient.get<Paginated<Service>>('/services', { ...filters })
  },
  featured(limit: number): Promise<Service[]> {
    return apiClient.get<Service[]>('/services/featured', { limit })
  },
  getById(id: string): Promise<ServiceDetail> {
    return apiClient.get<ServiceDetail>(`/services/${encodeURIComponent(id)}`)
  },
}
```

`src/services/requestService.ts`:

```ts
import type { ProducerDashboard, RequestStatusFilter } from '../types/api'
import type { ServiceRequest } from '../types/entities'
import { apiClient } from './api/apiClient'

export const requestService = {
  list(status: RequestStatusFilter): Promise<ServiceRequest[]> {
    return apiClient.get<ServiceRequest[]>('/requests', { status: status === 'all' ? undefined : status })
  },
  getDashboard(): Promise<ProducerDashboard> {
    return apiClient.get<ProducerDashboard>('/dashboard')
  },
}
```

- [ ] **Step 2: Write `docs/api-contract.md`**

````markdown
# AgroServ — Contrato da API REST

Este é o contrato que o front-end já consome. O back-end da próxima etapa deve implementá-lo exatamente.
Hoje as respostas vêm do adaptador mock (`src/services/api/mockRoutes.ts`), que segue estas mesmas regras.

## Configuração do front-end

| Variável | Valores | Padrão |
|---|---|---|
| `VITE_API_MODE` | `mock` ou `http` | `mock` |
| `VITE_API_URL` | URL base da API | `http://localhost:3333` |

Para usar a API real, crie `.env` com `VITE_API_MODE=http` e `VITE_API_URL=<url>`. Nenhum componente precisa mudar.

## Convenções

- JSON em requisições e respostas. IDs `string`. Datas ISO 8601 (`2026-10-15`). Valores em reais como `number`.
- Autenticação: `Authorization: Bearer <token>`, token obtido em `POST /auth/login`.
- Listas paginadas: `{ "data": T[], "meta": { "page", "pageSize", "total", "totalPages" } }`.
- Erros: status HTTP + corpo `{ "status": number, "code": string, "message": string }`. A `message` é exibida ao usuário (PT-BR).

| Status | `code` | Quando |
|---|---|---|
| 400 | `validation_error`, `invalid_status` | Corpo ou parâmetro inválido |
| 401 | `invalid_credentials`, `unauthorized` | Login incorreto ou token ausente/inválido |
| 404 | `service_not_found`, `route_not_found` | Recurso inexistente |

## Tipos

Definidos em `src/types/entities.ts` e `src/types/api.ts`: `User`, `Category`, `Provider`, `Service`, `ServiceDetail`, `ServiceRequest`, `ProducerDashboard`.

## Endpoints

### `POST /auth/login`
Corpo: `{ "email": string, "password": string }`. E-mail comparado sem diferenciar maiúsculas e sem espaços nas pontas.
200: `{ "token": string, "user": User }`. 400 se faltar campo. 401 `invalid_credentials` com a mensagem `E-mail ou senha inválidos.`

### `GET /auth/me` (autenticado)
200: `User`. 401 se o token for inválido. O front apaga a sessão somente nesse caso.

### `GET /categories`
200: `Category[]`.

### `GET /services`
Query (todas opcionais):

| Parâmetro | Regra |
|---|---|
| `q` | Todos os termos devem aparecer em título, descrição, prestador, categoria ou cidade. Sem diferenciar acento, caixa ou pontuação. |
| `location` | Todos os termos devem aparecer em cidade + UF (`Santa Helena, PR` encontra `Santa Helena - PR`). |
| `category` | `slug` da categoria. Slug inexistente retorna lista vazia. |
| `page` | Inteiro ≥ 1. Padrão 1. |
| `pageSize` | Inteiro ≥ 1, máximo 60. Padrão 9. |

200: `Paginated<Service>`.

### `GET /services/featured`
Query: `limit` (padrão 4, máximo 12). 200: `Service[]` disponíveis, ordenados por avaliação e número de avaliações.

### `GET /services/:id`
200: `ServiceDetail` (serviço + `provider` + `category`). 404 `service_not_found`.

### `GET /requests` (autenticado)
Query: `status` opcional (`pending`, `accepted`, `in_progress`, `completed`, `cancelled` ou `all`). Status inválido: 400 `invalid_status`.
200: `ServiceRequest[]` do usuário autenticado, ordenadas por `scheduledDate` decrescente.

### `GET /dashboard` (autenticado)
200: `ProducerDashboard`:
- `stats.open`: solicitações `pending` + `accepted`
- `stats.inProgress`: `in_progress`
- `stats.completed`: `completed`
- `stats.totalSpent`: soma de `value` em `accepted`, `in_progress` e `completed`
- `recentRequests`: as 5 mais recentes por `scheduledDate`

## Próximos endpoints previstos

Ver `docs/backlog.md`: cadastro, criação e cancelamento de solicitações, favoritos e perfil.
````

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/services/*.ts docs/api-contract.md
git commit -m "feat: add resource services and document the API contract"
```

---

### Task 2.5: Data hooks

**Files:**
- Create: `src/hooks/useAsync.ts`, `src/hooks/useServices.ts`, `src/hooks/useRequests.ts`
- Test: `src/hooks/useAsync.test.ts`

**Interfaces:**
- Consumes: services from Task 2.4.
- Produces: `interface AsyncState<T> { data: T | null; error: Error | null; isLoading: boolean; refetch: () => void }`; `useAsync<T>(fetcher: () => Promise<T>): AsyncState<T>` (fetcher must be stable — wrap in `useCallback`); `useServices(filters: ServiceFilters)`, `useFeaturedServices(limit: number)`, `useService(id: string)`, `useCategories()`, `useRequests(status: RequestStatusFilter)`, `useDashboard()` — each returns `AsyncState` of the matching service result.

- [ ] **Step 1: Write the failing test `src/hooks/useAsync.test.ts`**

```ts
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsync } from './useAsync'

describe('useAsync', () => {
  it('starts loading and resolves data', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok')
    const { result } = renderHook(() => useAsync(fetcher))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    await waitFor(() => expect(result.current.data).toBe('ok'))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('exposes errors', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useAsync(fetcher))
    await waitFor(() => expect(result.current.error?.message).toBe('boom'))
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('wraps non-Error rejections', async () => {
    const fetcher = vi.fn().mockRejectedValue('nope')
    const { result } = renderHook(() => useAsync(fetcher))
    await waitFor(() => expect(result.current.error?.message).toBe('Erro inesperado.'))
  })

  it('keeps previous data while refetching', async () => {
    let resolveSecond: (value: string) => void = () => {}
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce('first')
      .mockImplementationOnce(() => new Promise<string>((resolve) => (resolveSecond = resolve)))
    const { result } = renderHook(() => useAsync(fetcher))
    await waitFor(() => expect(result.current.data).toBe('first'))
    act(() => result.current.refetch())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBe('first')
    await act(async () => resolveSecond('second'))
    expect(result.current.data).toBe('second')
    expect(result.current.isLoading).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useAsync.test.ts`
Expected: FAIL — cannot resolve `./useAsync`.

- [ ] **Step 3: Write `src/hooks/useAsync.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  refetch: () => void
}

interface SettledResult<T> {
  fetcher: () => Promise<T>
  reloadToken: number
  data: T | null
  error: Error | null
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Erro inesperado.')
}

export function useAsync<T>(fetcher: () => Promise<T>): AsyncState<T> {
  const [reloadToken, setReloadToken] = useState(0)
  const [settled, setSettled] = useState<SettledResult<T> | null>(null)

  useEffect(() => {
    let active = true
    fetcher()
      .then((data) => {
        if (active) setSettled({ fetcher, reloadToken, data, error: null })
      })
      .catch((error: unknown) => {
        if (active) setSettled({ fetcher, reloadToken, data: null, error: toError(error) })
      })
    return () => {
      active = false
    }
  }, [fetcher, reloadToken])

  const refetch = useCallback(() => setReloadToken((token) => token + 1), [])
  const isCurrent = settled !== null && settled.fetcher === fetcher && settled.reloadToken === reloadToken

  return {
    data: settled?.data ?? null,
    error: isCurrent ? settled.error : null,
    isLoading: !isCurrent,
    refetch,
  }
}
```

- [ ] **Step 4: Write `src/hooks/useServices.ts` and `src/hooks/useRequests.ts`**

`src/hooks/useServices.ts`:

```ts
import { useCallback } from 'react'
import { categoryService } from '../services/categoryService'
import { serviceService } from '../services/serviceService'
import type { ServiceFilters } from '../types/api'
import { useAsync } from './useAsync'

export function useServices({ q, location, category, page, pageSize }: ServiceFilters) {
  const fetcher = useCallback(
    () => serviceService.list({ q, location, category, page, pageSize }),
    [q, location, category, page, pageSize],
  )
  return useAsync(fetcher)
}

export function useFeaturedServices(limit: number) {
  const fetcher = useCallback(() => serviceService.featured(limit), [limit])
  return useAsync(fetcher)
}

export function useService(id: string) {
  const fetcher = useCallback(() => serviceService.getById(id), [id])
  return useAsync(fetcher)
}

export function useCategories() {
  return useAsync(categoryService.list)
}
```

`src/hooks/useRequests.ts`:

```ts
import { useCallback } from 'react'
import { requestService } from '../services/requestService'
import type { RequestStatusFilter } from '../types/api'
import { useAsync } from './useAsync'

export function useRequests(status: RequestStatusFilter) {
  const fetcher = useCallback(() => requestService.list(status), [status])
  return useAsync(fetcher)
}

export function useDashboard() {
  return useAsync(requestService.getDashboard)
}
```

- [ ] **Step 5: Run tests, typecheck and lint**

Run: `npx vitest run src/hooks && npx tsc -b && npm run lint`
Expected: PASS; tsc exit 0; lint without errors. If lint flags a React Hooks rule inside `useAsync`, keep the behavior covered by the tests and adjust only the flagged expression.

- [ ] **Step 6: Commit**

```bash
git add src/hooks
git commit -m "feat: add useAsync and data hooks for services and requests"
```
