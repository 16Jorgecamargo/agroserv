# AgroServ — Fluxograma do Sistema

Visão única de como as telas se conectam e de como o sistema funciona por trás delas: inicialização, autenticação, proteção de rotas, carregamento de dados e estados de cada tela.

Para os diagramas detalhados por assunto, veja [flowcharts.md](flowcharts.md). Para o sistema planejado, com produtor, prestador e administrador, veja [future-flowcharts.md](future-flowcharts.md).

1. [Fluxograma completo](#1-fluxograma-completo)
2. [Telas e ações](#2-telas-e-ações)
3. [Telas e dados consumidos](#3-telas-e-dados-consumidos)
4. [Legenda](#4-legenda)

---

## 1. Fluxograma completo

```mermaid
flowchart TD
    start([Usuário abre o app]) --> boot["main.tsx → App<br/>Router (Browser ou Hash) + MotionConfig + AuthProvider"]
    boot --> hasToken{Token salvo no localStorage?}
    hasToken -->|Não| guest[Visitante<br/>user = null]
    hasToken -->|Sim| restore["Restaura usuário salvo<br/>isLoading = true"]
    restore --> me["GET /auth/me"]
    me -->|200| refresh[Atualiza sessão<br/>usuário autenticado]
    me -->|401| clear1[clearSession<br/>vira visitante]
    me -->|Outro erro| keep[Mantém sessão salva]
    refresh --> ready
    clear1 --> ready
    keep --> ready
    guest --> ready{{Rotas resolvidas em AppRoutes}}

    ready -->|"/"| home
    ready -->|"/servicos"| services
    ready -->|"/servicos/:id"| detail
    ready -->|"/login"| login
    ready -->|"/dashboard ou /solicitacoes"| guard
    ready -->|Rota inexistente| notfound

    subgraph PUBLIC["Área pública — PublicLayout (Navbar + Footer)"]
        home["Página inicial<br/>Hero, busca, categorias, destaques"]
        services["Listagem de serviços<br/>Busca, filtro por categoria, paginação"]
        detail["Detalhes do serviço<br/>Preço, disponibilidade, prestador"]
        notfound["Página não encontrada"]
    end

    home -->|Encontrar serviços / Ver todos| services
    home -->|"Buscar (q + location)"| services
    home -->|"Card de categoria (?category=slug)"| services
    home -->|Card de serviço em destaque| detail
    home -->|Acessar meu painel| guard
    services -->|Ver detalhes| detail
    services -->|Breadcrumb Início| home
    detail -->|Breadcrumb Serviços| services
    detail --> isAuthDetail{Usuário autenticado?}
    isAuthDetail -->|Não: Entrar para contratar| login
    isAuthDetail -->|Sim: Acompanhar no painel| dashboard
    notfound -->|Voltar para o início| home

    subgraph AUTH["Autenticação"]
        login["Tela de login<br/>E-mail, senha, conta demo"]
        alreadyAuth{Já autenticado?}
        validate{Formulário válido?}
        post["POST /auth/login"]
        save[saveSession<br/>token + usuário no localStorage]
        fieldErr[Mostra erros nos campos]
        apiErr[Mostra alerta de erro]
    end

    login --> alreadyAuth
    alreadyAuth -->|Sim| backTo
    alreadyAuth -->|Não| validate
    validate -->|Não| fieldErr --> login
    validate -->|Sim| post
    post -->|Credenciais inválidas| apiErr --> login
    post -->|Sucesso| save --> backTo{Veio de rota guardada?}
    backTo -->|Sim| original[Volta para rota original<br/>pathname + query]
    backTo -->|Não| dashboard
    original --> guard
    original --> detail
    login -->|Voltar para o site| home

    guard{"ProtectedRoute<br/>Sessão carregando?"}
    guard -->|Sim| loader[FullScreenLoader] --> guard
    guard -->|Não| authed{Autenticado?}
    authed -->|Não| redirect["Redireciona para /login<br/>reason = protected + rota original"]
    redirect --> login
    authed -->|Sim| privateArea

    subgraph PRIVATE["Área privada — PrivateLayout (Sidebar + cabeçalho com usuário)"]
        privateArea{Qual rota?}
        dashboard["Dashboard<br/>Resumo em 4 cards + solicitações recentes"]
        requests["Minhas solicitações<br/>Filtro por status na URL"]
    end

    privateArea -->|/dashboard| dashboard
    privateArea -->|/solicitacoes| requests
    dashboard -->|Ver todas| requests
    dashboard -->|Buscar serviços| services
    requests -->|Sidebar Dashboard| dashboard
    requests -->|Buscar serviços / Sidebar Ver serviços| services

    dashboard -->|Sair| logout
    requests -->|Sair| logout
    home -.->|Navbar Sair| logout
    logout[logout<br/>clearSession + user = null] --> home

    expired([Qualquer resposta 401 com token]) -.-> clear2[subscribeUnauthorized<br/>clearSession] -.-> guard

    classDef public fill:#E6F0E8,stroke:#2F6B45,color:#17201A
    classDef private fill:#173F2A,stroke:#173F2A,color:#FFFFFF
    classDef auth fill:#FFF4E5,stroke:#B54708,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    classDef decision fill:#FFFFFF,stroke:#2F6B45,color:#17201A

    class home,services,detail,notfound public
    class dashboard,requests private
    class login,post,save,fieldErr,apiErr,redirect,logout auth
    class boot,restore,me,refresh,clear1,keep,guest,loader,original,clear2,expired,start system
    class hasToken,ready,isAuthDetail,alreadyAuth,validate,backTo,guard,authed,privateArea decision
```

---

## 2. Telas e ações

```mermaid
flowchart LR
    subgraph HOME["Página inicial /"]
        h1[Encontrar serviços]
        h2[Acessar meu painel]
        h3[Barra de busca]
        h4[Cards de categoria]
        h5[Serviços em destaque]
    end

    subgraph SERVICES["Serviços /servicos"]
        s1[Barra de busca]
        s2[Chips de categoria]
        s3[Limpar filtros]
        s4[Carregar mais]
        s5[Card de serviço]
    end

    subgraph DETAIL["Detalhes /servicos/:id"]
        d1[Entrar para contratar]
        d2[Acompanhar no painel]
        d3[Breadcrumbs]
    end

    subgraph LOGIN["Login /login"]
        l1[Entrar]
        l2[Usar conta demo]
        l3[Mostrar/ocultar senha]
        l4[Voltar para o site]
    end

    subgraph DASH["Dashboard /dashboard"]
        a1[Buscar serviços]
        a2[Ver todas]
    end

    subgraph REQ["Solicitações /solicitacoes"]
        r1[Chips de status]
        r2[Ver todas / Buscar serviços]
    end

    subgraph SIDEBAR["Sidebar privada"]
        b1[Dashboard]
        b2[Solicitações]
        b3[Ver serviços]
        b4[Sair]
    end

    h1 --> SERVICES
    h2 --> DASH
    h3 -->|"?q=&location="| SERVICES
    h4 -->|"?category="| SERVICES
    h5 --> DETAIL
    s1 -->|Atualiza URL| SERVICES
    s2 -->|Atualiza URL| SERVICES
    s3 -->|Remove filtros| SERVICES
    s4 -->|+9 itens| SERVICES
    s5 --> DETAIL
    d1 --> LOGIN
    d2 --> DASH
    d3 --> SERVICES
    l1 -->|Sucesso| DASH
    l2 -->|Preenche campos| LOGIN
    l3 --> LOGIN
    l4 --> HOME
    a1 --> SERVICES
    a2 --> REQ
    r1 -->|"?status="| REQ
    r2 --> SERVICES
    b1 --> DASH
    b2 --> REQ
    b3 --> SERVICES
    b4 --> HOME
```

---

## 3. Telas e dados consumidos

Cada tela chama um hook, que chama um service, que passa pelo `apiClient`. O adaptador é escolhido por `VITE_API_MODE`: mock (padrão, dados locais em `src/data`) ou HTTP real.

```mermaid
flowchart LR
    subgraph Telas
        home[Página inicial]
        services[Serviços]
        detail[Detalhes]
        login[Login]
        boot[AuthProvider]
        dashboard[Dashboard]
        requests[Solicitações]
    end

    subgraph Hooks
        useCategories
        useFeaturedServices
        useServicePages
        useService
        useAuth
        useDashboard
        useRequests
    end

    subgraph Services
        categoryService
        serviceService
        authService
        requestService
    end

    subgraph Endpoints
        e1["GET /categories"]
        e2["GET /services/featured"]
        e3["GET /services"]
        e4["GET /services/:id"]
        e5["POST /auth/login"]
        e6["GET /auth/me"]
        e7["GET /dashboard"]
        e8["GET /requests"]
    end

    home --> useCategories & useFeaturedServices
    services --> useCategories & useServicePages
    detail --> useService & useAuth
    login --> useAuth
    boot --> authService
    dashboard --> useDashboard & useAuth
    requests --> useRequests

    useCategories --> categoryService --> e1
    useFeaturedServices --> serviceService
    useServicePages --> serviceService
    useService --> serviceService
    serviceService --> e2 & e3 & e4
    useAuth --> authService --> e5 & e6
    useDashboard --> requestService
    useRequests --> requestService
    requestService --> e7 & e8

    Endpoints --> client{{"apiClient<br/>injeta token, trata 401"}}
    client --> mode{VITE_API_MODE}
    mode -->|mock| mock["mockAdapter<br/>mockRoutes + src/data"]
    mode -->|http| http["httpAdapter<br/>VITE_API_URL"]
```

Toda tela que carrega dados segue o mesmo ciclo de estados:

```mermaid
stateDiagram-v2
    [*] --> Carregando: useAsync dispara fetch
    Carregando --> Erro: falha sem dados
    Carregando --> Vazio: lista vazia
    Carregando --> Conteudo: dados recebidos
    Erro --> Carregando: Tentar novamente (refetch)
    Vazio --> Carregando: Limpar filtros / trocar filtro
    Conteudo --> Carregando: muda filtro ou página
    Carregando: Skeletons
    Erro: ErrorState
    Vazio: EmptyState
    Conteudo: Cards / tabela
```

---

## 4. Legenda

| Cor | Significado |
|-----|-------------|
| Verde-claro | Telas públicas (`PublicLayout`) |
| Verde-escuro | Telas privadas (`PrivateLayout`, exigem login) |
| Laranja-claro | Autenticação e sessão |
| Cinza | Processos internos do sistema |
| Branco | Decisões |
| Linha tracejada | Evento assíncrono ou alternativo |

| Rota | Tela | Acesso | Arquivo |
|------|------|--------|---------|
| `/` | Página inicial | Pública | `src/pages/HomePage.tsx` |
| `/servicos` | Listagem de serviços | Pública | `src/pages/ServicesPage.tsx` |
| `/servicos/:id` | Detalhes do serviço | Pública | `src/pages/ServiceDetailPage.tsx` |
| `/login` | Login | Pública | `src/pages/LoginPage.tsx` |
| `/dashboard` | Dashboard do produtor | Privada | `src/pages/DashboardPage.tsx` |
| `/solicitacoes` | Minhas solicitações | Privada | `src/pages/RequestsPage.tsx` |
| `*` | Página não encontrada | Pública | `src/pages/NotFoundPage.tsx` |
