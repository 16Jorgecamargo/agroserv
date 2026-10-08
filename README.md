# AgroServ

Plataforma web para contratação de serviços agrícolas. Conecta produtores rurais a prestadores de máquinas, equipamentos e mão de obra.

Projeto acadêmico: nesta etapa o front-end usa um back-end simulado que segue o mesmo contrato da API REST que será implementada na próxima etapa.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/report.md`](docs/report.md) | Relatório técnico do projeto |
| [`docs/flowcharts.md`](docs/flowcharts.md) | Fluxogramas (Mermaid) e imagens em `docs/flowcharts/` |
| [`docs/slides/index.html`](docs/slides/index.html) | Apresentação animada: abra no navegador, use ← → e `F` para tela cheia |
| [`docs/api-contract.md`](docs/api-contract.md) | Contrato da API REST para a etapa de back-end |
| [`docs/backlog.md`](docs/backlog.md) | Funcionalidades adiadas |

## Demonstração online

- **App:** https://16jorgecamargo.github.io/agroserv/app/ (entre com `produtor@agroserv.com` / `123456`)
- **Apresentação:** https://16jorgecamargo.github.io/agroserv/slides/
- **Documentação:** https://16jorgecamargo.github.io/agroserv/

O GitHub Pages é publicado pelo workflow `.github/workflows/pages.yml`, que gera a documentação, roda os testes e compila o app a cada push na `master`.

## Como executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run test:run` | Testes automatizados |
| `npm run lint` | Lint |

## Conta de demonstração

- E-mail: `produtor@agroserv.com`
- Senha: `123456`

Na tela de login, o botão **Usar conta demo** preenche os campos.

## Páginas

| Rota | Acesso | Conteúdo |
|---|---|---|
| `/` | Pública | Página inicial com busca, categorias e serviços em destaque |
| `/servicos` | Pública | Listagem com busca, filtro por categoria e "Carregar mais" |
| `/servicos/:id` | Pública | Detalhes do serviço e do prestador |
| `/login` | Pública | Login |
| `/dashboard` | Privada | Resumo do produtor e solicitações recentes |
| `/solicitacoes` | Privada | Todas as solicitações com filtro por status |

Ao abrir uma rota privada sem login, o `ProtectedRoute` redireciona para `/login` com a mensagem "Faça login para acessar esta área." Depois do login, o usuário volta para a página que tentou abrir.

## Arquitetura

```
src/
├── types/        entidades e contrato da API
├── data/         dados simulados (usados só pelo mock)
├── services/
│   ├── api/      apiClient + adaptadores mock e http
│   └── *Service.ts   funções por recurso (auth, services, categories, requests)
├── hooks/        useAuth, useServices, useRequests, useAsync
├── contexts/     AuthContext + AuthProvider
├── routes/       rotas, paths e ProtectedRoute
├── layouts/      PublicLayout e PrivateLayout
├── components/   ui, domain e layout
└── pages/        uma página por rota
```

Fluxo de dados: `página → hook → service → apiClient → adaptador (mock ou http)`.

## Conectar ao back-end real

1. Implemente os endpoints descritos em `docs/api-contract.md`.
2. Crie `.env` a partir de `.env.example`:

```
VITE_API_MODE=http
VITE_API_URL=http://localhost:3333
```

Nenhum componente, hook ou service precisa mudar.

## Demonstrar estados

- Carregamento: os dados simulados têm atraso de 300–600 ms (skeletons).
- Vazio: busque um termo inexistente em `/servicos`.
- Erro: adicione `?mockError` a qualquer URL (ex.: `/servicos?mockError`).

## Próximas etapas

Itens adiados estão em `docs/backlog.md`.
