// Offline-first snapshot sync. Dexie stays the local source of truth; the whole
// dataset is mirrored to Supabase as one versioned JSON snapshot (reusing the
// BackupData export/import). Conflict resolution is last-write-wins at the
// dataset level — simple and robust for a single user across their own devices.
import { getDeviceId, isSupabaseConfigured, supabase } from './supabase'
import type { BackupData } from './models'
import { useStore } from '@/store/useStore'

const TABLE = 'focusflow_snapshots'

// Sync cursor is device-local bookkeeping (timestamps), not user content.
const CURSOR_KEY = 'focusflow.sync.cursor'

interface SyncCursor {
  lastRemoteUpdatedAt: string | null // ISO from server
  lastSyncedAt: string | null
}

function readCursor(): SyncCursor {
  try {
    const raw = localStorage.getItem(CURSOR_KEY)
    if (raw) return JSON.parse(raw) as SyncCursor
  } catch {
    /* ignore */
  }
  return { lastRemoteUpdatedAt: null, lastSyncedAt: null }
}

function writeCursor(c: SyncCursor): void {
  localStorage.setItem(CURSOR_KEY, JSON.stringify(c))
}

export function getLastSyncedAt(): string | null {
  return readCursor().lastSyncedAt
}

interface RemoteRow {
  snapshot: BackupData
  updated_at: string
}

async function pullRemote(userId: string): Promise<RemoteRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLE)
    .select('snapshot, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data as RemoteRow | null) ?? null
}

async function pushLocal(userId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured')
  const snapshot = await useStore.getState().exportData()
  const nowIso = new Date().toISOString()
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      snapshot,
      updated_at: nowIso,
      device: getDeviceId(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
  return nowIso
}

export type SyncResult = 'pushed' | 'pulled' | 'noop' | 'error'

// Reconciles local and remote with last-write-wins.
export async function syncNow(userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured || !supabase) return 'noop'
  try {
    const cursor = readCursor()
    const remote = await pullRemote(userId)

    if (!remote) {
      // Nothing in the cloud yet — seed it from local.
      const at = await pushLocal(userId)
      writeCursor({ lastRemoteUpdatedAt: at, lastSyncedAt: at })
      return 'pushed'
    }

    const remoteNewerThanLastSeen =
      !cursor.lastRemoteUpdatedAt ||
      remote.updated_at > cursor.lastRemoteUpdatedAt

    if (remoteNewerThanLastSeen) {
      // Cloud changed since we last synced — adopt it locally.
      await useStore.getState().importData(remote.snapshot)
      writeCursor({
        lastRemoteUpdatedAt: remote.updated_at,
        lastSyncedAt: new Date().toISOString(),
      })
      return 'pulled'
    }

    // Local is the most recent author — push our state up.
    const at = await pushLocal(userId)
    writeCursor({ lastRemoteUpdatedAt: at, lastSyncedAt: at })
    return 'pushed'
  } catch (err) {
    console.warn('[sync] failed (continuing local-only):', err)
    return 'error'
  }
}

// Debounced background push: after local edits, mirror up to the cloud.
let pushTimer: ReturnType<typeof setTimeout> | null = null
let unsubscribe: (() => void) | null = null

export function startAutoSync(getUserId: () => string | null): void {
  if (!isSupabaseConfigured) return
  if (unsubscribe) return // already running
  unsubscribe = useStore.subscribe((state, prev) => {
    // Only react to data changes, not the initial hydrate / ready flip.
    if (!state.ready || state === prev) return
    if (
      state.tasks === prev.tasks &&
      state.habits === prev.habits &&
      state.sessions === prev.sessions &&
      state.rewards === prev.rewards &&
      state.gamification === prev.gamification &&
      state.settings === prev.settings
    ) {
      return
    }
    const userId = getUserId()
    if (!userId) return
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      void syncNow(userId)
    }, 2500)
  })
}

export function stopAutoSync(): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = null
  unsubscribe?.()
  unsubscribe = null
}

export function clearSyncCursor(): void {
  localStorage.removeItem(CURSOR_KEY)
}
