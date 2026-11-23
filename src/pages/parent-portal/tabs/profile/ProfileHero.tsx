import React, { useState } from 'react'
import {
  CreditCard,
  Printer,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react'
import type { PortalChild } from '../../types'

interface ProfileHeroProps {
  child: PortalChild
  onOpenIdCard: () => void
  isBn: boolean
}

export const ProfileHero = React.memo(function ProfileHero({
  child,
  onOpenIdCard,
  isBn,
}: ProfileHeroProps) {
  const [copiedId, setCopiedId] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(child.id).then(() => {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Avatar + Primary Student Details */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            {child.photo ? (
              <img
                src={child.photo}
                alt={child.nameEn}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border border-[var(--border)] bg-[var(--bg-secondary)]"
              />
            ) : (
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--brand)] flex items-center justify-center font-bold text-xl sm:text-2xl">
                {child.nameEn.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                {isBn ? child.nameBn || child.nameEn : child.nameEn}
              </h2>
              {child.nameBn && child.nameEn !== child.nameBn && (
                <span className="text-xs text-[var(--text-muted)] font-normal">
                  ({isBn ? child.nameEn : child.nameBn})
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.6875rem] font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={11} />
                <span>{isBn ? 'নিয়মিত ও সক্রিয় শিক্ষার্থী' : 'Active Enrolled Student'}</span>
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[var(--text-primary)]">
                {child.class} · {isBn ? 'শাখা' : 'Sec'} {child.section}
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span>
                {isBn ? 'রোল:' : 'Roll:'}{' '}
                <strong className="text-[var(--text-primary)] font-semibold">{child.roll}</strong>
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6875rem] font-mono text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer bg-transparent border-none p-0"
                title={isBn ? 'আইডি কপি করুন' : 'Click to copy Student ID'}
              >
                <span>ID: {child.id}</span>
                {copiedId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto pt-3 border-t border-[var(--border)]/70 sm:border-t-0 sm:pt-0 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] text-xs font-medium transition-colors cursor-pointer"
            title={isBn ? 'প্রোফাইল প্রিন্ট করুন' : 'Print Profile'}
          >
            <Printer size={13} />
            <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenIdCard}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg bg-[var(--brand)] text-white hover:opacity-90 text-xs font-medium transition-opacity cursor-pointer border-none shadow-2xs"
            title={isBn ? 'ডিজিটাল আইডি কার্ড দেখুন' : 'View Digital ID Card'}
          >
            <CreditCard size={13} />
            <span>{isBn ? 'ডিজিটাল আইডি কার্ড' : 'Digital ID Card'}</span>
          </button>
        </div>
      </div>
    </div>
  )
})
