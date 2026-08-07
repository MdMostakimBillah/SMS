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
    <div className="fade-up">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors duration-150"
        >
          <ArrowLeft size={16} className="text-[var(--text-primary)]" />
        </button>
        <h2 className="text-[1.25rem] font-bold text-[var(--text-primary)] tracking-tight">
          {isBn ? titleBn : title}
        </h2>
      </div>
      <div className="card--premium !p-5">
        {children}
      </div>
    </div>
  )
}
