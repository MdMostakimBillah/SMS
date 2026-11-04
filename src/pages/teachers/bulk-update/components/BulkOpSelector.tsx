import React from 'react'
import type { BulkOp, BulkOpMeta } from './TeacherRow'

export interface BulkOpSelectorProps {
  ops: BulkOpMeta[]
  selectedOp: BulkOp
  onSelectOp: (op: BulkOp) => void
  isBn: boolean
  isMobile: boolean
}

export const BulkOpSelector = React.memo(function BulkOpSelector({
  ops,
  selectedOp,
  onSelectOp,
  isBn,
  isMobile,
}: BulkOpSelectorProps) {
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] py-[0.875rem] px-[1rem] mb-[0.75rem]">
      <div className="text-[0.75rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-[0.625rem]">
        ① {isBn ? 'কোন তথ্য পরিবর্তন করতে চান?' : 'What do you want to update?'}
      </div>
      <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-7'} gap-[0.375rem]`}>
        {ops.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelectOp(o.id)}
            className={`flex flex-col items-center gap-[0.3125rem] py-[0.625rem] px-[0.375rem] rounded-[0.625rem] border-2 ${selectedOp === o.id ? 'border-[color:var(--o-color)]' : 'border-[var(--border)]'} ${selectedOp === o.id ? 'bg-[color:var(--o-bg)]' : 'bg-[var(--bg-secondary)]'} cursor-pointer font-[inherit] transition-all duration-150`}
            style={{ '--o-color': o.color, '--o-bg': o.bg } as React.CSSProperties}
          >
            <o.Icon size={18} style={{ color: selectedOp === o.id ? o.color : undefined }} />
            <span
              className={`text-[0.625rem] ${selectedOp === o.id ? 'font-semibold' : 'font-normal'} ${selectedOp === o.id ? 'text-[color:var(--o-color)]' : 'text-[var(--text-secondary)]'} text-center leading-[1.2]`}
            >
              {isBn ? o.bn : o.en}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
})
