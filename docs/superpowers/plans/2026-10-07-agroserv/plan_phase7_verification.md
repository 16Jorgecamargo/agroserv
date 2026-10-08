# Phase 7 — README and final verification

> Part of `plan_index.md`. Read its Global Constraints first. Depends on Phases 1–6.

### Task 7.1: README

**Files:**
- Create: `README.md` (replace the Vite template README if present)

- [ ] **Step 1: Write `README.md`**

````markdown
# AgroServ

Plataforma web para contratação de serviços agrícolas. Conecta produtores rurais a prestadores de máquinas, equipamentos e mão de obra.

Projeto acadêmico: nesta etapa o front-end usa um back-end simulado que segue o mesmo contrato da API REST que será implementada na próxima etapa.

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
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, demo account and architecture"
```

---

### Task 7.2: Full verification and cleanup

**Files:**
- Modify: any file with issues found below

- [ ] **Step 1: Static checks**

Run: `npx tsc -b && npm run lint && npx vitest run && npm run build`
Expected: zero type errors, zero lint errors, all tests PASS, build succeeds. Fix any failure before continuing.

- [ ] **Step 2: Rule checks**

```bash
grep -rnE "//|/\*" src --include=*.ts --include=*.tsx | grep -vE "https?://" || echo "no comments"
grep -rn "from '../data\|from '../../data" src/pages src/components src/layouts src/hooks src/contexts src/routes || echo "no data imports in UI"
grep -rn "services/api" src/pages src/components src/layouts || echo "check: only apiError imports allowed"
grep -rni "co-authored" $(git ls-files) || echo "no attribution"
```

Expected: "no comments" (the only allowed match is the regex `/^\//` in `httpAdapter.ts`), "no data imports in UI", only `isApiError` imports from `services/api/apiError` in pages, "no attribution". Fix anything else.

- [ ] **Step 3: Dead code check**

```bash
npx tsc --noEmit --noUnusedLocals --noUnusedParameters -p tsconfig.app.json
```

Then confirm every exported symbol is used:

```bash
for symbol in $(grep -rhoE "export (function|const|type|interface|class) [A-Za-z]+" src | awk '{print $3}' | sort -u); do
  count=$(grep -rw "$symbol" src | wc -l)
  [ "$count" -lt 2 ] && echo "unused: $symbol"
done
```

Remove each reported unused export unless it is part of the documented API contract types.

- [ ] **Step 4: Browser QA with Playwright**

Start `npm run dev` in the background. Using the Playwright MCP tools, run each scenario and take a screenshot where noted. After each scenario call `browser_console_messages` and confirm there are no errors or React warnings.

| # | Scenario | Expected |
|---|---|---|
| 1 | Open `/` at 1440×900 (screenshot) | Hero, floating cards, search, 8 categories, 4 featured services |
| 2 | Scroll down 200px | Navbar gets blur + bottom border |
| 3 | Search "pulverizacao" + "Santa Helena, PR" | `/servicos` shows "Encontramos 1 serviço" |
| 4 | Click chip "Máquinas", then "Limpar filtros" | 2 results, then 12 |
| 5 | `/servicos`, click "Carregar mais" | 12 cards, button disappears |
| 6 | `/servicos?q=xyz` (screenshot) | Empty state + "Limpar filtros" |
| 7 | `/servicos?mockError` (screenshot) | Error state, "Tentar novamente" |
| 8 | Click "Ver detalhes" on a card | Detail page scrolled to top, breadcrumbs |
| 9 | `/servicos/nao-existe` | "Serviço não encontrado" |
| 10 | `/dashboard` logged out (screenshot) | `/login` with "Faça login para acessar esta área." |
| 11 | Wrong password | "E-mail ou senha inválidos." |
| 12 | "Usar conta demo" → Entrar (screenshot) | `/dashboard`, "Olá, Carlos", 4 stats, table with 5 rows |
| 13 | Reload the page | Still logged in |
| 14 | Sidebar "Solicitações", chip "Concluídas" (screenshot) | 3 requests, URL has `?status=completed` |
| 15 | Sidebar "Sair" | Homepage, Navbar shows "Entrar" |
| 16 | `/solicitacoes?status=completed` logged out → login | Returns to the filtered requests page |
| 17 | `/servicos/svc-1` logged out → "Entrar para contratar" → login | Returns to the service, CTA now "Acompanhar no painel" |
| 18 | `/rota-qualquer` | 404 page |
| 19 | Keyboard only on `/login`: Tab through skip link, fields, toggle, buttons | Visible focus ring on every element, Enter submits |
| 20 | Resize to 768×1024 and 375×812; repeat 1, 5, 12, 14 (screenshots) | No horizontal page scroll (`document.documentElement.scrollWidth <= innerWidth`), grids collapse, table becomes cards, sidebar becomes top menu, mobile menu opens/closes |
| 21 | `browser_emulate_media` with `reducedMotion: 'reduce'`, reload `/` | Content appears without movement |

- [ ] **Step 5: Visual comparison**

Put the 1440px screenshots of `/` and `/servicos` side by side with `docs/reference/visual-reference.jpeg`. Check: same off-white background, white cards with thin borders and minimal shadow, green only on actions and highlights, generous spacing, consistent radius. Adjust classes where the result drifts (too much green, heavy shadows, cramped cards).

- [ ] **Step 6: Re-run static checks after any fix**

Run: `npx tsc -b && npm run lint && npx vitest run && npm run build`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: final verification fixes"
```

Skip the commit if nothing changed.
