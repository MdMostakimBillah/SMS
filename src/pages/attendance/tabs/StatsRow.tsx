import type { ReactNode } from 'react'

interface StatsRowProps {
  stats: {
    label: string
    value: number
    icon: ReactNode
    color: string
  }[]
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5 mb-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] hover:shadow-md transition-all"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${s.color}15`, color: s.color }}
          >
            {s.icon}
          </div>
          <div>
            <div className="text-[1rem] font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[0.625rem] text-[var(--text-muted)]">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
