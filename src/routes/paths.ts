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
  requestDetail: (id: string) => `/solicitacoes/${encodeURIComponent(id)}`,
  properties: '/propriedades',
  providerRoot: '/prestador',
  providerDashboard: '/prestador/dashboard',
  providerServices: '/prestador/servicos',
  providerServiceNew: '/prestador/servicos/novo',
  providerServiceEdit: (id: string) => `/prestador/servicos/${encodeURIComponent(id)}/editar`,
  providerRequests: '/prestador/solicitacoes',
  providerAgenda: '/prestador/agenda',
  providerReviews: '/prestador/avaliacoes',
  providerRequestDetail: (id: string) => `/prestador/solicitacoes/${encodeURIComponent(id)}`,
  adminDashboard: '/admin',
  adminRequestDetail: (id: string) => `/admin/solicitacoes/${encodeURIComponent(id)}`,
  profile: '/perfil',
  notifications: '/notificacoes',
  providerNotifications: '/prestador/notificacoes',
  adminNotifications: '/admin/notificacoes',
  providerProfile: '/prestador/perfil',
}

export const routePatterns = {
  serviceDetail: '/servicos/:id',
  requestDetail: '/solicitacoes/:id',
}

export function notificationsPathFor(role: Role): string {
  if (role === 'provider') return paths.providerNotifications
  if (role === 'admin') return paths.adminNotifications
  return paths.notifications
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
    pathname === paths.profile
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
