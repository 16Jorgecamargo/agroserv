# AgroServ — Fluxogramas da Ampliação (histórico)

> **Histórico.** Este arquivo foi o plano da ampliação para três papéis: **produtor**, **prestador** e **administrador**. Tudo o que está aqui foi implementado no front-end e no back-end. A descrição do sistema atual fica em [`system-flowchart.md`](system-flowchart.md) e os diagramas com imagem em [`flowcharts.md`](flowcharts.md). O texto abaixo foi mantido como registro do planejamento.

Regras detalhadas de cada fluxo: [`api-contract.md`](api-contract.md). Tarefas e telas: [`backlog.md`](backlog.md).

1. [Mapa geral de telas](#1-mapa-geral-de-telas)
2. [Cadastro, login e recuperação de senha](#2-cadastro-login-e-recuperação-de-senha)
3. [Jornada do produtor](#3-jornada-do-produtor)
4. [Ciclo de status da solicitação](#4-ciclo-de-status-da-solicitação)
5. [Negociação entre produtor e prestador](#5-negociação-entre-produtor-e-prestador)
6. [Prestador: anúncios](#6-prestador-anúncios)
7. [Prestador: solicitações recebidas e agenda](#7-prestador-solicitações-recebidas-e-agenda)
8. [Prestador: verificação](#8-prestador-verificação)
9. [Administrador: usuários e suspensão](#9-administrador-usuários-e-suspensão)
10. [Administrador: denúncias](#10-administrador-denúncias)
11. [Administrador: anúncios e categorias](#11-administrador-anúncios-e-categorias)
12. [Avaliações](#12-avaliações)
13. [Notificações e conversa](#13-notificações-e-conversa)

Legenda de cores usada nos diagramas:

| Cor | Significado |
|-----|-------------|
| Verde-claro | Público |
| Verde-escuro | Produtor |
| Azul | Prestador |
| Laranja | Administrador |
| Cinza | Sistema |

---

## 1. Mapa geral de telas

```mermaid
flowchart LR
    subgraph PUB["Público"]
        home["/ Início"]
        services["/servicos Busca, filtros e mapa"]
        detail["/servicos/:id Detalhe, fotos, equipamentos, avaliações"]
        provPublic["/prestadores/:id Perfil do prestador"]
        login["/login"]
        register["/cadastro"]
        forgot["/esqueci-senha"]
        reset["/redefinir-senha"]
    end

    subgraph PROD["Produtor"]
        pDash["/dashboard Painel"]
        pReq["/solicitacoes Minhas solicitações"]
        pReqDetail["/solicitacoes/:id Detalhe, linha do tempo, conversa"]
        pProps["/propriedades Propriedades"]
        pFav["/favoritos Favoritos"]
        pProfile["/perfil Perfil"]
        pNotif["/notificacoes"]
    end

    subgraph PROV["Prestador"]
        vDash["/prestador/dashboard Painel"]
        vServ["/prestador/servicos Meus serviços"]
        vServForm["/prestador/servicos/novo e /:id/editar"]
        vEquip["/prestador/equipamentos"]
        vReq["/prestador/solicitacoes Recebidas"]
        vReqDetail["/prestador/solicitacoes/:id"]
        vAgenda["/prestador/agenda"]
        vReviews["/prestador/avaliacoes"]
        vVerif["/prestador/verificacao"]
        vProfile["/prestador/perfil"]
    end

    subgraph ADM["Administrador"]
        aDash["/admin Painel"]
        aUsers["/admin/usuarios"]
        aUserDetail["/admin/usuarios/:id"]
        aVerif["/admin/verificacoes"]
        aServ["/admin/anuncios"]
        aReports["/admin/denuncias"]
        aCat["/admin/categorias"]
        aHist["/admin/historico"]
        aReqDetail["/admin/solicitacoes/:id Detalhe somente leitura"]
        aAccount["/admin/conta Conta e senha"]
    end

    home --> services --> detail --> provPublic
    login --> register
    login --> forgot --> reset --> login
    login -->|produtor| pDash
    login -->|prestador| vDash
    login -->|admin| aDash

    pDash --> pReq --> pReqDetail
    pDash --> pProps
    pDash --> pFav
    pDash --> pProfile
    pDash -->|Sino| pNotif
    detail -->|Solicitar serviço| pReqDetail

    vDash --> vReq --> vReqDetail
    vDash --> vServ --> vServForm
    vServForm --> vEquip
    vDash --> vAgenda
    vDash --> vReviews
    vDash --> vVerif
    vDash --> vProfile

    aDash --> aUsers --> aUserDetail
    aUserDetail --> aReqDetail
    aDash --> aAccount
    aDash --> aVerif
    aDash --> aServ
    aDash --> aReports
    aDash --> aCat
    aDash --> aHist

    classDef public fill:#E6F0E8,stroke:#2F6B45,color:#17201A
    classDef producer fill:#173F2A,stroke:#173F2A,color:#FFFFFF
    classDef provider fill:#E3EDF7,stroke:#2B5C8A,color:#17201A
    classDef admin fill:#FFF4E5,stroke:#B54708,color:#17201A
    class home,services,detail,provPublic,login,register,forgot,reset public
    class pDash,pReq,pReqDetail,pProps,pFav,pProfile,pNotif producer
    class vDash,vServ,vServForm,vEquip,vReq,vReqDetail,vAgenda,vReviews,vVerif,vProfile provider
    class aDash,aUsers,aUserDetail,aVerif,aServ,aReports,aCat,aHist,aReqDetail,aAccount admin
```

Cada conta tem um único papel. Quem tenta abrir a área de outro papel volta para a própria área com o aviso "Você não tem acesso a esta área."

---

## 2. Cadastro, login e recuperação de senha

```mermaid
flowchart TD
    start([Visitante]) --> choice{Tem conta?}

    choice -->|Não| register["/cadastro<br/>Nome, e-mail, senha de 8+ caracteres,<br/>telefone, cidade/UF, aceite dos termos"]
    register --> role{Como vai usar?}
    role -->|Sou produtor rural| newProd[Conta de produtor]
    role -->|Sou prestador de serviços| newProv["Conta de prestador<br/>+ perfil profissional vazio<br/>verificação: não enviada"]
    register --> regValid{E-mail já cadastrado?}
    regValid -->|Sim| regErr[Erro no campo e-mail] --> register
    newProd --> logged
    newProv --> logged

    choice -->|Sim| login["/login"]
    login --> creds{Credenciais corretas?}
    creds -->|Não| loginErr["E-mail ou senha inválidos."] --> login
    creds -->|Sim| status{Situação da conta}
    status -->|Suspensa| suspended["Sua conta está suspensa.<br/>Entre em contato com o suporte."] --> login
    status -->|Ativa| logged{{Logado}}

    logged --> saved{Tinha uma rota guardada<br/>do mesmo papel?}
    saved -->|Sim| back[Volta para a rota guardada]
    saved -->|Não| roleHome{Papel}
    roleHome -->|Produtor| pDash["/dashboard"]
    roleHome -->|Prestador| vDash["/prestador/dashboard"]
    roleHome -->|Administrador| aDash["/admin"]

    login -->|Esqueci minha senha| forgot["/esqueci-senha<br/>Informa e-mail"]
    forgot --> generic["Se o e-mail existir,<br/>enviaremos um link."]
    generic --> link[Usuário abre o link]
    link --> reset["/redefinir-senha<br/>Nova senha + confirmação"]
    reset --> tokenOk{Link válido e não usado?}
    tokenOk -->|Não| tokenErr["Link inválido ou expirado."] --> forgot
    tokenOk -->|Sim| done["Senha redefinida.<br/>Entre com a nova senha."] --> login

    classDef public fill:#E6F0E8,stroke:#2F6B45,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    class register,login,forgot,reset public
    class newProd,newProv,logged,generic,done system
```

Administradores não se cadastram. Outro administrador cria a conta em `/admin/usuarios` com uma senha provisória, que precisa ser trocada no primeiro acesso.

---

## 3. Jornada do produtor

```mermaid
flowchart TD
    find["1. Encontrar<br/>Busca, filtros, mapa,<br/>avaliações, perfil do prestador"] --> logged{Está logado?}
    logged -->|Não| login["Entrar para contratar<br/>login ou cadastro"] --> back[Volta ao serviço]
    back --> hasProp
    logged -->|Sim| hasProp{Tem propriedade cadastrada?}
    hasProp -->|Não| newProp["2. Cadastrar propriedade<br/>nome, cidade/UF, acesso,<br/>área em hectares, culturas"]
    newProp --> form
    hasProp -->|Sim| form["3. Solicitar serviço<br/>propriedade, data, quantidade, observações"]

    form --> available{Serviço disponível?}
    available -->|Não| blocked[Botão desabilitado]
    available -->|Sim| dateOk{Data livre na agenda<br/>do prestador?}
    dateOk -->|Não| pickAgain[Dia bloqueado no calendário] --> form
    dateOk -->|Sim| radius{Propriedade dentro do<br/>raio de atendimento?}
    radius -->|Não| warn["Aviso: pode estar fora<br/>da área de atendimento"] --> estimate
    radius -->|Sim| estimate["Valor estimado = preço × quantidade<br/>Acerto feito direto com o prestador"]
    estimate --> send[Envia solicitação]
    send --> pending([Status: Pendente])

    pending --> negotiate["4. Negociar<br/>aceite, recusa ou contraproposta<br/>conversa dentro da solicitação"]
    negotiate --> follow["5. Acompanhar<br/>linha do tempo, notificações,<br/>cancelar se preciso"]
    follow --> done([Status: Concluída])
    done --> review["6. Avaliar<br/>1 a 5 estrelas + comentário"]
    review --> again["7. Voltar<br/>Contratar de novo, favoritos, histórico"]
    again --> find

    classDef producer fill:#173F2A,stroke:#173F2A,color:#FFFFFF
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    class find,newProp,form,negotiate,follow,review,again producer
    class estimate,send,pending,done,warn,pickAgain,blocked system
```

Não há pagamento no sistema. O valor exibido é sempre uma estimativa.

---

## 4. Ciclo de status da solicitação

```mermaid
stateDiagram-v2
    [*] --> Pendente: produtor envia

    Pendente --> Agendada: prestador aceita
    Pendente --> Recusada: prestador recusa com motivo
    Pendente --> Contraproposta: prestador propõe outra data ou valor
    Pendente --> Cancelada: produtor cancela

    Contraproposta --> Agendada: produtor aceita a proposta
    Contraproposta --> Cancelada: produtor recusa a proposta

    Agendada --> EmAndamento: prestador inicia na data
    Agendada --> Cancelada: produtor ou prestador cancela com motivo

    EmAndamento --> Concluida: prestador conclui
    EmAndamento --> Cancelada: sistema, só por suspensão de conta

    Concluida --> [*]: produtor pode avaliar
    Recusada --> [*]
    Cancelada --> [*]

    EmAndamento: Em andamento
    Concluida: Concluída
```

| Status | Quem pode agir |
|---|---|
| Pendente | Prestador responde. Produtor pode cancelar. |
| Contraproposta | Produtor aceita ou recusa. |
| Agendada | Prestador inicia a partir da data. Os dois podem cancelar. |
| Em andamento | Prestador conclui. |
| Concluída | Produtor avalia. |
| Recusada / Cancelada | Ninguém. A solicitação está encerrada. |

Toda mudança gera um evento na linha do tempo (quem, quando, motivo) e uma notificação para a outra parte.

**Datas que já passaram:** o prestador só aceita se a data pedida for hoje ou depois; se passou, faz uma contraproposta com nova data ou recusa. O produtor só aceita a contraproposta se a data efetiva for hoje ou depois. "Hoje" é sempre a data de Brasília.

A partir de **Agendada**, produtor e prestador veem o telefone um do outro, já que o acerto é feito fora do sistema.

---

## 5. Negociação entre produtor e prestador

```mermaid
sequenceDiagram
    actor P as Produtor
    participant S as AgroServ
    actor V as Prestador

    P->>S: Envia solicitação (propriedade, data, quantidade)
    S-->>V: Notificação: nova solicitação
    V->>S: Abre a solicitação e vê a propriedade

    alt Aceita
        V->>S: Aceitar (só se a data pedida não passou)
        S-->>P: Notificação: solicitação agendada
        S->>S: Telefones liberados para os dois
    else Recusa
        V->>S: Recusar com motivo
        S-->>P: Notificação: solicitação recusada
    else Contraproposta
        V->>S: Nova data e/ou novo valor + mensagem
        S-->>P: Notificação: contraproposta recebida
        alt Produtor aceita
            P->>S: Aceitar proposta (só se a data não passou)
            S->>S: Data e valor passam a ser os da proposta
            S-->>V: Notificação: proposta aceita
        else Produtor recusa
            P->>S: Recusar proposta
            S-->>V: Notificação: solicitação cancelada
        end
    end

    opt Dúvidas a qualquer momento
        P->>S: Mensagem na conversa
        S-->>V: Notificação: nova mensagem
        V->>S: Resposta
        S-->>P: Notificação: nova mensagem
    end

    V->>S: Iniciar (na data agendada)
    S-->>P: Notificação: serviço em andamento
    V->>S: Concluir
    S-->>P: Notificação: serviço concluído, avalie
```

Só uma contraproposta por solicitação. Se o produtor recusar, ele cria uma solicitação nova para negociar de novo.

---

## 6. Prestador: anúncios

```mermaid
flowchart TD
    list["/prestador/servicos<br/>Meus serviços"] --> new[Novo serviço]
    new --> form["Título, categoria, descrição,<br/>preço e unidade: hectare, hora, dia ou viagem,<br/>cidade/UF, fotos, equipamentos"]
    form --> valid{Campos válidos?}
    valid -->|Não| errors[Erros nos campos] --> form
    valid -->|Sim| active([Ativo: aparece na busca na hora])

    active -->|Pausar| paused([Pausado: some da busca])
    paused -->|Reativar| active
    active -->|Administrador oculta| hidden(["Oculto pelo admin<br/>prestador vê o motivo<br/>não pode reativar"])
    hidden -->|Administrador mostra de novo| active

    active --> del{Excluir}
    paused --> del
    del --> open{Tem solicitações em aberto?}
    open -->|Sim| mustPause["Não pode excluir.<br/>Pause o anúncio."]
    open -->|Não| removed(["Excluído<br/>some da busca e da lista,<br/>histórico das solicitações mantido"])

    list --> edit[Editar] --> form

    classDef provider fill:#E3EDF7,stroke:#2B5C8A,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    classDef admin fill:#FFF4E5,stroke:#B54708,color:#17201A
    class list,new,form,edit provider
    class active,paused,removed,mustPause,errors system
    class hidden admin
```

Prestadores não verificados também publicam. A diferença é o selo "verificado".

---

## 7. Prestador: solicitações recebidas e agenda

```mermaid
flowchart TD
    notif([Notificação: nova solicitação]) --> list["/prestador/solicitacoes<br/>novas em destaque"]
    list --> detail["Detalhe<br/>produtor, propriedade, área, culturas,<br/>data, quantidade, valor estimado, observações"]

    detail --> decide{Decisão}
    decide -->|"Aceitar, se a data não passou"| accepted[Agendada]
    decide -->|"Data já passou"| counterDate[Contraproposta com nova data]
    decide -->|Recusar| rejected[Recusada com motivo]
    decide -->|Contraproposta| counter[Aguardando produtor]
    decide -->|Conversar| chat[Conversa] --> decide

    accepted --> agenda["Dia marcado na agenda"]
    agenda --> dateReached{Chegou a data?}
    dateReached -->|Não| waitDate[Botão Iniciar desabilitado]
    dateReached -->|Sim| start[Iniciar → Em andamento]
    start --> finish[Concluir → Concluída]
    accepted -->|Imprevisto| cancel[Cancelar com motivo]

    subgraph AG["/prestador/agenda"]
        cal[Calendário mensal com serviços agendados]
        block[Bloquear ou desbloquear dias]
    end

    agenda --> cal
    block --> effect["Dias bloqueados ficam indisponíveis<br/>no formulário de todos os seus serviços"]

    subgraph DASH["/prestador/dashboard"]
        k1[Novas solicitações]
        k2[Agendados nos próximos 7 dias]
        k3[Em andamento]
        k4[Taxa de aceite nos últimos 90 dias]
        k5[Avaliação média]
        k6[Valor estimado concluído no mês]
    end

    classDef provider fill:#E3EDF7,stroke:#2B5C8A,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    class list,detail,chat,cal,block provider
    class notif,accepted,rejected,counter,counterDate,agenda,start,finish,cancel,effect,waitDate system
```

---

## 8. Prestador: verificação

```mermaid
flowchart LR
    notSent([Não enviada]) --> upload["/prestador/verificacao<br/>Documento CPF/CNPJ<br/>+ comprovante de endereço<br/>arquivos privados: só prestador e admins"]
    upload --> review([Em análise])
    review --> admin{Administrador analisa}
    admin -->|Aprova| approved(["Aprovada<br/>selo verificado no perfil,<br/>nos cards e no detalhe"])
    admin -->|Rejeita com motivo| rejected([Rejeitada])
    rejected -->|Corrige e reenvia| upload
    upload -.-> notifAdm([Admins notificados])
    approved -.-> notifA([Notificação ao prestador])
    rejected -.-> notifR([Notificação com o motivo])

    classDef provider fill:#E3EDF7,stroke:#2B5C8A,color:#17201A
    classDef admin fill:#FFF4E5,stroke:#B54708,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    class upload provider
    class admin admin
    class notSent,review,approved,rejected,notifA,notifR,notifAdm system
```

---

## 9. Administrador: usuários e suspensão

```mermaid
flowchart TD
    users["/admin/usuarios<br/>busca por nome ou e-mail<br/>filtro por papel e situação"] --> detail["/admin/usuarios/:id<br/>dados, solicitações, serviços,<br/>avaliações, histórico"]
    users --> newAdmin["Novo administrador<br/>nome, e-mail, senha provisória"]
    newAdmin --> firstLogin["Primeiro acesso:<br/>troca de senha obrigatória<br/>em /admin/conta"]
    detail --> openReq["Abrir solicitação<br/>/admin/solicitacoes/:id<br/>somente leitura"]

    detail --> action{Ação}
    action -->|Suspender| guard{É ele mesmo ou<br/>o último admin ativo?}
    guard -->|Sim| denied[Não permitido]
    guard -->|Não| reason[Informa o motivo]
    reason --> effects

    subgraph effects["Efeitos imediatos da suspensão"]
        e1[Conta não entra mais]
        e2[Sessão aberta cai na próxima ação]
        e3["Solicitações abertas viram Canceladas<br/>motivo: Conta suspensa pela administração"]
        e4[Outra parte de cada solicitação é notificada]
        e5[Se prestador: anúncios saem da busca]
    end

    action -->|Reativar| reactivate["Acesso volta<br/>anúncios voltam ao estado anterior<br/>solicitações canceladas não voltam"]

    effects --> log[(Histórico de ações)]
    reactivate --> log
    newAdmin --> log

    classDef admin fill:#FFF4E5,stroke:#B54708,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    class users,detail,newAdmin,reason,firstLogin,openReq admin
    class e1,e2,e3,e4,e5,reactivate,log,denied system
```

---

## 10. Administrador: denúncias

```mermaid
flowchart TD
    subgraph WHO["Quem denuncia o quê"]
        prod["Produtor:<br/>anúncio, prestador, problema na solicitação"]
        prov["Prestador:<br/>avaliação, produtor, problema na solicitação"]
    end

    prod --> form
    prov --> form
    form["Denunciar<br/>motivo: ofensivo, informação falsa,<br/>golpe ou fraude, serviço não realizado, outro<br/>+ descrição"] --> open([Aberta])
    open -.-> admNotif([Admins notificados])

    open --> queue["/admin/denuncias<br/>fila de denúncias"]
    queue --> analyze["Analisa o alvo<br/>e a conversa da solicitação, se houver"]
    analyze --> target{Tipo de alvo}

    target -->|Anúncio| t1[Ocultar anúncio · Advertir · Suspender · Arquivar]
    target -->|Avaliação| t2[Ocultar avaliação · Advertir · Suspender · Arquivar]
    target -->|Produtor ou prestador| t3[Advertir · Suspender · Arquivar]
    target -->|Solicitação| t4[Advertir uma parte · Suspender uma parte · Arquivar]

    t1 --> outcome
    t2 --> outcome
    t3 --> outcome
    t4 --> outcome
    outcome{Ação escolhida} -->|Arquivar| dismissed([Arquivada])
    outcome -->|Outra ação| resolved([Resolvida])

    dismissed --> note["Nota interna obrigatória<br/>só administradores veem"]
    resolved --> msg["Mensagem ao usuário afetado<br/>obrigatória para ocultar anúncio,<br/>advertir ou suspender"]
    msg --> note
    note --> notifyReporter([Quem denunciou é avisado, sem detalhes])
    note --> log[(Histórico de ações)]

    classDef admin fill:#FFF4E5,stroke:#B54708,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    class queue,analyze,t1,t2,t3,t4 admin
    class open,dismissed,resolved,note,msg,notifyReporter,log system
```

Advertir envia uma notificação ao usuário com a mensagem escrita pelo administrador. A nota interna nunca é enviada a usuários.

---

## 11. Administrador: anúncios e categorias

```mermaid
flowchart LR
    subgraph ANU["/admin/anuncios"]
        aList[Todos os serviços<br/>busca, categoria, situação]
        aList --> hide[Ocultar com motivo]
        aList --> show[Mostrar de novo]
        aList --> remove{Remover}
        remove --> hasOpen{Solicitações em aberto?}
        hasOpen -->|Sim| noRemove[Não permitido]
        hasOpen -->|Não| removed[Removido]
    end

    hide -.-> provNotif([Prestador notificado com o motivo])

    subgraph CAT["/admin/categorias"]
        cList[Lista de categorias]
        cList --> cNew[Criar: nome, slug, ícone]
        cList --> cEdit[Editar]
        cList --> cToggle{Ativar ou desativar}
        cToggle -->|Desativada| cEffect["Some dos filtros e do formulário<br/>de novo serviço; serviços existentes continuam"]
        cList --> cDel{Apagar}
        cDel --> cHas{Tem serviços?}
        cHas -->|Sim| cNo[Não permitido]
        cHas -->|Não| cOk[Apagada]
    end

    hide --> log[(Histórico de ações)]
    show --> log
    removed --> log
    cNew --> log
    cEdit --> log
    cToggle --> log

    classDef admin fill:#FFF4E5,stroke:#B54708,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    class aList,hide,show,cList,cNew,cEdit admin
    class removed,noRemove,cEffect,cNo,cOk,provNotif,log system
```

---

## 12. Avaliações

```mermaid
flowchart TD
    done([Solicitação concluída]) --> already{Já avaliou esta solicitação?}
    already -->|Sim| editable{Faz menos de 7 dias?}
    editable -->|Sim| edit[Editar avaliação]
    editable -->|Não| fixed[Avaliação fixa]
    already -->|Não| rate["Avaliar<br/>1 a 5 estrelas + comentário opcional"]

    rate --> recalc["Atualiza a média do serviço<br/>e do prestador"]
    edit --> recalc
    recalc --> publicView["Aparece no detalhe do serviço<br/>e no perfil do prestador"]
    recalc -.-> notifP([Prestador notificado])

    publicView --> reply["Prestador responde publicamente<br/>uma resposta por avaliação, editável"]
    reply -.-> notifR([Produtor notificado])
    publicView --> report[Prestador denuncia avaliação ofensiva]
    report --> adminHide{Administrador oculta?}
    adminHide -->|Sim| out[Avaliação some e sai da média]
    adminHide -->|Não| keep[Continua visível]

    classDef producer fill:#173F2A,stroke:#173F2A,color:#FFFFFF
    classDef provider fill:#E3EDF7,stroke:#2B5C8A,color:#17201A
    classDef admin fill:#FFF4E5,stroke:#B54708,color:#17201A
    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    class rate,edit producer
    class reply,report provider
    class adminHide admin
    class done,recalc,publicView,notifP,notifR,out,keep,fixed system
```

---

## 13. Notificações e conversa

```mermaid
flowchart LR
    subgraph EV["Eventos que notificam"]
        n1[Nova solicitação]
        n2[Mudança de status]
        n3[Contraproposta]
        n4[Nova mensagem]
        n5[Nova avaliação]
        n6[Resposta à avaliação]
        n7[Resultado da verificação]
        n8[Anúncio oculto]
        n9[Advertência]
        n10[Denúncia resolvida]
    end

    EV --> bell["Sino no topo<br/>contador de não lidas<br/>10 mais recentes"]
    bell --> page["Página de notificações<br/>marcar todas como lidas"]
    bell --> openNotif[Clicar numa notificação]
    page --> openNotif
    openNotif --> read[Marca como lida]
    read --> go["Abre o item:<br/>solicitação, avaliação,<br/>denúncia ou verificação"]

    subgraph CH["Conversa da solicitação"]
        open{Solicitação aberta?}
        open -->|Sim| write["Produtor e prestador trocam mensagens<br/>só texto, até 2000 caracteres"]
        open -->|"Não: concluída, recusada ou cancelada"| readonly[Somente leitura]
        write -.-> n4
        adminView[Administrador vê a conversa<br/>ao analisar uma denúncia]
    end

    classDef system fill:#F2F4F7,stroke:#667085,color:#17201A
    classDef admin fill:#FFF4E5,stroke:#B54708,color:#17201A
    class bell,page,openNotif,read,go,write,readonly system
    class adminView admin
```

Notificações aparecem só dentro do sistema. Não há e-mail, SMS ou push nesta etapa.
