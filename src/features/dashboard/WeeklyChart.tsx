import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStore } from '@/store/useStore'
import { lastNDays, shortWeekday } from '@/lib/date'

interface DayDatum {
  day: string
  focus: number
  habits: number
}

export function WeeklyChart() {
  const sessions = useStore((s) => s.sessions)
  const habits = useStore((s) => s.habits)

  const data: DayDatum[] = useMemo(() => {
    const days = lastNDays(7)
    const habitCountByDay = new Map<string, number>()
    for (const h of habits) {
      for (const d of h.log) {
        habitCountByDay.set(d, (habitCountByDay.get(d) ?? 0) + 1)
      }
    }
    const focusByDay = new Map<string, number>()
    for (const s of sessions) {
      if (s.mode === 'work') {
        focusByDay.set(s.date, (focusByDay.get(s.date) ?? 0) + s.minutes)
      }
    }
    return days.map((key) => ({
      day: shortWeekday(key),
      focus: focusByDay.get(key) ?? 0,
      habits: habitCountByDay.get(key) ?? 0,
    }))
  }, [sessions, habits])

  return (
    <div className="glass rounded-2xl p-4">
      <p className="mb-3 font-heading text-sm font-semibold">This week</p>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#9aa0b4', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9aa0b4', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(11,16,36,0.92)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#e7e9f3',
                fontSize: 12,
              }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar
              dataKey="focus"
              name="Focus min"
              fill="#a78bfa"
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
            <Line
              dataKey="habits"
              name="Habits"
              stroke="#34d399"
              strokeWidth={2}
              dot={{ r: 3, fill: '#34d399' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-sm bg-violet" /> Focus minutes
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-teal" /> Habit checks
        </span>
      </div>
    </div>
  )
}
