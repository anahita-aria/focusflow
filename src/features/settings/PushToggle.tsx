import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/store/useAuth'
import {
  disablePush,
  enablePush,
  isPushConfigured,
  isPushEnabled,
} from '@/data/push'

// Toggle for server-scheduled background push (fires when a timer ends even if
// the app is fully closed). Requires Web Push setup + being signed in.
export function PushToggle() {
  const user = useAuth((s) => s.user)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void isPushEnabled().then(setEnabled)
  }, [user])

  const disabled = !isPushConfigured || !user || busy

  const subtitle = !isPushConfigured
    ? 'Requires setup — see WEBPUSH_SETUP.md'
    : !user
      ? 'Sign in (Cloud sync) to enable'
      : 'Alerts you when a timer ends, even if the app is closed'

  const onToggle = async (checked: boolean) => {
    if (!user) {
      toast.error('Sign in first to enable background alerts')
      return
    }
    setBusy(true)
    try {
      if (checked) {
        const ok = await enablePush(user.id)
        setEnabled(ok)
        toast[ok ? 'success' : 'error'](
          ok ? 'Background alerts on' : 'Could not enable notifications',
        )
      } else {
        await disablePush(user.id)
        setEnabled(false)
        toast.success('Background alerts off')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="pr-3">
        <p className="text-sm">Background alerts</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <Switch
        checked={enabled}
        disabled={disabled}
        onCheckedChange={(c) => void onToggle(c)}
      />
    </div>
  )
}
