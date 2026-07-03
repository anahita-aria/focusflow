import { useRef, useState } from 'react'
import { Bell, Download, Palette, Timer, Upload, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useStore } from '@/store/useStore'
import type { BackupData, FocusMode, ThemeName } from '@/data/models'
import { THEMES } from '@/lib/theme'
import { AVATARS, Avatar } from '@/lib/avatars'
import { cn } from '@/lib/utils'
import { CloudSync } from './CloudSync'
import { PushToggle } from './PushToggle'

const MODE_LABELS: Record<FocusMode, string> = {
  work: 'Focus',
  short: 'Short break',
  long: 'Long break',
}

export function SettingsView() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)

  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const setDuration = (mode: FocusMode, value: number) => {
    const clamped = Math.min(180, Math.max(1, Math.round(value)))
    void updateSettings({
      durations: { ...settings.durations, [mode]: clamped },
    })
  }

  const requestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Notifications are not supported in this browser')
      return
    }
    const result = await Notification.requestPermission()
    const granted = result === 'granted'
    await updateSettings({ notifications: granted })
    toast[granted ? 'success' : 'error'](
      granted ? 'Notifications enabled' : 'Notifications blocked',
    )
  }

  const handleExport = async () => {
    const data = await exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focusflow-backup-${data.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported')
  }

  const handleImportFile = async (file: File) => {
    setImporting(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as BackupData
      if (parsed.version !== 1 || !Array.isArray(parsed.tasks)) {
        throw new Error('Unrecognised backup file')
      }
      await importData(parsed)
    } catch (err) {
      toast.error('Import failed', {
        description: err instanceof Error ? err.message : 'Invalid file',
      })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold">Settings</h1>

      {/* Profile */}
      <div className="glass space-y-3 rounded-2xl p-4">
        <p className="flex items-center gap-2 font-heading text-sm font-semibold">
          <UserRound className="size-4 text-violet" /> Profile
        </p>
        <div className="flex items-center gap-3">
          <Avatar
            avatarId={settings.profile.avatarId}
            name={settings.profile.name}
            className="size-12 text-lg"
          />
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="profile-name">Display name</Label>
            <Input
              id="profile-name"
              placeholder="Your name"
              value={settings.profile.name}
              maxLength={24}
              onChange={(e) =>
                void updateSettings({
                  profile: { ...settings.profile, name: e.target.value },
                })
              }
            />
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Avatar</Label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => {
              const active = settings.profile.avatarId === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-label={`Avatar ${a.label}`}
                  onClick={() =>
                    void updateSettings({
                      profile: { ...settings.profile, avatarId: a.id },
                    })
                  }
                  className={cn(
                    'rounded-full transition-transform',
                    active
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0b1024]'
                      : 'opacity-80 hover:scale-110',
                  )}
                >
                  <Avatar
                    avatarId={a.id}
                    name={settings.profile.name}
                    className="size-9 text-sm"
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Cloud sync (Phase 2) */}
      <CloudSync />

      {/* Pomodoro durations */}
      <div className="glass space-y-3 rounded-2xl p-4">
        <p className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Timer className="size-4 text-violet" /> Pomodoro durations
        </p>
        {(['work', 'short', 'long'] as FocusMode[]).map((mode) => (
          <div key={mode} className="flex items-center justify-between">
            <Label htmlFor={`dur-${mode}`}>{MODE_LABELS[mode]}</Label>
            <div className="flex items-center gap-1.5">
              <Input
                id={`dur-${mode}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={180}
                value={settings.durations[mode]}
                onChange={(e) => setDuration(mode, Number(e.target.value))}
                className="h-9 w-20 text-center"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
          </div>
        ))}
      </div>

      {/* Theme */}
      <div className="glass space-y-3 rounded-2xl p-4">
        <p className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Palette className="size-4 text-violet" /> Accent theme
        </p>
        <div className="flex gap-2">
          {(Object.keys(THEMES) as ThemeName[]).map((name) => {
            const theme = THEMES[name]
            const active = settings.theme === name
            return (
              <button
                key={name}
                type="button"
                onClick={() => void updateSettings({ theme: name })}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-white/30 bg-white/5'
                    : 'border-white/5 text-muted-foreground',
                )}
              >
                <span
                  className="size-4 rounded-full"
                  style={{ background: theme.accent }}
                />
                {theme.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="glass space-y-3 rounded-2xl p-4">
        <p className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Bell className="size-4 text-violet" /> Notifications
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Focus session alerts</p>
            <p className="text-xs text-muted-foreground">
              Get notified when a timer completes
            </p>
          </div>
          <Switch
            checked={settings.notifications}
            onCheckedChange={(checked) => {
              if (checked) void requestNotifications()
              else void updateSettings({ notifications: false })
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Alarm sound</p>
            <p className="text-xs text-muted-foreground">
              Play a chime on completion
            </p>
          </div>
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(checked) =>
              void updateSettings({ soundEnabled: checked })
            }
          />
        </div>
        <PushToggle />
      </div>

      {/* Data */}
      <div className="glass space-y-3 rounded-2xl p-4">
        <p className="font-heading text-sm font-semibold">Data</p>
        <p className="text-xs text-muted-foreground">
          Your data lives only on this device. Export a backup or restore one.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => void handleExport()}
            className="flex-1 cursor-pointer gap-2"
          >
            <Download className="size-4" /> Export
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex-1 cursor-pointer gap-2"
          >
            <Upload className="size-4" /> Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleImportFile(file)
            }}
          />
        </div>
      </div>

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        FocusFlow · local-first · installable as a PWA
      </p>
    </div>
  )
}
