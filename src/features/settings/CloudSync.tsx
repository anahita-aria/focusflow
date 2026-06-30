import { useState } from 'react'
import { Cloud, CloudOff, LogOut, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/store/useAuth'
import { getLastSyncedAt } from '@/data/sync'

export function CloudSync() {
  const { configured, status, user, syncing } = useAuth()
  const signIn = useAuth((s) => s.signIn)
  const signUp = useAuth((s) => s.signUp)
  const signOut = useAuth((s) => s.signOut)
  const syncNow = useAuth((s) => s.syncNow)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (mode: 'in' | 'up') => {
    if (!email.trim() || password.length < 6) return
    setBusy(true)
    try {
      if (mode === 'up') await signUp(email.trim(), password)
      else await signIn(email.trim(), password)
    } catch {
      /* toasts handled in store */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass space-y-3 rounded-2xl p-4">
      <p className="flex items-center gap-2 font-heading text-sm font-semibold">
        {configured && status === 'signed-in' ? (
          <Cloud className="size-4 text-teal" />
        ) : (
          <CloudOff className="size-4 text-violet" />
        )}
        Cloud sync
      </p>

      {/* Not configured */}
      {!configured && (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">
            Cloud sync isn't set up yet. Your data is saved locally on this
            device.
          </p>
          <p className="text-xs text-muted-foreground">
            To enable syncing across devices, follow{' '}
            <span className="text-violet">SUPABASE_SETUP.md</span> in the project
            root, then add your keys to a <code>.env</code> file and restart.
          </p>
        </div>
      )}

      {/* Configured, signed out */}
      {configured && status === 'signed-out' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Sign in to back up and sync your data across devices.
          </p>
          <div className="space-y-2">
            <Label htmlFor="cs-email">Email</Label>
            <Input
              id="cs-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-password">Password</Label>
            <Input
              id="cs-password"
              type="password"
              autoComplete="current-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => void submit('in')}
              disabled={busy || !email.trim() || password.length < 6}
              className="flex-1 cursor-pointer"
            >
              Sign in
            </Button>
            <Button
              variant="secondary"
              onClick={() => void submit('up')}
              disabled={busy || !email.trim() || password.length < 6}
              className="flex-1 cursor-pointer"
            >
              Create account
            </Button>
          </div>
        </div>
      )}

      {/* Signed in */}
      {configured && status === 'signed-in' && user && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {getLastSyncedAt()
                  ? `Last synced ${new Date(getLastSyncedAt() as string).toLocaleString()}`
                  : 'Not synced yet'}
              </p>
            </div>
            <span className="rounded-full bg-teal/15 px-2 py-1 text-[11px] font-medium text-teal">
              Synced
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => void syncNow()}
              disabled={syncing}
              className="flex-1 cursor-pointer gap-2"
            >
              <RefreshCw className={syncing ? 'size-4 animate-spin' : 'size-4'} />
              {syncing ? 'Syncing…' : 'Sync now'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => void signOut()}
              className="cursor-pointer gap-2"
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {configured && status === 'loading' && (
        <p className="text-sm text-muted-foreground">Checking session…</p>
      )}
    </div>
  )
}
