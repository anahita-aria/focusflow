import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Credentials come from Vite env vars (see .env.example / SUPABASE_SETUP.md).
// When they're absent the app simply runs local-only — no cloud features.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

// Stable per-device id (sync bookkeeping only — not user content).
export function getDeviceId(): string {
  const KEY = 'focusflow.sync.deviceId'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(KEY, id)
  }
  return id
}
