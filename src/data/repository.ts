// The ONLY module that talks to Dexie. UI and the store call these functions;
// swapping to a cloud backend later means rewriting just this file.
import { db, META_KEYS, type MetaRow } from './db'
import {
  DEFAULT_GAMIFICATION,
  DEFAULT_SETTINGS,
  type BackupData,
  type Completion,
  type GamificationState,
  type Habit,
  type PomodoroSession,
  type Reward,
  type Settings,
  type Task,
} from './models'
import { normalizeHabit, normalizeSettings } from './migrate'

// ---- Tasks ----
export const tasksRepo = {
  all: () => db.tasks.toArray(),
  put: (task: Task) => db.tasks.put(task),
  bulkPut: (tasks: Task[]) => db.tasks.bulkPut(tasks),
  remove: (id: string) => db.tasks.delete(id),
}

// ---- Habits ----
export const habitsRepo = {
  all: async () => (await db.habits.toArray()).map(normalizeHabit),
  put: (habit: Habit) => db.habits.put(habit),
  remove: (id: string) => db.habits.delete(id),
}

// ---- Pomodoro sessions ----
export const sessionsRepo = {
  all: () => db.sessions.toArray(),
  add: (session: PomodoroSession) => db.sessions.put(session),
  count: () => db.sessions.count(),
}

// ---- Rewards ----
export const rewardsRepo = {
  all: () => db.rewards.toArray(),
  put: (reward: Reward) => db.rewards.put(reward),
  remove: (id: string) => db.rewards.delete(id),
}

// ---- Task completions (history log) ----
export const completionsRepo = {
  all: () => db.completions.toArray(),
  add: (c: Completion) => db.completions.put(c),
  remove: (id: string) => db.completions.delete(id),
  // Remove the completion recorded for a task on a given day (task un-checked).
  removeForTaskOnDate: (taskId: string, date: string) =>
    db.completions.where({ taskId, date }).delete(),
}

// ---- Gamification (singleton meta row) ----
export const gamificationRepo = {
  async get(): Promise<GamificationState> {
    const row = await db.meta.get(META_KEYS.gamification)
    return (row?.value as GamificationState) ?? { ...DEFAULT_GAMIFICATION }
  },
  async set(value: GamificationState): Promise<void> {
    const row: MetaRow<GamificationState> = {
      key: META_KEYS.gamification,
      value,
    }
    await db.meta.put(row)
  },
}

// ---- Settings (singleton meta row) ----
export const settingsRepo = {
  async get(): Promise<Settings> {
    const row = await db.meta.get(META_KEYS.settings)
    return normalizeSettings((row?.value as Settings) ?? { ...DEFAULT_SETTINGS })
  },
  async set(value: Settings): Promise<void> {
    const row: MetaRow<Settings> = { key: META_KEYS.settings, value }
    await db.meta.put(row)
  },
}

// ---- Whole-database export / import ----
export async function exportAll(exportedAt: string): Promise<BackupData> {
  const [tasks, habits, sessions, rewards, completions, gamification, settings] =
    await Promise.all([
      tasksRepo.all(),
      habitsRepo.all(),
      sessionsRepo.all(),
      rewardsRepo.all(),
      completionsRepo.all(),
      gamificationRepo.get(),
      settingsRepo.get(),
    ])
  return {
    version: 1,
    exportedAt,
    tasks,
    habits,
    sessions,
    rewards,
    completions,
    gamification,
    settings,
  }
}

export async function importAll(data: BackupData): Promise<void> {
  await db.transaction(
    'rw',
    [db.tasks, db.habits, db.sessions, db.rewards, db.completions, db.meta],
    async () => {
      await Promise.all([
        db.tasks.clear(),
        db.habits.clear(),
        db.sessions.clear(),
        db.rewards.clear(),
        db.completions.clear(),
        db.meta.clear(),
      ])
      await Promise.all([
        db.tasks.bulkPut(data.tasks ?? []),
        db.habits.bulkPut(data.habits ?? []),
        db.sessions.bulkPut(data.sessions ?? []),
        db.rewards.bulkPut(data.rewards ?? []),
        db.completions.bulkPut(data.completions ?? []),
        gamificationRepo.set(data.gamification ?? { ...DEFAULT_GAMIFICATION }),
        settingsRepo.set(data.settings ?? { ...DEFAULT_SETTINGS }),
      ])
    },
  )
}
