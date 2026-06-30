import { create } from 'zustand'
import type { FocusMode } from '@/data/models'
import { useStore } from './useStore'
import { playAlarm, primeAudio } from '@/lib/sound'

// Timestamp-driven Pomodoro timer kept in a GLOBAL store (not inside the Focus
// view), so it survives navigating between tabs and keeps running in the
// background. The source of truth is an absolute `endTime`, so the countdown
// stays accurate even when the browser throttles timers in a hidden tab.

function notify(mode: FocusMode) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  const body =
    mode === 'work'
      ? 'Focus session complete — nice work!'
      : 'Break over — ready for the next round?'
  try {
    new Notification('FocusFlow', { body })
  } catch {
    /* some browsers require a ServiceWorkerRegistration; ignore failures */
  }
}

function durationFor(mode: FocusMode): number {
  return useStore.getState().settings.durations[mode] * 60
}

interface TimerState {
  mode: FocusMode
  running: boolean
  started: boolean // running OR paused (distinct from a fresh/reset timer)
  remaining: number // seconds
  endTime: number | null // epoch ms
  justCompleted: FocusMode | null

  setMode: (mode: FocusMode) => void
  start: () => void
  pause: () => void
  reset: () => void
  tick: () => void
  syncIdleDuration: () => void
}

// A single module-level interval drives the countdown independent of any
// component, so unmounting the Focus view never stops or resets the timer.
let intervalId: ReturnType<typeof setInterval> | null = null

export const useTimer = create<TimerState>((set, get) => {
  function ensureInterval() {
    if (intervalId == null) {
      intervalId = setInterval(() => get().tick(), 250)
    }
  }
  function clearIntervalIfIdle() {
    if (intervalId != null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function complete() {
    clearIntervalIfIdle()
    const { mode } = get()
    const { durations, soundEnabled } = useStore.getState().settings
    if (soundEnabled) playAlarm()
    notify(mode)
    if (mode === 'work') {
      void useStore.getState().recordSession('work', durations[mode])
    }
    set({
      running: false,
      started: false,
      endTime: null,
      justCompleted: mode,
      remaining: durations[mode] * 60,
    })
  }

  return {
    mode: 'work',
    running: false,
    started: false,
    remaining: durationFor('work'),
    endTime: null,
    justCompleted: null,

    tick() {
      const { endTime } = get()
      if (endTime == null) return
      const rem = Math.max(0, Math.round((endTime - Date.now()) / 1000))
      if (rem <= 0) complete()
      else set({ remaining: rem })
    },

    start() {
      primeAudio()
      const endTime = Date.now() + get().remaining * 1000
      set({ running: true, started: true, endTime, justCompleted: null })
      ensureInterval()
    },

    pause() {
      const { endTime, remaining } = get()
      const rem =
        endTime != null
          ? Math.max(0, Math.round((endTime - Date.now()) / 1000))
          : remaining
      clearIntervalIfIdle()
      set({ running: false, endTime: null, remaining: rem })
      // `started` stays true — paused, not reset.
    },

    reset() {
      clearIntervalIfIdle()
      set({
        running: false,
        started: false,
        endTime: null,
        justCompleted: null,
        remaining: durationFor(get().mode),
      })
    },

    setMode(mode) {
      clearIntervalIfIdle()
      set({
        mode,
        running: false,
        started: false,
        endTime: null,
        justCompleted: null,
        remaining: durationFor(mode),
      })
    },

    // When durations change in Settings and the timer is idle, reflect the new
    // duration (without disturbing a running/paused session).
    syncIdleDuration() {
      if (!get().started) set({ remaining: durationFor(get().mode) })
    },
  }
})

// Re-sync the instant a backgrounded tab becomes visible again.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') useTimer.getState().tick()
  })
}

// Keep the idle display in step with duration edits made in Settings.
useStore.subscribe((state, prev) => {
  if (state.settings.durations !== prev.settings.durations) {
    useTimer.getState().syncIdleDuration()
  }
})
