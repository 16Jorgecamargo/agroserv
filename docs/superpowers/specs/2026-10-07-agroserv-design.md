# AgroServ — Design Spec (escopo mínimo)

Data: 2026-10-07
Status: aprovado em conversa, aguardando revisão escrita

## 1. Contexto e objetivo

AgroServ é um marketplace web que conecta **produtores rurais** a **prestadores de serviços agrícolas**.

Projeto acadêmico em duas etapas:

1. **Etapa atual:** front-end mínimo que atende aos requisitos da entrega, com back-end simulado.
2. **Próxima etapa da disciplina:** back-end real (API REST) conectado a este mesmo projeto.

**Princípio central:** o front-end consome um **contrato de API** desde o primeiro dia. Na próxima etapa, o back-end implementa esse contrato e o front troca de modo via variável de ambiente, sem retrabalho em componentes, hooks ou services.

### Requisitos da entrega

| Requisito | Atendido por |
|---|---|
| Homepage como ponto de entrada, com navegação clara | `/` com Navbar e links para todas as áreas |
| Pelo menos duas páginas públicas | `/servicos` (listagem) e `/servicos/:id` (detalhe) |
| Área privada só para autenticados | `/dashboard` e `/solicitacoes` |
| Tela de login funcional que controla o acesso | `/login` + `AuthContext` |
| Middleware de proteção de rotas | `ProtectedRoute`: verifica autenticação, permite ou bloqueia, redireciona para `/login` |

### Critérios de sucesso

- Fluxo navegável: Home → Serviços → Detalhe → tentar abrir Dashboard → Login → volta ao Dashboard → Solicitações → Logout.
- Acessar rota privada deslogado redireciona para `/login` com a mensagem "Faça login para acessar esta área."
- Após login, o usuário volta para a rota que tentou abrir.
- Visual fiel ao estilo de `docs/reference/visual-reference.jpeg`.
- Camadas visíveis: `types → services/api → services → hooks → pages/components`.
- `tsc`, `eslint`, `vitest` e `vite build` sem erros; console do navegador limpo.

### Regras do projeto

- Código **sem comentários**.
- Variáveis, funções, tipos e arquivos **em inglês**.
- Textos de interface e URLs em **PT-BR**.

## 2. Stack

| Item | Escolha |
|---|---|
| Build | Vite + React 19 + TypeScript (strict) |
| Rotas | React Router v7 (`BrowserRouter`) |
| Estilo | Tailwind CSS v4 (`@tailwindcss/vite`) com tokens em CSS variables |
| Ícones | lucide-react |
| Animação | framer-motion |
| Fonte | Manrope via `@fontsource-variable/manrope` |
| Estado global | Context API (`AuthContext`) |
| Testes | Vitest + @testing-library/react + jsdom |

Imagens: fotos curadas em `src/assets/images/` (funciona offline).

## 3. Estrutura de pastas

```
agroserv/
├── docs/
│   ├── api-contract.md
│   ├── reference/visual-reference.jpeg
│   └── superpowers/specs/
├── src/
│   ├── assets/images/
│   ├── types/
│   │   ├── entities.ts
│   │   └── api.ts
│   ├── data/
│   │   ├── users.ts
│   │   ├── providers.ts
│   │   ├── categories.ts
│   │   ├── services.ts
│   │   └── requests.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── apiError.ts
│   │   │   ├── httpAdapter.ts
│   │   │   ├── mockAdapter.ts
│   │   │   └── mockRoutes.ts
│   │   ├── authService.ts
│   │   ├── categoryService.ts
│   │   ├── serviceService.ts
│   │   └── requestService.ts
│   ├── hooks/
│   │   ├── useAsync.ts
│   │   ├── useAuth.ts
│   │   ├── useServices.ts
│   │   └── useRequests.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── domain/
│   │   └── layout/
│   ├── layouts/
│   │   ├── PublicLayout.tsx
│   │   └── PrivateLayout.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ServicesPage.tsx
│   │   ├── ServiceDetailPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── RequestsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── paths.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── format.ts
│   │   ├── motion.ts
│   │   └── storage.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
└── package.json
```

Regras de dependência:

