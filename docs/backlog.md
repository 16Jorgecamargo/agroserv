# AgroServ — Backlog (escopo adiado)

Itens planejados no design completo e retirados da primeira entrega para manter o projeto mínimo, conforme os requisitos do professor. Ficam aqui para as próximas etapas.

## O que foi adiado

### Funcionalidades do produtor
- Cadastro de conta (`/cadastro`) com escolha de papel
- Criação de solicitação (modal "Solicitar serviço" com data, horário, local, área, observações e confirmação animada)
- Detalhe da solicitação (`/solicitacoes/:id`) com timeline e cancelamento (`PATCH /requests/:id`)
- Favoritos (`/favoritos`, `GET/POST/DELETE /me/favorites`, coração animado)
- Perfil (`/perfil`, `ProfileForm` em modo visualização/edição, `PATCH /me`)
- Configurações (`/configuracoes`: tema, notificações, restaurar dados demo)
- Contratos (`/contratos`) e Mensagens (`/mensagens`)
- Notificações no header (`GET /me/notifications`)
- "Lembrar de mim" (localStorage vs sessionStorage) e "Esqueci minha senha"

### Área do prestador
- Papéis (`producer` / `provider`) e `ProtectedRoute` com `allowedRoles`
- `ProviderLayout` e `/prestador/dashboard` (KPIs, solicitações recebidas, agenda, faturamento)
- Rotas `/prestador/servicos`, `/prestador/solicitacoes`, `/prestador/agenda`
- Aceitar/recusar solicitações

### Páginas públicas
- `/prestadores` e `/prestadores/:id` (listagem e perfil do prestador)
- `/sobre` e `/como-funciona`
- Seções extras da home: "Como funciona", números da plataforma, CTA para prestadores

### Interface e experiência
- Mapa com Leaflet + OpenStreetMap em `/servicos` (pins, raio, "N prestadores próximos")
- Filtros avançados: preço, avaliação mínima, disponibilidade, ordenação, alternância grid/lista
- Dark mode (`ThemeContext`, tokens dark, persistência em `agroserv_theme`)
- Sistema de toasts (`ToastContext`)
- Gráficos (sparklines nos KPIs, barras de gastos mensais)
- Galeria de imagens, equipamentos e avaliações no detalhe do serviço
- Componentes: Modal, ConfirmDialog, Drawer, Dropdown, Tabs, DataTable genérico, Select, Textarea, Checkbox
- Animações extras: transição com `AnimatePresence`, modal, dropdown, toast
- Lazy loading de páginas (`React.lazy` + `Suspense`)

### Back-end simulado
- `mockDb` com persistência em localStorage (dados criados sobrevivem ao F5)
- Endpoints de escrita: `POST /auth/register`, `POST /requests`, `PATCH /requests/:id`, `PATCH /me`, favoritos
- Entidades `Equipment`, `Review`, `Notification`

## Design completo original

O design aprovado antes da redução de escopo segue abaixo, sem alterações, como referência.

---

# AgroServ — Design Spec

Data: 2026-10-07
Status: aprovado em conversa, aguardando revisão escrita

## 1. Contexto e objetivo

AgroServ é um marketplace web que conecta **produtores rurais** a **prestadores de serviços agrícolas** (máquinas, equipamentos, mão de obra).

Projeto acadêmico em duas etapas:

1. **Etapa atual:** front-end completo, com back-end simulado.
2. **Próxima etapa da disciplina:** back-end real (API REST) conectado a este mesmo projeto.

**Princípio central:** o front-end consome um **contrato de API** desde o primeiro dia. A próxima etapa implementa esse contrato no servidor e troca o modo de execução via variável de ambiente, sem retrabalho em componentes, hooks ou services.

### Critérios de sucesso

- Fluxo completo navegável: Home → Serviços → Detalhes → Login → (volta ao serviço) → Solicitar → Dashboard → Solicitações → Perfil → Logout.
- Rotas privadas protegidas, com retorno à rota original após login e controle por papel (produtor/prestador).
- Visual de SaaS B2B profissional, fiel à imagem de referência `docs/reference/visual-reference.jpeg`.
- Arquitetura em camadas visível: `types → services/api → services → hooks → components/pages`.
- `docs/api-contract.md` completo, servindo de especificação para o back-end.
- `tsc`, `eslint`, `vitest` e `vite build` sem erros; console do navegador limpo.

