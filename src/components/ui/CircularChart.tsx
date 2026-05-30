import React from 'react'

interface Props {
  value: number // 0-100
  size?: number
  stroke?: number
  color?: string
}

export default function CircularChart({ value, size = 72, stroke = 8, color = 'var(--primary)' }: Props) {
  const radius = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, value))
  const dash = `${(circumference * pct) / 100} ${circumference}`

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="grad-circ" x1="0%" x2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* background ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="var(--bg-secondary)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />

      {/* progress ring */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke="url(#grad-circ)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={dash}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 600ms cubic-bezier(.2,.9,.22,1)' }}
      />

      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" style={{ fontSize: Math.max(12, size * 0.22), fontWeight: 700, fill: 'var(--text-strong)' }}>
        {Math.round(pct)}%
      </text>
    </svg>
  )
}
