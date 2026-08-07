import type { ReactNode } from 'react'

interface Props {
  title: string
  titleBn: string
  isBn: boolean
  children: ReactNode
}

export function SettingsGroup({ title, titleBn, isBn, children }: Props) {
  return (
    <div className="mb-6 mt-4">
      <h2 className="text-[0.8125rem] font-bold text-[var(--text-primary)] mb-2.5 px-1">
        {isBn ? titleBn : title}
      </h2>
      <div className="bg-[var(--bg-primary)] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        {children}
      </div>
    </div>
  )
}
