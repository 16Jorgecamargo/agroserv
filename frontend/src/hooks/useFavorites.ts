import { useContext } from 'react'
import { FavoritesContext, type FavoritesContextValue } from '../contexts/FavoritesContext'

export function useFavorites(): FavoritesContextValue | null {
  return useContext(FavoritesContext)
}
