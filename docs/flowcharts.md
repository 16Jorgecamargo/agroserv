# AgroServ — Fluxogramas

Oito diagramas que explicam a navegação, a autenticação e a arquitetura do AgroServ. Cada um aparece como imagem; o código-fonte em [Mermaid](https://mermaid.js.org/) fica logo abaixo, em "Ver código Mermaid".

1. [Mapa de navegação](#1-mapa-de-navegação)
2. [Proteção de rotas (ProtectedRoute)](#2-proteção-de-rotas-protectedroute)
3. [Fluxo de login](#3-fluxo-de-login)
4. [Restauração da sessão ao abrir o app](#4-restauração-da-sessão-ao-abrir-o-app)
5. [Arquitetura em camadas](#5-arquitetura-em-camadas)
6. [Caminho de uma requisição de dados](#6-caminho-de-uma-requisição-de-dados)
7. [Busca e filtros de serviços](#7-busca-e-filtros-de-serviços)
8. [Estados de interface de uma listagem](#8-estados-de-interface-de-uma-listagem)

---

## 1. Mapa de navegação

Páginas públicas em verde-claro, área privada em verde-escuro.

<p align="center"><img src="flowcharts/01-navigation.png" alt="Mapa de navegação" width="960"></p>

<details markdown="1">
<summary>Ver código Mermaid</summary>

```mermaid
flowchart LR
    home["/ Página inicial"]
    services["/servicos Listagem"]
    detail["/servicos/:id Detalhes"]
    login["/login Login"]
    dashboard["/dashboard Painel"]
    requests["/solicitacoes Solicitações"]
    notfound["Rota inexistente: Página não encontrada"]

    home -->|Encontrar serviços / Buscar| services
    home -->|Card de categoria| services
    home -->|Ver detalhes| detail
    services -->|Ver detalhes| detail
    detail -->|Entrar para contratar| login
    home -->|Acessar meu painel| dashboard
    login -->|Login com sucesso| dashboard
    dashboard -->|Ver todas| requests
    requests -->|Sidebar| dashboard
    dashboard -->|Sair| home

    classDef public fill:#E6F0E8,stroke:#2F6B45,color:#17201A
    classDef private fill:#173F2A,stroke:#173F2A,color:#FFFFFF
    classDef neutral fill:#FFFFFF,stroke:#667085,color:#17201A
    class home,services,detail,login public
    class dashboard,requests private
    class notfound neutral
```

</details>

## 2. Proteção de rotas (ProtectedRoute)

Implementado em `src/routes/ProtectedRoute.tsx`. Envolve todas as rotas privadas.

<p align="center"><img src="flowcharts/02-protected-route.png" alt="Proteção de rotas (ProtectedRoute)" width="777"></p>

<details markdown="1">
<summary>Ver código Mermaid</summary>

```mermaid
flowchart TD
    start([Usuário acessa rota privada]) --> loading{Sessão ainda sendo verificada?}
    loading -->|Sim| loader[Mostra tela de carregamento]
    loader --> loading
    loading -->|Não| auth{Usuário autenticado?}
    auth -->|Sim| allow[Renderiza a página privada]
    auth -->|Não| save["Guarda rota original (pathname + query)"]
    save --> redirect["Redireciona para /login com reason = protected"]
    redirect --> message["Login mostra: Faça login para acessar esta área."]
    message --> doLogin([Usuário faz login])
    doLogin --> back[Volta para a rota original guardada]
```

</details>

## 3. Fluxo de login

Implementado em `src/pages/LoginPage.tsx` e `src/contexts/AuthProvider.tsx`.

<p align="center"><img src="flowcharts/03-login.png" alt="Fluxo de login" width="960"></p>

<details markdown="1">
<summary>Ver código Mermaid</summary>

```mermaid
flowchart TD
    open([Abre /login]) --> already{Já está autenticado?}
    already -->|Sim| goFrom[Redireciona para a rota de origem ou /dashboard]
    already -->|Não| form[Formulário: e-mail e senha]
    form --> demo{Clicou em Usar conta demo?}
    demo -->|Sim| fill["Preenche e-mail e senha da conta demo"]
    fill --> form
    demo -->|Não| submit[Clica em Entrar]
    submit --> validate{Campos válidos?}
    validate -->|Não| fieldErrors[Mostra erro em cada campo]
    fieldErrors --> form
    validate -->|Sim| api["POST /auth/login"]
    api --> ok{Resposta 200?}
    ok -->|Não, 401| apiError["Alerta: E-mail ou senha inválidos."]
    apiError --> form
    ok -->|Sim| persist["Salva token e usuário no localStorage"]
    persist --> state[AuthContext atualiza user]
    state --> goFrom
```

</details>

## 4. Restauração da sessão ao abrir o app

Implementado em `src/contexts/AuthProvider.tsx`.

<p align="center"><img src="flowcharts/04-session-restore.png" alt="Restauração da sessão ao abrir o app" width="960"></p>

<details markdown="1">
<summary>Ver código Mermaid</summary>

```mermaid
flowchart TD
    boot([App carrega]) --> token{Existe agroserv_token?}
    token -->|Não| guest[Visitante: isLoading = false]
    token -->|Sim| stored["Lê agroserv_user (descarta se estiver corrompido)"]
    stored --> me["GET /auth/me com Bearer token"]
    me --> result{Resposta}
    result -->|200| refresh[Atualiza usuário salvo]
    result -->|401| clear[Limpa sessão: usuário deslogado]
    result -->|Falha de rede| keep[Mantém sessão salva]
    refresh --> done[isLoading = false]
    clear --> done
    keep --> done
    guest --> ready([App pronto])
    done --> ready
```

</details>

## 5. Arquitetura em camadas

A interface nunca acessa os dados diretamente. Trocar dados simulados por API real é uma variável de ambiente.

<p align="center"><img src="flowcharts/05-architecture.png" alt="Arquitetura em camadas" width="960"></p>

<details markdown="1">
<summary>Ver código Mermaid</summary>

```mermaid
flowchart TB
    subgraph UI["Interface"]
        pages["pages/ (uma por rota)"]
        components["components/ (ui, domain, layout)"]
        layouts["layouts/ (PublicLayout, PrivateLayout)"]
    end
    subgraph State["Estado e lógica"]
        hooks["hooks/ (useAuth, useServicePages, useRequests, useAsync)"]
        contexts["contexts/ (AuthContext + AuthProvider)"]
        routes["routes/ (AppRoutes, ProtectedRoute, paths)"]
    end
    subgraph Data["Camada de dados"]
        services["services/*Service.ts (auth, service, category, request)"]
        client["services/api/apiClient.ts"]
        mock["mockAdapter + mockRoutes"]
        http["httpAdapter (fetch)"]
    end
    seeds[("data/ (dados simulados)")]
    backend[("API REST (próxima etapa)")]

    pages --> components
    layouts --> components
    pages --> hooks
    hooks --> contexts
    hooks --> services
    contexts --> services
    services --> client
    client -->|VITE_API_MODE=mock| mock
    client -->|VITE_API_MODE=http| http
    mock --> seeds
    http --> backend
```

</details>

## 6. Caminho de uma requisição de dados

Exemplo: abrir a listagem de serviços.

<p align="center"><img src="flowcharts/06-data-request.png" alt="Caminho de uma requisição de dados" width="960"></p>

<details markdown="1">
<summary>Ver código Mermaid</summary>

```mermaid
sequenceDiagram
    actor U as Usuário
    participant P as ServicesPage
    participant H as useServicePages / useAsync
    participant S as serviceService
    participant C as apiClient
    participant A as Adaptador (mock ou http)

    U->>P: Abre /servicos?category=pulverizacao
    P->>H: filtros da URL + página atual
    H-->>P: isLoading = true (skeleton)
    H->>S: list({ category, page, pageSize })
    S->>C: get('/services', query)
    C->>A: request({ method, path, query, token })
    A-->>C: Paginated<Service> ou ApiError
    C-->>S: dados
    S-->>H: dados
    H-->>P: data / error
    P-->>U: grid de cards, estado vazio ou estado de erro
```

</details>

## 7. Busca e filtros de serviços

Implementado em `src/pages/ServicesPage.tsx` (estado na URL) e `src/services/api/mockRoutes.ts` (regras do "servidor").

<p align="center"><img src="flowcharts/07-service-search.png" alt="Busca e filtros de serviços" width="783"></p>

<details markdown="1">
<summary>Ver código Mermaid</summary>

```mermaid
flowchart TD
    input([Usuário busca, escolhe categoria ou carrega mais]) --> url["Atualiza a URL: ?q=&location=&category="]
    url --> request["GET /services página a página (9 por página)"]
    request --> normalize["Servidor normaliza texto: sem acento, minúsculo, sem pontuação"]
    normalize --> category{Categoria informada existe?}
    category -->|Não| empty[Lista vazia]
    category -->|Sim ou não informada| filter[Filtra por todos os termos de q e de location]
    filter --> paginate[Pagina o resultado]
    paginate --> any{Algum serviço?}
    any -->|Não| empty
    any -->|Sim| grid[Mostra cards + contador]
    grid --> more{Ainda há mais resultados?}
    more -->|Sim| loadMore[Botão Carregar mais]
    loadMore --> request
    more -->|Não| stop([Fim da lista])
    empty --> clear["Não encontramos serviços para essa busca. + Limpar filtros"]
    clear --> url
```

</details>

## 8. Estados de interface de uma listagem

Padrão aplicado em todas as páginas com dados (home, serviços, detalhe, dashboard, solicitações).

<p align="center"><img src="flowcharts/08-ui-states.png" alt="Estados de interface de uma listagem" width="764"></p>

<details markdown="1">
<summary>Ver código Mermaid</summary>

```mermaid
stateDiagram-v2
    [*] --> Carregando
    Carregando --> Sucesso: dados recebidos
    Carregando --> Vazio: lista sem itens
    Carregando --> Erro: falha na requisição
    Erro --> Carregando: Tentar novamente
    Vazio --> Carregando: Limpar filtros
    Sucesso --> Recarregando: filtro alterado
    Recarregando --> Sucesso: novos dados
    Recarregando --> Vazio: nenhum resultado

    Carregando: Skeleton
    Sucesso: Conteúdo
    Vazio: EmptyState
    Erro: ErrorState
    Recarregando: Conteúdo anterior esmaecido
```

</details>
