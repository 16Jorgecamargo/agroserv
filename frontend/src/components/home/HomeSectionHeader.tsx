import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { revealOnScroll, riseIn } from './homeMotion'

interface HomeSectionHeaderProps {
  id: string
  title: string
  description: string
  action?: ReactNode
}

export function HomeSectionHeader({ id, title, description, action }: HomeSectionHeaderProps) {
  return (
    <motion.div variants={riseIn} {...revealOnScroll} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h2 id={id} className="text-3xl/[1.15] font-bold tracking-[-0.025em] text-text sm:text-[40px]/[1.12]">
          {title}
        </h2>
        <p className="mt-3 text-lg text-text-muted">{description}</p>
      </div>
      {action}
    </motion.div>
  )
}
