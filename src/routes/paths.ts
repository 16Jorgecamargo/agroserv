import type { Role } from '../types/entities'

export const paths = {
  home: '/',
  services: '/servicos',
  serviceDetail: (id: string) => `/servicos/${encodeURIComponent(id)}`,
  login: '/login',
  forgotPassword: '/esqueci-senha',
  resetPassword: '/redefinir-senha',
  register: '/cadastro',
  terms: '/termos',
  privacy: '/privacidade',
  dashboard: '/dashboard',
  requests: '/solicitacoes',
  providerRoot: '/prestador',
  providerDashboard: '/prestador/dashboard',
  adminDashboard: '/admin',
}

export const routePatterns = {
  serviceDetail: '/servicos/:id',
}

export interface LoginLocationState {
  from?: { pathname: string; search: string }
  reason?: 'protected' | 'forbidden'
  notice?: 'passwordReset'
}

export function getRoleHomePath(role: Role): string {
  if (role === 'provider') return paths.providerDashboard
  if (role === 'admin') return paths.adminDashboard
  return paths.dashboard
}

export function getRequiredRole(pathname: string): Role | null {
  if (
    pathname === paths.dashboard ||
    pathname === paths.requests ||
    pathname.startsWith(`${paths.requests}/`) ||
    pathname === '/propriedades' ||
    pathname.startsWith('/propriedades/') ||
    pathname === '/favoritos' ||
    pathname === '/perfil'
  ) {
    return 'producer'
  }

  if (pathname === paths.providerRoot || pathname.startsWith(`${paths.providerRoot}/`)) {
    return 'provider'
  }

  if (pathname === paths.adminDashboard || pathname.startsWith(`${paths.adminDashboard}/`)) {
    return 'admin'
  }

  return null
}

export function canReturnToPath(pathname: string, role: Role): boolean {
  if (pathname === paths.login) return false

  const requiredRole = getRequiredRole(pathname)
  return requiredRole === null || requiredRole === role
}
