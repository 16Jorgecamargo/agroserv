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
