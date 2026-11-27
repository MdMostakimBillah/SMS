import React, { useState } from 'react'
import {
  CreditCard,
  Printer,
  Copy,
  Check,
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
    navigator.clipboard?.writeText(child.id).then(() => {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="card--premium bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Avatar + Primary Student Details */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            {child.photo ? (
              <img
                src={child.photo}
                alt={child.nameEn}
                className="w-16 h-16 rounded-2xl object-cover bg-slate-100 dark:bg-white/[0.06] border border-[var(--border)] shadow-2xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xl border border-[var(--border)] shadow-2xs">
                {(child.nameEn || 'S').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] truncate">
                {isBn ? child.nameBn || child.nameEn : child.nameEn}
              </h2>
              {child.nameBn && child.nameEn !== child.nameBn && (
                <span className="text-xs text-[var(--text-muted)]">
                  ({isBn ? child.nameEn : child.nameBn})
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6875rem] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{isBn ? 'নিয়মিত ও সক্রিয় শিক্ষার্থী' : 'Active Enrolled Student'}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                  {isBn ? 'শ্রেণি:' : 'Class:'}
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {child.class || '—'}
                  {child.section ? ` · ${isBn ? 'শাখা' : 'Sec'} ${child.section}` : ''}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                  {isBn ? 'রোল:' : 'Roll:'}
                </span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {child.roll || '—'}
                </span>
              </div>

              {child.academicYear && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                  <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                    {isBn ? 'সেশন:' : 'Session:'}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {child.academicYear}
                  </span>
                </div>
              )}

              {child.bloodGroup && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                  <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                    {isBn ? 'রক্তের গ্রুপ:' : 'Blood:'}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {child.bloodGroup}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--brand)] transition-colors cursor-pointer"
                title={isBn ? 'আইডি কপি করুন' : 'Click to copy Student ID'}
              >
                <span>ID: {child.id}</span>
                {copiedId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="text-[var(--text-muted)]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="h-8 flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-100/70 dark:hover:bg-white/[0.05] text-xs font-medium transition-colors cursor-pointer"
            title={isBn ? 'প্রোফাইল প্রিন্ট করুন' : 'Print Profile'}
          >
            <Printer size={13} />
            <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenIdCard}
            className="h-8 flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 rounded-lg bg-[var(--brand)] hover:opacity-90 text-white text-xs font-semibold transition-opacity cursor-pointer border-none shadow-xs"
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