### Regras do projeto

- Código **sem comentários**.
- Variáveis, funções, tipos e arquivos **em inglês**.
- Textos de interface em **PT-BR**. URLs em PT-BR, conforme o enunciado.

## 2. Stack

| Item | Escolha |
|---|---|
| Build | Vite + React 19 + TypeScript (strict) |
| Rotas | React Router v7 (modo biblioteca, `BrowserRouter`) |
| Estilo | Tailwind CSS v4 (`@tailwindcss/vite`) com tokens em CSS variables |
| Ícones | lucide-react |
| Animação | framer-motion |
| Mapa | leaflet + react-leaflet, tiles OpenStreetMap |
| Fonte | Manrope via `@fontsource-variable/manrope` (local) |
| Estado global | Context API (sem Zustand) |
| Testes | Vitest + @testing-library/react + jsdom |
| Lint | ESLint (config padrão do template Vite) |

Imagens: fotos curadas baixadas em `src/assets/images/` (funciona offline). Só os tiles do mapa precisam de internet.

## 3. Estrutura de pastas

```
agroserv/
├── docs/
│   ├── api-contract.md
│   ├── reference/visual-reference.jpeg
│   └── superpowers/specs/
├── public/
├── src/
│   ├── assets/images/
│   ├── types/
│   │   ├── entities.ts
│   │   └── api.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── httpAdapter.ts
│   │   │   ├── mockAdapter.ts
│   │   │   ├── mockRoutes.ts
│   │   │   ├── mockDb.ts
│   │   │   └── apiError.ts
│   │   ├── authService.ts
│   │   ├── serviceService.ts
│   │   ├── providerService.ts
│   │   ├── categoryService.ts
│   │   ├── requestService.ts
│   │   ├── reviewService.ts
│   │   ├── favoriteService.ts
│   │   ├── userService.ts
│   │   └── dashboardService.ts
│   ├── data/
│   │   ├── users.ts
│   │   ├── providers.ts
│   │   ├── services.ts
│   │   ├── categories.ts
│   │   ├── equipments.ts
│   │   ├── requests.ts
│   │   ├── reviews.ts
│   │   └── notifications.ts
│   ├── hooks/
│   │   ├── useAsync.ts
│   │   ├── useAuth.ts
│   │   ├── useServices.ts
│   │   ├── useService.ts
│   │   ├── useProviders.ts
│   │   ├── useRequests.ts
│   │   ├── useFavorites.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── useMediaQuery.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── ToastContext.tsx
│   │   └── FavoritesContext.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── domain/
│   │   ├── layout/
│   │   └── motion/
│   ├── layouts/
│   │   ├── PublicLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   ├── ProducerLayout.tsx
│   │   └── ProviderLayout.tsx
│   ├── pages/
│   │   ├── public/
│   │   ├── auth/
│   │   ├── producer/
│   │   └── provider/
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── GuestRoute.tsx
│   │   └── paths.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── format.ts
│   │   ├── validators.ts
│   │   ├── motion.ts
│   │   ├── storage.ts
│   │   └── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
└── package.json
```

Responsabilidades:

- `types/` não importa nada do projeto.
- `data/` contém só seeds e é importado **exclusivamente** por `services/api/mockDb.ts`.
- `services/api/` é o único lugar que conhece transporte (mock ou HTTP).
- `services/*Service.ts` expõem funções tipadas por recurso e chamam só o `apiClient`.
- `hooks/` chamam services e expõem `{ data, isLoading, error, refetch }`.
- Componentes e páginas nunca importam `data/` nem `services/api/`.

## 4. Modelo de dados (`types/entities.ts`)

