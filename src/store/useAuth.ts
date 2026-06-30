import { create } from 'zustand'
import { toast } from 'sonner'
import { isSupabaseConfigured, supabase } from '@/data/supabase'
import {
  clearSyncCursor,
  startAutoSync,
  stopAutoSync,
  syncNow,
} from '@/data/sync'

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

interface AuthUser {
  id: string
  email: string
}

interface AuthState {
  configured: boolean
  status: AuthStatus
  user: AuthUser | null
  syncing: boolean
  lastSyncResult: string | null

  init: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => {
  function setUserFromSession(sessionUser: { id: string; email?: string } | null) {
    if (sessionUser) {
      set({
        status: 'signed-in',
        user: { id: sessionUser.id, email: sessionUser.email ?? '' },
      })
    } else {
      set({ status: 'signed-out', user: null })
    }
  }

  return {
    configured: isSupabaseConfigured,
    status: 'loading',
    user: null,
    syncing: false,
    lastSyncResult: null,

    async init() {
      if (!isSupabaseConfigured || !supabase) {
        set({ status: 'signed-out', configured: false })
        return
      }
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user ?? null
      setUserFromSession(sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null)

      if (sessionUser) {
        startAutoSync(() => get().user?.id ?? null)
        void get().syncNow()
      }

      supabase.auth.onAuthStateChange((event, session) => {
        const u = session?.user ?? null
        setUserFromSession(u ? { id: u.id, email: u.email } : null)
        if (event === 'SIGNED_IN' && u) {
          startAutoSync(() => get().user?.id ?? null)
          void get().syncNow()
        }
        if (event === 'SIGNED_OUT') {
          stopAutoSync()
          clearSyncCursor()
        }
      })
    },

    async signUp(email, password) {
      if (!supabase) return
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        toast.error('Sign-up failed', { description: error.message })
        throw error
      }
      toast.success('Account created', {
        description: 'Check your email if confirmation is required, then sign in.',
      })
    },

    async signIn(email, password) {
      if (!supabase) return
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error('Sign-in failed', { description: error.message })
        throw error
      }
      toast.success('Signed in')
    },

    async signOut() {
      if (!supabase) return
      await supabase.auth.signOut()
      stopAutoSync()
      clearSyncCursor()
      toast.success('Signed out')
    },

    async syncNow() {
      const userId = get().user?.id
      if (!userId) return
      set({ syncing: true })
      const result = await syncNow(userId)
      set({ syncing: false, lastSyncResult: result })
      if (result === 'pulled') toast.success('Synced — pulled latest from cloud')
      else if (result === 'pushed') toast.success('Synced — backed up to cloud')
      else if (result === 'error') toast.error('Sync failed — still saved locally')
    },
  }
})
