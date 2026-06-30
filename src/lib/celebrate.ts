import confetti from 'canvas-confetti'

const ACCENTS = ['#a78bfa', '#34d399', '#fbbf24', '#f87171', '#38bdf8']

function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  )
}

// A quick burst — used for habit checks / task completion.
export function celebrateBurst(): void {
  if (reducedMotion()) return
  confetti({
    particleCount: 60,
    spread: 70,
    startVelocity: 35,
    origin: { y: 0.7 },
    colors: ACCENTS,
    scalar: 0.9,
    disableForReducedMotion: true,
  })
}

// A bigger two-sided celebration — used for level-ups and badges.
export function celebrateBig(): void {
  if (reducedMotion()) return
  const defaults = {
    colors: ACCENTS,
    disableForReducedMotion: true,
  }
  confetti({
    ...defaults,
    particleCount: 120,
    spread: 100,
    origin: { x: 0.2, y: 0.6 },
    angle: 60,
  })
  confetti({
    ...defaults,
    particleCount: 120,
    spread: 100,
    origin: { x: 0.8, y: 0.6 },
    angle: 120,
  })
}