```ts
type Role = 'producer' | 'provider';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatarUrl?: string;
  location: Location;
  document?: string;
  farmName?: string;
  farmAreaHectares?: number;
  providerId?: string;
  createdAt: string;
}

interface Location {
  city: string;
  state: string;
  lat: number;
  lng: number;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  serviceCount: number;
}

interface Equipment {
  id: string;
  providerId: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  capacity?: string;
  imageUrl?: string;
}

interface Provider {
  id: string;
  userId: string;
  name: string;
  companyName: string;
  avatarUrl?: string;
  specialty: string;
  bio: string;
  location: Location;
  serviceRadiusKm: number;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  yearsOfExperience: number;
  verified: boolean;
  categoryIds: string[];
}

type PriceUnit = 'hour' | 'hectare' | 'day' | 'trip' | 'fixed';

interface Service {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  providerId: string;
  location: Location;
  price: number;
  priceUnit: PriceUnit;
  rating: number;
  reviewCount: number;
  available: boolean;
  imageUrl: string;
  gallery: string[];
  equipmentIds: string[];
  tags: string[];
  createdAt: string;
}

interface ServiceDetail extends Service {
  provider: Provider;
  category: Category;
  equipments: Equipment[];
}

type RequestStatus =
  | 'pending'
  | 'in_review'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface ServiceRequest {
  id: string;
  serviceId: string;
  providerId: string;
  producerId: string;
  scheduledDate: string;
  scheduledTime: string;
  propertyLocation: string;
  areaHectares: number;
  notes?: string;
  status: RequestStatus;
  estimatedValue: number;
  statusHistory: { status: RequestStatus; at: string }[];
  createdAt: string;
  updatedAt: string;
}

interface ServiceRequestDetail extends ServiceRequest {
  service: Service;
  provider: Provider;
}

interface Review {
  id: string;
  serviceId: string;
  providerId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Notification {
  id: string;
  userId: string;
  type: 'request' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
```

Convenções: IDs `string`; datas ISO 8601; dinheiro em `number` (BRL); relacionamentos por ID; respostas de detalhe trazem relações expandidas (`ServiceDetail`, `ServiceRequestDetail`).

## 5. Contrato de API (`types/api.ts` + `docs/api-contract.md`)

### Formatos comuns

```ts
interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface ApiErrorBody {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}
```

Autenticação: header `Authorization: Bearer <token>`. Erros: 400 validação, 401 não autenticado, 403 papel sem permissão, 404 não encontrado.

### Endpoints

| Método | Path | Auth | Query / Body | Resposta |
|---|---|---|---|---|
| POST | `/auth/login` | — | `{ email, password }` | `{ token, user }` |
| POST | `/auth/register` | — | `{ name, email, phone, password, role, city, state }` | `{ token, user }` |
| GET | `/auth/me` | sim | — | `User` |
| POST | `/auth/logout` | sim | — | `204` |
| GET | `/categories` | — | — | `Category[]` |
| GET | `/services` | — | `q, category, location, minPrice, maxPrice, minRating, available, sort, page, pageSize` | `Paginated<Service>` |
| GET | `/services/featured` | — | `limit` | `Service[]` |
| GET | `/services/:id` | — | — | `ServiceDetail` |
| GET | `/services/:id/reviews` | — | `page, pageSize` | `Paginated<Review>` |
| GET | `/providers` | — | `q, specialty, location, minRating, lat, lng, radiusKm, page, pageSize` | `Paginated<Provider>` |
| GET | `/providers/:id` | — | — | `Provider & { services: Service[]; equipments: Equipment[] }` |
| GET | `/providers/:id/reviews` | — | `page, pageSize` | `Paginated<Review>` |
| GET | `/requests` | produtor | `status, page, pageSize` | `Paginated<ServiceRequestDetail>` |
| GET | `/requests/:id` | dono | — | `ServiceRequestDetail` |
| POST | `/requests` | produtor | `{ serviceId, scheduledDate, scheduledTime, propertyLocation, areaHectares, notes? }` | `ServiceRequest` (201) |
| PATCH | `/requests/:id` | dono | `{ status: 'cancelled' }` | `ServiceRequest` |
| GET | `/me/favorites` | sim | — | `Service[]` |
| POST | `/me/favorites` | sim | `{ serviceId }` | `204` |
| DELETE | `/me/favorites/:serviceId` | sim | — | `204` |
| PATCH | `/me` | sim | `Partial<User>` sem `id, role, email` | `User` |
| GET | `/me/notifications` | sim | — | `Notification[]` |
| GET | `/dashboard/producer` | produtor | — | `ProducerDashboard` |
| GET | `/dashboard/provider` | prestador | — | `ProviderDashboard` |

