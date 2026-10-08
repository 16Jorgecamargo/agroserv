import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { paths } from '../../routes/paths'
import { cn } from '../../utils/cn'
import { Avatar } from '../ui/Avatar'
import { buttonClasses } from '../ui/buttonClasses'
import { Container } from './Container'
import { Logo } from './Logo'

const navItems = [
  { label: 'Início', to: paths.home, end: true },
  { label: 'Serviços', to: paths.services, end: false },
  { label: 'Painel', to: paths.dashboard, end: false },
]

function navLinkClasses({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-primary' : 'text-text-muted hover:text-text',
  )
}

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 8)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    navigate(paths.home)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-200',
        isScrolled || isMenuOpen ? 'border-border bg-bg/80 backdrop-blur-md' : 'border-transparent bg-bg',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={navLinkClasses}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <>
              <Link to={paths.dashboard} className={buttonClasses('primary', 'sm')}>
                Meu painel
              </Link>
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sair da conta"
                className="grid size-9 place-items-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </>
          ) : (
            <Link to={paths.login} className={buttonClasses('secondary', 'sm')}>
              Entrar
            </Link>
          )}
        </div>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-lg text-text md:hidden"
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border md:hidden"
          >
            <Container className="flex flex-col gap-1 py-3">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} onClick={closeMenu} className={navLinkClasses}>
                  {item.label}
                </NavLink>
              ))}
              <div className="mt-2 border-t border-border pt-3">
                {isAuthenticated ? (
                  <button type="button" onClick={handleLogout} className={buttonClasses('secondary', 'md', 'w-full')}>
                    Sair
                  </button>
                ) : (
                  <Link to={paths.login} onClick={closeMenu} className={buttonClasses('primary', 'md', 'w-full')}>
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
