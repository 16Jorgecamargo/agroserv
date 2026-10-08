import { motion } from 'framer-motion'
import { startTransition } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { Sidebar } from '../components/layout/Sidebar'
import { SkipLink } from '../components/layout/SkipLink'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../hooks/useAuth'
import { paths } from '../routes/paths'
import { formatLocation } from '../utils/format'
import { pageTransition } from '../utils/motion'

export function PrivateLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    startTransition(() => {
      navigate(paths.home, { replace: true })
      logout()
    })
  }

  return (
    <div className="min-h-dvh bg-bg lg:pl-64">
      <SkipLink />
      <Sidebar onLogout={handleLogout} />
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-text-muted">Painel do produtor</p>
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-semibold text-text">{user.name}</p>
                <p className="text-xs text-text-muted">{formatLocation(user.city, user.state)}</p>
              </div>
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            </div>
          )}
        </header>
        <motion.main
          id="main-content"
          key={location.pathname}
          {...pageTransition}
          className="flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
        >
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  )
}
