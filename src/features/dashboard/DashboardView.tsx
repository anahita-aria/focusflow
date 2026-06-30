import { useMemo } from 'react'
import { CheckCircle2, Coins, Flame, Repeat, Timer, TrendingUp } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNav } from '@/store/useNav'
import { today } from '@/lib/date'
import { badgeById } from '@/lib/gamification'
import { getIcon } from '@/lib/icons'
import { GlassCard } from '@/components/layout/GlassCard'
import { StatCard } from './StatCard'
import { WeeklyChart } from './WeeklyChart'

export function DashboardView() {
  const tasks = useStore((s) => s.tasks)
  const habits = useStore((s) => s.habits)
  const sessions = useStore((s) => s.sessions)
  const g = useStore((s) => s.gamification)
  const navigate = useNav((s) => s.navigate)
  const t = today()

  const stats = useMemo(() => {
    const totalTasks = tasks.length
    const doneTasks = tasks.filter((x) => x.done).length
    const completionPct =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)
    const habitsDone = habits.filter((h) => h.log.includes(t)).length
    const focusToday = sessions
      .filter((s) => s.date === t && s.mode === 'work')
      .reduce((sum, s) => sum + s.minutes, 0)
    const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0)
    return {
      completionPct,
      habitsDone,
      habitsTotal: habits.length,
      focusToday,
      bestStreak,
    }
  }, [tasks, habits, sessions, t])

  const recentBadges = useMemo(
    () => [...g.badges].slice(-3).reverse(),
    [g.badges],
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your day at a glance
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          index={0}
          icon={CheckCircle2}
          label="Task completion"
          value={`${stats.completionPct}%`}
          color="#34d399"
        />
        <StatCard
          index={1}
          icon={Repeat}
          label="Habits today"
          value={`${stats.habitsDone}/${stats.habitsTotal}`}
          color="#a78bfa"
        />
        <StatCard
          index={2}
          icon={Timer}
          label="Focus minutes"
          value={`${stats.focusToday}`}
          color="#38bdf8"
        />
        <StatCard
          index={3}
          icon={Coins}
          label="Coins"
          value={`${g.coins}`}
          color="#fbbf24"
        />
      </div>

      <WeeklyChart />

      <div className="grid grid-cols-2 gap-3">
        <GlassCard index={4} className="p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="size-4 text-amber" /> Best streak
          </div>
          <p className="font-display text-3xl font-semibold">
            {stats.bestStreak}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              days
            </span>
          </p>
        </GlassCard>
        <GlassCard index={5} className="p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="size-4 text-violet" /> Level
          </div>
          <p className="font-display text-3xl font-semibold">{g.level}</p>
        </GlassCard>
      </div>

      <GlassCard index={6} className="p-4">
        <button
          type="button"
          onClick={() => navigate('rewards')}
          className="mb-3 flex w-full cursor-pointer items-center justify-between"
        >
          <span className="font-heading text-sm font-semibold">
            Recent badges
          </span>
          <span className="text-xs text-violet">View all</span>
        </button>
        {recentBadges.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No badges yet — complete tasks, habits and focus sessions to earn
            them.
          </p>
        ) : (
          <div className="flex gap-2">
            {recentBadges.map((id) => {
              const def = badgeById(id)
              if (!def) return null
              const Icon = getIcon(def.icon)
              return (
                <div
                  key={id}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-violet/30 bg-violet/10 p-2.5 text-center"
                >
                  <Icon className="size-5 text-violet" />
                  <span className="text-[10px] font-medium leading-tight">
                    {def.name}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
