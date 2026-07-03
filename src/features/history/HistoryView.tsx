import { useMemo } from 'react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { ArrowLeft, CheckCircle2, Flame, Timer } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNav } from '@/store/useNav'
import { getIcon } from '@/lib/icons'
import { PRIORITY_META } from '@/features/tasks/util'
import { GlassCard } from '@/components/layout/GlassCard'

interface DayEntry {
  date: string
  tasks: { text: string; priority: 'low' | 'medium' | 'high' }[]
  habits: { name: string; icon: string; color: string }[]
  slips: { name: string; color: string }[]
  focusMin: number
}

function dayLabel(date: string): string {
  const d = parseISO(date)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'EEEE, MMM d')
}

export function HistoryView() {
  const completions = useStore((s) => s.completions)
  const habits = useStore((s) => s.habits)
  const sessions = useStore((s) => s.sessions)
  const navigate = useNav((s) => s.navigate)

  const days = useMemo<DayEntry[]>(() => {
    const map = new Map<string, DayEntry>()
    const ensure = (date: string): DayEntry => {
      let e = map.get(date)
      if (!e) {
        e = { date, tasks: [], habits: [], slips: [], focusMin: 0 }
        map.set(date, e)
      }
      return e
    }

    for (const c of completions) {
      ensure(c.date).tasks.push({ text: c.text, priority: c.priority })
    }
    for (const h of habits) {
      for (const date of h.log) {
        if (h.negative) {
          ensure(date).slips.push({ name: h.name, color: h.color })
        } else {
          ensure(date).habits.push({
            name: h.name,
            icon: h.icon,
            color: h.color,
          })
        }
      }
    }
    for (const s of sessions) {
      if (s.mode === 'work') ensure(s.date).focusMin += s.minutes
    }

    return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [completions, habits, sessions])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('tasks')}
          aria-label="Back"
          className="glass grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="font-heading text-2xl font-semibold">History</h1>
      </div>

      {days.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
          No activity logged yet. Complete a task, check a habit, or finish a
          focus session and it'll show up here, day by day.
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day, i) => (
            <GlassCard key={day.date} index={i} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-sm font-semibold">
                  {dayLabel(day.date)}
                </h2>
                {day.focusMin > 0 && (
                  <span className="flex items-center gap-1 text-xs text-sky">
                    <Timer className="size-3.5" />
                    {day.focusMin} min
                  </span>
                )}
              </div>

              {day.habits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {day.habits.map((h, k) => {
                    const Icon = getIcon(h.icon)
                    return (
                      <span
                        key={k}
                        className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px]"
                        style={{ background: `${h.color}22`, color: h.color }}
                      >
                        <Icon className="size-3" />
                        {h.name}
                      </span>
                    )
                  })}
                </div>
              )}

              {day.tasks.length > 0 && (
                <ul className="space-y-1">
                  {day.tasks.map((t, k) => (
                    <li
                      key={k}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="size-3.5 shrink-0 text-teal" />
                      <span className="truncate">{t.text}</span>
                      <span
                        className={`ml-auto size-1.5 shrink-0 rounded-full ${PRIORITY_META[t.priority].dot}`}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {day.slips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {day.slips.map((s, k) => (
                    <span
                      key={k}
                      className="flex items-center gap-1 rounded-full bg-coral/15 px-2 py-1 text-[11px] text-coral"
                    >
                      <Flame className="size-3" />
                      Slipped: {s.name}
                    </span>
                  ))}
                </div>
              )}

              {day.habits.length === 0 &&
                day.tasks.length === 0 &&
                day.slips.length === 0 &&
                day.focusMin > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Focused for {day.focusMin} minutes.
                  </p>
                )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
