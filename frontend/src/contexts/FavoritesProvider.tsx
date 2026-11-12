import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { favoriteService } from '../services/favoriteService'
import { FavoritesContext, type FavoritesContextValue } from './FavoritesContext'
import { ToastContext } from './ToastContext'

interface FavoriteState {
  userId: string
  ids: Set<string>
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const toast = useContext(ToastContext)
  const userId = user?.role === 'producer' ? user.id : null
  const [state, setState] = useState<FavoriteState | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    favoriteService
      .list()
      .then((services) => {
        if (active) setState({ userId, ids: new Set(services.map((service) => service.id)) })
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [userId])

  const ids = useMemo(() => (userId && state?.userId === userId ? state.ids : new Set<string>()), [state, userId])

  const toggle = useCallback(
    async (serviceId: string) => {
      if (!userId) return
      const wasFavorite = ids.has(serviceId)
      const next = new Set(ids)
      if (wasFavorite) next.delete(serviceId)
      else next.add(serviceId)
      setState({ userId, ids: next })
      try {
        if (wasFavorite) await favoriteService.remove(serviceId)
        else await favoriteService.add(serviceId)
      } catch {
        setState({ userId, ids })
        toast?.error('Não foi possível atualizar seus favoritos.')
      }
    },
    [ids, toast, userId],
  )

  const value = useMemo<FavoritesContextValue>(
    () => ({
      canFavorite: Boolean(userId),
      isVisitor: !user,
      isReady: Boolean(userId && state?.userId === userId),
      isFavorite: (serviceId) => ids.has(serviceId),
      toggle,
    }),
    [ids, state, toggle, user, userId],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}
