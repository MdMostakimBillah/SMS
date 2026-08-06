import type { ReactNode } from 'react'

interface Props {
  title: string
  titleBn: string
  isBn: boolean
  children: ReactNode
}

export function SettingsGroup({ title, titleBn, isBn, children }: Props) {
  return (
    <div className="mb-5">
      <h2 className="text-[0.875rem] font-bold text-[var(--text-primary)] mb-2.5 px-1">
        {isBn ? titleBn : title}
      </h2>
      <div className="bg-[var(--bg-primary)] rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  )
}
