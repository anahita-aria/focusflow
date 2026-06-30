import type { GamificationState, Priority } from '@/data/models'

// XP needed to advance FROM level L to L+1: 100 + (L-1) * 50.
// L1->2 = 100, L2->3 = 150, ...
export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 50
}

// XP awarded for completing a task of a given priority.
export const TASK_XP: Record<Priority, number> = {
  low: 10,
  medium: 20,
  high: 35,
}

// Habit check: 15 XP + streak bonus (+2 per streak day, capped at +30).
// `streak` is the streak value *after* today's check is counted.
export function habitXp(streak: number): number {
  const bonus = Math.min(streak * 2, 30)
  return 15 + bonus
}

// Work focus session: 1 XP per minute.
export function focusXp(minutes: number): number {
  return Math.max(0, Math.round(minutes))
}

// Coins earned alongside an XP award: round(xp / 2).
export function coinsFor(xp: number): number {
  return Math.round(xp / 2)
}

export interface XpResult {
  state: GamificationState
  leveledUp: boolean
  newLevel: number
  coinsGained: number
}

// Pure: apply an XP award, leveling up as many times as the total allows.
export function applyXp(
  state: GamificationState,
  xpGained: number,
): XpResult {
  const coinsGained = coinsFor(xpGained)
  let xp = state.xp + xpGained
  let level = state.level
  let leveledUp = false

  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level)
    level += 1
    leveledUp = true
  }

  return {
    state: {
      ...state,
      xp,
      level,
      coins: state.coins + coinsGained,
    },
    leveledUp,
    newLevel: level,
    coinsGained,
  }
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  icon: string // lucide icon name
}

export const BADGES: BadgeDef[] = [
  {
    id: 'streak-7',
    name: 'On Fire',
    description: 'Reach a 7-day streak on any habit',
    icon: 'Flame',
  },
  {
    id: 'streak-30',
    name: 'Unstoppable',
    description: 'Reach a 30-day streak on any habit',
    icon: 'Trophy',
  },
  {
    id: 'focus-100',
    name: 'Deep Worker',
    description: 'Complete 100 focus sessions',
    icon: 'Brain',
  },
  {
    id: 'level-10',
    name: 'Veteran',
    description: 'Reach level 10',
    icon: 'Star',
  },
  {
    id: 'tasks-100',
    name: 'Taskmaster',
    description: 'Complete 100 tasks',
    icon: 'CheckCheck',
  },
]

export interface BadgeStats {
  bestHabitStreak: number
  focusSessions: number
  level: number
  tasksCompletedTotal: number
}

// Returns badge ids that are now earned given current stats (includes
// already-earned ones — caller diffs against state.badges).
export function earnedBadgeIds(stats: BadgeStats): string[] {
  const earned: string[] = []
  if (stats.bestHabitStreak >= 7) earned.push('streak-7')
  if (stats.bestHabitStreak >= 30) earned.push('streak-30')
  if (stats.focusSessions >= 100) earned.push('focus-100')
  if (stats.level >= 10) earned.push('level-10')
  if (stats.tasksCompletedTotal >= 100) earned.push('tasks-100')
  return earned
}

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id)
}
