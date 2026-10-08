import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import type { Category } from '../../types/entities'
import { cardHover } from '../../utils/motion'
import { toSearchString } from '../../utils/searchParams'
import { CategoryIcon } from './CategoryIcon'

export function CategoryCard({ category }: { category: Category }) {
  return (
    <motion.div whileHover={cardHover} className="h-full">
      <Link
        to={`${paths.services}${toSearchString({ category: category.slug })}`}
        className="group flex h-full flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-card-hover"
      >
        <span className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <CategoryIcon name={category.icon} className="size-5" />
        </span>
        <span className="font-semibold text-text">{category.name}</span>
      </Link>
    </motion.div>
  )
}
