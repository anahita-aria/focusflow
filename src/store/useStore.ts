import { create } from 'zustand'
import { toast } from 'sonner'
import {
  DEFAULT_GAMIFICATION,
  DEFAULT_SETTINGS,
  type BackupData,
  type Completion,
  type FocusMode,
  type GamificationState,
  type Habit,
  type PomodoroSession,
  type Priority,
  type Reward,
  type Settings,
  type Task,
} from '@/data/models'
import {
  completionsRepo,
  exportAll,
  gamificationRepo,
  habitsRepo,
  importAll,
  rewardsRepo,
  sessionsRepo,
  settingsRepo,
  tasksRepo,
} from '@/data/repository'
import {
  applyXp,
  badgeById,
  earnedBadgeIds,
  focusXp,
  habitXp,
  TASK_XP,
} from '@/lib/gamification'
import {
  computeCleanStreak,
  computeStreak,
  dayKey,
  today,
  yesterday,
} from '@/lib/date'
import { newId } from '@/lib/id'
import { celebrateBig, celebrateBurst } from '@/lib/celebrate'

const STREAK_FREEZE_COST = 50

interface StoreState {
  ready: boolean
  tasks: Task[]
  habits: Habit[]
  sessions: PomodoroSession[]
  rewards: Reward[]
  completions: Completion[]
  gamification: GamificationState
  settings: Settings

  init: () => Promise<void>

  // Tasks
  addTask: (input: { text: string; priority: Priority; recurring: boolean }) => Promise<void>
  updateTask: (id: string, patch: Partial<Pick<Task, 'text' | 'priority' | 'recurring'>>) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  // Habits
  addHabit: (input: {
    name: string
    icon: string
    color: string
    target: number
    negative: boolean
  }) => Promise<void>
  toggleHabitToday: (id: string) => Promise<void> // simple check / slip toggle
  bumpHabit: (id: string, delta: number) => Promise<void> // count goals
  deleteHabit: (id: string) => Promise<void>

  // Focus
  recordSession: (mode: FocusMode, minutes: number) => Promise<void>

  // Rewards / gamification
  addReward: (input: { label: string; cost: number }) => Promise<void>
  deleteReward: (id: string) => Promise<void>
  redeemReward: (id: string) => Promise<boolean>
  buyStreakFreeze: () => Promise<boolean>

  // Settings + backup
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  exportData: () => Promise<BackupData>
  importData: (data: BackupData) => Promise<void>
}

