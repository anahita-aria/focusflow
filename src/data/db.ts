import Dexie, { type Table } from 'dexie'
import type {
  Task,
  Habit,
  PomodoroSession,
  Reward,
  GamificationState,
  Settings,
} from './models'

// Singleton meta rows are stored in a keyed table so gamification/settings
// each live as one record. Keep this module thin: only the schema lives here.
export interface MetaRow<T> {
  key: string
  value: T
}

export const META_KEYS = {
  gamification: 'gamification',
  settings: 'settings',
} as const

class FocusFlowDB extends Dexie {
  tasks!: Table<Task, string>
  habits!: Table<Habit, string>
  sessions!: Table<PomodoroSession, string>
  rewards!: Table<Reward, string>
  meta!: Table<MetaRow<GamificationState | Settings>, string>

  constructor() {
    super('focusflow')
    this.version(1).stores({
      tasks: 'id, priority, done, recurring, createdOn',
      habits: 'id, name',
      sessions: 'id, date, mode',
      rewards: 'id',
      meta: 'key',
    })
  }
}

export const db = new FocusFlowDB()
