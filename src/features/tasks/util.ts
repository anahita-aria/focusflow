import type { Priority } from '@/data/models'

export const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; dot: string }
> = {
  high: { label: 'High', color: 'text-coral', dot: 'bg-coral' },
  medium: { label: 'Medium', color: 'text-amber', dot: 'bg-amber' },
  low: { label: 'Low', color: 'text-sky', dot: 'bg-sky' },
}

export type TaskFilter = 'all' | 'open' | 'done' | Priority
