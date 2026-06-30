import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Flame, Minus, Plus, ShieldCheck, ShieldX, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { getIcon } from '@/lib/icons'
import { today } from '@/lib/date'
import { cn } from '@/lib/utils'
import { HabitFormDialog } from './HabitFormDialog'
import { HabitHeatmap } from './HabitHeatmap'

export function HabitsView() {
  const habits = useStore((s) => s.habits)
  const toggleHabitToday = useStore((s) => s.toggleHabitToday)
  const bumpHabit = useStore((s) => s.bumpHabit)
  const deleteHabit = useStore((s) => s.deleteHabit)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [range, setRange] = useState<14 | 30>(14)
  const t = today()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Habits</h1>
        <div className="flex items-center gap-2">
          <div className="glass flex rounded-full p-0.5 text-xs">
            {[14, 30].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r as 14 | 30)}
                className={cn(
                  'cursor-pointer rounded-full px-2.5 py-1 font-medium transition-colors',
                  range === r ? 'bg-violet text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {r}d
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="cursor-pointer gap-1"
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {habits.map((habit) => {
            const Icon = getIcon(habit.icon)
            const count = habit.counts[t] ?? 0
            const doneToday = count >= habit.target
            const slippedToday = habit.log.includes(t)
            const isCount = !habit.negative && habit.target > 1
            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="glass space-y-3 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-xl"
                    style={{
                      background: `${habit.color}22`,
                      color: habit.color,
                    }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{habit.name}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Flame className="size-3 text-amber" />
                        {habit.streak} {habit.negative ? 'days clean' : 'day streak'}
                      </span>
                      {habit.negative ? (
                        <span>{habit.log.length} slips</span>
                      ) : isCount ? (
                        <span>
                          {count}/{habit.target} today
                        </span>
                      ) : (
                        <span>{habit.log.length} total</span>
                      )}
                    </div>
                  </div>

                  {/* Right-side control depends on habit kind */}
                  {habit.negative ? (
                    <button
                      type="button"
                      onClick={() => void toggleHabitToday(habit.id)}
                      aria-label={slippedToday ? 'Undo slip' : 'Mark slip today'}
                      className={cn(
                        'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all active:scale-95',
                        slippedToday
                          ? 'border-transparent bg-coral text-[#1a0a0a]'
                          : 'border-white/15 text-muted-foreground',
                      )}
                    >
                      {slippedToday ? (
                        <ShieldX className="size-4" />
                      ) : (
                        <ShieldCheck className="size-4 text-teal" />
                      )}
                      {slippedToday ? 'Slipped' : 'Clean'}
                    </button>
                  ) : isCount ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void bumpHabit(habit.id, -1)}
                        aria-label="Decrease"
                        disabled={count === 0}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg bg-secondary/50 disabled:opacity-40"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span
                        className="font-display w-9 text-center text-sm font-semibold"
                        style={doneToday ? { color: habit.color } : undefined}
                      >
                        {count}/{habit.target}
                      </span>
                      <button
                        type="button"
                        onClick={() => void bumpHabit(habit.id, 1)}
                        aria-label="Increase"
                        disabled={doneToday}
                        className="grid size-8 cursor-pointer place-items-center rounded-lg bg-secondary/50 disabled:opacity-40"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void toggleHabitToday(habit.id)}
                      aria-label={doneToday ? 'Undo today' : 'Mark done today'}
                      className={cn(
                        'grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border transition-all active:scale-95',
                        doneToday
                          ? 'border-transparent text-[#04140d]'
                          : 'border-white/15 text-muted-foreground',
                      )}
                      style={doneToday ? { background: habit.color } : undefined}
                    >
                      <Check className="size-5" strokeWidth={3} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void deleteHabit(habit.id)}
                    aria-label="Delete habit"
                    className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:text-coral"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <HabitHeatmap
                  log={habit.log}
                  color={habit.negative ? '#f87171' : habit.color}
                  days={range}
                />
                {habit.negative && (
                  <p className="text-[11px] text-muted-foreground">
                    Red marks a slip — keep the row empty to grow your clean streak.
                  </p>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {habits.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No habits yet. Tap <span className="text-violet">Add</span> to start
            building one.
          </div>
        )}
      </div>

      <HabitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
