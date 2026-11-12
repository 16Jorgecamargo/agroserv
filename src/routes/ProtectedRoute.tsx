import { Navigate, Outlet, useLocation } from 'react-router'
import { FullScreenLoader } from '../components/ui/FullScreenLoader'
import { useAuth } from '../hooks/useAuth'
import { getRoleHomePath, paths, type LoginLocationState } from './paths'
import type { Role } from '../types/entities'

interface ProtectedRouteProps {
  allowedRoles: readonly Role[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullScreenLoader />

  if (!isAuthenticated || !user) {
    const state: LoginLocationState = {
      from: { pathname: location.pathname, search: location.search },
      reason: 'protected',
    }
    return <Navigate to={paths.login} replace state={state} />
  }

  if (!allowedRoles.includes(user.role)) {
    const state: LoginLocationState = { reason: 'forbidden' }
    return <Navigate to={getRoleHomePath(user.role)} replace state={state} />
  }

  if (user.role === 'admin' && user.mustChangePassword && location.pathname !== paths.adminAccount) {
    return <Navigate to={paths.adminAccount} replace />
  }

  return <Outlet />
}