```ts
interface ProducerDashboard {
  stats: { open: number; inProgress: number; completed: number; totalSpent: number };
  monthlySpending: { month: string; value: number }[];
  recentRequests: ServiceRequestDetail[];
  upcoming: ServiceRequestDetail[];
}

interface ProviderDashboard {
  stats: { received: number; active: number; completed: number; rating: number; revenue: number };
  monthlyRevenue: { month: string; value: number }[];
  incomingRequests: ServiceRequestDetail[];
  schedule: { date: string; items: ServiceRequestDetail[] }[];
}
```

`estimatedValue` de uma solicitação é calculado pelo servidor: `price × areaHectares` quando `priceUnit = 'hectare'`; caso contrário, `price` × unidade estimada (8h para `hour`, 1 para os demais).

## 6. Camada de transporte

```ts
interface HttpAdapter {
  request<T>(config: { method: HttpMethod; path: string; query?: QueryParams; body?: unknown; token?: string | null }): Promise<T>;
}
```

- `apiClient.ts` expõe `get`, `post`, `patch` e `delete`. Lê o token via `utils/storage.ts` e escolhe o adaptador por `import.meta.env.VITE_API_MODE` (`mock` por padrão).
- `httpAdapter.ts` usa `fetch` com `VITE_API_URL`, serializa a query, converte respostas não-2xx em `ApiError`. Status `204` retorna `undefined`.
- `mockAdapter.ts` aplica latência aleatória de 300–600 ms, resolve a rota em `mockRoutes.ts` por método + padrão de path (`/services/:id`), valida o token, retorna clone profundo do resultado e lança `ApiError` com o mesmo formato do HTTP. Suporta `?mockError=1` na URL da página para forçar erro 500 e demonstrar o estado de erro.
- `mockRoutes.ts` implementa a lógica de servidor: filtros, ordenação, paginação, expansão de relações, cálculo de `estimatedValue`, regras de permissão (401/403/404) e validação de payload (400 com `fieldErrors`).
- `mockDb.ts` carrega seeds de `data/` na primeira execução e persiste coleções mutáveis (`users`, `requests`, `favorites`) em `localStorage` (`agroserv_db_v1`). Expõe `reset()` para a tela de configurações.
- Token mock: `mock.<base64(userId)>.<timestamp>`.

Troca para o back-end real: `.env` com `VITE_API_MODE=http` e `VITE_API_URL=http://localhost:3333`. Nenhum outro arquivo muda.

## 7. Estado global e hooks

| Context | Estado | Persistência |
|---|---|---|
| `AuthContext` | `user, isAuthenticated, isLoading, login, register, logout, updateUser` | token em `localStorage` (lembrar de mim) ou `sessionStorage`; chaves `agroserv_token`, `agroserv_user` |
| `ThemeContext` | `theme: 'light' \| 'dark' \| 'system'`, `resolvedTheme`, `setTheme`, `toggle` | `agroserv_theme` |
| `ToastContext` | `toast.success/error/info(message)`, fila com auto-dismiss em 4 s | — |
| `FavoritesContext` | `favoriteIds: Set<string>`, `isFavorite`, `toggleFavorite` | servidor (`/me/favorites`); visitante deslogado é enviado ao login |

Fluxo de boot do `AuthContext`: lê o token; se existe, chama `GET /auth/me`; com 401 limpa a sessão. `isLoading` fica `true` até concluir.

`useAsync(fn, deps)` é a base genérica dos hooks de dados e retorna `{ data, isLoading, error, refetch }`. Hooks como `useServices(filters)` usam `useMemo` para estabilizar filtros e `useDebounce` (300 ms) para o campo de texto.

`toggleFavorite` aplica atualização otimista e reverte em caso de erro, com os toasts "Serviço adicionado aos favoritos." e "Serviço removido dos favoritos."

## 8. Rotas

URLs centralizadas em `routes/paths.ts`. Páginas carregadas com `React.lazy` + `Suspense`. `AnimatePresence` com `PageTransition` no outlet de cada layout.

