import { Coins, Gift, Settings as SettingsIcon } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useNav } from '@/store/useNav'
import { Avatar } from '@/lib/avatars'

export function Header() {
  const gamification = useStore((s) => s.gamification)
  const profile = useStore((s) => s.settings.profile)
  const navigate = useNav((s) => s.navigate)

  return (
    <header
      className="sticky top-0 z-20 mx-auto flex max-w-md items-center justify-between gap-2 px-4 pb-3"
      style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
    >
      <button
        type="button"
        onClick={() => navigate('settings')}
        className="flex cursor-pointer items-center gap-2"
        aria-label="Profile and settings"
      >
        <Avatar
          avatarId={profile.avatarId}
          name={profile.name}
          className="size-8 text-sm"
        />
        <span className="font-heading text-lg font-semibold tracking-tight">
          {profile.name ? `Hi, ${profile.name.split(' ')[0]}` : 'FocusFlow'}
        </span>
      </button>

      <div className="flex items-center gap-1.5">
        <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
          <span className="text-violet">Lv</span>
          <span className="font-display">{gamification.level}</span>
        </span>
        <button
          type="button"
          onClick={() => navigate('rewards')}
          className="glass flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
          aria-label="Rewards shop"
        >
          <Coins className="size-3.5 text-amber" />
          <span className="font-display">{gamification.coins}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('rewards')}
          className="glass grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground"
          aria-label="Rewards"
        >
          <Gift className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate('settings')}
          className="glass grid size-8 cursor-pointer place-items-center rounded-full text-muted-foreground"
          aria-label="Settings"
        >
          <SettingsIcon className="size-4" />
        </button>
      </div>
    </header>
  )
}
