import { create } from 'zustand'
import { toast } from 'sonner'
import type { FocusMode } from '@/data/models'
import { useStore } from './useStore'
import { useAuth } from './useAuth'
import { playAlarm, primeAudio } from '@/lib/sound'
import { cancelPush, isPushEnabled, schedulePush } from '@/data/push'

// Timestamp-driven Pomodoro timer kept in a GLOBAL store (not inside the Focus
// view), so it survives navigating between tabs. Its state is also PERSISTED to
// localStorage: mobile OSes unload a backgrounded PWA, so on reopen the app
// reloads from scratch — we restore the session from the saved end-time and
// either resume it (still counting) or complete it (finished while away).
// The source of truth is an absolute `endTime`, so timing stays correct across
// throttling, backgrounding, and full reloads.

const PERSIST_KEY = 'focusflow.timer'

function notify(mode: FocusMode) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  const body =
    mode === 'work'
      ? 'Focus session complete — nice work!'
      : 'Break over — ready for the next round?'
  const options: NotificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'focusflow-timer',
  }
  // Installed PWAs (esp. iOS) require the service-worker registration to show
  // notifications; fall back to the page-level API where that's unavailable.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification('FocusFlow', options))
      .catch(() => {
        try {
          new Notification('FocusFlow', options)
        } catch {
          /* ignore */
        }
      })
  } else {
    try {
      new Notification('FocusFlow', options)
    } catch {
      /* ignore */
    }
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
  plannedMinutes: number // full length of the active session (for accurate recording)
  scheduledPushId: string | null // server-scheduled background push, if any
  justCompleted: FocusMode | null

  setMode: (mode: FocusMode) => void
  start: () => void
  pause: () => void
  reset: () => void
  tick: () => void
  restore: () => void
  syncIdleDuration: () => void
}

interface Snapshot {
  mode: FocusMode
  running: boolean
  started: boolean
  remaining: number
  endTime: number | null
  plannedMinutes: number
  scheduledPushId: string | null
}

// A single module-level interval drives the countdown independent of any
// component, so unmounting the Focus view never stops or resets the timer.
let intervalId: ReturnType<typeof setInterval> | null = null
let restored = false // guard against double-restore (React StrictMode)

