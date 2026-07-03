import { useEffect, useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store/useStore'
import { HABIT_ICON_NAMES, getIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'

export const HABIT_COLORS = [
  '#a78bfa',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#38bdf8',
  '#f472b6',
  '#fb923c',
  '#4ade80',
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HabitFormDialog({ open, onOpenChange }: Props) {
  const addHabit = useStore((s) => s.addHabit)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState(HABIT_ICON_NAMES[0])
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [negative, setNegative] = useState(false)
  const [target, setTarget] = useState(1)

  useEffect(() => {
    if (open) {
      setName('')
      setIcon(HABIT_ICON_NAMES[0])
      setColor(HABIT_COLORS[0])
      setNegative(false)
      setTarget(1)
    }
  }, [open])

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    await addHabit({ name: trimmed, icon, color, target, negative })
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-strong">
        <div className="mx-auto w-full max-w-md overflow-y-auto">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-heading text-lg">New habit</DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-2">
          <div className="space-y-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              placeholder={negative ? 'e.g. No late-night snacks' : 'e.g. Drink water'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
            />
          </div>

          {/* Build vs break (negative) */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="glass flex rounded-xl p-1">
              <button
                type="button"
                onClick={() => setNegative(false)}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg py-2 text-sm font-medium transition-colors',
                  !negative ? 'bg-teal text-[#04140d]' : 'text-muted-foreground',
                )}
              >
                Build a habit
              </button>
              <button
                type="button"
                onClick={() => setNegative(true)}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg py-2 text-sm font-medium transition-colors',
                  negative ? 'bg-coral text-[#1a0a0a]' : 'text-muted-foreground',
                )}
              >
                Break a habit
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {negative
                ? 'Track slips — your streak counts the days you stay clean.'
                : 'Check it off each day to build a streak.'}
            </p>
          </div>

          {/* Daily goal (positive habits only) */}
          {!negative && (
            <div className="space-y-2">
              <Label>Daily goal</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease goal"
                  onClick={() => setTarget((t) => Math.max(1, t - 1))}
                  className="grid size-9 cursor-pointer place-items-center rounded-lg bg-secondary/50 text-lg"
                >
                  −
                </button>
                <span className="font-display w-10 text-center text-lg font-semibold">
                  {target}
                </span>
                <button
                  type="button"
                  aria-label="Increase goal"
                  onClick={() => setTarget((t) => Math.min(50, t + 1))}
                  className="grid size-9 cursor-pointer place-items-center rounded-lg bg-secondary/50 text-lg"
                >
                  +
                </button>
                <span className="text-xs text-muted-foreground">
                  {target === 1 ? 'once a day' : `${target}× a day`}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2">
              {HABIT_ICON_NAMES.map((n) => {
                const Icon = getIcon(n)
                const active = n === icon
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setIcon(n)}
                    className={cn(
                      'grid aspect-square cursor-pointer place-items-center rounded-lg border transition-colors',
                      active
                        ? 'border-violet bg-violet/20 text-violet'
                        : 'border-white/10 text-muted-foreground hover:border-white/30',
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={cn(
                    'size-7 cursor-pointer rounded-full transition-transform',
                    color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b1024]'
                      : 'opacity-80 hover:scale-110',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <DrawerFooter
          className="flex-row gap-2"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={!name.trim()}
            className="flex-1 cursor-pointer"
          >
            Create habit
          </Button>
        </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
