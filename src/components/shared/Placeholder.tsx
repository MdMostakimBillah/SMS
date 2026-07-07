interface PlaceholderProps {
  title: string
  icon: React.ReactNode
  color: string
  isBn: boolean
}

export function Placeholder({ title, icon, color, isBn }: PlaceholderProps) {
  return (
    <div className="anim-card flex flex-col items-center justify-center py-20 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${color}12`, color }}>{icon}</div>
      <div className="text-[1rem] font-semibold text-[var(--text-primary)] mb-1">{title}</div>
      <div className="text-[0.8125rem] text-[var(--text-muted)]">{isBn ? 'শীঘ্রই আসছে' : 'Coming soon'}</div>
    </div>
  )
}
