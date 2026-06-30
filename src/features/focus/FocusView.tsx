import { Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore } from '@/store/useStore'
import { useTimer } from '@/store/useTimer'
import type { FocusMode } from '@/data/models'
import { cn } from '@/lib/utils'
import { TimerRing } from './TimerRing'

const MODES: { value: FocusMode; label: string; color: string }[] = [
  { value: 'work', label: 'Focus', color: '#a78bfa' },
  { value: 'short', label: 'Short break', color: '#34d399' },
  { value: 'long', label: 'Long break', color: '#38bdf8' },
]

const PRESETS: Record<FocusMode, number[]> = {
  work: [15, 25, 50, 90],
  short: [3, 5, 10],
  long: [15, 20, 30],
}

function fmt(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function FocusView() {
  const timer = useTimer()
  const durations = useStore((s) => s.settings.durations)
  const updateSettings = useStore((s) => s.updateSettings)

  const activeColor =
    MODES.find((m) => m.value === timer.mode)?.color ?? '#a78bfa'
  const currentMinutes = durations[timer.mode]
  const totalSeconds = durations[timer.mode] * 60
  const progress = totalSeconds > 0 ? 1 - timer.remaining / totalSeconds : 0

  const setDuration = (minutes: number) => {
    const clamped = Math.min(180, Math.max(1, Math.round(minutes)))
    void updateSettings({
      durations: { ...durations, [timer.mode]: clamped },
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Focus</h1>

      {/* Mode selector */}
      <div className="glass flex rounded-2xl p-1">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => timer.setMode(m.value)}
            className={cn(
              'flex-1 cursor-pointer rounded-xl px-2 py-2 text-xs font-medium transition-colors',
              timer.mode === m.value
                ? 'text-[#0b1024]'
                : 'text-muted-foreground',
            )}
            style={
              timer.mode === m.value ? { background: m.color } : undefined
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-6 py-2">
        <TimerRing
          progress={progress}
          label={fmt(timer.remaining)}
          sub={
            timer.justCompleted
              ? 'Complete'
              : timer.running
                ? 'In progress'
                : 'Ready'
          }
          color={activeColor}
        />

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            onClick={timer.running ? timer.pause : timer.start}
            className="h-14 w-36 cursor-pointer gap-2 text-base"
            style={{ background: activeColor, color: '#0b1024' }}
          >
            {timer.running ? (
              <>
                <Pause className="size-5" /> Pause
              </>
            ) : (
              <>
                <Play className="size-5" /> Start
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={timer.reset}
            aria-label="Reset"
            className="glass size-14 cursor-pointer"
          >
            <RotateCcw className="size-5" />
          </Button>
        </div>
      </div>

      {/* Duration config: presets + custom (1–180) */}
      <div className="glass space-y-3 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Duration</p>
          <span className="text-xs text-muted-foreground">
            {currentMinutes} min
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS[timer.mode].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDuration(p)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                currentMinutes === p
                  ? 'bg-violet text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground',
              )}
            >
              {p}m
            </button>
          ))}
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={180}
              value={currentMinutes}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="h-8 w-16 text-center"
              aria-label="Custom minutes"
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Completing a focus session earns 1 XP per minute. The timer keeps
          accurate time even if you switch tabs.
        </p>
      </div>
    </div>
  )
}
