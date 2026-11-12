import type { RequestConfig } from '../../types/api'
import { ApiError } from './apiError'
import { authRoutes } from './mockRoutes/authRoutes'
import { catalogRoutes } from './mockRoutes/catalogRoutes'
import { accountRoutes } from './mockRoutes/accountRoutes'
import { demoRoutes } from './mockRoutes/demoRoutes'
import { producerRoutes } from './mockRoutes/producerRoutes'
import { propertyRoutes } from './mockRoutes/propertyRoutes'
import { providerRoutes } from './mockRoutes/providerRoutes'
import { providerServiceRoutes } from './mockRoutes/providerServiceRoutes'
import { uploadRoutes } from './mockRoutes/uploadRoutes'
import { normalizeText } from './mockRoutes/shared'
import type { MockRoute } from './mockRoutes/types'

export { normalizeText }

export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean)
  const pathParts = path.split('/').filter(Boolean)

  if (patternParts.length !== pathParts.length) return null

  const params: Record<string, string> = {}

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const pathPart = pathParts[index]

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart)
    } else if (patternPart !== pathPart) {
      return null
    }
  }

  return params
}

const routes: MockRoute[] = [
  ...authRoutes,
  ...catalogRoutes,
  ...producerRoutes,
  ...providerRoutes,
  ...providerServiceRoutes,
  ...propertyRoutes,
  ...accountRoutes,
  ...uploadRoutes,
  ...demoRoutes,
]

export function handleMockRequest(config: RequestConfig): unknown {
  for (const route of routes) {
    if (route.method !== config.method) continue

    const params = matchPath(route.pattern, config.path)

    if (params) {
      return route.handle({
        params,
        query: config.query ?? {},
        body: config.body,
        token: config.token ?? null,
      })
    }
  }

  throw new ApiError({
    status: 404,
    code: 'route_not_found',
    message: `Rota ${config.method} ${config.path} não encontrada.`,
  })
}
