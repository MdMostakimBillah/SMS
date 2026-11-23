import React, { useState } from 'react'
import {
  CreditCard,
  Printer,
  Copy,
  Check,
  GraduationCap,
  Sparkles,
  Calendar,
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
  const [copiedSummary, setCopiedSummary] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(child.id).then(() => {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    })
  }

  const handleCopySummary = () => {
    const summary = `${child.nameEn} (${child.nameBn})\nID: ${child.id}\nClass: ${child.class} (Sec ${child.section}) | Roll: ${child.roll}\nSession: ${child.academicYear}\nGuardian: ${child.guardianName} (${child.guardianPhone})\nEmergency: ${child.emergencyContact}`
    navigator.clipboard.writeText(summary).then(() => {
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2000)
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs">
      {/* Decorative Brand Top Banner */}
      <div className="h-20 sm:h-24 bg-gradient-to-r from-[var(--brand)]/20 via-[var(--brand)]/10 to-transparent relative p-4 flex items-start justify-end">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6875rem] font-bold border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-2xs backdrop-blur-xs">
          <CheckCircle2 size={12} />
          {isBn ? 'নিয়মিত ও সক্রিয় শিক্ষার্থী' : 'Active Enrolled Student'}
        </span>
      </div>

      {/* Profile Details Bar */}
      <div className="px-5 pb-5 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
          {/* Avatar */}
          <div className="flex items-end gap-3.5">
            <div className="relative shrink-0">
              {child.photo ? (
                <img
                  src={child.photo}
                  alt={child.nameEn}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-[var(--surface)] shadow-md bg-[var(--bg-secondary)]"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-[var(--surface)] shadow-md bg-[var(--bg-secondary)] text-[var(--brand)] flex items-center justify-center font-bold text-2xl">
                  {child.nameEn.charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0 pt-2 sm:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate">
                  {isBn ? child.nameBn || child.nameEn : child.nameEn}
                </h2>
                {child.nameBn && child.nameEn !== child.nameBn && (
                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    ({isBn ? child.nameEn : child.nameBn})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.6875rem] font-mono font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors cursor-pointer"
                  title={isBn ? 'আইডি কপি করুন' : 'Click to copy Student ID'}
                >
                  {copiedId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  <span>ID: {child.id}</span>
                </button>

                <span className="text-xs text-[var(--text-muted)]">·</span>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section})
                </span>
                <span className="text-xs text-[var(--text-muted)]">·</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {isBn ? 'রোল:' : 'Roll:'}{' '}
                  <span className="font-bold text-[var(--text-primary)]">{child.roll}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title={isBn ? 'প্রোফাইল তথ্য কপি করুন' : 'Copy Student Profile Summary'}
            >
              {copiedSummary ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copiedSummary ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'তথ্য কপি' : 'Copy')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title={isBn ? 'প্রোফাইল প্রিন্ট করুন' : 'Print Student Profile'}
            >
              <Printer size={14} />
              <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenIdCard}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand)] text-white hover:opacity-90 text-xs font-semibold shadow-xs transition-opacity cursor-pointer border-none"
              title={isBn ? 'ডিজিটাল আইডি কার্ড দেখুন' : 'View Digital ID Card'}
            >
              <CreditCard size={14} />
              <span>{isBn ? 'ডিজিটাল আইডি কার্ড' : 'Digital ID Card'}</span>
            </button>
          </div>
        </div>

        {/* Highlight Metadata Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[var(--border)] text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium">
            <GraduationCap size={13} className="text-[var(--text-muted)]" />
            <span>{isBn ? 'শ্রেণি:' : 'Class:'} {child.class} - {child.section}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium">
            <Calendar size={13} className="text-[var(--text-muted)]" />
            <span>{isBn ? 'শিক্ষাবর্ষ:' : 'Session:'} {child.academicYear}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
            <span>🩸 {isBn ? 'রক্তের গ্রুপ:' : 'Blood:'} {child.bloodGroup || '—'}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium">
            <Sparkles size={13} className="text-[var(--text-muted)]" />
            <span>{isBn ? 'লিঙ্গ:' : 'Gender:'} {child.gender || '—'}</span>
          </span>
        </div>
      </div>
    </div>
  )
})
