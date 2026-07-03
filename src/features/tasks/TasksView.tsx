import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  History,
  MoreVertical,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStore } from '@/store/useStore'
import { useNav } from '@/store/useNav'
import { today } from '@/lib/date'
import type { Task } from '@/data/models'
import { cn } from '@/lib/utils'
import { TaskFormDialog } from './TaskFormDialog'
import { PRIORITY_META, PRIORITY_RANK, type TaskFilter } from './util'

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Med' },
  { value: 'low', label: 'Low' },
]

export function TasksView() {
  const tasks = useStore((s) => s.tasks)
  const toggleTask = useStore((s) => s.toggleTask)
  const deleteTask = useStore((s) => s.deleteTask)
  const navigate = useNav((s) => s.navigate)

  const [filter, setFilter] = useState<TaskFilter>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  const visible = useMemo(() => {
    const t = today()
    const filtered = tasks.filter((task) => {
      // Keep "today's board" tidy: hide one-time tasks finished on a previous
      // day (they live in History). Everything open + done-today stays.
      if (task.done && !task.recurring && task.completedOn !== t) return false
      if (filter === 'all') return true
      if (filter === 'open') return !task.done
      if (filter === 'done') return task.done
      return task.priority === filter
    })
    // Sort by priority, then open-before-done.
    return filtered.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    })
  }, [tasks, filter])

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (task: Task) => {
    setEditing(task)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Tasks</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('history')}
            aria-label="History"
            className="glass grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground"
          >
            <History className="size-4" />
          </button>
          <Button size="sm" onClick={openAdd} className="cursor-pointer gap-1">
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              'shrink-0 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.value
                ? 'bg-violet text-primary-foreground'
                : 'glass text-muted-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((task) => {
            const meta = PRIORITY_META[task.priority]
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="glass flex items-center gap-3 rounded-2xl p-3"
              >
                <button
                  type="button"
                  onClick={() => void toggleTask(task.id)}
                  aria-label={task.done ? 'Mark not done' : 'Mark done'}
                  className={cn(
                    'grid size-6 shrink-0 cursor-pointer place-items-center rounded-lg border transition-colors',
                    task.done
                      ? 'border-teal bg-teal text-[#04140d]'
                      : 'border-white/20 text-transparent hover:border-teal',
                  )}
                >
                  <Check className="size-4" strokeWidth={3} />
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'truncate text-sm',
                      task.done && 'text-muted-foreground line-through',
                    )}
                  >
                    {task.text}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className={cn('flex items-center gap-1', meta.color)}>
                      <span className={cn('size-1.5 rounded-full', meta.dot)} />
                      {meta.label}
                    </span>
                    {task.recurring && (
                      <span className="flex items-center gap-1">
                        <Repeat className="size-3" /> Daily
                      </span>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Task options"
                      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-white/5"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-strong">
                    <DropdownMenuItem onClick={() => openEdit(task)}>
                      <Pencil className="mr-2 size-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => void deleteTask(task.id)}
                      className="text-coral focus:text-coral"
                    >
                      <Trash2 className="mr-2 size-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {visible.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No tasks here yet. Tap <span className="text-violet">Add</span> to
            create one.
          </div>
        )}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
      />
    </div>
  )
}
