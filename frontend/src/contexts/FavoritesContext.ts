import { createContext } from 'react'

export interface FavoritesContextValue {
  canFavorite: boolean
  isVisitor: boolean
  isReady: boolean
  isFavorite: (serviceId: string) => boolean
  toggle: (serviceId: string) => Promise<void>
}

export const FavoritesContext = createContext<FavoritesContextValue | null>(null)
