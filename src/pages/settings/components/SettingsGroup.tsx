import type { ReactNode } from 'react'

interface Props {
  title: string
  titleBn: string
  isBn: boolean
  children: ReactNode
}

export function SettingsGroup({ title, titleBn, isBn, children }: Props) {
  return (
    <div className="mb-5 mt-4 first:mt-0">
      <h2 className="text-[0.75rem] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
        {isBn ? titleBn : title}
      </h2>
      <div className="card--premium !p-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
