# AgroServ — Back-end

API REST do AgroServ. Implementa o contrato de [`docs/api-contract.md`](../docs/api-contract.md) e os itens **B-01 a B-10** de [`docs/backlog.md`](../docs/backlog.md).

**Stack:** NestJS 12 · TypeScript · TypeORM · SQLite (`better-sqlite3`) · class-validator · JWT · bcrypt · Vitest + supertest.

## Como rodar

Requisitos: Node 22 e [pnpm](https://pnpm.io).

```bash
cd backend
pnpm install
cp .env.example .env
pnpm start:dev
```

A API sobe em `http://localhost:3333`. Na primeira execução, o banco (`data/agroserv.sqlite`) é criado e recebe os dados demo sozinho.

| Comando | O que faz |
|---|---|
| `pnpm start:dev` | Sobe a API recarregando a cada mudança |
| `pnpm build` e `pnpm start:prod` | Compila e roda a versão compilada |
| `pnpm seed` | Apaga o banco e volta aos dados demo |
| `pnpm test` | Testes unitários (services com repository simulado) |
| `pnpm test:e2e` | Testes de integração (API inteira sobre SQLite em memória) |
| `pnpm lint` e `pnpm typecheck` | Lint e checagem de tipos |

### Contas demo

Todas com a senha `123456`.

| Papel | E-mail |
|---|---|
| Produtor | `produtor@agroserv.com` |
| Prestador | `prestador@agroserv.com` (e `prestador2@` … `prestador6@agroserv.com`) |
| Administrador | `admin@agroserv.com` |

### Variáveis de ambiente

Todas estão descritas em [`.env.example`](.env.example). As principais:

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | `3333` | Porta da API |
| `DATABASE_PATH` | `data/agroserv.sqlite` | Arquivo do SQLite |
| `DB_SYNCHRONIZE` | `true` fora de produção | Cria e atualiza as tabelas sozinho. Use só em desenvolvimento |
| `JWT_SECRET` | segredo de desenvolvimento | **Troque** fora do ambiente local |
| `CORS_ORIGIN` | `*` | Origens liberadas, separadas por vírgula |
| `PUBLIC_URL` | `http://localhost:<PORT>` | Base das URLs dos arquivos enviados |
| `EXPOSE_RESET_TOKEN` | `false` | Devolve o `resetToken` na resposta, só para demonstração sem e-mail |

## Formato das respostas

Toda resposta com corpo usa o mesmo envelope (exigência do trabalho: respostas padronizadas de sucesso e de erro):

```json
{ "success": true, "data": { "token": "...", "user": { } } }
```

```json
{
  "success": false,
  "error": {
    "status": 422,
    "code": "validation_error",
    "message": "Revise os campos destacados.",
    "fields": { "email": "Este e-mail já está cadastrado." }
  }
}
```

`data` e `error` têm exatamente o formato descrito no contrato. Respostas `204` não têm corpo. O motivo e o que muda para o front-end estão na seção 17 do contrato.

## Arquitetura

Uma pasta por assunto em `src/`. Cada uma segue as mesmas camadas:

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| Controller | `*.controller.ts` | Só HTTP: rota, parâmetros, DTO e status. Chama o service |
| Service | `*.service.ts` | Regras de negócio. Lança as exceções (`AppException`) |
| Repository | `*.repository.ts` | Só acesso a dados com TypeORM. Sem regra de negócio |
| Entidade | `entities/*.entity.ts` | Tabela e relacionamentos |
| DTO | `dto/*.dto.ts` | Validação de entrada com class-validator e as mensagens do contrato |
| Presenter | `*.presenter.ts` | Converte a entidade no tipo do contrato, sem campos internos |

```
src/
  common/         envelope, filtro de erros, log, validação, guards, relógio, paginação
  database/       conexão, lista de entidades e seed
  auth/           cadastro, login, sessão e recuperação de senha
  users/          perfil, senha e exclusão de conta
  providers/      perfil profissional, verificação e perfil público
  categories/  services/  equipment/  properties/  favorites/  agenda/
  requests/       solicitações do produtor e do prestador e a máquina de status
  messages/  notifications/  reviews/  reports/  uploads/
  admin/          painel, usuários, verificações, anúncios, categorias e histórico
test/             testes de integração (*.e2e-spec.ts)
```

Os repositories ficam na pasta do seu assunto e são registrados em `database/database.module.ts`, que é global. Assim qualquer service usa qualquer repository sem dependência circular entre módulos.

### Onde está cada exigência do trabalho

| Exigência | Onde |
|---|---|
| NestJS + TypeORM + SQLite | `src/app.module.ts`, `src/database/database.module.ts` |
| API REST com métodos, parâmetros, query params e status codes | controllers de cada pasta (ex.: `src/services/services.controller.ts`) |
| DTOs com class-validator | `src/**/dto/*.dto.ts`, `src/common/validation.pipe.ts`, `src/common/validators.ts` |
| Middleware de log | `src/common/logger.middleware.ts` |
| Resposta padronizada de sucesso (interceptor) | `src/common/response.interceptor.ts` |
| Resposta padronizada de erro (filtro global) | `src/common/http-exception.filter.ts`, `src/common/app.exception.ts` |
| Controller, service e repository | todas as pastas de assunto |
| Entidades com relacionamentos | `src/**/entities/*.entity.ts` (1:1 usuário–perfil, 1:N em quase tudo, N:N serviço–equipamento) |
| Seed | `src/database/seed.service.ts`, `src/database/seed.data.ts` (`pnpm seed`) |
| CRUD completo | propriedades, serviços, equipamentos e categorias |
| Cadastro e login com bcrypt | `src/auth/auth.service.ts` |
| Token JWT | `src/auth/auth.module.ts`, `src/auth/auth.service.ts` |
| Rotas privadas com Guard (401) | `AuthGuard` em `src/common/auth.guard.ts` (global; rotas abertas usam `@Public()`) |
| Rota restrita por papel (403) | `RolesGuard` + `@Roles(...)` (ex.: tudo em `/admin/*`) |

### Regras que valem para a API inteira

- **Autenticação:** `Authorization: Bearer <token>`, token válido por 7 dias. O guard recarrega a conta a cada requisição, então conta suspensa ou excluída recebe 401 na hora.
- **Recursos de outros usuários:** respondem 404, não 403.
- **"Hoje":** sempre o dia de Brasília (`ClockService`). Momentos são gravados em UTC.
- **Exclusão lógica:** serviços, propriedades e contas nunca são apagados de verdade.
- **Solicitações:** toda mudança de status passa por `applyTransition` (`src/requests/request-lifecycle.ts`), que segue a tabela da seção 6 do contrato.
- **Segurança:** helmet, CORS, limite de 300 requisições por minuto por IP e bloqueio de login após 5 tentativas erradas em 15 minutos.
- **Arquivos:** `multipart/form-data` em `POST /uploads`, guardados em `uploads/`. Documentos de verificação só abrem para o dono, para administradores ou por URL assinada de 10 minutos.
- **E-mail:** não há servidor de e-mail nesta etapa. O link de redefinição de senha sai no log da API (`[Mail]`).

## Testes

- `pnpm test`: regras puras e services com repository simulado (máquina de status, médias de avaliação, login, relógio).
- `pnpm test:e2e`: 110 casos sobre a API real com banco em memória. Cobrem sucesso, validação (422), permissão (401/403/404) e transição inválida (409) de cada endpoint.

Os arquivos de teste usam os sufixos `.unit-spec.ts` e `.e2e-spec.ts` para não serem capturados pelo Vitest do front-end na raiz do repositório.

## Convenções de código

- Código em inglês. Textos de erro em PT-BR, prontos para exibir.
- Comentários em português, curtos, um por bloco de função.
- Imports relativos terminam em `.js` (o projeto é ESM).
