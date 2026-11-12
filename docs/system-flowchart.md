# AgroServ — Fluxograma do Sistema

Visão única do sistema completo: como o app inicia, como cada papel entra na sua área, como produtor e prestador fecham um serviço e como a administração modera a plataforma. Front-end e back-end seguem o mesmo contrato ([`api-contract.md`](api-contract.md)), então os fluxos valem nos dois modos (`mock` e `http`).

Para os diagramas detalhados por assunto, com imagens, veja [flowcharts.md](flowcharts.md).

1. [Fluxograma completo](#1-fluxograma-completo)
2. [Jornada de um serviço](#2-jornada-de-um-serviço)
3. [Moderação](#3-moderação)
4. [Telas e dados consumidos](#4-telas-e-dados-consumidos)
5. [Rotas](#5-rotas)
6. [Legenda](#6-legenda)

---

## 1. Fluxograma completo

```mermaid
flowchart TD
    start([Usuário abre o app]) --> boot["main.tsx → App<br/>Router + AuthProvider + FavoritesProvider + ToastProvider"]
    boot --> hasToken{Token salvo?}
    hasToken -->|Não| guest[Visitante]
    hasToken -->|Sim| me["GET /auth/me"]
    me -->|200| authed[Sessão restaurada]
    me -->|401| guest
    guest --> routes{{AppRoutes}}
    authed --> routes

    subgraph PUBLIC["Área pública — PublicLayout"]
        home["Página inicial<br/>busca, categorias, destaques"]
        services["Serviços<br/>filtros avançados, ordenação, lista ou mapa"]
        detail["Detalhe do serviço<br/>galeria, equipamentos, avaliações, favoritar"]
        providerProfile["Perfil público do prestador<br/>raio de atendimento no mapa"]
    end

    subgraph ACCOUNT["Conta"]
        login["Login"]
        register["Cadastro de produtor ou prestador"]
        recovery["Esqueci a senha → e-mail → nova senha"]
    end

    routes --> home
    routes --> services
    routes --> detail
    routes --> providerProfile
    routes --> login
    login --> register
    login --> recovery
    detail -->|Visitante| login
    detail -->|Produtor: Solicitar serviço| request

    routes --> guard{"ProtectedRoute<br/>papel aceito?"}
    login -->|Sucesso| guard
    guard -->|Sem sessão| login
    guard -->|Outro papel| ownHome[Painel do próprio papel]
    guard -->|Admin com senha provisória| adminAccount["/admin/conta"]
    guard -->|Produtor| producer
    guard -->|Prestador| provider
    guard -->|Administrador| admin

    subgraph PRODUCER["Área do produtor"]
        producer["Painel"]
        request["Solicitações e detalhe<br/>conversa, contraproposta, avaliação, contratar de novo"]
        properties["Propriedades"]
        favorites["Favoritos"]
        producerProfile["Perfil e conta"]
    end

    subgraph PROVIDER["Área do prestador"]
        provider["Painel"]
        ads["Meus serviços<br/>criar, editar, pausar, excluir"]
        received["Pedidos recebidos<br/>aceitar, recusar, contraproposta, iniciar, concluir"]
        agenda["Agenda e dias bloqueados"]
        reviews["Avaliações e respostas"]
        equipment["Equipamentos"]
        verification["Verificação de documentos"]
    end

    subgraph ADMIN["Área do administrador"]
        admin["Painel com filas"]
        users["Usuários: suspender, reativar, criar admin"]
        verifications["Verificações: aprovar ou rejeitar"]
        moderation["Anúncios: ocultar, mostrar, excluir"]
        reports["Denúncias: resolver com ação"]
        categories["Categorias"]
        history["Histórico de ações"]
    end

    producer --> request
    producer --> properties
    producer --> favorites
    producer --> producerProfile
    provider --> ads
    provider --> received
    provider --> agenda
    provider --> reviews
    provider --> equipment
    provider --> verification
    admin --> users
    admin --> verifications
    admin --> moderation
    admin --> reports
    admin --> categories
    admin --> history

    request <-.->|"mensagens e notificações"| received
    verification -.->|fila| verifications
    request -.->|"Denunciar"| reports
    received -.->|"Denunciar"| reports

    expired([Qualquer 401 com token]) -.-> clear[Limpa a sessão] -.-> login

    classDef public fill:#E6F0E8,stroke:#2F6B45,color:#17201A
    classDef producerC fill:#173F2A,stroke:#173F2A,color:#FFFFFF
    classDef providerC fill:#2B5C8A,stroke:#2B5C8A,color:#FFFFFF
    classDef adminC fill:#475467,stroke:#475467,color:#FFFFFF
    classDef auth fill:#FFF4E5,stroke:#B54708,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A

    class home,services,detail,providerProfile public
    class producer,request,properties,favorites,producerProfile producerC
    class provider,ads,received,agenda,reviews,equipment,verification providerC
    class admin,users,verifications,moderation,reports,categories,history,adminAccount adminC
    class login,register,recovery auth
    class boot,me,authed,guest,clear,expired,start,ownHome system
```

---

## 2. Jornada de um serviço

Do anúncio à avaliação. Cada passo grava um evento na linha do tempo da solicitação e notifica a outra parte.

```mermaid
sequenceDiagram
    actor V as Prestador
    participant API as API (mock ou NestJS)
    actor P as Produtor

    V->>API: POST /provider/services (fotos, preço, equipamentos)
    P->>API: GET /services?category=&minRating=&date=
    API-->>P: anúncios visíveis (ativo + prestador ativo)
    P->>API: POST /me/favorites (opcional)
    P->>API: POST /requests (serviço, propriedade, data, quantidade)
    Note over P: Aviso se a propriedade estiver fora do raio de atendimento
    API-->>V: notificação: nova solicitação
    alt aceita
        V->>API: POST /provider/requests/:id/accept
    else contraproposta
        V->>API: POST /provider/requests/:id/counter-offer
        P->>API: POST /requests/:id/counter-offer/accept
    else recusa
        V->>API: POST /provider/requests/:id/reject (motivo)
    end
    P->>API: POST /requests/:id/messages
    V->>API: POST /provider/requests/:id/start (no dia)
    V->>API: POST /provider/requests/:id/complete
    API-->>P: notificação: serviço concluído
    P->>API: POST /requests/:id/review (nota e comentário)
    V->>API: PUT /provider/reviews/:id/reply
    P->>API: Contratar de novo → novo POST /requests
```

---

## 3. Moderação

```mermaid
flowchart LR
    subgraph IN["Entradas"]
        doc["Prestador envia documentos"]
        report["Usuário denuncia anúncio, solicitação, avaliação ou pessoa"]
    end

    subgraph QUEUE["Filas no painel do admin"]
        vq["Verificações em análise<br/>mais antigas primeiro"]
        rq["Denúncias abertas<br/>mais antigas primeiro"]
    end

    doc --> vq
    report --> rq
    vq -->|Aprovar| badge["Selo Verificado nos anúncios"]
    vq -->|Rejeitar com motivo| retry["Prestador corrige e reenvia"]
    rq -->|Arquivar| closed["Denúncia resolvida"]
    rq -->|Avisar| warn["Notificação: Aviso da administração"]
    rq -->|Ocultar anúncio| hide["Anúncio sai da busca"]
    rq -->|Ocultar avaliação| hideReview["Média do prestador é recalculada"]
    rq -->|Suspender conta| suspend["Conta bloqueada<br/>solicitações abertas canceladas<br/>outra parte notificada"]
    hide --> log[("Histórico de ações<br/>quem, quando, motivo")]
    hideReview --> log
    suspend --> log
    badge --> log
    retry --> log
    warn --> log
    closed --> notifyReporter["Denunciante recebe: Sua denúncia foi analisada."]
```

---

## 4. Telas e dados consumidos

Cada tela chama um hook, que chama um service, que passa pelo `apiClient`. O adaptador é escolhido por `VITE_API_MODE`: `mock` (padrão, dados demo no `localStorage`) ou `http` (back-end NestJS em `VITE_API_URL`).

| Área | Telas | Endpoints principais |
|---|---|---|
| Pública | Início, serviços (lista e mapa), detalhe, perfil do prestador | `GET /categories`, `GET /services`, `GET /services/featured`, `GET /services/:id`, `GET /services/:id/reviews`, `GET /services/:id/blocked-days`, `GET /providers/:id` |
| Conta | Login, cadastro, recuperação, perfil | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `PATCH /me`, `PATCH /me/password`, `DELETE /me`, `POST /uploads` |
| Produtor | Painel, solicitações, propriedades, favoritos | `GET /dashboard`, `GET/POST /requests`, `GET /requests/:id`, `POST /requests/:id/cancel`, `POST /requests/:id/counter-offer/accept\|decline`, `POST /requests/:id/review`, `PATCH /reviews/:id`, `GET/POST/PATCH/DELETE /me/properties`, `GET/POST/DELETE /me/favorites` |
| Prestador | Painel, anúncios, pedidos, agenda, avaliações, equipamentos, verificação | `GET /provider/dashboard`, `GET/POST/PATCH/DELETE /provider/services`, `POST /provider/services/:id/pause\|activate`, `GET /provider/requests`, `POST /provider/requests/:id/accept\|reject\|counter-offer\|start\|complete\|cancel`, `GET /provider/agenda`, `POST /provider/blocked-days`, `DELETE /provider/blocked-days/:date`, `GET /provider/reviews`, `PUT /provider/reviews/:id/reply`, `GET/POST/PATCH/DELETE /provider/equipment`, `GET/POST /provider/verification`, `GET/PATCH /provider/profile` |
| Conversa e avisos | Detalhe da solicitação, sino, notificações, denúncias | `GET/POST /requests/:id/messages`, `GET /me/notifications`, `POST /me/notifications/:id/read`, `POST /me/notifications/read-all`, `POST /reports` |
| Administrador | Painel, usuários, verificações, anúncios, denúncias, categorias, histórico | `GET /admin/dashboard`, `GET/POST /admin/users`, `POST /admin/users/:id/suspend\|reactivate`, `GET /admin/requests/:id`, `GET /admin/verifications`, `POST /admin/verifications/:id/approve\|reject`, `GET /admin/services`, `POST /admin/services/:id/hide\|show`, `DELETE /admin/services/:id`, `GET /admin/reports`, `POST /admin/reports/:id/resolve`, `GET/POST/PATCH/DELETE /admin/categories`, `GET /admin/actions` |

Toda tela que carrega dados segue o mesmo ciclo de estados:

```mermaid
stateDiagram-v2
    [*] --> Carregando: useAsync dispara a busca
    Carregando --> Erro: falha sem dados
    Carregando --> Vazio: lista vazia
    Carregando --> Conteudo: dados recebidos
    Erro --> Carregando: Tentar novamente
    Vazio --> Carregando: Limpar filtros
    Conteudo --> Carregando: muda filtro, página ou outra tela altera dados
    Carregando: Skeletons
    Erro: ErrorState
    Vazio: EmptyState
    Conteudo: Cards, tabelas ou mapa
```

---

## 5. Rotas

| Rota | Tela | Acesso | Arquivo |
|---|---|---|---|
| `/` | Página inicial | Pública | `src/pages/HomePage.tsx` |
| `/servicos` | Serviços, lista ou mapa | Pública | `src/pages/ServicesPage.tsx` |
| `/servicos/:id` | Detalhe do serviço | Pública | `src/pages/ServiceDetailPage.tsx` |
| `/prestadores/:id` | Perfil público do prestador | Pública | `src/pages/ProviderPublicProfilePage.tsx` |
| `/termos`, `/privacidade` | Termos de uso e privacidade | Pública | `src/pages/TermsPage.tsx`, `src/pages/PrivacyPage.tsx` |
| `/login` | Login | Pública | `src/pages/LoginPage.tsx` |
| `/cadastro` | Cadastro | Pública | `src/pages/RegisterPage.tsx` |
| `/esqueci-senha`, `/redefinir-senha` | Recuperação de senha | Pública | `src/pages/ForgotPasswordPage.tsx`, `src/pages/ResetPasswordPage.tsx` |
| `/dashboard` | Painel do produtor | Produtor | `src/pages/DashboardPage.tsx` |
| `/solicitacoes`, `/solicitacoes/:id` | Solicitações e detalhe | Produtor | `src/pages/RequestsPage.tsx`, `src/pages/RequestDetailPage.tsx` |
| `/propriedades` | Propriedades | Produtor | `src/pages/PropertiesPage.tsx` |
| `/favoritos` | Favoritos | Produtor | `src/pages/FavoritesPage.tsx` |
| `/perfil` | Perfil e conta | Produtor | `src/pages/ProfilePage.tsx` |
| `/prestador/dashboard` | Painel do prestador | Prestador | `src/pages/ProviderDashboardPage.tsx` |
| `/prestador/servicos`, `/novo`, `/:id/editar` | Anúncios | Prestador | `src/pages/MyServicesPage.tsx`, `src/pages/ServiceFormPage.tsx` |
| `/prestador/solicitacoes`, `/:id` | Pedidos recebidos | Prestador | `src/pages/ProviderRequestsPage.tsx`, `src/pages/ProviderRequestDetailPage.tsx` |
| `/prestador/agenda` | Agenda | Prestador | `src/pages/AgendaPage.tsx` |
| `/prestador/avaliacoes` | Avaliações | Prestador | `src/pages/ProviderReviewsPage.tsx` |
| `/prestador/equipamentos` | Equipamentos | Prestador | `src/pages/EquipmentPage.tsx` |
| `/prestador/verificacao` | Verificação | Prestador | `src/pages/VerificationPage.tsx` |
| `/prestador/perfil` | Perfil profissional | Prestador | `src/pages/ProviderProfilePage.tsx` |
| `/admin` | Painel do administrador | Administrador | `src/pages/AdminDashboardPage.tsx` |
| `/admin/usuarios`, `/:id` | Usuários | Administrador | `src/pages/AdminUsersPage.tsx`, `src/pages/AdminUserDetailPage.tsx` |
| `/admin/solicitacoes/:id` | Solicitação (somente leitura) | Administrador | `src/pages/AdminRequestDetailPage.tsx` |
| `/admin/verificacoes` | Verificações | Administrador | `src/pages/AdminVerificationsPage.tsx` |
| `/admin/anuncios` | Anúncios | Administrador | `src/pages/AdminServicesPage.tsx` |
| `/admin/denuncias`, `/:id` | Denúncias | Administrador | `src/pages/AdminReportsPage.tsx`, `src/pages/AdminReportDetailPage.tsx` |
| `/admin/categorias` | Categorias | Administrador | `src/pages/AdminCategoriesPage.tsx` |
| `/admin/historico` | Histórico de ações | Administrador | `src/pages/AdminActionsPage.tsx` |
| `/admin/conta` | Minha conta | Administrador | `src/pages/AdminAccountPage.tsx` |
| `/notificacoes`, `/prestador/notificacoes`, `/admin/notificacoes` | Notificações | Cada papel | `src/pages/NotificationsPage.tsx` |
| `*` | Página não encontrada | Pública | `src/pages/NotFoundPage.tsx` |

---

## 6. Legenda

| Cor | Significado |
|---|---|
| Verde-claro | Telas públicas (`PublicLayout`) |
| Verde-escuro | Área do produtor |
| Azul | Área do prestador |
| Cinza-escuro | Área do administrador |
| Laranja-claro | Autenticação e conta |
| Cinza-claro | Processos internos do sistema |
| Linha tracejada | Evento assíncrono ou alternativo |
