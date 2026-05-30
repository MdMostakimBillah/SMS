interface Props { data: number[]; color?: string; width?: number; height?: number; padding?: number }

export default function MiniLineChart({ data, color = 'var(--primary-dark)', width = 200, height = 60, padding = 6 }: Props) {
  const w = Math.max(120, width)
  const h = Math.max(40, height)
  const pad = Math.max(2, padding)
  const max = Math.max(...data, 1)
  const points = data.map((d, i) => {
    const x = pad + (i * (w - 2 * pad) / Math.max(1, data.length - 1))
    const y = h - pad - (d / max) * (h - 2 * pad)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.96} />
    </svg>
  )
}
