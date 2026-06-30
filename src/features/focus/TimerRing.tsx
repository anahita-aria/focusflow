interface Props {
  progress: number // 0..1
  label: string // MM:SS
  sub: string
  color: string
}

const SIZE = 240
const STROKE = 12
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R

export function TimerRing({ progress, label, sub, color }: Props) {
  const offset = C * (1 - Math.min(1, Math.max(0, progress)))
  return (
    <div className="relative grid place-items-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.3s cubic-bezier(0.16,1,0.3,1)',
            filter: `drop-shadow(0 0 8px ${color}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-display text-5xl font-semibold tabular-nums">
          {label}
        </span>
        <span className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
          {sub}
        </span>
      </div>
    </div>
  )
}