export const useTimer = create<TimerState>((set, get) => {
  function persist() {
    if (typeof localStorage === 'undefined') return
    const s = get()
    const snap: Snapshot = {
      mode: s.mode,
      running: s.running,
      started: s.started,
      remaining: s.remaining,
      endTime: s.endTime,
      plannedMinutes: s.plannedMinutes,
      scheduledPushId: s.scheduledPushId,
    }
    // Persist only meaningful transitions (not every tick — endTime is enough
    // to reconstruct a running countdown).
    localStorage.setItem(PERSIST_KEY, JSON.stringify(snap))
  }

  // Schedule a background push for a work session's end (fires even if the app
  // is closed). No-op unless push is configured, the user is signed in, and
  // they've enabled background alerts.
  async function scheduleWorkPush(mode: FocusMode, endTime: number) {
    if (mode !== 'work') return
    const userId = useAuth.getState().user?.id
    if (!userId) return
    try {
      if (!(await isPushEnabled())) return
      const id = await schedulePush(
        userId,
        new Date(endTime),
        'Focus session complete',
        'Nice work — time for a break.',
      )
      if (id) {
        set({ scheduledPushId: id })
        persist()
      }
    } catch {
      /* offline / not configured — silently skip */
    }
  }

  // Cancel a pending background push (session ended/paused inside the app, so
  // the server push would be redundant).
  function cancelWorkPush() {
    const id = get().scheduledPushId
    if (!id) return
    set({ scheduledPushId: null })
    void cancelPush(id).catch(() => {})
  }

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

  // Finish the active session. `silent` skips the alarm chime (used when we
  // discover on reopen that it already ended in the past).
  function finish(mode: FocusMode, minutes: number, silent: boolean) {
    clearIntervalIfIdle()
    cancelWorkPush() // completed here — drop any redundant background push
    if (!silent && useStore.getState().settings.soundEnabled) playAlarm()
    notify(mode)
    if (mode === 'work') {
      void useStore.getState().recordSession('work', minutes)
    }
    set({
      running: false,
      started: false,
      endTime: null,
      justCompleted: mode,
      remaining: durationFor(mode),
    })
    persist()
  }

  return {
    mode: 'work',
    running: false,
    started: false,
    remaining: durationFor('work'),
    endTime: null,
    plannedMinutes: useStore.getState().settings.durations.work,
    scheduledPushId: null,
    justCompleted: null,

    tick() {
      const { endTime, mode, plannedMinutes } = get()
      if (endTime == null) return
      const rem = Math.max(0, Math.round((endTime - Date.now()) / 1000))
      if (rem <= 0) finish(mode, plannedMinutes, false)
      else set({ remaining: rem })
    },

    start() {
      primeAudio()
      const mode = get().mode
      const minutes = useStore.getState().settings.durations[mode]
      const endTime = Date.now() + get().remaining * 1000
      set({
        running: true,
        started: true,
        endTime,
        plannedMinutes: minutes,
        justCompleted: null,
      })
      ensureInterval()
      persist()
      void scheduleWorkPush(mode, endTime)
    },

    pause() {
      const { endTime, remaining } = get()
      const rem =
        endTime != null
          ? Math.max(0, Math.round((endTime - Date.now()) / 1000))
          : remaining
      clearIntervalIfIdle()
      cancelWorkPush()
      set({ running: false, endTime: null, remaining: rem })
      persist()
      // `started` stays true — paused, not reset.
    },

    reset() {
      clearIntervalIfIdle()
      cancelWorkPush()
      set({
        running: false,
        started: false,
        endTime: null,
        justCompleted: null,
        remaining: durationFor(get().mode),
      })
      persist()
    },

    setMode(mode) {
      clearIntervalIfIdle()
      cancelWorkPush()
      set({
        mode,
        running: false,
        started: false,
        endTime: null,
        justCompleted: null,
        remaining: durationFor(mode),
      })
      persist()
    },

    // Called once on app load: reconstruct the session saved before the app was
    // unloaded/backgrounded.
    restore() {
      if (restored) return
      restored = true
      if (typeof localStorage === 'undefined') return
      const raw = localStorage.getItem(PERSIST_KEY)
      if (!raw) return
      let snap: Snapshot
      try {
        snap = JSON.parse(raw) as Snapshot
      } catch {
        return
      }

      if (snap.running && snap.endTime != null) {
        if (Date.now() >= snap.endTime) {
          // Session finished while the app was away — record it now.
          set({
            mode: snap.mode,
            plannedMinutes: snap.plannedMinutes,
            scheduledPushId: snap.scheduledPushId ?? null,
          })
          finish(snap.mode, snap.plannedMinutes, true)
          if (snap.mode === 'work') {
            toast.success('Focus session finished', {
              description: `${snap.plannedMinutes} min tracked while you were away`,
            })
          }
        } else {
          // Still counting — resume from the saved end-time.
          set({
            mode: snap.mode,
            running: true,
            started: true,
            endTime: snap.endTime,
            plannedMinutes: snap.plannedMinutes,
            scheduledPushId: snap.scheduledPushId ?? null,
            remaining: Math.max(
              0,
              Math.round((snap.endTime - Date.now()) / 1000),
            ),
            justCompleted: null,
          })
          ensureInterval()
        }
      } else if (snap.started) {
        // Was paused — restore the frozen remaining time.
        set({
          mode: snap.mode,
          running: false,
          started: true,
          endTime: null,
          remaining: snap.remaining,
          plannedMinutes: snap.plannedMinutes,
          scheduledPushId: snap.scheduledPushId ?? null,
        })
      } else {
        set({ mode: snap.mode })
      }
    },

    // When durations change in Settings and the timer is idle, reflect the new
    // duration (without disturbing a running/paused session).
    syncIdleDuration() {
      if (!get().started) set({ remaining: durationFor(get().mode) })
    },
  }
})

// Re-sync the instant a backgrounded tab becomes visible again (covers the
// case where the app was frozen but not fully unloaded).
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
