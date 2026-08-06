import type { ReactNode } from 'react'

interface Props {
  title: string
  titleBn: string
  isBn: boolean
  children: ReactNode
}

export function SettingsGroup({ title, titleBn, isBn, children }: Props) {
  return (
    <div className="mb-6">
      <h2 className="text-[0.8125rem] font-semibold text-[var(--text-muted)] mb-2 px-1">
        {isBn ? titleBn : title}
      </h2>
      <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  )
}
