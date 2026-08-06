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
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <ArrowLeft size={16} className="text-[var(--text-primary)]" />
        </button>
        <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)]">
          {isBn ? titleBn : title}
        </h2>
      </div>
      <div className="bg-[var(--bg-primary)] rounded-2xl p-5">
        {children}
      </div>
    </div>
  )
}
