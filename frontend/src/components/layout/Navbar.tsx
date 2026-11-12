import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { usePanelPath } from '../../hooks/usePanelPath'
import { paths } from '../../routes/paths'
import { cn } from '../../utils/cn'
import { Avatar } from '../ui/Avatar'
import { Container } from './Container'
import { Logo } from './Logo'

const actionClasses =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.97]'
const loginClasses = cn(actionClasses, 'bg-primary-strong text-white hover:bg-primary')
const logoutClasses = cn(actionClasses, 'border border-border bg-surface text-text hover:border-primary/40 hover:text-primary')

function navLinkClasses({ isActive }: { isActive: boolean }) {
  return cn(
    'inline-flex h-9 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200',
    isActive ? 'bg-primary-soft text-primary-strong' : 'text-text-muted hover:text-text',
  )
}

function mobileLinkClasses({ isActive }: { isActive: boolean }) {
  return cn(
    'flex h-12 items-center rounded-xl px-4 text-base font-medium transition-colors duration-200',
    isActive ? 'bg-primary-soft text-primary-strong' : 'text-text hover:bg-surface-muted',
  )
}

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const panelPath = usePanelPath()
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navItems = [
    { label: 'Início', to: paths.home, end: true },
    { label: 'Serviços', to: paths.services, end: false },
    { label: 'Painel', to: panelPath, end: false },
  ]

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function closeMenu() {
    setIsMenuOpen(false)
  }

  function handleLogout() {
    closeMenu()
    logout()
    navigate(paths.home, { replace: true })
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300',
        isScrolled || isMenuOpen ? 'border-border bg-bg/75 backdrop-blur-xl backdrop-saturate-150' : 'border-transparent bg-bg',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Logo />
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.label}>
                <NavLink to={item.to} end={item.end} className={navLinkClasses}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center justify-end gap-3 md:flex">
          {isAuthenticated && user ? (
            <>
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
              <button type="button" onClick={handleLogout} aria-label="Sair da conta" className={logoutClasses}>
                <LogOut className="size-4" aria-hidden />
                Sair
              </button>
            </>
          ) : (
            <Link to={paths.login} className={loginClasses}>
              Entrar
            </Link>
          )}
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full text-text transition-colors hover:bg-surface-muted md:hidden"
          aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </Container>
      <AnimatePresence initial={false}>
        {isMenuOpen && (
          <motion.nav
            id="mobile-menu"
            aria-label="Menu móvel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <Container className="flex flex-col gap-1 py-3">
              {navItems.map((item) => (
                <NavLink key={item.label} to={item.to} end={item.end} onClick={closeMenu} className={mobileLinkClasses}>
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-border pt-3">
                {isAuthenticated && user ? (
                  <button type="button" onClick={handleLogout} className={cn(logoutClasses, 'h-12 w-full')}>
                    <LogOut className="size-4" aria-hidden />
                    Sair
                  </button>
                ) : (
                  <Link to={paths.login} onClick={closeMenu} className={cn(loginClasses, 'h-12 w-full')}>
                    Entrar
                  </Link>
                )}
              </div>
            </Container>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
