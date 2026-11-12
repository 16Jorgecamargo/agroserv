import type { Service } from '../../../types/entities'
import { getMockDatabase, persistMockDatabase } from '../mockDatabase'
import { findServiceRecord, getBody, isServiceVisible, requireUser, serviceNotFound, textField, toService } from './shared'
import type { MockRoute } from './types'

function listFavorites(userId: string): Service[] {
  const database = getMockDatabase()
  return database.favorites
    .filter((favorite) => favorite.producerId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .flatMap((favorite) => {
      const record = findServiceRecord(favorite.serviceId)
      return record && isServiceVisible(record) ? [toService(record)] : []
    })
}

export const favoriteRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: '/me/favorites',
    handle: ({ token }) => listFavorites(requireUser(token, 'producer').id),
  },
  {
    method: 'POST',
    pattern: '/me/favorites',
    handle: ({ token, body }) => {
      const user = requireUser(token, 'producer')
      const serviceId = textField(getBody(body).serviceId)
      const record = findServiceRecord(serviceId)
      if (!record || !isServiceVisible(record)) serviceNotFound()
      const database = getMockDatabase()
      if (!database.favorites.some((favorite) => favorite.producerId === user.id && favorite.serviceId === serviceId)) {
        database.favorites.push({ producerId: user.id, serviceId, createdAt: new Date().toISOString() })
        persistMockDatabase()
      }
      return undefined
    },
  },
  {
    method: 'DELETE',
    pattern: '/me/favorites/:serviceId',
    handle: ({ token, params }) => {
      const user = requireUser(token, 'producer')
      const database = getMockDatabase()
      database.favorites = database.favorites.filter((favorite) => !(favorite.producerId === user.id && favorite.serviceId === params.serviceId))
      persistMockDatabase()
      return undefined
    },
  },
]
