// Normalizes records loaded from storage (or imported backups) so older
// Phase 1 data gains the Phase 2 fields with sensible defaults. Applied at the
// repository boundary, so the rest of the app always sees complete models.
import {
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  type Habit,
  type Settings,
} from './models'
import { today } from '@/lib/date'

export function normalizeHabit(raw: Habit): Habit {
  const log = Array.isArray(raw.log) ? raw.log : []
  const target = typeof raw.target === 'number' && raw.target >= 1 ? raw.target : 1
  // Derive per-day counts for legacy habits: each completed day met its goal.
  let counts = raw.counts
  if (!counts || typeof counts !== 'object') {
    counts = {}
    for (const day of log) counts[day] = target
  }
  const createdOn =
    typeof raw.createdOn === 'string' && raw.createdOn
      ? raw.createdOn
      : log.length
        ? [...log].sort()[0]
        : today()
  return {
    id: raw.id,
    name: raw.name,
    icon: raw.icon,
    color: raw.color,
    log,
    streak: typeof raw.streak === 'number' ? raw.streak : 0,
    target,
    counts,
    negative: raw.negative === true,
    createdOn,
  }
}

export function normalizeSettings(raw: Settings): Settings {
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    durations: { ...DEFAULT_SETTINGS.durations, ...(raw?.durations ?? {}) },
    profile: { ...DEFAULT_PROFILE, ...(raw?.profile ?? {}) },
  }
}