- `types/` não importa nada do projeto.
- `data/` é importado **somente** por `services/api/mockRoutes.ts`.
- `services/api/` é o único lugar que conhece o transporte (mock ou HTTP).
- `services/*Service.ts` chamam só o `apiClient`.
- `hooks/` chamam services e expõem `{ data, isLoading, error, refetch }`.
- Páginas e componentes nunca importam `data/` nem `services/api/`.

## 4. Modelo de dados (`types/entities.ts`)

```ts
interface User {
  id: string;
  name: string;
  email: string;
  role: 'producer';
  avatarUrl?: string;
  city: string;
  state: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
}

interface Provider {
  id: string;
  name: string;
  avatarUrl?: string;
  city: string;
  state: string;
  rating: number;
  yearsOfExperience: number;
}

type PriceUnit = 'hour' | 'hectare' | 'day' | 'trip';

interface Service {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  providerId: string;
  city: string;
  state: string;
  price: number;
  priceUnit: PriceUnit;
  rating: number;
  reviewCount: number;
  available: boolean;
  imageUrl: string;
}

interface ServiceDetail extends Service {
  provider: Provider;
  category: Category;
}

type RequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

interface ServiceRequest {
  id: string;
  serviceId: string;
  serviceTitle: string;
  providerName: string;
  scheduledDate: string;
  location: string;
  status: RequestStatus;
  value: number;
}

interface ProducerDashboard {
  stats: { open: number; inProgress: number; completed: number; totalSpent: number };
  recentRequests: ServiceRequest[];
}
```

Convenções: IDs `string`, datas ISO 8601, dinheiro em `number` (BRL), relacionamentos por ID. O detalhe traz as relações expandidas.

## 5. Contrato de API (`types/api.ts` + `docs/api-contract.md`)

```ts
interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface ApiErrorBody {
  status: number;
  code: string;
  message: string;
}
```

Autenticação: header `Authorization: Bearer <token>`. Erros: 400, 401, 404.

| Método | Path | Auth | Query / Body | Resposta |
|---|---|---|---|---|
| POST | `/auth/login` | — | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | sim | — | `User` |
| GET | `/categories` | — | — | `Category[]` |
| GET | `/services` | — | `q, category, page, pageSize` | `Paginated<Service>` |
| GET | `/services/featured` | — | `limit` | `Service[]` |
| GET | `/services/:id` | — | — | `ServiceDetail` |
| GET | `/requests` | sim | `status` | `ServiceRequest[]` |
| GET | `/dashboard` | sim | — | `ProducerDashboard` |

## 6. Camada de transporte

```ts
interface HttpAdapter {
  request<T>(config: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    token?: string | null;
  }): Promise<T>;
}
```

- `apiClient.ts` expõe `get` e `post`, lê o token em `utils/storage.ts` e escolhe o adaptador por `import.meta.env.VITE_API_MODE` (`mock` por padrão).
- `httpAdapter.ts` usa `fetch` com `VITE_API_URL`, monta a query string e converte respostas não-2xx em `ApiError`.
- `mockAdapter.ts` espera 300–600 ms, resolve a rota em `mockRoutes.ts` por método + padrão de path, devolve cópia dos dados e lança `ApiError` no mesmo formato do HTTP.
- `mockRoutes.ts` faz o papel do servidor: filtro por `q` e `category`, paginação, expansão do detalhe, cálculo do dashboard, validação de credenciais e token (401) e recurso inexistente (404).
- Token mock: `mock.<userId>`. O mock aceita qualquer token nesse formato cujo usuário exista.

Para usar o back-end real: `.env` com `VITE_API_MODE=http` e `VITE_API_URL=http://localhost:3333`. Nenhum outro arquivo muda.

## 7. Autenticação e proteção de rotas

### AuthContext

- Estado: `user`, `isAuthenticated`, `isLoading`, `login(email, password)`, `logout()`.
- Persistência em `localStorage`: `agroserv_token` e `agroserv_user`.
- Boot: se existe token, chama `GET /auth/me`. Em caso de 401, limpa a sessão. `isLoading` fica `true` até concluir.
- `useAuth()` lê o contexto e lança erro se usado fora do provider.

### ProtectedRoute