export const useStore = create<StoreState>((set, get) => {
  // --- Private helpers (closure over set/get) ---

  async function persistGamification(g: GamificationState) {
    await gamificationRepo.set(g)
    set({ gamification: g })
  }

  // Re-evaluate badges against current stats; award + celebrate new ones.
  async function refreshBadges() {
    const { gamification, habits, sessions } = get()
    const bestHabitStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0)
    const focusSessions = sessions.filter((s) => s.mode === 'work').length
    const nowEarned = earnedBadgeIds({
      bestHabitStreak,
      focusSessions,
      level: gamification.level,
      tasksCompletedTotal: gamification.tasksCompletedTotal,
    })
    const fresh = nowEarned.filter((id) => !gamification.badges.includes(id))
    if (fresh.length === 0) return

    const updated: GamificationState = {
      ...gamification,
      badges: [...gamification.badges, ...fresh],
    }
    await persistGamification(updated)
    fresh.forEach((id) => {
      const def = badgeById(id)
      celebrateBig()
      toast.success(`Badge unlocked: ${def?.name ?? id}`, {
        description: def?.description,
      })
    })
  }

  // Apply an XP award, persist, toast on level-up, then refresh badges.
  async function award(xpGained: number) {
    const g = get().gamification
    const result = applyXp(g, xpGained)
    await persistGamification(result.state)
    if (result.leveledUp) {
      celebrateBig()
      toast.success(`Level up! You reached level ${result.newLevel}`, {
        description: `+${result.coinsGained} coins earned`,
      })
    }
    await refreshBadges()
  }

  // Runs once on load: reset recurring tasks + decay/freeze habit streaks.
  async function runDailyReset() {
    const t = today()
    const { settings } = get()
    if (settings.lastResetDate === t) return

    // Recurring tasks: uncheck for the new day. One-time tasks untouched.
    const tasks = get().tasks
    const resetTasks = tasks.map((task) =>
      task.recurring && task.done
        ? { ...task, done: false, completedOn: null }
        : task,
    )
    const changedTasks = resetTasks.filter(
      (task, i) => task.done !== tasks[i].done,
    )
    if (changedTasks.length) await tasksRepo.bulkPut(changedTasks)

    // Habits: if yesterday was missed but a freeze is owned and a streak was
    // active (the day before yesterday was done), spend a freeze to bridge it.
    let g = get().gamification
    const y = yesterday()
    const dayBeforeY = dayKey(new Date(Date.now() - 2 * 86400000))
    const habits = get().habits
    const updatedHabits = habits.map((h) => {
      // Negative habits track slips; the streak is consecutive clean days.
      if (h.negative) {
        return { ...h, streak: computeCleanStreak(h.log, h.createdOn) }
      }
      const set = new Set(h.log)
      if (!set.has(y) && set.has(dayBeforeY) && g.streakFreezes > 0) {
        g = { ...g, streakFreezes: g.streakFreezes - 1 }
        const log = [...h.log, y]
        return { ...h, log, streak: computeStreak(log) }
      }
      return { ...h, streak: computeStreak(h.log) }
    })
    await Promise.all(updatedHabits.map((h) => habitsRepo.put(h)))
    if (g !== get().gamification) await gamificationRepo.set(g)

    const newSettings: Settings = { ...settings, lastResetDate: t }
    await settingsRepo.set(newSettings)

    set({ tasks: resetTasks, habits: updatedHabits, gamification: g, settings: newSettings })
  }

  return {
    ready: false,
    tasks: [],
    habits: [],
    sessions: [],
    rewards: [],
    completions: [],
    gamification: { ...DEFAULT_GAMIFICATION },
    settings: { ...DEFAULT_SETTINGS },

    async init() {
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
      set({ tasks, habits, sessions, rewards, completions, gamification, settings })
      await runDailyReset()
      set({ ready: true })
    },

    // ---- Tasks ----
    async addTask({ text, priority, recurring }) {
      const task: Task = {
        id: newId(),
        text: text.trim(),
        priority,
        recurring,
        done: false,
        completedOn: null,
        createdOn: today(),
      }
      await tasksRepo.put(task)
      set({ tasks: [...get().tasks, task] })
    },

    async updateTask(id, patch) {
      const task = get().tasks.find((t) => t.id === id)
      if (!task) return
      const updated = { ...task, ...patch, text: (patch.text ?? task.text).trim() }
      await tasksRepo.put(updated)
      set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
    },

    async toggleTask(id) {
      const task = get().tasks.find((t) => t.id === id)
      if (!task) return
      const t = today()
      const nowDone = !task.done
      const updated: Task = {
        ...task,
        done: nowDone,
        completedOn: nowDone ? t : null,
      }
      await tasksRepo.put(updated)
      set({ tasks: get().tasks.map((x) => (x.id === id ? updated : x)) })

      if (nowDone) {
        // Log the completion for the History view.
        const completion: Completion = {
          id: newId(),
          taskId: task.id,
          date: t,
          text: updated.text,
          priority: task.priority,
          recurring: task.recurring,
        }
        await completionsRepo.add(completion)
        set({ completions: [...get().completions, completion] })

        // Count lifetime completion + award XP.
        const g = get().gamification
        await persistGamification({
          ...g,
          tasksCompletedTotal: g.tasksCompletedTotal + 1,
        })
        celebrateBurst()
        await award(TASK_XP[task.priority])
      } else {
        // Un-checked today — drop today's history entry for this task.
        await completionsRepo.removeForTaskOnDate(task.id, t)
        set({
          completions: get().completions.filter(
            (c) => !(c.taskId === task.id && c.date === t),
          ),
        })
      }
    },

    async deleteTask(id) {
      await tasksRepo.remove(id)
      set({ tasks: get().tasks.filter((t) => t.id !== id) })
    },

    // ---- Habits ----
    async addHabit({ name, icon, color, target, negative }) {
      const habit: Habit = {
        id: newId(),
        name: name.trim(),
        icon,
        color,
        log: [],
        streak: 0,
        target: negative ? 1 : Math.max(1, Math.round(target)),
        counts: {},
        negative,
        createdOn: today(),
      }
      await habitsRepo.put(habit)
      set({ habits: [...get().habits, habit] })
    },

    // Shared writer for both positive (count) and negative (slip) habits.
    async toggleHabitToday(id) {
      const habit = get().habits.find((h) => h.id === id)
      if (!habit) return
      const t = today()

      if (habit.negative) {
        // Toggle a slip for today; clean streak recomputed, no XP for slipping.
        const slipped = habit.log.includes(t)
        const log = slipped ? habit.log.filter((d) => d !== t) : [...habit.log, t]
        const updated: Habit = {
          ...habit,
          log,
          streak: computeCleanStreak(log, habit.createdOn),
        }
        await habitsRepo.put(updated)
        set({ habits: get().habits.map((h) => (h.id === id ? updated : h)) })
        await refreshBadges()
        return
      }

      // Positive habit: a tap fills the day to its target, or clears it.
      const done = (habit.counts[t] ?? 0) >= habit.target
      await get().bumpHabit(id, done ? -habit.target : habit.target)
    },

    // Adjust a positive habit's progress for today by `delta` (count goals).
    async bumpHabit(id, delta) {
      const habit = get().habits.find((h) => h.id === id)
      if (!habit || habit.negative) return
      const t = today()
      const prev = habit.counts[t] ?? 0
      const next = Math.min(habit.target, Math.max(0, prev + delta))
      if (next === prev) return

      const counts = { ...habit.counts, [t]: next }
      const wasComplete = prev >= habit.target
      const nowComplete = next >= habit.target
      const log = nowComplete
        ? habit.log.includes(t)
          ? habit.log
          : [...habit.log, t]
        : habit.log.filter((d) => d !== t)
      const streak = computeStreak(log)
      const updated: Habit = { ...habit, counts, log, streak }
      await habitsRepo.put(updated)
      set({ habits: get().habits.map((h) => (h.id === id ? updated : h)) })

      if (!wasComplete && nowComplete) {
        // Goal met for the first time today — award XP with streak bonus.
        celebrateBurst()
        await award(habitXp(streak))
      } else {
        await refreshBadges()
      }
    },

    async deleteHabit(id) {
      await habitsRepo.remove(id)
      set({ habits: get().habits.filter((h) => h.id !== id) })
    },

    // ---- Focus ----
    async recordSession(mode, minutes) {
      const session: PomodoroSession = {
        id: newId(),
        date: today(),
        minutes,
        mode,
      }
      await sessionsRepo.add(session)
      set({ sessions: [...get().sessions, session] })
      if (mode === 'work') {
        await award(focusXp(minutes))
      } else {
        await refreshBadges()
      }
    },

    // ---- Rewards ----
    async addReward({ label, cost }) {
      const reward: Reward = { id: newId(), label: label.trim(), cost }
      await rewardsRepo.put(reward)
      set({ rewards: [...get().rewards, reward] })
    },

    async deleteReward(id) {
      await rewardsRepo.remove(id)
      set({ rewards: get().rewards.filter((r) => r.id !== id) })
    },

    async redeemReward(id) {
      const reward = get().rewards.find((r) => r.id === id)
      const g = get().gamification
      if (!reward || g.coins < reward.cost) {
        toast.error('Not enough coins for that reward')
        return false
      }
      await persistGamification({ ...g, coins: g.coins - reward.cost })
      toast.success(`Redeemed: ${reward.label}`, {
        description: `-${reward.cost} coins`,
      })
      return true
    },

    async buyStreakFreeze() {
      const g = get().gamification
      if (g.coins < STREAK_FREEZE_COST) {
        toast.error('Not enough coins for a streak freeze')
        return false
      }
      await persistGamification({
        ...g,
        coins: g.coins - STREAK_FREEZE_COST,
        streakFreezes: g.streakFreezes + 1,
      })
      toast.success('Streak freeze purchased', {
        description: 'Protects a streak for one missed day',
      })
      return true
    },

    // ---- Settings + backup ----
    async updateSettings(patch) {
      const settings = { ...get().settings, ...patch }
      await settingsRepo.set(settings)
      set({ settings })
    },

    async exportData() {
      return exportAll(new Date().toISOString())
    },

    async importData(data) {
      await importAll(data)
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
      set({ tasks, habits, sessions, rewards, completions, gamification, settings })
      toast.success('Data imported')
    },
  }
})

export { STREAK_FREEZE_COST }
