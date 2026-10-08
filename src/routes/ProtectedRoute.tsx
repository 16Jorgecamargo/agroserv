import { Navigate, Outlet, useLocation } from 'react-router'
import { FullScreenLoader } from '../components/ui/FullScreenLoader'
import { useAuth } from '../hooks/useAuth'
import { paths, type LoginLocationState } from './paths'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullScreenLoader />

  if (!isAuthenticated) {
    const state: LoginLocationState = {
      from: { pathname: location.pathname, search: location.search },
      reason: 'protected',
    }
    return <Navigate to={paths.login} replace state={state} />
  }

  return <Outlet />
}
