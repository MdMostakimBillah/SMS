import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  titleBn: string
  isBn: boolean
  onBack: () => void
  children: ReactNode
}

export function SettingsPanel({ title, titleBn, isBn, onBack, children }: Props) {
  return (
    <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer hover:bg-[var(--brand-light)] transition-colors"
        >
          <ArrowLeft size={16} className="text-[var(--text-primary)]" />
        </button>
        <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
          {isBn ? titleBn : title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
