export const paths = {
  home: '/',
  services: '/servicos',
  serviceDetail: (id: string) => `/servicos/${encodeURIComponent(id)}`,
  login: '/login',
  dashboard: '/dashboard',
  requests: '/solicitacoes',
}

export const routePatterns = {
  serviceDetail: '/servicos/:id',
}

export interface LoginLocationState {
  from?: { pathname: string; search: string }
  reason?: 'protected'
}
