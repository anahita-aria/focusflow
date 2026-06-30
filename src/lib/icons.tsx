import {
  Activity,
  Apple,
  BookOpen,
  Brain,
  CheckCheck,
  Droplet,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  PenLine,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

// Curated set of icons users can pick for habits, plus badge icons.
export const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  Apple,
  BookOpen,
  Brain,
  CheckCheck,
  Droplet,
  Dumbbell,
  Flame,
  Footprints,
  Heart,
  Leaf,
  Moon,
  Music,
  PenLine,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  Wallet,
}

// Icons offered in the habit creation picker.
export const HABIT_ICON_NAMES: string[] = [
  'Dumbbell',
  'Footprints',
  'BookOpen',
  'Droplet',
  'Apple',
  'Brain',
  'Moon',
  'Sun',
  'Music',
  'PenLine',
  'Heart',
  'Leaf',
  'Activity',
  'Target',
  'Wallet',
  'Sparkles',
]

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Star
}
