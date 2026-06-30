import { useStore } from '@/store/useStore'
import { BADGES } from '@/lib/gamification'
import { getIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'

export function BadgesGrid() {
  const earned = useStore((s) => s.gamification.badges)

  return (
    <div className="glass rounded-2xl p-4">
      <p className="mb-3 font-heading text-sm font-semibold">Achievements</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BADGES.map((badge) => {
          const Icon = getIcon(badge.icon)
          const has = earned.includes(badge.id)
          return (
            <div
              key={badge.id}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors',
                has
                  ? 'border-violet/40 bg-violet/10'
                  : 'border-white/5 bg-white/[0.02] opacity-60',
              )}
            >
              <Icon
                className={cn(
                  'size-6',
                  has ? 'text-violet' : 'text-muted-foreground',
                )}
              />
              <p className="text-xs font-medium leading-tight">{badge.name}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">
                {badge.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
