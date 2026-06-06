import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  text: string
  textBn?: string
  isBn?: boolean
}

export function EmptyState({ icon, text, textBn, isBn }: EmptyStateProps) {
  return (
    <div className="text-center py-10">
      <div className="mb-2 opacity-20 text-[var(--text-muted)]">{icon}</div>
      <p className="text-[0.8125rem] text-[var(--text-muted)]">
        {isBn && textBn ? textBn : text}
      </p>
    </div>
  )
}