| Grupo | Guarda | Layout | Rotas |
|---|---|---|---|
| Público | — | `PublicLayout` | `/`, `/servicos`, `/servicos/:id`, `/prestadores`, `/prestadores/:id`, `/sobre`, `/como-funciona` |
| Visitante | `GuestRoute` | `AuthLayout` | `/login`, `/cadastro` |
| Produtor | `ProtectedRoute allowedRoles={['producer']}` | `ProducerLayout` | `/dashboard`, `/solicitacoes`, `/solicitacoes/:id`, `/contratos`, `/favoritos`, `/mensagens`, `/perfil`, `/configuracoes` |
| Prestador | `ProtectedRoute allowedRoles={['provider']}` | `ProviderLayout` | `/prestador/dashboard`, `/prestador/servicos`, `/prestador/solicitacoes`, `/prestador/agenda` |
| — | — | `PublicLayout` | `*` → `NotFoundPage` |

`/buscar` redireciona para `/servicos`. O item "Buscar serviços" da sidebar aponta para `/servicos`.

`/perfil` e `/configuracoes` também ficam disponíveis no layout do prestador, como `/prestador/perfil` e `/prestador/configuracoes`, reutilizando as mesmas páginas.

### ProtectedRoute

1. `isLoading` → `FullScreenLoader`.
2. Não autenticado → `<Navigate to="/login" replace state={{ from: location, reason: 'auth_required' }} />`.
3. Papel fora de `allowedRoles` → redireciona ao dashboard do próprio papel.
4. Caso contrário → `<Outlet />`.

`GuestRoute`: usuário autenticado é redirecionado ao dashboard do papel.

Login com sucesso: navega para `state.from` (path + search) se existir; senão, para o dashboard do papel. Com `reason === 'auth_required'`, a página mostra o alerta "Faça login para acessar esta área."

"Solicitar serviço" deslogado: navega para `/login` com `from = /servicos/:id?request=1`. A página de detalhe abre o modal quando `request=1` e o usuário é produtor, depois remove o parâmetro. Para prestador, o botão fica desabilitado com a dica "Disponível para produtores".

Contas demo (seed): `produtor@agroserv.com` / `123456` e `prestador@agroserv.com` / `123456`. A tela de login tem botões "Entrar como produtor" e "Entrar como prestador", que preenchem os campos.

## 9. Design system

### Tokens (`index.css`, expostos via `@theme`)

| Token | Light | Dark |
|---|---|---|
| `--color-bg` | `#F7F8F5` | `#0F1511` |
| `--color-surface` | `#FFFFFF` | `#161E19` |
| `--color-surface-muted` | `#EEF1EC` | `#1D2721` |
| `--color-border` | `#E4E8E1` | `#26322B` |
| `--color-text` | `#17201A` | `#E8EDE9` |
| `--color-text-muted` | `#667085` | `#98A29C` |
| `--color-primary` | `#2F6B45` | `#7FB685` |
| `--color-primary-strong` | `#173F2A` | `#A8D3AD` |
| `--color-primary-soft` | `#E6F0E8` | `#1F3326` |
| `--color-on-primary` | `#FFFFFF` | `#0F1511` |
| `--color-warning` | `#B7791F` | `#E0B060` |
| `--color-danger` | `#B42318` | `#F08A80` |
| `--color-info` | `#2B5C8A` | `#8AB4DE` |

Dark mode via classe `.dark` em `<html>`, aplicada por `ThemeContext` e por um script inline no `index.html` antes do primeiro paint.

### Forma e profundidade

- Raio: cards 10px, inputs/botões 8px, badges/avatares `full`.
- Borda 1px `--color-border` em cards e inputs.
- Sombra base `0 1px 2px rgb(16 24 20 / 0.04)`; hover `0 8px 24px -12px rgb(16 24 20 / 0.18)`.
- Verde reservado a: CTA principal, item ativo, pins do mapa, "Disponível", foco.

### Tipografia (Manrope)

| Nível | Tamanho/altura | Peso |
|---|---|---|
| H1 | 48/56 (mobile 36/44), tracking -0.02em | 800 |
| H2 | 30/38 | 700 |
| H3 | 18/26 | 600 |
| Corpo | 15/24 | 400 |
| Secundário | 13/20, `text-muted` | 400–500 |
| Botão | 14–15 | 600 |

