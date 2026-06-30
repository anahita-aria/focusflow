import type { LucideIcon } from 'lucide-react'
import { GlassCard } from '@/components/layout/GlassCard'

interface Props {
  icon: LucideIcon
  label: string
  value: string
  color: string
  index?: number
}

export function StatCard({ icon: Icon, label, value, color, index = 0 }: Props) {
  return (
    <GlassCard index={index} className="p-4">
      <div
        className="mb-2 grid size-9 place-items-center rounded-xl"
        style={{ background: `${color}22`, color }}
      >
        <Icon className="size-5" />
      </div>
      <p className="font-display text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </GlassCard>
  )
}
