import { useMemo } from 'react'
import { lastNDays } from '@/lib/date'
import { cn } from '@/lib/utils'

interface Props {
  log: string[]
  color: string
  days: number
}

// Compact day grid: filled cells = completed days, hollow = missed.
export function HabitHeatmap({ log, color, days }: Props) {
  const set = useMemo(() => new Set(log), [log])
  const keys = useMemo(() => lastNDays(days), [days])

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${days <= 14 ? 14 : 15}, minmax(0, 1fr))` }}
    >
      {keys.map((key) => {
        const done = set.has(key)
        return (
          <div
            key={key}
            title={key}
            className={cn(
              'aspect-square rounded-[3px] border',
              done ? 'border-transparent' : 'border-white/10 bg-white/[0.03]',
            )}
            style={done ? { background: color } : undefined}
          />
        )
      })}
    </div>
  )
}
