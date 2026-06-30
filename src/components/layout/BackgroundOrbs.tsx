import { motion } from 'framer-motion'

// Three slowly drifting ambient orbs behind the frosted UI.
const ORBS = [
  { color: '#a78bfa', size: 340, top: '-6%', left: '-8%', delay: 0 },
  { color: '#38bdf8', size: 300, top: '38%', left: '70%', delay: 1.5 },
  { color: '#34d399', size: 260, top: '74%', left: '6%', delay: 3 },
]

export function BackgroundOrbs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className="orb"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            background: orb.color,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 20, 0],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{
            duration: 18,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
