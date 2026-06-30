import { motion } from 'framer-motion'
import { LayoutDashboard, ListTodo, Repeat, Timer } from 'lucide-react'
import { useNav, type View } from '@/store/useNav'
import { cn } from '@/lib/utils'

const TABS: { view: View; label: string; icon: typeof Timer }[] = [
  { view: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { view: 'tasks', label: 'Tasks', icon: ListTodo },
  { view: 'habits', label: 'Habits', icon: Repeat },
  { view: 'focus', label: 'Focus', icon: Timer },
]

export function BottomNav() {
  const view = useNav((s) => s.view)
  const navigate = useNav((s) => s.navigate)

  return (
    <nav
      className="glass-strong fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-stretch justify-around rounded-t-3xl border-x-0 border-b-0 px-2 pt-2"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      {TABS.map(({ view: v, label, icon: Icon }) => {
        const active = view === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => navigate(v)}
            className="relative flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium transition-colors"
            aria-current={active ? 'page' : undefined}
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 rounded-2xl bg-violet/15"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Icon
              className={cn(
                'relative z-10 size-5 transition-colors',
                active ? 'text-violet' : 'text-muted-foreground',
              )}
            />
            <span
              className={cn(
                'relative z-10 transition-colors',
                active ? 'text-violet' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
