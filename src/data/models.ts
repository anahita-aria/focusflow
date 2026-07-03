// Domain models — the single source of truth for app data shapes.
// No `any` anywhere; UI and store import types from here.

export type Priority = 'low' | 'medium' | 'high'

export type FocusMode = 'work' | 'short' | 'long'

export interface Task {
  id: string
  text: string
  priority: Priority
  recurring: boolean // daily recurring vs one-time
  done: boolean
  completedOn: string | null // YYYY-MM-DD
  createdOn: string // YYYY-MM-DD
}

export interface Habit {
  id: string
  name: string
  icon: string // lucide icon name
  color: string // hex / css color
  // Positive habit: dates the daily goal was MET. Negative habit: dates the
  // user SLIPPED. `streak` is the completion streak (positive) or the
  // clean-day streak (negative). Both are derivable from `log`.
  log: string[] // YYYY-MM-DD
  streak: number
  // Phase 2: goals / counts (positive habits only).
  target: number // daily target count (>= 1; 1 = simple check)
  counts: Record<string, number> // YYYY-MM-DD -> progress for the day
  // Phase 2: negative habit (something to avoid) vs positive (build).
  negative: boolean
  createdOn: string // YYYY-MM-DD
}

export interface PomodoroSession {
  id: string
  date: string // YYYY-MM-DD
  minutes: number
  mode: FocusMode
}

export interface GamificationState {
  xp: number // XP accumulated toward the next level
  level: number
  coins: number
  badges: string[] // earned badge ids
  streakFreezes: number
  // Internal lifetime counters needed to evaluate badge rules
  // (recurring task completions reset daily, so a running total is required).
  tasksCompletedTotal: number
}

export interface Reward {
  id: string
  label: string // e.g. "1 hour of gaming"
  cost: number // in coins
}

// A log entry written each time a task is completed, so the History view can
// show a per-day journal even for recurring tasks (whose `done` flag resets).
export interface Completion {
  id: string
  taskId: string
  date: string // YYYY-MM-DD it was completed
  text: string
  priority: Priority
  recurring: boolean
}

export type ThemeName = 'violet' | 'teal' | 'amber'

export interface Profile {
  name: string
  avatarId: string // id from the preset avatar set
}

export interface FocusDurations {
  work: number
  short: number
  long: number
}

export interface Settings {
  durations: FocusDurations // minutes per mode
  theme: ThemeName
  notifications: boolean // user has opted in
  soundEnabled: boolean
  lastResetDate: string // YYYY-MM-DD of the last daily-reset run
  profile: Profile // Phase 2: display name + avatar
}

// Shape of the full JSON export / import payload.
export interface BackupData {
  version: 1
  exportedAt: string
  tasks: Task[]
  habits: Habit[]
  sessions: PomodoroSession[]
  rewards: Reward[]
  completions?: Completion[] // optional: absent in older backups
  gamification: GamificationState
  settings: Settings
}

export const DEFAULT_DURATIONS: FocusDurations = {
  work: 25,
  short: 5,
  long: 15,
}

export const DEFAULT_GAMIFICATION: GamificationState = {
  xp: 0,
  level: 1,
  coins: 0,
  badges: [],
  streakFreezes: 0,
  tasksCompletedTotal: 0,
}

export const DEFAULT_PROFILE: Profile = {
  name: '',
  avatarId: 'aurora',
}

export const DEFAULT_SETTINGS: Settings = {
  durations: DEFAULT_DURATIONS,
  theme: 'violet',
  notifications: false,
  soundEnabled: true,
  lastResetDate: '',
  profile: DEFAULT_PROFILE,
}
