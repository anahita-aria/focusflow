# FocusFlow — Project Spec

A personal productivity app: habit tracking with gamification, a prioritized daily to-do list, and a configurable Pomodoro timer. Dark glassmorphism UI. Local-first, installable as a PWA.

This document is the single source of truth. Build to this spec.

---

## 1. Tech stack (non-negotiable)

- **Vite + React + TypeScript**
- **Tailwind CSS** for styling
- **shadcn/ui** for base components
- **framer-motion** (or its successor package `motion`) for animation
- **zustand** for app state
- **dexie** for the IndexedDB data layer
- **lucide-react** for icons
- **recharts** for dashboard charts
- **canvas-confetti** for celebrations
- **date-fns** for date logic
- **vite-plugin-pwa** so it installs on a phone

No backend in Phase 1. No `localStorage` for app data — use IndexedDB via Dexie.

**Design tooling:** the UI/UX Pro Max skill (community Claude Code skill) is installed and must be used for design decisions — see section 5. It requires Python 3.x for its search script.

---

## 2. Architecture rules

- All reads/writes go through a **single repository module** (e.g. `src/data/repository.ts`). UI never touches Dexie directly. This makes swapping to a cloud backend later a contained change.
- Typed models everywhere. No `any`.
- One feature per folder: `src/features/{tasks,habits,focus,dashboard,gamification,settings}`.
- App must run with `npm run dev` and have **zero console errors**.

---

## 3. Data models

```ts
type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  text: string;
  priority: Priority;
  recurring: boolean;      // daily recurring vs one-time
  done: boolean;
  completedOn: string | null; // YYYY-MM-DD
  createdOn: string;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  log: string[];           // array of YYYY-MM-DD it was completed
  streak: number;
}

interface PomodoroSession {
  id: string;
  date: string;            // YYYY-MM-DD
  minutes: number;
  mode: 'work' | 'short' | 'long';
}

interface GamificationState {
  xp: number;
  level: number;
  coins: number;
  badges: string[];        // earned badge ids
  streakFreezes: number;
}

interface Reward {        // user-defined real-life rewards
  id: string;
  label: string;          // e.g. "1 hour of gaming"
  cost: number;           // in coins
}
```

---

## 4. Features

### 4.1 Tasks
- Add / edit / delete.
- Priority: high / medium / low.
- Type toggle: **recurring (daily)** or **one-time**.
- Filters: all / open / done / by priority. Sort by priority.
- **Daily reset:** at the start of a new day, recurring tasks become unchecked again; one-time tasks are left as-is. Detect day change on app load using the last-reset date.

### 4.2 Habits
- Create habit with an icon and color.
- Toggle done for today; compute current streak.
- 14-day (and optional 30-day) heatmap per habit.
- Show streak + total completions.

### 4.3 Focus (Pomodoro)
- Three modes: Focus / Short break / Long break.
- Configurable duration per mode: presets + custom value (1–180 min).
- **Background-accurate timer:** drive the countdown from a real-clock end-timestamp (recompute remaining = endTime - now), and re-sync on tab `visibilitychange`. Must stay correct when backgrounded.
- Audible alarm (Web Audio API) + browser Notification on completion.
- Completing a **work** session awards XP + coins (see gamification).
- Reference logic exists in the user's prior single-file build; reuse the timestamp-driven approach, just clean it and port to TypeScript.

### 4.4 Gamification (medium tier)
**XP awards**
- Task complete: low = 10, medium = 20, high = 35 XP.
- Habit check: 15 XP + streak bonus (+2 per streak day, capped at +30).
- Work focus session: 1 XP per minute focused.

**Coins:** earn `round(xp_gained / 2)` coins alongside every XP award.

**Level curve:** XP needed to go from level `L` to `L+1` is `100 + (L-1) * 50`. (L1→2 = 100, L2→3 = 150, …). Show a level progress bar.

**Rewards shop:** user defines their own rewards (label + coin cost) and redeems them by spending coins. Redeeming deducts coins; block if insufficient.

**Badges / achievements** (examples — implement at least these):
- `streak-7`: any habit reaches a 7-day streak.
- `streak-30`: any habit reaches a 30-day streak.
- `focus-100`: 100 total focus sessions.
- `level-10`: reach level 10.
- `tasks-100`: complete 100 tasks total.

**Soft penalty:** missing a daily habit only resets its streak — no health/damage. Optional **Streak Freeze** purchasable for 50 coins that preserves a streak for one missed day.

**Feedback:** confetti (canvas-confetti) + a toast on level-up and on earning a badge.

### 4.5 Dashboard
- Stat cards: task completion %, habits done today, focus minutes today, current level, coins.
- Weekly performance chart (recharts, last 7 days).
- Best streak + most recently earned badges.

### 4.6 Settings
- Edit Pomodoro durations, theme, notification permission.
- **Export / Import all data as JSON** (important since data is local).

---

## 5. Design direction

**Use the UI/UX Pro Max skill for all design decisions.** Before building any UI, query it for a dark-glassmorphism design system and follow its color, typography, spacing, and UX guidance instead of defaulting to generic output. Examples:
- `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "productivity habit tracker dark glassmorphism" --design-system -p "FocusFlow" --persist`
- `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism dark mode" --domain style`
- `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard" --domain chart --stack react`
Then synthesize its recommendations with the constraints below (which take priority where they conflict).

- Dark glassmorphism: deep navy/near-black background (~`#050814`), translucent frosted cards with subtle borders, soft animated background orbs.
- Accent palette: violet `#a78bfa` (primary), teal `#34d399`, amber `#fbbf24`, red `#f87171`, sky `#38bdf8`.
- Fonts: Inter (body), Space Grotesk (headings/numbers).
- Motion: framer-motion for entrances, tab transitions, check animations, level-up. Keep it smooth, not noisy.
- Bottom tab nav: Dashboard / Tasks / Habits / Focus. Mobile-first, safe-area aware.
- UI language: English.

---

## 6. Phases
**Phase 1 (build now):** everything above — all four modules, medium gamification, dashboard, settings + export/import, PWA installable, local IndexedDB.

**Phase 2 (later, do not build yet):** cloud sync + login via Supabase (swap only the repository layer), habit goals/counts, negative habits, avatar.

---

## 7. Acceptance criteria
- `npm run dev` runs with no console errors.
- Installable as a PWA on a phone.
- Data persists across reloads in IndexedDB.
- Recurring tasks reset on a new day; one-time tasks persist.
- Pomodoro stays accurate when the tab is backgrounded.
- XP/coins/levels/badges update correctly per the rules above.
- Export then Import JSON restores the full state.