1. `isLoading` → loader de tela cheia, sem redirecionar.
2. Não autenticado → `<Navigate to="/login" replace state={{ from: location }} />`.
3. Autenticado → `<Outlet />`.

### Login

- Com `state.from` presente, mostra o alerta "Faça login para acessar esta área."
- Após sucesso, navega para `state.from` se existir; senão, para `/dashboard`.
- Usuário já autenticado que abre `/login` é redirecionado para `/dashboard`.
- Conta demo: `produtor@agroserv.com` / `123456`. Botão "Usar conta demo" preenche os campos.

### Logout

Botão no `PrivateLayout` e no menu da Navbar (quando logado). Limpa a sessão e navega para `/`.

## 8. Rotas

URLs centralizadas em `routes/paths.ts`.

| Rota | Layout | Acesso | Página |
|---|---|---|---|
| `/` | `PublicLayout` | público | HomePage |
| `/servicos` | `PublicLayout` | público | ServicesPage |
| `/servicos/:id` | `PublicLayout` | público | ServiceDetailPage |
| `/login` | — (tela própria) | público | LoginPage |
| `/dashboard` | `PrivateLayout` | `ProtectedRoute` | DashboardPage |
| `/solicitacoes` | `PrivateLayout` | `ProtectedRoute` | RequestsPage |
| `*` | `PublicLayout` | público | NotFoundPage |

A Navbar mostra "Entrar" quando deslogado e "Meu painel" + avatar quando logado.

## 9. Design system

### Tokens (`index.css`, via `@theme`)

| Token | Valor |
|---|---|
| `--color-bg` | `#F7F8F5` |
| `--color-surface` | `#FFFFFF` |
| `--color-surface-muted` | `#EEF1EC` |
| `--color-border` | `#E4E8E1` |
| `--color-text` | `#17201A` |
| `--color-text-muted` | `#667085` |
| `--color-primary` | `#2F6B45` |
| `--color-primary-strong` | `#173F2A` |
| `--color-primary-light` | `#7FB685` |
| `--color-primary-soft` | `#E6F0E8` |
| `--color-warning` | `#B7791F` |
| `--color-danger` | `#B42318` |
| `--color-info` | `#2B5C8A` |

Estilo da referência: fundo off-white, cards brancos com borda de 1px, sombra quase nula (`0 1px 2px`) que cresce levemente no hover, raio de 10px nos cards e 8px em inputs e botões. Verde reservado a CTAs, item ativo, "Disponível" e foco.

### Tipografia (Manrope)

H1 48/56 peso 800 (mobile 36/44); H2 30/38 peso 700; H3 18/26 peso 600; corpo 15/24; secundário 13/20 em `text-muted`; botões peso 600; números com `tabular-nums`.

### Status

| Status | Label | Cor |
|---|---|---|
| `pending` | Pendente | warning |
| `accepted` | Aceito | primary |
| `in_progress` | Em andamento | info |
| `completed` | Concluído | primary-strong |
| `cancelled` | Cancelado | danger |

### Componentes

- **`components/ui/`:** Button, Input, Badge, StatusBadge, Rating, Skeleton, EmptyState, ErrorState, Alert.
- **`components/domain/`:** ServiceCard, CategoryCard, SearchBar, StatsCard, RequestsTable.
- **`components/layout/`:** Navbar, Footer, Sidebar, Logo.

`RequestsTable` vira lista de cards abaixo de `md`.

### Motion (Framer Motion, uso leve)

- Hero: `opacity 0→1`, `y 20→0`, 0.4 s.
- Listas de cards: `staggerChildren: 0.05`.
- Card hover: `y: -4`; botão tap: `scale: 0.98`.
- Transição de página com fade curto.
- `MotionConfig reducedMotion="user"` na raiz.

Presets em `utils/motion.ts`.

### Acessibilidade

HTML semântico, `label` em todos os inputs, `aria-label` em botões de ícone, foco visível (`ring-2`), ações em `<button>` e navegação em `<Link>`.

## 10. Páginas

**Home (`/`)**

