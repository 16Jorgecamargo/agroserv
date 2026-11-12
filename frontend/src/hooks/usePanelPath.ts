import { getRoleHomePath, paths } from '../routes/paths'
import { useAuth } from './useAuth'

export function usePanelPath(): string {
  const { isAuthenticated, user } = useAuth()
  return isAuthenticated && user ? getRoleHomePath(user.role) : paths.dashboard
}
