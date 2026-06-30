import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Coins, Gift, Plus, Shield, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStore, STREAK_FREEZE_COST } from '@/store/useStore'
import { LevelCard } from './LevelCard'
import { BadgesGrid } from './BadgesGrid'

export function RewardsView() {
  const rewards = useStore((s) => s.rewards)
  const coins = useStore((s) => s.gamification.coins)
  const freezes = useStore((s) => s.gamification.streakFreezes)
  const addReward = useStore((s) => s.addReward)
  const deleteReward = useStore((s) => s.deleteReward)
  const redeemReward = useStore((s) => s.redeemReward)
  const buyStreakFreeze = useStore((s) => s.buyStreakFreeze)

  const [label, setLabel] = useState('')
  const [cost, setCost] = useState('50')

  const add = async () => {
    const c = Number(cost)
    if (!label.trim() || !Number.isFinite(c) || c <= 0) return
    await addReward({ label: label.trim(), cost: Math.round(c) })
    setLabel('')
    setCost('50')
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold">Rewards</h1>

      <LevelCard />

      {/* Streak freeze */}
      <div className="glass flex items-center justify-between rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-sky/15 text-sky">
            <Shield className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">Streak Freeze</p>
            <p className="text-xs text-muted-foreground">
              Owned: {freezes} · Protects a streak for one missed day
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void buyStreakFreeze()}
          disabled={coins < STREAK_FREEZE_COST}
          className="cursor-pointer gap-1"
        >
          <Coins className="size-3.5 text-amber" /> {STREAK_FREEZE_COST}
        </Button>
      </div>

      {/* Rewards shop */}
      <div className="glass space-y-3 rounded-2xl p-4">
        <p className="flex items-center gap-2 font-heading text-sm font-semibold">
          <Gift className="size-4 text-violet" /> Your reward shop
        </p>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {rewards.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{r.label}</p>
                  <p className="flex items-center gap-1 text-xs text-amber">
                    <Coins className="size-3" /> {r.cost}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => void redeemReward(r.id)}
                  disabled={coins < r.cost}
                  className="h-8 cursor-pointer"
                >
                  Redeem
                </Button>
                <button
                  type="button"
                  onClick={() => void deleteReward(r.id)}
                  aria-label="Delete reward"
                  className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:text-coral"
                >
                  <Trash2 className="size-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {rewards.length === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No rewards yet — define something you'll look forward to.
            </p>
          )}
        </div>

        {/* Add reward */}
        <div className="flex gap-2 border-t border-white/5 pt-3">
          <Input
            placeholder="e.g. 1 hour of gaming"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void add()
            }}
            className="flex-1"
          />
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-20 text-center"
            aria-label="Cost in coins"
          />
          <Button
            onClick={() => void add()}
            disabled={!label.trim()}
            className="cursor-pointer"
            aria-label="Add reward"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <BadgesGrid />
    </div>
  )
}
