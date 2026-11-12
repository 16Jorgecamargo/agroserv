import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle'
import { paths } from '../routes/paths'

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  usePageTitle(title)

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-10">
      <Link to={paths.register} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text">
        <ArrowLeft className="size-4" aria-hidden />
        Voltar ao cadastro
      </Link>
      <article className="space-y-6 rounded-card border border-border bg-surface p-6 shadow-card sm:p-10">
        <header>
          <h1 className="text-3xl/[38px] font-bold tracking-[-0.01em] text-text">{title}</h1>
          <p className="mt-2 text-sm text-text-muted">Documento demonstrativo do projeto acadêmico AgroServ.</p>
        </header>
        <div className="space-y-5 text-sm leading-7 text-text-muted">{children}</div>
      </article>
    </main>
  )
}

export function TermsPage() {
  return (
    <LegalPage title="Termos de uso">
      <section className="space-y-2">
        <h2 className="font-semibold text-text">1. Sobre o AgroServ</h2>
        <p>
          O AgroServ é uma plataforma demonstrativa para aproximar produtores rurais e prestadores de serviços
          agrícolas. Nesta versão acadêmica, as informações e operações servem para demonstrar o funcionamento do
          sistema.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-text">2. Contas e responsabilidades</h2>
        <p>
          Cada pessoa deve fornecer informações corretas e manter a segurança de suas credenciais. Produtores e
          prestadores são responsáveis por combinar diretamente os detalhes de cada serviço.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-text">3. Valores e contratação</h2>
        <p>
          Os valores apresentados são estimativas. O AgroServ não processa pagamentos; o acerto é feito diretamente
          entre produtor e prestador.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-text">4. Uso adequado</h2>
        <p>
          Não use a plataforma para publicar informações falsas, praticar atividades ilegais ou prejudicar outras
          pessoas. O projeto pode alterar ou remover conteúdo que viole estas regras.
        </p>
      </section>
    </LegalPage>
  )
}

export function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade">
      <section className="space-y-2">
        <h2 className="font-semibold text-text">1. Dados tratados</h2>
        <p>
          O cadastro solicita nome, e-mail, telefone, cidade, estado, papel na plataforma e senha. O aceite desta
          política é registrado para documentar a autorização dada durante o cadastro.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-text">2. Finalidade</h2>
        <p>
          Os dados são usados para criar e proteger a conta, identificar o papel do usuário e viabilizar a comunicação
          relacionada aos serviços. Nesta demonstração, as contas são armazenadas no ambiente de desenvolvimento do
          projeto.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-text">3. Compartilhamento e contato</h2>
        <p>
          Dados de contato podem ser disponibilizados à outra parte quando uma solicitação é agendada, conforme as
          regras da plataforma. Os dados não são vendidos para publicidade.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold text-text">4. Direitos e dúvidas</h2>
        <p>
          Para solicitar acesso, correção ou exclusão de dados da demonstração, entre em contato com a equipe
          responsável pelo projeto acadêmico AgroServ.
        </p>
      </section>
    </LegalPage>
  )
}