Números de KPI e tabelas com `tabular-nums`.

### Status de solicitação

| Status | Label | Cor |
|---|---|---|
| `pending` | Pendente | warning |
| `in_review` | Em análise | info |
| `accepted` | Aceito | primary |
| `in_progress` | Em andamento | info forte |
| `completed` | Concluído | primary-strong |
| `cancelled` | Cancelado | danger |

### Componentes

**`components/ui/`:** Button, IconButton, Input, Select, Textarea, Checkbox, Modal, ConfirmDialog, Drawer, Card, Badge, StatusBadge, Avatar, Rating, Skeleton, EmptyState, ErrorState, Tabs, Dropdown, Breadcrumbs, Pagination, DataTable, Toaster, ThemeToggle, FullScreenLoader, Alert.

- `DataTable<T>` recebe `columns: Column<T>[]`, `rows`, `getRowId`, `isLoading` e `emptyState`. Abaixo de `md`, renderiza cada linha como card.
- `Modal` e `Drawer`: portal, focus trap, Esc fecha, foco volta ao gatilho, `aria-modal`.

**`components/domain/`:** ServiceCard, ProviderCard, CategoryCard, SearchBar, FilterPanel, MapView, FavoriteButton, StatsCard, Sparkline, BarChart, RequestForm, RequestSuccess, ProfileForm, RequestTimeline, ReviewList, RatingDistribution, EquipmentCard.

- `MapView` recebe `markers: { id; lat; lng; label; href? }[]`, `center`, `radiusKm?`. É o único arquivo que importa Leaflet.
- `ProfileForm` recebe `mode: 'view' | 'edit'`, `initialValues` e `onSubmit`. Reutilizado em `/perfil` e no cadastro.

**`components/layout/`:** Navbar, Footer, Sidebar, DashboardHeader, MobileNav, SkipLink, Logo.

- Navbar: sticky; com scroll > 8px aplica `backdrop-blur` + fundo translúcido + borda inferior. No mobile, menu em Drawer.
- Sidebar: recolhível no desktop (estado em `useLocalStorage`), Drawer no mobile. "Sair" abre ConfirmDialog.

**`components/motion/`:** PageTransition, FadeIn, AnimatedCard, AnimatedList, AnimatedItem, ModalAnimation, DropdownAnimation, ToastAnimation.

### Motion

Presets em `utils/motion.ts`:

- `fadeUp`: `opacity 0→1`, `y 20→0`, 0.4 s, ease `[0.22, 1, 0.36, 1]`.
- `staggerContainer`: `staggerChildren: 0.05`.
- Card hover: `y: -4`, `scale: 1.01`, 0.2 s. Botão tap: `scale: 0.98`.
- Favorito: `scale [1, 1.3, 1]`.
- Modal: backdrop fade + painel `scale 0.98→1` e `y 8→0`. Drawer: slide lateral.
- Toast: entra pela direita/baixo, sai com fade; layout animado ao empilhar.
- Hero: cards flutuantes com oscilação de 4px em loop lento.

`MotionConfig reducedMotion="user"` na raiz. Sem animação em tabelas, campos de formulário e texto corrido.

### Acessibilidade

HTML semântico (`header`, `nav`, `main`, `aside`, `footer`), skip-link, `label` em todo input, `aria-invalid` + `aria-describedby` nos erros, `aria-live="polite"` no Toaster, `aria-label` em botões de ícone, foco visível `ring-2` em todos os interativos, ações em `<button>` e navegação em `<Link>`, contraste AA nos pares de tokens.

## 10. Páginas

### Públicas

**Home (`/`)**

1. Hero em duas colunas: H1 "Encontre o serviço agrícola certo para sua propriedade.", subtítulo, CTAs "Encontrar serviços" (→ `/servicos`) e "Oferecer meus serviços" (→ `/cadastro?role=provider`). À direita, foto de lavoura com cards flutuantes ("Pulverização · Disponível", mini-gráfico de área atendida, pin "Santa Helena - PR", "4.9 ★ · 128 serviços").
2. SearchBar grande: "Qual serviço você precisa?", "Localização", "Quando?", botão "Buscar" → `/servicos?q=&location=&date=`.
3. "Encontre o serviço que precisa": 8 CategoryCards (Plantio, Colheita, Irrigação, Pulverização, Fertilização, Transporte, Manutenção, Máquinas) com ícones Lucide → `/servicos?category=slug`.
4. "Serviços em destaque": grid de ServiceCards (`GET /services/featured`).
5. "Como funciona": 3 passos.
6. Números da plataforma.
7. CTA para prestadores.
8. Footer.

