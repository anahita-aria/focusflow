import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AvatarPreset {
  id: string
  label: string
  from: string
  to: string
}

// Preset gradient avatars. Phase 2 keeps this local; once Supabase auth lands
// the chosen avatar travels with the account.
export const AVATARS: AvatarPreset[] = [
  { id: 'aurora', label: 'Aurora', from: '#a78bfa', to: '#38bdf8' },
  { id: 'ember', label: 'Ember', from: '#fbbf24', to: '#f87171' },
  { id: 'forest', label: 'Forest', from: '#34d399', to: '#10b981' },
  { id: 'dusk', label: 'Dusk', from: '#a78bfa', to: '#f87171' },
  { id: 'ocean', label: 'Ocean', from: '#38bdf8', to: '#34d399' },
  { id: 'gold', label: 'Gold', from: '#fbbf24', to: '#a78bfa' },
  { id: 'rose', label: 'Rose', from: '#f87171', to: '#f472b6' },
  { id: 'mint', label: 'Mint', from: '#34d399', to: '#38bdf8' },
]

export function avatarById(id: string): AvatarPreset {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]
}

interface AvatarProps {
  avatarId: string
  name?: string
  className?: string
}

// Gradient circle showing the user's initial (or a person glyph when unnamed).
export function Avatar({ avatarId, name, className }: AvatarProps) {
  const preset = avatarById(avatarId)
  const initial = name?.trim()?.[0]?.toUpperCase()
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-heading font-semibold text-[#0b1024]',
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
      }}
    >
      {initial ? (
        <span className="leading-none">{initial}</span>
      ) : (
        <User className="size-1/2" />
      )}
    </span>
  )
}
