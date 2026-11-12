import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { paths } from '../../routes/paths'
import type { Category } from '../../types/entities'
import { toSearchString } from '../../utils/searchParams'
import { CategoryIcon } from './CategoryIcon'

export function CategoryCard({ category }: { category: Category }) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }} className="h-full">
      <Link
        to={`${paths.services}${toSearchString({ category: category.slug })}`}
        className="group flex h-16 items-center gap-3 rounded-full border border-border bg-surface py-2 pr-5 pl-2 transition-[border-color,background-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-card-hover"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary transition-[background-color,color,transform] duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-white">
          <CategoryIcon name={category.icon} className="size-5" />
        </span>
        <span className="flex-1 font-semibold whitespace-nowrap text-text">{category.name}</span>
        <ArrowUpRight
          className="size-4 shrink-0 -translate-x-1 text-primary opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
          aria-hidden
        />
      </Link>
    </motion.div>
  )
}
