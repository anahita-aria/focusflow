import { useEffect, useState } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Priority, Task } from '@/data/models'
import { useStore } from '@/store/useStore'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this task instead of creating one. */
  task?: Task | null
}

export function TaskFormDialog({ open, onOpenChange, task }: Props) {
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)

  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [recurring, setRecurring] = useState(false)

  useEffect(() => {
    if (open) {
      setText(task?.text ?? '')
      setPriority(task?.priority ?? 'medium')
      setRecurring(task?.recurring ?? false)
    }
  }, [open, task])

  const submit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (task) {
      await updateTask(task.id, { text: trimmed, priority, recurring })
    } else {
      await addTask({ text: trimmed, priority, recurring })
    }
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-strong">
        <div className="mx-auto w-full max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-heading text-lg">
            {task ? 'Edit task' : 'New task'}
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-2">
          <div className="space-y-2">
            <Label htmlFor="task-text">Task</Label>
            <Input
              id="task-text"
              placeholder="What needs doing?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary/40 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Recurring (daily)</p>
              <p className="text-xs text-muted-foreground">
                Resets each new day
              </p>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>
        </div>

        <DrawerFooter
          className="flex-row gap-2"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={!text.trim()}
            className="flex-1 cursor-pointer"
          >
            {task ? 'Save' : 'Add task'}
          </Button>
        </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
