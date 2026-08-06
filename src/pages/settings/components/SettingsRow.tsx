import { ChevronRight } from 'lucide-react'
import type { SettingItem } from '../types'

interface Props {
  item: SettingItem
  isBn: boolean
  onClick: () => void
  isLast?: boolean
}

export function SettingsRow({ item, isBn, onClick, isLast }: Props) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer bg-transparent border-none text-left transition-colors hover:bg-[var(--bg-secondary)] ${
        !isLast ? 'border-b border-[var(--border)]' : ''
      }`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: item.iconBg, color: item.iconColor }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
          {isBn ? item.titleBn : item.title}
        </div>
        <div className="text-[0.75rem] text-[var(--text-muted)] mt-0.5 leading-snug">
          {isBn ? item.descriptionBn : item.description}
        </div>
      </div>
      <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0" />
    </button>
  )
}
