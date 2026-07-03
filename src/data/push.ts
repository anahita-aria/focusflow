// Web Push client: subscribe the device, and schedule/cancel a push for the
// timer's end-time via Supabase. The actual sending is done server-side by the
// `send-pushes` Edge Function (see supabase/ + WEBPUSH_SETUP.md), so alerts
// fire even when the app is fully closed.
import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined

export const isPushConfigured = Boolean(VAPID_PUBLIC_KEY) && Boolean(supabase)

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buffer = new ArrayBuffer(raw.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// Ask permission, subscribe via the SW, and persist the subscription so the
// server can push to this device. Returns true on success.
export async function enablePush(userId: string): Promise<boolean> {
  if (!isPushConfigured || !supabase || !pushSupported() || !VAPID_PUBLIC_KEY) {
    return false
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      subscription: json,
    },
    { onConflict: 'endpoint' },
  )
  return !error
}

export async function disablePush(userId: string): Promise<void> {
  if (!supabase || !pushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    const endpoint = sub.endpoint
    await sub.unsubscribe().catch(() => {})
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
  }
}

export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false
  if (Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.ready.catch(() => null)
  if (!reg) return false
  const sub = await reg.pushManager.getSubscription()
  return Boolean(sub)
}

// Schedule a push for a future time; returns the row id (to cancel later).
export async function schedulePush(
  userId: string,
  fireAt: Date,
  title: string,
  body: string,
): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('scheduled_pushes')
    .insert({
      user_id: userId,
      fire_at: fireAt.toISOString(),
      title,
      body,
    })
    .select('id')
    .single()
  if (error || !data) return null
  return (data as { id: string }).id
}

export async function cancelPush(id: string): Promise<void> {
  if (!supabase) return
  await supabase.from('scheduled_pushes').delete().eq('id', id)
}
