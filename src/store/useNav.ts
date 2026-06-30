import { create } from 'zustand'

export type View =
  | 'dashboard'
  | 'tasks'
  | 'habits'
  | 'focus'
  | 'rewards'
  | 'settings'

interface NavState {
  view: View
  navigate: (view: View) => void
}

export const useNav = create<NavState>((set) => ({
  view: 'dashboard',
  navigate: (view) => set({ view }),
}))