**Serviços (`/servicos`)** — layout da referência

- Breadcrumbs, título "Encontre serviços agrícolas", SearchBar.
- Linha de filtros: categoria, localização, faixa de preço, avaliação mínima, "Somente disponíveis".
- Abaixo de `lg`: botão "Filtros" abre FilterPanel em Drawer.
- Corpo em duas colunas no desktop: MapView sticky à esquerda (pins dos prestadores, círculo de raio, legenda "N prestadores encontrados próximos a você") e resultados à direita ("Encontramos N serviços", ordenação, alternância grid/lista, grid 2 colunas).
- Mobile: mapa escondido, botão "Ver no mapa" abre Drawer.
- Estado dos filtros sincronizado com `useSearchParams`.
- Paginação "Carregar mais" (`pageSize` 8).
- Estados: skeleton de cards, ErrorState com "Tentar novamente", EmptyState "Não encontramos serviços para essa busca." com "Limpar filtros".

**Detalhe do serviço (`/servicos/:id`)**

- Breadcrumbs; galeria (principal + miniaturas); título, categoria, rating, localização, FavoriteButton.
- Descrição, tags, equipamentos (EquipmentCards), avaliações (RatingDistribution + ReviewList).
- Card lateral sticky: preço com unidade, disponibilidade, resumo do prestador (avatar, nome, rating, experiência, link para o perfil), botão "Solicitar serviço".
- Modal com RequestForm: data desejada, horário, local da propriedade, área aproximada (ha), observações, valor estimado ao vivo. Botão "Enviar solicitação".
- Sucesso: RequestSuccess com check animado (`pathLength`), toast "Solicitação enviada." e ações "Ver solicitação" e "Continuar navegando".
- 404: EmptyState "Serviço não encontrado" com link para `/servicos`.

**Prestadores (`/prestadores`)**: busca, filtros por especialidade e cidade, grid de ProviderCards (avatar, nome, especialidade, cidade, rating, serviços realizados, experiência, "Ver perfil"). Loading, vazio e erro.

**Perfil do prestador (`/prestadores/:id`)**: cabeçalho com avatar, selo verificado, KPIs, bio; abas Serviços, Equipamentos e Avaliações; MapView com raio de atendimento.

**Sobre (`/sobre`) e Como funciona (`/como-funciona`)**: páginas institucionais curtas, com seções e FadeIn.

**404**: EmptyState com link para a home.

### Autenticação

**Login (`/login`)**: AuthLayout dividido (esquerda: foto com overlay escuro, logo e depoimento/métricas; direita: card). Título "Bem-vindo de volta", E-mail, Senha (mostrar/ocultar), "Lembrar de mim", "Entrar", "Esqueci minha senha" (toast informativo), "Criar conta", botões de conta demo. Erro de credencial inline.

**Cadastro (`/cadastro`)**: escolha de papel (cards Produtor/Prestador; `?role=provider` pré-seleciona), nome, e-mail, telefone, cidade, UF, senha, confirmação. Ao concluir, faz login e vai ao dashboard do papel.

### Área do produtor (`ProducerLayout`)

Sidebar: Dashboard, Buscar serviços, Minhas solicitações, Contratos, Favoritos, Mensagens, Perfil, Configurações, Sair. Header: título da página, busca rápida, ThemeToggle, sino de notificações (Dropdown), menu do usuário.