1. Navbar sticky (Início, Serviços, Painel; Entrar/Meu painel) com blur após scroll.
2. Hero em duas colunas: H1 "Encontre o serviço agrícola certo para sua propriedade.", subtítulo "Conecte-se a profissionais, máquinas e serviços agrícolas disponíveis na sua região.", botão "Encontrar serviços". À direita, foto de lavoura com 2–3 cards flutuantes estáticos (serviço disponível, localização, avaliação).
3. SearchBar: "Qual serviço você precisa?" + "Localização" + "Buscar" → `/servicos?q=`.
4. "Encontre o serviço que precisa": 8 CategoryCards com ícones Lucide → `/servicos?category=slug`.
5. "Serviços em destaque": 4 ServiceCards.
6. Footer.

**Serviços (`/servicos`)**

- Título "Encontre serviços agrícolas", campo de busca e chips de categoria.
- Filtros sincronizados com a URL via `useSearchParams`.
- Contador "Encontramos N serviços" e grid de ServiceCards (1 / 2 / 3 colunas).
- Botão "Carregar mais" (`pageSize` 9).
- Estados: skeleton de cards, ErrorState com "Tentar novamente", EmptyState "Não encontramos serviços para essa busca." com "Limpar filtros".

**Detalhe (`/servicos/:id`)**

- Breadcrumbs (Início › Serviços › título).
- Imagem principal, título, categoria, avaliação, localização, descrição.
- Card lateral com preço e unidade, disponibilidade e resumo do prestador (avatar, nome, cidade, avaliação, anos de experiência).
- Serviço inexistente → EmptyState "Serviço não encontrado" com link para `/servicos`.

**Login (`/login`)**

- Layout dividido: à esquerda, foto com overlay escuro, logo e frase de valor; à direita, card com "Bem-vindo de volta", E-mail, Senha, "Entrar" e "Usar conta demo".
- "Criar conta" e "Esqueci minha senha" aparecem desabilitados com a dica "Em breve".
- Erro de credencial em Alert inline. Botão com estado de carregamento.
- Abaixo de `lg`, a foto some e fica só o card.

**Dashboard (`/dashboard`)**

- `PrivateLayout`: Sidebar (Dashboard, Solicitações, Ver serviços, Sair) e header com nome e avatar. No mobile, a Sidebar vira menu no topo.
- Saudação "Olá, {nome}".
- 4 StatsCards: Solicitações abertas, Em andamento, Concluídos, Total contratado.
- "Solicitações recentes": RequestsTable (Serviço, Prestador, Data, Status, Valor) com link "Ver todas" → `/solicitacoes`.

**Solicitações (`/solicitacoes`)**

- Abas de status: Todas, Pendentes, Em andamento, Concluídas, Canceladas.
- RequestsTable com Serviço, Prestador, Data, Local, Status, Valor.
- Estados de loading, vazio e erro.

**404**: EmptyState com link para a home.

## 11. Responsividade

| Largura | Comportamento |
|---|---|
| < 640 | Grids em 1 coluna; Navbar com menu recolhível; tabelas viram cards; Sidebar vira menu no topo |
| 640–1023 | Grids em 2 colunas |
| ≥ 1024 | Layout completo; Sidebar fixa |

## 12. Testes e verificação

Vitest + Testing Library:

- `ProtectedRoute`: deslogado redireciona para `/login` preservando `from`; logado renderiza o conteúdo; enquanto `isLoading`, não redireciona.
- `AuthContext` / `authService`: login válido persiste a sessão, login inválido lança erro, logout limpa a sessão.
- `mockRoutes`: filtro por `q` e `category`, paginação, 401 sem token, 404 em serviço inexistente.

Verificação final:

1. `npx tsc --noEmit`, `npm run lint`, `npx vitest run` e `npm run build` sem erros.
2. Playwright (MCP) no `npm run dev`: fluxo completo; `/dashboard` deslogado; login com credencial errada; logout; busca sem resultados; larguras 375, 768 e 1440 px; console sem erros.
3. Screenshots comparados com a referência.

## 13. Fora de escopo nesta versão

Cadastro, criação de solicitação, favoritos, mapa, dark mode, toasts, perfil, configurações, contratos, mensagens, área do prestador e papéis, páginas de prestadores, sobre e como funciona, gráficos, back-end real.

A arquitetura (contrato de API, adaptadores e camadas) permite adicionar esses itens nas próximas etapas sem reescrever o que existe.
