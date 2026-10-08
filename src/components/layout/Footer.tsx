import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import { Container } from './Container'
import { Logo } from './Logo'

const footerLinks = [
  { label: 'Início', to: paths.home },
  { label: 'Serviços', to: paths.services },
  { label: 'Entrar', to: paths.login },
  { label: 'Painel do produtor', to: paths.dashboard },
]

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm text-text-muted">
            Conectamos produtores rurais a prestadores de serviços agrícolas com mais agilidade e transparência.
          </p>
        </div>
        <nav aria-label="Rodapé">
          <ul className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-text-muted transition-colors hover:text-text">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-border">
        <Container className="py-5 text-xs text-text-muted">© 2026 AgroServ · Projeto acadêmico de desenvolvimento web</Container>
      </div>
    </footer>
  )
}
