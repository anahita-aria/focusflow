import { format, subDays, parseISO } from 'date-fns'

// Canonical day key used everywhere: local-time YYYY-MM-DD.
export function dayKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd')
}

export function today(): string {
  return dayKey()
}

export function yesterday(): string {
  return dayKey(subDays(new Date(), 1))
}

// Returns the last `count` day keys, oldest first, ending today.
export function lastNDays(count: number): string[] {
  const out: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    out.push(dayKey(subDays(new Date(), i)))
  }
  return out
}

export function shortWeekday(key: string): string {
  return format(parseISO(key), 'EEE')
}

// Current consecutive-day streak from a set of completed day keys.
// Counts back from today; if today isn't done yet, the streak is still
// "alive" so we count back from yesterday instead.
export function computeStreak(log: string[]): number {
  const set = new Set(log)
  let streak = 0
  let cursor = new Date()
  if (!set.has(dayKey(cursor))) {
    cursor = subDays(cursor, 1) // today not done yet — start from yesterday
  }
  while (set.has(dayKey(cursor))) {
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}

// Clean-day streak for a negative habit: consecutive days WITHOUT a slip,
// counting back from today to the creation date. A slip today breaks it to 0.
export function computeCleanStreak(slips: string[], createdOn: string): number {
  const set = new Set(slips)
  let streak = 0
  let cursor = new Date()
  while (dayKey(cursor) >= createdOn) {
    if (set.has(dayKey(cursor))) break
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}