- **Dashboard**: saudação; 4 StatsCards (Solicitações abertas, Em andamento, Concluídos, Total contratado) com sparkline; BarChart de gastos mensais; "Solicitações recentes" em DataTable (Serviço, Prestador, Data, Status, Valor, Ação); "Próximos serviços".
- **Solicitações (`/solicitacoes`)**: Tabs com contagem (Todos, Pendentes, Aceitas, Em andamento, Concluídas, Canceladas; "Pendentes" agrupa `pending` + `in_review`); DataTable com Serviço, Prestador, Data, Local, Status, Valor, "Ver detalhes".
- **Detalhe (`/solicitacoes/:id`)**: RequestTimeline, dados do serviço, do prestador e da solicitação; "Cancelar solicitação" (só em `pending`/`in_review`/`accepted`) com ConfirmDialog → `PATCH /requests/:id`.
- **Contratos (`/contratos`)**: solicitações `accepted`, `in_progress` e `completed` em formato de contrato (valor, período, prestador).
- **Favoritos (`/favoritos`)**: grid de ServiceCards; EmptyState com link para `/servicos`.
- **Mensagens (`/mensagens`)**: lista de conversas mock à esquerda e painel de conversa à direita, somente leitura, com aviso "Envio de mensagens disponível em breve".
- **Perfil (`/perfil`)**: cabeçalho com avatar, nome, tipo de usuário; ProfileForm em modo view; "Editar perfil" alterna para edit; salvar → `PATCH /me` → toast "Perfil atualizado."
- **Configurações (`/configuracoes`)**: tema (claro/escuro/sistema), preferências de notificação (locais), "Restaurar dados de demonstração" (`mockDb.reset`, com ConfirmDialog, visível só em modo mock), "Sair".

### Área do prestador (`ProviderLayout`)

Sidebar: Dashboard, Meus serviços, Solicitações, Agenda, Perfil, Configurações, Sair.

- **Dashboard (`/prestador/dashboard`)**: StatsCards (Solicitações recebidas, Serviços ativos, Concluídos, Avaliação, Faturamento), BarChart de faturamento, "Solicitações recebidas" em DataTable, agenda da semana.
- **`/prestador/servicos`, `/prestador/solicitacoes`, `/prestador/agenda`**: layout completo com EmptyState "Em breve nesta versão".

## 11. Formulários e erros

- Validação por funções puras em `utils/validators.ts` (`required`, `email`, `minLength`, `phone`, `futureDate`, `positiveNumber`, `matches`).
- Erro inline por campo, exibido após blur ou submit.
- Botão de submit com estado loading; submissão duplicada bloqueada.
- `ApiError` com `fieldErrors` mapeado para os campos; demais erros viram toast de erro.
- Todos os hooks de dados seguem: `isLoading` → Skeleton; `error` → ErrorState com retry; vazio → EmptyState; sucesso → conteúdo.

## 12. Responsividade

Breakpoints Tailwind padrão.

| Largura | Comportamento |
|---|---|
| < 640 | Grids em 1 coluna; Navbar com Drawer; filtros e mapa em Drawer; DataTable em cards; Sidebar em Drawer |
| 640–1023 | Grids em 2 colunas; Sidebar em Drawer |
| ≥ 1024 | Layout completo; mapa sticky; Sidebar fixa e recolhível |

Verificação em 375, 768 e 1440 px.

## 13. Testes e verificação

Vitest + Testing Library, cobrindo lógica:

- `mockRoutes`: filtros, ordenação, paginação, expansão, 400/401/403/404, cálculo de `estimatedValue`.
- `apiClient` / `mockAdapter`: header de token, conversão em `ApiError`.
- `AuthContext`: login, logout, boot com `/auth/me`, lembrar de mim.
- `ProtectedRoute`: redirecionamento, `from` preservado, bloqueio por papel.
- `validators` e `format`.

Verificação final:

1. `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, `npm run build` sem erros.
2. Playwright (MCP) no `npm run dev`: fluxo completo; `/dashboard` deslogado; papel errado; logout; favoritos; criação e cancelamento de solicitação; empty/loading/error; dark mode; 375/768/1440 px; console sem erros.
3. Screenshots comparados com `docs/reference/visual-reference.jpeg`.
4. Remoção de código morto e imports quebrados.

## 14. Fora de escopo nesta versão

- Back-end real, upload de arquivos, pagamentos.
- Envio de mensagens em tempo real.
- Fluxo do prestador para aceitar/recusar solicitações e cadastrar serviços (rotas e layout prontos; contrato de API a estender na próxima etapa).
- Recuperação de senha real.
- Internacionalização.
