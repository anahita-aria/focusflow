import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  /** Stagger index for entrance animation. */
  index?: number
  onClick?: () => void
}

// The frosted-card primitive with a smooth expo entrance.
export function GlassCard({ children, className, index = 0, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.05, 0.3),
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={onClick}
      className={cn('glass rounded-2xl', className)}
    >
      {children}
    </motion.div>
  )
}
