import type { ThemeName } from '@/data/models'

// Accent themes swap the primary accent while keeping the dark glass base.
export const THEMES: Record<
  ThemeName,
  { label: string; accent: string; foreground: string }
> = {
  violet: { label: 'Violet', accent: '#a78bfa', foreground: '#160b2e' },
  teal: { label: 'Teal', accent: '#34d399', foreground: '#04140d' },
  amber: { label: 'Amber', accent: '#fbbf24', foreground: '#241a02' },
}

export function applyTheme(theme: ThemeName): void {
  if (typeof document === 'undefined') return
  const { accent, foreground } = THEMES[theme]
  const root = document.documentElement.style
  root.setProperty('--primary', accent)
  root.setProperty('--primary-foreground', foreground)
  root.setProperty('--violet', accent)
  root.setProperty('--ring', accent)
  root.setProperty('--accent-foreground', accent)
}
