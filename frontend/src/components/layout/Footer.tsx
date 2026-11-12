import { Link } from 'react-router'
import { usePanelPath } from '../../hooks/usePanelPath'
import { paths } from '../../routes/paths'
import { Container } from './Container'
import { Logo } from './Logo'

export function Footer() {
  const panelPath = usePanelPath()
  const groups = [
    {
      title: 'Marketplace',
      links: [
        { label: 'Início', to: paths.home },
        { label: 'Serviços', to: paths.services },
      ],
    },
    {
      title: 'Conta',
      links: [
        { label: 'Entrar', to: paths.login },
        { label: 'Criar conta', to: paths.register },
        { label: 'Painel', to: panelPath },
      ],
    },
    {
      title: 'Institucional',
      links: [
        { label: 'Termos de uso', to: paths.terms },
        { label: 'Política de privacidade', to: paths.privacy },
      ],
    },
  ]

  return (
    <footer className="mt-24 bg-primary-strong text-white">
      <Container className="grid gap-12 py-14 lg:grid-cols-[1.2fr_2fr] lg:py-16">
        <div className="max-w-sm space-y-4">
          <Logo tone="light" />
          <p className="text-sm/6 text-white/70">
            Conectamos produtores rurais a prestadores de serviços agrícolas com mais agilidade e transparência.
          </p>
        </div>
        <nav aria-label="Rodapé" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-semibold text-white">{group.title}</p>
              <ul className="mt-4 space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-white/70 transition-colors duration-200 hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Container>
      <div className="border-t border-white/10">
        <Container className="py-6 text-xs text-white/60">© 2026 AgroServ. Projeto acadêmico de desenvolvimento web.</Container>
      </div>
    </footer>
  )
}
