import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import { BackgroundOrbs } from '@/components/layout/BackgroundOrbs'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { useStore } from '@/store/useStore'
import { useNav } from '@/store/useNav'
import { useAuth } from '@/store/useAuth'
import { applyTheme } from '@/lib/theme'
import { DashboardView } from '@/features/dashboard/DashboardView'
import { TasksView } from '@/features/tasks/TasksView'
import { HabitsView } from '@/features/habits/HabitsView'
import { FocusView } from '@/features/focus/FocusView'
import { RewardsView } from '@/features/gamification/RewardsView'
import { SettingsView } from '@/features/settings/SettingsView'

const VIEWS = {
  dashboard: DashboardView,
  tasks: TasksView,
  habits: HabitsView,
  focus: FocusView,
  rewards: RewardsView,
  settings: SettingsView,
} as const

function App() {
  const ready = useStore((s) => s.ready)
  const init = useStore((s) => s.init)
  const initAuth = useAuth((s) => s.init)
  const theme = useStore((s) => s.settings.theme)
  const view = useNav((s) => s.view)

  useEffect(() => {
    // Local data first; cloud auth/sync layers on top (no-op if unconfigured).
    void init().then(() => initAuth())
  }, [init, initAuth])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const ViewComponent = VIEWS[view]

  return (
    <div className="relative min-h-svh">
      <BackgroundOrbs />

      {!ready ? (
        <div className="relative z-10 grid min-h-svh place-items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-heading text-xl text-muted-foreground"
          >
            Loading FocusFlow…
          </motion.div>
        </div>
      ) : (
        <div className="relative z-10 flex min-h-svh flex-col">
          <Header />
          <main className="no-scrollbar mx-auto w-full max-w-md flex-1 overflow-y-auto px-4 pb-28">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <ViewComponent />
              </motion.div>
            </AnimatePresence>
          </main>
          <BottomNav />
        </div>
      )}

      <Toaster position="top-center" richColors theme="dark" />
    </div>
  )
}

export default App
