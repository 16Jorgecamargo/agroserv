import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useFavorites } from '../../hooks/useFavorites'
import { paths, type LoginLocationState } from '../../routes/paths'
import { cn } from '../../utils/cn'

interface FavoriteButtonProps {
  serviceId: string
  serviceTitle: string
  className?: string
}

export function FavoriteButton({ serviceId, serviceTitle, className }: FavoriteButtonProps) {
  const favorites = useFavorites()
  const navigate = useNavigate()
  const location = useLocation()

  if (!favorites || (!favorites.canFavorite && !favorites.isVisitor)) return null

  const isFavorite = favorites.isFavorite(serviceId)

  function handleClick() {
    if (!favorites) return
    if (favorites.isVisitor) {
      const state: LoginLocationState = { from: { pathname: location.pathname, search: location.search } }
      navigate(paths.login, { state })
      return
    }
    void favorites.toggle(serviceId)
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? `Remover ${serviceTitle} dos favoritos` : `Adicionar ${serviceTitle} aos favoritos`}
      className={cn(
        'grid size-9 place-items-center rounded-full bg-surface/90 text-text-muted shadow-card backdrop-blur transition-colors hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        isFavorite && 'text-danger',
        className,
      )}
    >
      <motion.span key={String(isFavorite)} initial={{ scale: 0.6 }} animate={{ scale: [0.6, 1.25, 1] }} transition={{ duration: 0.35 }} className="grid place-items-center">
        <Heart className={cn('size-4', isFavorite && 'fill-current')} aria-hidden />
      </motion.span>
    </motion.button>
  )
}
