import React from 'react'
import { ArrowLeft, ArrowUpCircle, Check } from 'lucide-react'

interface Props {
  isBn: boolean
  isMobile: boolean
  fSession: string
  selectedCount: number
  canPromote: boolean
  isPromoting: boolean
  promoted: boolean
  promotedCount: number
  onBack: () => void
  onPromote: () => void
}

export const PromotionHeader: React.FC<Props> = React.memo(function PromotionHeader({
  isBn,
  isMobile,
  fSession,
  selectedCount,
  canPromote,
  isPromoting,
  promoted,
  promotedCount,
  onBack,
  onPromote,
}) {
  return (
    <div className="flex items-center gap-[0.625rem] mb-[1.125rem] flex-wrap">
      <button
        onClick={onBack}
        type="button"
        className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-[0.75rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit] shrink-0 hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={14} />
        {isBn ? 'ফিরে যান' : 'Back'}
      </button>

      <div className="flex-1 min-w-[12rem]">
        <h1
          className={`font-semibold text-[var(--text-primary)] tracking-tight ${
            isMobile ? 'text-[1.125rem]' : 'text-[1.375rem]'
          }`}
        >
          {isBn ? 'ক্লাস প্রমোশন' : 'Class Promotion'}
        </h1>
        <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
          {isBn
            ? `${fSession} থেকে পরবর্তী সেশনে ছাত্রদের প্রমোট করুন`
            : `Promote students from ${fSession} to next session`}
        </p>
      </div>

      {canPromote && (
        <button
          onClick={onPromote}
          disabled={isPromoting || selectedCount === 0}
          type="button"
          className={`flex items-center gap-[0.375rem] py-[0.5625rem] px-[1.125rem] rounded-[0.5625rem] border-none text-white text-[0.8125rem] font-semibold font-[inherit] shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all ${
            isPromoting || selectedCount === 0
              ? 'opacity-50 cursor-not-allowed bg-[var(--brand)]'
              : promoted
              ? 'bg-[var(--green)] cursor-default'
              : 'bg-[var(--brand)] hover:brightness-110 active:scale-[0.98] cursor-pointer'
          }`}
        >
          {promoted ? <Check size={14} /> : <ArrowUpCircle size={14} />}
          {isPromoting
            ? isBn
              ? 'প্রমোশন হচ্ছে...'
              : 'Promoting...'
            : promoted
            ? isBn
              ? `✓ ${promotedCount} জন প্রমোট হয়েছে!`
              : `✓ ${promotedCount} Promoted!`
            : isBn
            ? `${selectedCount} জন প্রমোট করুন`
            : `Promote ${selectedCount}`}
        </button>
      )}
    </div>
  )
})
