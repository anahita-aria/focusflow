# FocusFlow

A personal productivity PWA — habit tracking with gamification, a prioritized
daily to-do list, and a configurable Pomodoro timer. Dark glassmorphism UI,
local-first, installable on your phone, with optional cloud sync.

## Features

- **Tasks** — priorities, recurring (daily) vs one-time, filters, and a daily
  reset that re-opens recurring tasks each new day.
- **Habits** — build or break habits, daily count goals, streaks, and 14/30-day
  heatmaps. Negative habits track clean-day streaks.
- **Focus** — Pomodoro timer (focus / short / long), configurable durations,
  background-accurate (timestamp-driven) countdown, alarm + notification.
- **Gamification** — XP, levels, coins, badges, a rewards shop, and streak
  freezes, with confetti + toasts.
- **Dashboard** — stat cards, a weekly performance chart, best streak, recent
  badges.
- **Settings** — durations, accent theme, profile/avatar, JSON export/import.
- **Cloud sync (optional)** — sign in with email/password to back up and sync
  across devices via Supabase. Works fully offline; cloud is additive.

## Tech

Vite · React · TypeScript · Tailwind CSS · shadcn/ui · framer-motion · Zustand ·
Dexie (IndexedDB) · Recharts · canvas-confetti · date-fns · vite-plugin-pwa ·
Supabase (optional).

Data access goes through a single repository module (`src/data/repository.ts`),
so the local IndexedDB layer and the optional cloud sync stay cleanly separable.

## Develop

```bash
npm install
npm run dev
```

## Cloud sync (optional)

Cloud sync is off until you add Supabase credentials. See
[`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) for the ~5-minute setup, then create a
`.env` from [`.env.example`](./.env.example):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The anon key is a public client key; `.env` is git-ignored. When deploying, set
these as environment variables in your host (e.g. Vercel project settings).

## Build

```bash
npm run build      # type-checks then builds to dist/
npm run preview    # serve the production build locally (PWA active here)
```
