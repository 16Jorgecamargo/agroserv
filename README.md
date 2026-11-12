<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/brand/logo-stacked-white.png" />
    <img src="docs/assets/brand/logo-stacked.png" alt="AgroServ" width="260" />
  </picture>
</h1>

Plataforma web para contratação de serviços agrícolas. Conecta produtores rurais a prestadores de máquinas, equipamentos e mão de obra, com uma área de administração para moderar a plataforma.

Projeto acadêmico em duas etapas:

- **Trabalho 1:** front-end em React com uma API local simulada (mock) que segue o contrato REST.
- **Trabalho 2:** back-end em NestJS + TypeORM + SQLite ([`backend/`](backend/README.md)) que atende todas as funcionalidades do front-end. O front troca do mock para a API real por variável de ambiente, sem mudar componentes.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/report.md`](docs/report.md) | Relatório técnico do projeto |
| [`docs/system-flowchart.md`](docs/system-flowchart.md) | Visão única do sistema: áreas, jornada de um serviço, moderação, telas e rotas |
| [`docs/flowcharts.md`](docs/flowcharts.md) | Dez fluxogramas (Mermaid) com imagens em `docs/flowcharts/` |
| [`docs/api-contract.md`](docs/api-contract.md) | Contrato da API REST: endpoints, tipos, erros, permissões e notificações |
| [`docs/backlog.md`](docs/backlog.md) | Backlog: tarefas por fase, dependências e critérios de aceite |
| [`docs/future-flowcharts.md`](docs/future-flowcharts.md) | Histórico: os fluxos planejados para a ampliação, hoje implementados |
| [`backend/README.md`](backend/README.md) | Como rodar e testar a API |
| [`docs/slides/full-stack/`](docs/slides/full-stack/index.html) | Apresentação do sistema completo, front-end e back-end |
| [`docs/slides/backend/`](docs/slides/backend/index.html) | Apresentação do back-end: NestJS, TypeORM e SQLite |
| [`docs/slides/`](docs/slides/index.html) | Apresentação da etapa 1 (front-end). Em todas: ← → para navegar e `F` para tela cheia |

## Demonstração online

- **App:** https://agroserv-bay.vercel.app/app/
- **Apresentações:** [sistema completo](https://agroserv-bay.vercel.app/slides/full-stack/), [back-end](https://agroserv-bay.vercel.app/slides/backend/) e [etapa 1](https://agroserv-bay.vercel.app/slides/)
- **Página do projeto** (apresentações, documentação e links): https://agroserv-bay.vercel.app/

O site é hospedado na Vercel. O app publicado roda em modo `mock`, com os dados demo no navegador. O comando `npm run build:site` monta tudo em `site/`: a página inicial, os documentos de `docs/` convertidos de Markdown para HTML (com os diagramas Mermaid), as apresentações e o app em `/app/`. A configuração fica em `vercel.json`.

## Contas de demonstração

Todas com a senha `123456`. Na tela de login, os botões de conta demo preenchem os campos (só no modo `mock`).

| Papel | E-mail | O que dá para fazer |
|---|---|---|
| Produtor | `produtor@agroserv.com` | Buscar serviços, favoritar, solicitar, conversar, aceitar contraproposta, avaliar, contratar de novo, cadastrar propriedades |
| Prestador | `prestador@agroserv.com` | Criar e pausar anúncios, responder pedidos, contraproposta, agenda com dias bloqueados, equipamentos, responder avaliações, enviar documentos para verificação |
| Administrador | `admin@agroserv.com` | Painel com filas, suspender e reativar contas, aprovar verificações, ocultar anúncios, resolver denúncias, gerenciar categorias, ver o histórico de ações |

No modo `mock`, o administrador pode voltar aos dados demo pelo painel (**Restaurar dados demo**).

## Como executar

### Tudo de uma vez (front-end + API + banco)

```bash
npm start
```

O comando instala as dependências que faltam, cria `backend/.env` a partir do `.env.example` na primeira vez, sobe a API NestJS, espera ela responder e abre o front-end em modo `http`. Ctrl+C para os dois.

- App: `http://localhost:5173`
- API: `http://localhost:3333`
- Banco: `backend/data/agroserv.sqlite`, criado com os dados demo na primeira execução. Para voltar aos dados demo, pare o projeto e apague esse arquivo.

### Só o front-end (modo `mock`)

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

### Front-end + back-end (modo `http`)

```bash
cd backend
pnpm install
cp .env.example .env
pnpm start:dev
```

Em outro terminal, na raiz, crie `.env` a partir de `.env.example` com:

```
VITE_API_MODE=http
VITE_API_URL=http://localhost:3333
```

e rode `npm run dev`. O banco SQLite é criado e recebe os dados demo na primeira execução.

| Comando | O que faz |
|---|---|
| `npm start` | Front-end + API + banco SQLite, em modo `http` |
| `npm run dev` | Só o front-end, em modo `mock` |
| `npm run build` | Build de produção do app |
| `npm run build:site` | Monta o site completo publicado na Vercel em `site/` |
| `npm run test:run` | Testes automatizados do front-end |
| `npm run lint` | Lint |
| `cd backend && pnpm test` e `pnpm test:e2e` | Testes unitários e de integração da API |

## Áreas e páginas

| Área | Rotas | Destaques |
|---|---|---|
| Pública | `/`, `/servicos`, `/servicos/:id`, `/prestadores/:id` | Busca sem acento, filtros por preço, nota, selo e dia livre, ordenação, lista ou mapa (Leaflet + OpenStreetMap), perfil público com raio de atendimento |
| Conta | `/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha` | Cadastro de produtor ou prestador, recuperação de senha por e-mail |
| Produtor | `/dashboard`, `/solicitacoes`, `/propriedades`, `/favoritos`, `/perfil` | Linha do tempo da solicitação, conversa, avaliação, contratar de novo, aviso de propriedade fora da área |
| Prestador | `/prestador/*` | Anúncios com fotos, pedidos recebidos, agenda, equipamentos, avaliações, verificação |
| Administrador | `/admin/*` | Usuários, verificações, anúncios, denúncias, categorias, histórico, troca de senha provisória |

O `ProtectedRoute` manda quem não está logado para `/login` e quem tem outro papel para o próprio painel. A lista completa de rotas está em [`docs/system-flowchart.md`](docs/system-flowchart.md#5-rotas).

## Arquitetura

```
src/
├── types/        entidades e contrato da API
├── data/         dados demo (usados só pelo mock)
├── services/
│   ├── api/      apiClient, httpAdapter, mockAdapter e rotas do mock
│   └── *Service.ts   funções por recurso
├── hooks/        useAuth, useAsync, useServices, useFavorites...
├── contexts/     Auth, Favorites e Toast
├── routes/       rotas, paths e ProtectedRoute
├── layouts/      PublicLayout e PrivateLayout
├── components/   ui, domain, admin, map e layout
└── pages/        uma página por rota

backend/src/
├── common/       guard JWT, papéis, validação, envelope de resposta, filtro de erros
├── database/     entidades TypeORM e semente dos dados demo
└── <módulo>/     controller + service + repository por recurso
```

Fluxo de dados: `página → hook → service → apiClient → adaptador (mock ou http) → API NestJS → SQLite`.

## Demonstrar estados

- Carregamento: o mock tem atraso de 300–600 ms (skeletons).
- Vazio: busque um termo inexistente em `/servicos`.
- Erro: adicione `?mockError` a qualquer URL no modo `mock` (ex.: `/servicos?mockError`).
