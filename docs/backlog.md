# AgroServ — Backlog da ampliação

Lista de tarefas para levar o AgroServ da etapa 1 (vitrine + painel do produtor) ao marketplace completo com **produtor**, **prestador** e **administrador**.

| Documento | Para que serve |
|---|---|
| Este backlog | Quem faz o quê, em que ordem, e quando está pronto. Rotas, regras do projeto e design system. |
| [`api-contract.md`](api-contract.md) | Endpoints, tipos, erros, permissões e efeitos. **Fonte da verdade** para front-end e back-end. |
| [`future-flowcharts.md`](future-flowcharts.md) | Fluxos de cada papel em diagramas. |

## Como usar

- Cada item tem um **ID** (`F2-03`), as **telas**, os **endpoints** do contrato, **depende de** e os **critérios de aceite**.
- Um item está pronto quando cumpre todos os critérios e a [definição de pronto](#definição-de-pronto).
- As fases seguem a ordem da jornada do produtor. Dentro de uma fase, itens sem dependência entre si podem ser feitos em paralelo.
- Ao pegar um item, coloque seu nome na coluna **Responsável** do [quadro](#quadro) e mude a situação.
- O front-end é construído sobre o **mock** (`src/services/api/mock*`), que deve seguir o contrato à risca. O back-end real implementa o mesmo contrato depois (seção [Back-end](#back-end)).

### Ordem de início e divisão

1. **F1-01 e F1-02 primeiro, com uma pessoa só.** As duas reorganizam o mock e os tipos base. Todas as outras tarefas dependem delas e mexem nos mesmos arquivos. Feitas em paralelo, geram conflito de merge.
2. **Ao mesmo tempo, outra pessoa faz F1-03** (componentes de formulário). Ela não depende do mock.
3. Com F1-01, F1-02 e F1-03 prontas, o restante da fase 1 e o início da fase 2 podem ser divididos.
4. Prefira dar a uma mesma pessoa tarefas que mexem no mesmo domínio do mock (ex.: F2-01, F2-04 e F3-03 tratam das solicitações).

### Fluxo de trabalho

- Uma branch por tarefa, a partir de `master`: `feat/F2-03-solicitar-servico`.
- Commits no padrão do repositório: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`.
- Pull request com o ID no título (`F2-03: solicitar serviço`), a lista de critérios de aceite marcada e prints das telas novas.
- Pelo menos uma revisão de outro colega antes do merge.
- Atualize a branch com `master` antes de pedir revisão. Conflito em arquivo do mock: quem abriu o PR resolve.
- Se a tarefa exigir mudar o contrato, a mudança vai no mesmo PR e é avisada ao grupo.

## Regras do projeto

- Código **sem comentários**.
- Variáveis, funções, tipos e arquivos **em inglês**. Textos de interface e URLs **em PT-BR**.
- Camadas: `types → services/api → services/*Service → hooks → pages/components`. Páginas e componentes nunca importam de `src/data/` nem de `src/services/api/`.
- Toda escrita passa pelo `apiClient`. O mock valida, devolve os mesmos erros do contrato e aplica os mesmos efeitos (notificações, médias, cancelamentos).
- Dados criados no mock sobrevivem ao F5 (banco salvo no `localStorage`, arquivos no IndexedDB).
- Sem pagamento de nenhum tipo. Todo valor exibido é estimativa, com o texto `Valor estimado. O acerto é feito diretamente com o prestador.`
- **"Hoje" é a data de Brasília** (`America/Sao_Paulo`) em toda regra de data, no mock e no back-end.
- Senha mínima de 8 caracteres (as contas demo com `123456` são exceção da semente).
- Telas novas seguem o [design system](#design-system), com estados de carregando, vazio e erro.

## Design system

Resumo do que já existe no projeto. Use os tokens e componentes prontos em vez de criar valores novos.

**Cores** (tokens em `src/index.css`, usados como classes do Tailwind, ex.: `bg-primary`, `text-text-muted`):

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#F7F8F5` | Fundo da página |
| `surface` | `#FFFFFF` | Cards, formulários |
| `surface-muted` | `#EEF1EC` | Áreas de destaque suave, skeleton |
| `border` | `#E4E8E1` | Bordas |
| `text` | `#17201A` | Texto principal |
| `text-muted` | `#667085` | Texto secundário |
| `primary` | `#2F6B45` | Botões, links, item ativo |
| `primary-strong` | `#173F2A` | Hover, fundos escuros |
| `primary-light` | `#7FB685` | Detalhes |
| `primary-soft` | `#E6F0E8` | Fundo de item ativo, selos |
| `warning` | `#B7791F` | Avisos, pendente |
| `danger` | `#B42318` | Erros, ações destrutivas |
| `info` | `#2B5C8A` | Informação, em andamento |

**Forma:** cantos de card `rounded-card` (10 px), sombras `shadow-card` e `shadow-card-hover`.

**Tipografia:** Manrope (variável). Título de página `text-3xl font-bold`, título de seção `text-xl font-semibold`, números com `tabular-nums`.

**Componentes prontos** (`src/components/ui`): `Alert`, `Avatar`, `Badge`, `Breadcrumbs`, `Button` / `buttonClasses`, `EmptyState`, `ErrorState`, `FilterChip`, `FullScreenLoader`, `Input`, `Rating`, `SectionHeader`, `Skeleton`, `StatusBadge`. F1-03 acrescenta os de formulário, modal e toasts.

**Animação:** framer-motion com as variantes de `src/utils/motion.ts` (`fadeUp`, `staggerContainer`, `pageTransition`). O app respeita a opção "reduzir movimento" do sistema (`MotionConfig reducedMotion="user"`).

**Acessibilidade:** todo campo com label, erro ligado por `aria-describedby`, foco visível, navegação por teclado, `role="status"` nos carregamentos, contraste AA.

**Responsivo:** testar em 375 px (celular) e desktop. Tabelas viram cards no celular, como em `RequestsTable`.

## Rotas

| Rota | Tela | Acesso | Item |
|---|---|---|---|
| `/` | Página inicial | Público | existe |
| `/servicos` | Busca de serviços | Público | existe, muda em F7-01 e F7-02 |
| `/servicos/:id` | Detalhe do serviço | Público | existe, muda em F2-03, F3-02, F4-04 e F5-01 |
| `/prestadores/:id` | Perfil público do prestador | Público | F7-05 |
| `/login` | Login | Público | existe, muda em F1-04 |
| `/cadastro` | Cadastro | Público | F1-06 |
| `/esqueci-senha`, `/redefinir-senha` | Recuperação de senha | Público | F1-07 |
| `/termos`, `/privacidade` | Termos de uso e política de privacidade | Público | F1-06 |
| `/dashboard` | Painel do produtor | Produtor | existe, muda em F2-05 |
| `/solicitacoes` | Minhas solicitações | Produtor | existe, muda em F2-05 |
| `/solicitacoes/:id` | Detalhe da solicitação | Produtor | F2-04 |
| `/propriedades` | Propriedades | Produtor | F2-02 |
| `/favoritos` | Favoritos | Produtor | F7-03 |
| `/perfil` | Perfil e conta | Produtor | F1-08 |
| `/notificacoes` | Notificações | Produtor | F4-01 |
| `/prestador/dashboard` | Painel | Prestador | F3-04 |
| `/prestador/servicos`, `/prestador/servicos/novo`, `/prestador/servicos/:id/editar` | Meus serviços | Prestador | F3-02 |
| `/prestador/solicitacoes`, `/prestador/solicitacoes/:id` | Solicitações recebidas | Prestador | F3-03 |
| `/prestador/agenda` | Agenda | Prestador | F5-02 |
| `/prestador/equipamentos` | Equipamentos | Prestador | F5-01 |
| `/prestador/avaliacoes` | Avaliações | Prestador | F4-04 |
| `/prestador/verificacao` | Verificação | Prestador | F5-03 |
| `/prestador/perfil` | Perfil e conta | Prestador | F1-08 |
| `/prestador/notificacoes` | Notificações | Prestador | F4-01 |
| `/admin` | Painel | Admin | F6-01 |
| `/admin/usuarios`, `/admin/usuarios/:id` | Usuários | Admin | F6-02 |
| `/admin/solicitacoes/:id` | Detalhe de solicitação (somente leitura) | Admin | F6-02 |
| `/admin/verificacoes` | Verificações | Admin | F6-03 |
| `/admin/anuncios` | Anúncios | Admin | F6-04 |
| `/admin/denuncias` | Denúncias | Admin | F6-05 |
| `/admin/categorias` | Categorias | Admin | F6-06 |
| `/admin/historico` | Histórico de ações | Admin | F6-07 |
| `/admin/conta` | Conta do administrador | Admin | F6-02 |
| `/admin/notificacoes` | Notificações | Admin | F4-01 |

Rota desconhecida dentro de `/prestador/*` ou `/admin/*` mostra "Página não encontrada" dentro do layout da área.

## Definição de pronto

- [ ] Critérios de aceite do item cumpridos.
- [ ] Testes (Vitest + Testing Library) cobrindo os critérios, incluindo os casos de erro.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test:run` e `npm run build` sem erros.
- [ ] Endpoints do item funcionando no mock exatamente como em `api-contract.md`. Se o contrato precisou mudar, ele foi atualizado no mesmo PR.
- [ ] Testado no navegador em largura de celular (375 px) e desktop.
- [ ] Item marcado como **Feito** no quadro.

---

## Quadro

Situação: `A fazer`, `Em andamento`, `Em revisão`, `Feito`.

Tamanho (estimativa para uma pessoa): **P** até 1 dia · **M** 2 a 3 dias · **G** 4 dias ou mais.

| ID | Item | Tamanho | Depende de | Responsável | Situação |
|---|---|---|---|---|---|
| F1-01 | Banco simulado persistente e restaurar dados demo | G | — | | Feito |
| F1-02 | Papéis, situação da conta e contas demo | M | F1-01 | | Feito |
| F1-03 | Componentes de formulário, modal e toasts | G | — | | Feito |
| F1-04 | Login por papel e proteção de rotas por papel | M | F1-02 | | Feito |
| F1-05 | Layouts das três áreas | M | F1-04 | | Feito |
| F1-06 | Cadastro | M | F1-02, F1-03 | | Feito |
| F1-07 | Recuperação de senha | P | F1-02, F1-03 | | Feito |
| F1-08 | Perfil e conta (produtor e prestador) | M | F1-03, F1-05 | | Feito |
| F2-01 | Novo modelo de solicitação e máquina de status | G | F1-02 | | Feito |
| F2-02 | Propriedades | M | F1-03, F1-05 | | Feito |
| F2-03 | Solicitar serviço | G | F1-03, F2-01, F2-02 | | Feito |
| F2-04 | Detalhe da solicitação (produtor) | M | F1-03, F2-01 | | Feito |
| F2-05 | Lista e painel do produtor com os novos status | P | F2-01 | | Feito |
| F3-01 | Upload de arquivos | M | F1-01, F1-03 | | Feito |
| F3-02 | Meus serviços | G | F3-01, F1-05 | | Feito |
| F3-03 | Solicitações recebidas e ações do prestador | G | F1-03, F1-05, F2-01 | | Feito |
| F3-04 | Painel do prestador | M | F3-03 | | Feito |
| F4-01 | Notificações e sino | M | F1-05, F2-01 | | A fazer |
| F4-02 | Conversa da solicitação | M | F2-04, F3-03 | | A fazer |
| F4-03 | Avaliar serviço (produtor) | M | F2-04 | | Feito |
| F4-04 | Avaliações no detalhe do serviço e respostas do prestador | M | F4-03 | | A fazer |
| F5-01 | Equipamentos | M | F3-01, F3-02 | | A fazer |
| F5-02 | Agenda e dias bloqueados | G | F3-03, F2-03 | | A fazer |
| F5-03 | Verificação do prestador e selo | M | F3-01 | | Feito |
| F6-01 | Painel do administrador | P | F1-05 | | A fazer |
| F6-02 | Usuários e suspensão | G | F1-03, F6-01, F2-01 | | A fazer |
| F6-03 | Fila de verificações | P | F5-03, F6-01 | | A fazer |
| F6-04 | Moderação de anúncios | M | F3-02, F6-01 | | A fazer |
| F6-05 | Denúncias | G | F3-03, F4-04, F6-02, F6-04 | | A fazer |
| F6-06 | Categorias | M | F1-03, F6-01 | | A fazer |
| F6-07 | Histórico de ações | P | F6-02 | | A fazer |
| F7-01 | Filtros avançados e ordenação | M | F5-02, F5-03 | | A fazer |
| F7-02 | Mapa de serviços e raio de atendimento | G | F1-08 | | A fazer |
| F7-03 | Favoritos | P | F2-05 | | A fazer |
| F7-04 | Contratar de novo | P | F2-03 | | A fazer |
| F7-05 | Perfil público do prestador | M | F4-04, F5-01 | | A fazer |
| F7-06 | Documentação final | P | todos | | A fazer |

---

## Fase 1 — Papéis e contas

### F1-01 — Banco simulado persistente e restaurar dados demo
**Telas:** nenhuma nova. Botão "Restaurar dados demo" entra em F1-08.
**Endpoints:** todos os atuais passam a ler e gravar no banco simulado.

O mock deixa de ler arrays fixos de `src/data` e passa a usar um banco em memória salvo no `localStorage` (chave `agroserv_mock_db`, com versão). `src/data` vira só a semente inicial.

Critérios de aceite:
- [ ] `mockRoutes.ts` dividido em módulos por domínio (auth, catálogo, produtor…), sem mudar o comportamento atual: todos os testes existentes passam.
- [ ] Alterações feitas pela API continuam depois de recarregar a página.
- [ ] Banco ausente, corrompido ou de versão antiga → recria a partir da semente, sem erro.
- [ ] Função de restaurar volta tudo à semente.
- [ ] Erros do mock aceitam `fields` (422), e `ApiError`/`httpAdapter` repassam esse campo.
- [ ] Os testes começam sempre de um banco limpo.

### F1-02 — Papéis, situação da conta e contas demo
**Contrato:** seção 5 (`User`, `ProviderProfile`, `Provider`), seção 16 (dados demo).

Critérios de aceite:
- [ ] `User` com `role` (`producer`, `provider`, `admin`), `status` (`active`, `suspended`, `deleted`), `phone` e `createdAt`.
- [ ] Os 6 prestadores atuais viram contas de prestador com os mesmos ids (`prv-1` a `prv-6`), cada um com `ProviderProfile`.
- [ ] Contas demo da seção 16 do contrato funcionando, todas com senha `123456`.
- [ ] `GET /services/:id` devolve `provider.verified`.
- [ ] Token de conta suspensa ou excluída recebe 401 em qualquer endpoint autenticado.
- [ ] Endpoint de papel errado → 403 `forbidden`.

### F1-03 — Componentes de formulário, modal e toasts
**Telas:** nenhuma nova. Base para todas as outras.

Critérios de aceite:
- [ ] `Textarea`, `Select`, `Checkbox`, `Tabs`, `DatePicker` e `FileInput` com label ligada ao campo, mensagem de erro com `aria-describedby` e `aria-invalid`, no mesmo padrão do `Input`.
- [ ] `Modal`: fecha com Esc e clique fora, prende o foco e devolve o foco a quem abriu.
- [ ] `ConfirmDialog` com campo de motivo opcional ou obrigatório (botão de confirmar desabilitado enquanto o motivo obrigatório está vazio).
- [ ] Toasts de sucesso e erro: somem em 4 s, botão `Fechar aviso`, `role="status"`/`role="alert"`.
- [ ] Hook de ação (ex.: `useAction`) que ignora um segundo clique enquanto o primeiro está em andamento e expõe os `fields` do erro 422.
- [ ] `DatePicker` aceita data mínima e uma lista de dias desabilitados.

### F1-04 — Login por papel e proteção de rotas por papel
**Telas:** `/login`.
**Endpoints:** `POST /auth/login` (muda), `GET /auth/me` (muda).

Critérios de aceite:
- [ ] Após o login: produtor → `/dashboard`, prestador → `/prestador/dashboard`, admin → `/admin`.
- [ ] Se havia uma rota guardada antes do login e ela é do mesmo papel (ou pública), volta para ela. Se for de outro papel, vai para a área do próprio papel.
- [ ] Conta suspensa vê `Sua conta está suspensa. Entre em contato com o suporte.`
- [ ] Três atalhos de conta demo no login (Produtor, Prestador, Admin), só no modo mock.
- [ ] "Esqueci minha senha" leva a `/esqueci-senha` e "Criar conta" leva a `/cadastro` (os selos "Em breve" saem).
- [ ] `ProtectedRoute` aceita os papéis permitidos. Usuário de outro papel vai para a própria área com o aviso `Você não tem acesso a esta área.`
- [ ] Teste para cada combinação: produtor em `/admin`, prestador em `/dashboard`, admin em `/prestador/dashboard`.

### F1-05 — Layouts das três áreas
**Telas:** layout do produtor (atual), `/prestador/*`, `/admin/*`.

Critérios de aceite:
- [ ] Um layout base compartilhado (barra lateral, cabeçalho com nome, cidade e foto, conteúdo animado), com itens de menu por papel.
- [ ] Menu do produtor: Dashboard, Solicitações, Propriedades, Favoritos, Ver serviços, Perfil.
- [ ] Menu do prestador: Painel, Solicitações, Meus serviços, Agenda, Equipamentos, Avaliações, Verificação, Perfil.
- [ ] Menu do admin: Painel, Usuários, Verificações, Anúncios, Denúncias, Categorias, Histórico.
- [ ] Os itens de páginas ainda não feitas podem ficar fora do menu até a página existir.
- [ ] Espaço reservado no cabeçalho para o sino (F4-01).
- [ ] Navbar pública: "Meu painel" leva à área do papel do usuário logado.
- [ ] Sair leva à página inicial nas três áreas.

### F1-06 — Cadastro
**Telas:** `/cadastro`.
**Endpoints:** `POST /auth/register`.

Critérios de aceite:
- [ ] Campos: nome, e-mail, senha (mínimo 8 caracteres), confirmação, telefone, cidade, UF (lista das 27) e escolha entre `Sou produtor rural` e `Sou prestador de serviços`.
- [ ] Caixa obrigatória "Li e aceito os termos de uso e a política de privacidade", com links para `/termos` e `/privacidade` (páginas simples; o texto pode ser um modelo acadêmico).
- [ ] Validação no front com as mensagens do contrato. Senhas diferentes: `As senhas não conferem.`
- [ ] E-mail já cadastrado aparece no campo de e-mail (erro 422 da API).
- [ ] Após cadastrar, o usuário já está logado e vai para a área do seu papel.
- [ ] Cadastro de prestador cria o perfil profissional vazio.

### F1-07 — Recuperação de senha
**Telas:** `/esqueci-senha`, `/redefinir-senha?token=…`.
**Endpoints:** `POST /auth/forgot-password`, `POST /auth/reset-password`.

Critérios de aceite:
- [ ] Sempre mostra `Se o e-mail existir, enviaremos um link.`
- [ ] No mock, quando a conta existe, aparece o link `Abrir link de redefinição`.
- [ ] Link vencido, inexistente ou já usado: `Link inválido ou expirado.`, com opção de pedir outro.
- [ ] Sucesso leva ao login com `Senha redefinida. Entre com a nova senha.`, e a senha nova funciona.

### F1-08 — Perfil e conta (produtor e prestador)
**Telas:** `/perfil`, `/prestador/perfil`.
**Endpoints:** `PATCH /me`, `PATCH /me/password`, `DELETE /me`, `GET/PATCH /provider/profile`.

Critérios de aceite:
- [ ] Editar nome, telefone, cidade e UF. O cabeçalho atualiza na hora.
- [ ] Trocar senha pedindo a atual (`Senha atual incorreta.`).
- [ ] Excluir conta com confirmação. Com solicitações abertas, mostra a mensagem do contrato e não exclui. Sem elas, exclui, desloga e vai para a página inicial.
- [ ] Prestador: seção "Perfil profissional" com CPF/CNPJ, raio de atendimento (km), anos de experiência e descrição.
- [ ] Botão "Restaurar dados demo" no perfil (e no painel do admin), só no modo mock.
- [ ] A troca de foto entra em F3-01.

---

## Fase 2 — Jornada do produtor

### F2-01 — Novo modelo de solicitação e máquina de status
**Contrato:** seção 5 (`ServiceRequest`, `ServiceRequestDetail`, `RequestEvent`), seção 6 (ciclo de vida).

Critérios de aceite:
- [ ] Status novos `counter_offer` e `rejected`. Rótulos: Pendente, Contraproposta, Agendada, Em andamento, Concluída, Recusada, Cancelada.
- [ ] Uma função única aplica as transições da tabela da seção 6 e responde 409 `invalid_transition` para qualquer outra. Ela é usada por todos os endpoints de ação.
- [ ] `allowedActions` calculado por papel e status (tabela da seção 6).
- [ ] Toda transição grava um `RequestEvent`.
- [ ] Testes cobrindo cada linha da tabela de transições e pelo menos uma transição inválida por status.
- [ ] Regra de datas que já passaram (contrato, seção 6): o prestador não aceita solicitação com data passada, e o produtor não aceita contraproposta com data efetiva passada.
- [ ] "Hoje" calculado no horário de Brasília. Teste com um horário entre 21h e 23h59 de Brasília.
- [ ] Semente com ao menos uma solicitação em cada status entre o produtor demo e o prestador demo.
- [ ] `GET /requests` e `GET /dashboard` com os novos status. `stats.open` conta `counter_offer`.
- [ ] O card "Total contratado" vira "Total estimado contratado".

### F2-02 — Propriedades
**Telas:** `/propriedades`.
**Endpoints:** `GET/POST/PATCH/DELETE /me/properties`.

Critérios de aceite:
- [ ] Lista, cria, edita e remove propriedades com nome, cidade, UF, acesso, área em hectares e culturas (tags).
- [ ] Validações e mensagens do contrato.
- [ ] Propriedade com solicitação aberta não pode ser removida (mensagem do contrato).
- [ ] Remover é exclusão lógica: some da lista e do formulário, mas as solicitações antigas continuam mostrando a propriedade com o selo "Propriedade removida".
- [ ] Estado vazio com o botão "Cadastrar propriedade".

### F2-03 — Solicitar serviço
**Telas:** botão e formulário no detalhe do serviço (`/servicos/:id`), confirmação.
**Endpoints:** `POST /requests`, `GET /me/properties`, `GET /services/:id/blocked-days` (a partir de F5-02).

Critérios de aceite:
- [ ] Produtor logado vê "Solicitar serviço". Visitante vê "Entrar para contratar", que volta ao serviço depois do login. Prestador e admin não veem o botão.
- [ ] Formulário: propriedade, data (a partir de hoje), quantidade na unidade do serviço e observações.
- [ ] Sem propriedade cadastrada, dá para criar uma ali mesmo, sem sair do formulário.
- [ ] Valor estimado (preço × quantidade) atualiza enquanto digita, com o aviso de estimativa.
- [ ] Serviço indisponível não deixa enviar.
- [ ] Erros da API aparecem nos campos.
- [ ] Depois de enviar: confirmação com o link para o detalhe da solicitação.

### F2-04 — Detalhe da solicitação (produtor)
**Telas:** `/solicitacoes/:id`.
**Endpoints:** `GET /requests/:id`, `POST /requests/:id/cancel`, `POST /requests/:id/counter-offer/accept`, `POST /requests/:id/counter-offer/decline`.

Critérios de aceite:
- [ ] Resumo: serviço, prestador, propriedade, data, quantidade, valor estimado, observações.
- [ ] Linha do tempo com cada evento (quem, quando, motivo).
- [ ] Botões conforme `allowedActions`: cancelar (motivo obrigatório quando agendada), aceitar ou recusar contraproposta.
- [ ] A contraproposta aparece em destaque, com a data e o valor propostos comparados aos originais.
- [ ] Data que já passou: aviso `A data pedida já passou.`, e o botão de aceitar contraproposta some, conforme `allowedActions`.
- [ ] Telefone do prestador aparece a partir de "Agendada".
- [ ] Serviço ou propriedade excluídos depois aparecem com os selos "Anúncio removido" / "Propriedade removida", sem quebrar a tela.
- [ ] Ação que falhar com 409 mostra a mensagem e recarrega a solicitação.
- [ ] Id inexistente ou de outro produtor mostra "Solicitação não encontrada".
- [ ] Linhas da lista de solicitações e do painel abrem este detalhe.

### F2-05 — Lista e painel do produtor com os novos status
**Telas:** `/solicitacoes`, `/dashboard`.

Critérios de aceite:
- [ ] Filtros por status incluem Contraproposta e Recusada.
- [ ] Contrapropostas aparecem em destaque no painel ("Você tem uma contraproposta para responder").
- [ ] Status antigo inválido na URL continua caindo em "Todas".

---

## Fase 3 — Prestador

### F3-01 — Upload de arquivos
**Endpoints:** `POST /uploads`.

Critérios de aceite:
- [ ] Componente de envio de arquivo com prévia, remoção e mensagem de erro.
- [ ] Aceita JPG, PNG, WEBP e PDF até 5 MB. Imagens reduzidas para no máximo 1280 px antes de enviar.
- [ ] Envia o `purpose` certo: `public` para fotos, `verification` para documentos (contrato, seção 9).
- [ ] No mock, o arquivo fica no IndexedDB e a URL `mockfile:<id>` continua exibindo a imagem depois de recarregar.
- [ ] Componente de imagem que resolve `mockfile:` e URLs normais, com o ícone de imagem quebrada quando falhar.
- [ ] Troca de foto de perfil em `/perfil` e `/prestador/perfil`.

### F3-02 — Meus serviços
**Telas:** `/prestador/servicos`, `/prestador/servicos/novo`, `/prestador/servicos/:id/editar`.
**Endpoints:** `GET/POST/PATCH/DELETE /provider/services`, `POST /provider/services/:id/pause`, `POST /provider/services/:id/activate`, mudanças em `GET /services`, `/services/featured`, `/services/:id`.

Critérios de aceite:
- [ ] Lista com situação de cada anúncio: Ativo, Pausado, Oculto pela administração (com o motivo).
- [ ] Formulário: título, categoria (só ativas), descrição, preço, unidade, cidade, UF, até 8 fotos e "Disponível para novas solicitações".
- [ ] Publicar coloca o anúncio na busca na hora.
- [ ] Pausar e reativar. Anúncio oculto não pode ser reativado pelo prestador.
- [ ] Excluir bloqueado com solicitações abertas, com sugestão de pausar.
- [ ] Excluir é exclusão lógica: some de tudo, mas as solicitações e avaliações antigas continuam mostrando o anúncio com o selo "Anúncio removido".
- [ ] Busca, destaques e detalhe público seguem a regra de visibilidade do contrato (seção 10).
- [ ] Detalhe do serviço com galeria de fotos.

### F3-03 — Solicitações recebidas e ações do prestador
**Telas:** `/prestador/solicitacoes`, `/prestador/solicitacoes/:id`.
**Endpoints:** `GET /provider/requests`, `GET /provider/requests/:id`, `POST /provider/requests/:id/accept|reject|counter-offer|start|complete|cancel`.

Critérios de aceite:
- [ ] Lista com filtro por status. As pendentes ficam em destaque.
- [ ] Detalhe com produtor e propriedade (área, culturas, acesso, cidade), data, quantidade, valor estimado, observações e linha do tempo.
- [ ] Telefone do produtor só a partir de "Agendada".
- [ ] Botões conforme `allowedActions`: aceitar, recusar (motivo), contraproposta (nova data e/ou valor total + mensagem), iniciar (desabilitado antes da data, com a explicação), concluir, cancelar (motivo).
- [ ] Solicitação pendente com data passada: aviso `A data pedida já passou.`, sem botão de aceitar, com destaque para a contraproposta com nova data.
- [ ] Ação em tela desatualizada (409) mostra a mensagem e recarrega.

### F3-04 — Painel do prestador
**Telas:** `/prestador/dashboard`.
**Endpoints:** `GET /provider/dashboard`.

Critérios de aceite:
- [ ] Cards: novas solicitações, agendados nos próximos 7 dias, em andamento, taxa de aceite (90 dias, "—" sem dados), avaliação média, valor estimado concluído no mês (com o aviso de estimativa).
- [ ] Listas de pendentes e próximos agendados, com links para o detalhe.
- [ ] Atalhos para Solicitações e Agenda.

---

## Fase 4 — Confiança e comunicação

### F4-01 — Notificações e sino
**Telas:** sino no cabeçalho das três áreas, `/notificacoes`, `/prestador/notificacoes`, `/admin/notificacoes`.
**Endpoints:** `GET /me/notifications`, `POST /me/notifications/:id/read`, `POST /me/notifications/read-all`.

Critérios de aceite:
- [ ] Estrutura de notificações pronta (gerar, listar, marcar como lida) para as próximas tarefas usarem.
- [ ] Geradas nesta tarefa: as notificações da seção 15 do contrato ligadas a solicitações (nova, aceita, recusada, contraproposta, cancelada, iniciada, concluída). As de mensagens, avaliações, verificação, anúncios e denúncias entram nas tarefas F4-02, F4-03, F4-04, F5-03, F6-02, F6-03, F6-04 e F6-05.
- [ ] Sino com contador de não lidas e as 10 mais recentes.
- [ ] Clicar marca como lida e abre o `link`.
- [ ] Página com todas, paginada, e "Marcar todas como lidas".
- [ ] O contador atualiza ao trocar de página e depois de cada ação (sem tempo real).

### F4-02 — Conversa da solicitação
**Telas:** bloco de conversa nos detalhes de solicitação do produtor e do prestador.
**Endpoints:** `GET/POST /requests/:id/messages`.

Critérios de aceite:
- [ ] Mensagens em ordem, com nome, papel e hora. As do próprio usuário ficam alinhadas à direita.
- [ ] Campo de texto até 2000 caracteres, com contador.
- [ ] Com a solicitação encerrada, a conversa fica somente leitura com o aviso `Esta conversa está encerrada.`
- [ ] Nova mensagem notifica a outra parte, sem repetir notificação enquanto a anterior não for lida.

### F4-03 — Avaliar serviço (produtor)
**Telas:** formulário no detalhe da solicitação concluída.
**Endpoints:** `POST /requests/:id/review`, `PATCH /reviews/:id`.

Critérios de aceite:
- [ ] Estrelas de 1 a 5 acessíveis pelo teclado, e comentário opcional até 1000 caracteres.
- [ ] Só em solicitação concluída, uma vez.
- [ ] Editável por 7 dias, com a data limite visível. Depois disso, fica somente leitura.
- [ ] A média do serviço e do prestador muda conforme a fórmula do contrato. Os números atuais dos dados demo são o ponto de partida.
- [ ] Nova avaliação notifica o prestador (`review`).

### F4-04 — Avaliações no detalhe do serviço e respostas do prestador
**Telas:** seção de avaliações em `/servicos/:id`, `/prestador/avaliacoes`.
**Endpoints:** `GET /services/:id/reviews`, `GET /provider/reviews`, `PUT /provider/reviews/:id/reply`.

Critérios de aceite:
- [ ] Detalhe do serviço: média, total, distribuição por estrelas e lista paginada com as respostas do prestador.
- [ ] `/prestador/avaliacoes`: lista com filtro por nota. As ocultas aparecem marcadas.
- [ ] Responder e editar a resposta. A primeira resposta notifica o produtor.
- [ ] Botão "Denunciar avaliação" fica reservado para F6-05.

---

## Fase 5 — Extras do prestador

### F5-01 — Equipamentos
**Telas:** `/prestador/equipamentos`, campo de equipamentos no formulário de serviço, bloco no detalhe do serviço.
**Endpoints:** `GET/POST/PATCH/DELETE /provider/equipment`.

Critérios de aceite:
- [ ] Criar, editar e remover equipamentos com tipo, marca/modelo, ano, descrição técnica e até 6 fotos.
- [ ] Vincular equipamentos aos serviços. Remover um equipamento tira o vínculo.
- [ ] O detalhe público do serviço mostra os equipamentos.

### F5-02 — Agenda e dias bloqueados
**Telas:** `/prestador/agenda`, calendário do formulário de solicitação.
**Endpoints:** `GET /provider/agenda`, `POST /provider/blocked-days`, `DELETE /provider/blocked-days/:date`, `GET /services/:id/blocked-days`.

Critérios de aceite:
- [ ] Calendário mensal com as solicitações agendadas, em andamento e concluídas em cada dia. Clicar abre a solicitação.
- [ ] Bloquear e desbloquear dias a partir de hoje.
- [ ] No formulário de solicitação (F2-03), os dias bloqueados ficam desabilitados.
- [ ] `POST /requests` recusa dia bloqueado com `O prestador não atende nesta data.`
- [ ] Bloquear um dia não cancela o que já está agendado.

### F5-03 — Verificação do prestador e selo
**Telas:** `/prestador/verificacao`, selo nos cards, no detalhe e no perfil público.
**Endpoints:** `GET/POST /provider/verification`.

Critérios de aceite:
- [ ] Mostra a situação: Não enviada, Em análise, Aprovada, Rejeitada (com o motivo).
- [ ] Envio de documento de identidade e comprovante de endereço (imagem ou PDF).
- [ ] Exige CPF/CNPJ preenchido no perfil antes de enviar.
- [ ] Reenvio permitido depois de rejeitada.
- [ ] Documentos enviados com `purpose: "verification"`: só o prestador e os administradores conseguem abrir.
- [ ] O envio notifica os administradores (`verification_submitted`).
- [ ] Selo "Verificado" aparece onde o prestador aparece: cards, detalhe do serviço e perfil público.

---

## Fase 6 — Administrador

### F6-01 — Painel do administrador
**Telas:** `/admin`.
**Endpoints:** `GET /admin/dashboard`.

Critérios de aceite:
- [ ] Usuários por papel, novos cadastros em 7 dias, solicitações por status, serviços ativos, 5 categorias mais solicitadas, verificações pendentes e denúncias abertas.
- [ ] Os números de verificações e denúncias levam às respectivas filas.

### F6-02 — Usuários e suspensão
**Telas:** `/admin/usuarios`, `/admin/usuarios/:id`, `/admin/solicitacoes/:id`, `/admin/conta`.
**Endpoints:** `GET/POST /admin/users`, `GET /admin/users/:id`, `GET /admin/requests/:id`, `POST /admin/users/:id/suspend`, `POST /admin/users/:id/reactivate`, `PATCH /me`, `PATCH /me/password`.

Critérios de aceite:
- [ ] Busca por nome ou e-mail e filtros por papel e situação, com paginação.
- [ ] Detalhe com dados, solicitações, serviços (prestador), avaliações e histórico de ações sobre a conta.
- [ ] Criar administrador com senha provisória. No primeiro acesso, o novo admin é levado a `/admin/conta` com o aviso `Troque sua senha provisória para continuar.`, e as outras telas do admin ficam bloqueadas até a troca.
- [ ] `/admin/conta`: dados pessoais e troca de senha (sem excluir conta).
- [ ] As solicitações listadas no detalhe do usuário abrem `/admin/solicitacoes/:id` (`GET /admin/requests/:id`): somente leitura, com os telefones das duas partes.
- [ ] A suspensão notifica a outra parte de cada solicitação cancelada.
- [ ] Suspender com motivo, com todos os efeitos da seção 14 do contrato: solicitações abertas canceladas pelo sistema, outra parte notificada, anúncios fora da busca.
- [ ] Usuário suspenso com sessão aberta é deslogado na próxima ação.
- [ ] Bloqueios: não suspender a si mesmo nem o último administrador.
- [ ] Reativar devolve o acesso, e os anúncios voltam como estavam.

### F6-03 — Fila de verificações
**Telas:** `/admin/verificacoes`.
**Endpoints:** `GET /admin/verifications`, `POST /admin/verifications/:providerId/approve|reject`.

Critérios de aceite:
- [ ] Fila com os mais antigos primeiro, mostrando os dados e os documentos (imagem ou PDF).
- [ ] Aprovar dá o selo na hora. Rejeitar exige motivo. O prestador é notificado nos dois casos.

### F6-04 — Moderação de anúncios
**Telas:** `/admin/anuncios`.
**Endpoints:** `GET /admin/services`, `POST /admin/services/:id/hide|show`, `DELETE /admin/services/:id`.

Critérios de aceite:
- [ ] Lista de todos os anúncios com busca e filtros por categoria e situação.
- [ ] Ocultar com motivo (o prestador é notificado). Mostrar de novo volta ao estado anterior.
- [ ] Remover bloqueado com solicitações abertas.

### F6-05 — Denúncias
**Telas:** botão "Denunciar" no detalhe do serviço, no detalhe das solicitações (produtor e prestador) e nas avaliações recebidas (prestador); `/admin/denuncias` com detalhe.
**Endpoints:** `POST /reports`, `GET /admin/reports`, `GET /admin/reports/:id`, `POST /admin/reports/:id/resolve`.

Critérios de aceite:
- [ ] Formulário de denúncia com motivo (lista fixa) e descrição, respeitando quem pode denunciar o quê (tabela do contrato).
- [ ] Denúncia repetida em aberto para o mesmo alvo é bloqueada.
- [ ] Fila do admin com filtros por situação e tipo de alvo.
- [ ] Detalhe mostra o alvo atual e, para solicitações, a conversa.
- [ ] Ações permitidas por tipo de alvo (tabela do contrato), com nota interna obrigatória e mensagem obrigatória para ocultar anúncio, advertir ou suspender.
- [ ] A nota interna nunca aparece para usuários. O que o usuário afetado recebe é sempre a mensagem.
- [ ] Nova denúncia notifica os administradores (`report_created`).
- [ ] Ocultar avaliação tira a nota da média.
- [ ] Quem denunciou recebe `Sua denúncia foi analisada.`, sem detalhes.

### F6-06 — Categorias
**Telas:** `/admin/categorias`.
**Endpoints:** `GET/POST/PATCH/DELETE /admin/categories`, mudança em `GET /categories`.

Critérios de aceite:
- [ ] Lista com número de serviços por categoria, incluindo desativadas.
- [ ] Criar e editar com nome, endereço (slug, gerado automaticamente) e ícone da lista do contrato.
- [ ] Desativar tira a categoria dos filtros públicos e do formulário de serviço, sem esconder os serviços existentes.
- [ ] Apagar só sem serviços.

### F6-07 — Histórico de ações
**Telas:** `/admin/historico`.
**Endpoints:** `GET /admin/actions`.

Critérios de aceite:
- [ ] Toda ação de escrita do admin aparece: quem, quando, ação, alvo e motivo.
- [ ] Filtros por administrador, tipo de ação e período, com paginação.
- [ ] Somente leitura.

---

## Fase 7 — Descoberta

### F7-01 — Filtros avançados e ordenação
**Telas:** `/servicos`.
**Endpoints:** `GET /services` com `priceUnit`, `minPrice`, `maxPrice`, `minRating`, `verified`, `date` e `sort`.

Critérios de aceite:
- [ ] Painel de filtros (em celular, numa gaveta): unidade de cobrança, faixa de preço, avaliação mínima, só verificados, disponível em uma data.
- [ ] A faixa de preço só aparece depois de escolher a unidade (hectare, hora, dia ou viagem).
- [ ] Ordenação: relevância, menor preço, maior preço, melhor avaliação.
- [ ] Filtros e ordenação ficam na URL e sobrevivem ao recarregar e ao voltar.
- [ ] "Limpar filtros" limpa os novos também.

### F7-02 — Mapa de serviços e raio de atendimento
**Telas:** alternância lista/mapa em `/servicos`; círculo de raio no perfil público; aviso no formulário de solicitação.

Critérios de aceite:
- [ ] Mapa com Leaflet + OpenStreetMap e um marcador por cidade com serviços, mostrando quantos há.
- [ ] Coordenadas vêm de uma tabela fixa de cidades no front-end (pelo menos as cidades dos dados demo e as principais do oeste do Paraná). Cidade fora da tabela não aparece no mapa.
- [ ] Perfil público do prestador desenha o raio de atendimento.
- [ ] Formulário de solicitação mostra `Sua propriedade pode estar fora da área de atendimento` quando a distância entre as cidades passa do raio. Não bloqueia o envio.
- [ ] Nos testes, o mapa é substituído por um componente simples.

### F7-03 — Favoritos
**Telas:** coração nos cards e no detalhe do serviço; `/favoritos`.
**Endpoints:** `GET/POST/DELETE /me/favorites`.

Critérios de aceite:
- [ ] Coração animado, visível só para produtores logados.
- [ ] Visitante clicando no coração vai para o login e volta.
- [ ] `/favoritos` lista os favoritos visíveis, com estado vazio.

### F7-04 — Contratar de novo
**Telas:** botão no detalhe de solicitação concluída.

Critérios de aceite:
- [ ] Abre o formulário de solicitação com o mesmo serviço e a mesma propriedade.
- [ ] Se o serviço não estiver mais disponível, explica e oferece buscar serviços parecidos (mesma categoria).

### F7-05 — Perfil público do prestador
**Telas:** `/prestadores/:id`, links a partir do detalhe do serviço e dos cards.
**Endpoints:** `GET /providers/:id`.

Critérios de aceite:
- [ ] Nome, foto, cidade, selo, raio de atendimento, anos de experiência, descrição, serviços ativos, equipamentos e avaliações recentes.
- [ ] Prestador suspenso ou excluído: `Prestador não está mais na plataforma.`

### F7-06 — Documentação final
Critérios de aceite:
- [ ] `api-contract.md`: todos os endpoints marcados como **Implementado**.
- [ ] `system-flowchart.md` descreve o sistema completo. `future-flowcharts.md` vira histórico ou é removido.
- [ ] README atualizado com as contas demo e as novas áreas.
- [ ] Imagens dos fluxogramas regeneradas para o GitHub Pages.

---

## Back-end

Para a etapa seguinte da disciplina. O back-end implementa `api-contract.md`. O front-end passa a usá-lo com `VITE_API_MODE=http`.

**Situação:** B-01 a B-07, B-09 e B-10 estão implementados em [`backend/`](../backend/README.md), na branch `backend`. B-08 depende de ajustes no front-end, listados na seção 17 do contrato.

| ID | Item | Critérios de aceite |
|---|---|---|
| B-01 | Base do projeto | API REST com o formato de erro da seção 3, CORS liberado para o front-end, variáveis de ambiente documentadas. |
| B-02 | Banco de dados e semente | Modelo cobrindo todas as entidades da seção 5. Semente com os dados demo da seção 16. |
| B-03 | Autenticação | Senhas com hash (bcrypt ou argon2), mínimo de 8 caracteres. Token Bearer (JWT recomendado) válido por 7 dias. 401 para conta suspensa ou excluída, papéis e 403. Limite de 5 tentativas erradas de login por e-mail em 15 minutos (429). Data do aceite dos termos guardada no cadastro. `mustChangePassword` para administradores criados com senha provisória. |
| B-04 | Recuperação de senha por e-mail | Token de uso único, válido por 60 minutos. A resposta não revela se o e-mail existe e **não** devolve `resetToken`. No máximo 3 e-mails por conta por hora. |
| B-05 | Upload de arquivos | `multipart/form-data` com `purpose`, limites de tipo e tamanho, armazenamento em disco ou nuvem. Fotos (`public`) com URL pública. Documentos de verificação (`verification`) com URL que exige autenticação, ou assinada com validade curta, acessível só ao prestador dono e a administradores. |
| B-06 | Endpoints por fase | Implementar na ordem F1 → F7, com as mesmas validações, mensagens e efeitos do mock. |
| B-07 | Testes de integração | Cada endpoint com casos de sucesso, validação, permissão (401/403/404) e transição inválida (409). |
| B-08 | Troca no front-end | Front-end rodando com `VITE_API_MODE=http` sem mudar componentes. Todos os fluxos de `future-flowcharts.md` funcionando de ponta a ponta. |
| B-09 | Fuso horário | Toda regra de "hoje" usa `America/Sao_Paulo`. Datas e horários gravados em UTC. |
| B-10 | Exclusão lógica | Serviços, propriedades e contas nunca são apagados de verdade (seção 2 do contrato). Solicitações e avaliações antigas continuam abrindo. |

---

## Fora do escopo desta ampliação

Ideias levantadas antes e que **não** fazem parte do design atual. Só entram com uma nova decisão.

- **Pagamento** de qualquer tipo, incluindo registro de "pago / a pagar". Fora por decisão do projeto.
- Chat em tempo real, e-mail, SMS e notificações push.
- Uma conta com dois papéis.
- Modo escuro.
- Gráficos (sparklines, gastos mensais).
- Páginas `/sobre` e `/como-funciona` e seções extras na página inicial.
- "Lembrar de mim" no login.
- Lazy loading de páginas.
- Aplicativo mobile nativo.

## Histórico

A versão anterior deste arquivo listava o escopo adiado da etapa 1 e repetia o design original completo. O design original continua em `docs/superpowers/specs/2026-10-07-agroserv-design.md`, e a versão antiga deste backlog está no histórico do Git.
