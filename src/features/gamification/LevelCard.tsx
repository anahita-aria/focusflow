import { Coins, Zap } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { xpForLevel } from '@/lib/gamification'

export function LevelCard() {
  const g = useStore((s) => s.gamification)
  const needed = xpForLevel(g.level)
  const pct = Math.min(100, Math.round((g.xp / needed) * 100))

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-violet/20 font-display text-xl font-bold text-violet">
            {g.level}
          </span>
          <div>
            <p className="font-heading text-lg font-semibold">Level {g.level}</p>
            <p className="text-xs text-muted-foreground">
              {g.xp} / {needed} XP to next
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1.5 text-sm font-semibold text-amber">
          <Coins className="size-4" />
          <span className="font-display">{g.coins}</span>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet to-sky transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Zap className="size-3 text-violet" />
        Earn XP by completing tasks, habits and focus sessions.
      </p>
    </div>
  )
}
