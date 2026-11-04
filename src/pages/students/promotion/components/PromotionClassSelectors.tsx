import React from 'react'
import { Info } from 'lucide-react'

interface Props {
  isBn: boolean
  sessions: string[]
  currentSession: string
  fSession: string
  fromClass: string
  fromSection: string
  toClass: string
  toSection: string
  newSession: string
  classOptions: string[]
  sectionsMap: Record<string, string[]>
  toClassOptions: string[]
  toSectionsMap: Record<string, string[]>
  onFSessionChange: (v: string) => void
  onFromClassChange: (v: string) => void
  onFromSectionChange: (v: string) => void
  onToClassChange: (v: string) => void
  onToSectionChange: (v: string) => void
  onNewSessionChange: (v: string) => void
}

export const PromotionClassSelectors: React.FC<Props> = React.memo(function PromotionClassSelectors({
  isBn,
  sessions,
  currentSession,
  fSession,
  fromClass,
  fromSection,
  toClass,
  toSection,
  newSession,
  classOptions,
  sectionsMap,
  toClassOptions,
  toSectionsMap,
  onFSessionChange,
  onFromClassChange,
  onFromSectionChange,
  onToClassChange,
  onToSectionChange,
  onNewSessionChange,
}) {
  const fromSectionOptions = (
    sectionsMap[fromClass] || classOptions.flatMap((c) => sectionsMap[c] || [])
  ).filter((s, i, a) => a.indexOf(s) === i)

  const toSectionOptions = (
    toSectionsMap[toClass] || toClassOptions.flatMap((c) => toSectionsMap[c] || [])
  ).filter((s, i, a) => a.indexOf(s) === i)

  return (
    <div className="flex flex-col gap-[0.75rem]">
      {/* 1. From Class Box */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.75rem] p-[0.875rem]">
        <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-[0.625rem]">
          ① {isBn ? 'বর্তমান শ্রেণি' : 'From Class'}
        </div>
        <div className="flex flex-col gap-[0.5rem] mb-[0.625rem]">
          <div>
            <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">
              {isBn ? 'সেশন' : 'Session'}
            </label>
            <select
              value={fSession}
              onChange={(e) => onFSessionChange(e.target.value)}
              className="w-full py-[0.4375rem] px-[0.625rem] rounded-lg border border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)] text-xs font-[inherit] outline-none cursor-pointer font-medium"
            >
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s} {s === currentSession ? (isBn ? '(বর্তমান)' : '(Current)') : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-[0.5rem]">
          <div>
            <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">
              {isBn ? 'শ্রেণি' : 'Class'}
            </label>
            <select
              value={fromClass}
              onChange={(e) => onFromClassChange(e.target.value)}
              className="w-full py-[0.4375rem] px-[0.625rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer"
            >
              <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">
              {isBn ? 'সেকশন' : 'Section'}
            </label>
            <select
              value={fromSection}
              onChange={(e) => onFromSectionChange(e.target.value)}
              className="w-full py-[0.4375rem] px-[0.625rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer"
            >
              <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
              {fromSectionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Target Class Box */}
      <div className="bg-[var(--bg-primary)] border border-[var(--brand)] rounded-[0.75rem] p-[0.875rem]">
        <div className="text-[0.6875rem] font-semibold text-[var(--brand)] uppercase tracking-[0.0313rem] mb-[0.625rem]">
          ② {isBn ? 'লক্ষ্য শ্রেণি' : 'To Class'}
        </div>
        <div className="flex flex-col gap-[0.5rem]">
          <div>
            <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">
              {isBn ? 'শ্রেণি' : 'Class'} <span className="text-[var(--red)]">*</span>
            </label>
            <select
              value={toClass}
              onChange={(e) => onToClassChange(e.target.value)}
              className={`w-full py-[0.4375rem] px-[0.625rem] rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer ${
                toClass ? 'border-[var(--brand)]' : 'border-[var(--border)]'
              }`}
            >
              <option value="">{isBn ? 'বেছে নিন' : 'Select'}</option>
              {toClassOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">
              {isBn ? 'সেকশন' : 'Section'}
            </label>
            <select
              value={toSection}
              onChange={(e) => onToSectionChange(e.target.value)}
              className="w-full py-[0.4375rem] px-[0.625rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer"
            >
              <option value="">{isBn ? 'একই সেকশন' : 'Same Section'}</option>
              {toSectionOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[0.6875rem] text-[var(--text-secondary)] mb-[0.25rem] block">
              {isBn ? 'নতুন সেশন' : 'New Session'} <span className="text-[var(--red)]">*</span>
            </label>
            <select
              value={newSession}
              onChange={(e) => onNewSessionChange(e.target.value)}
              className={`w-full py-[0.4375rem] px-[0.625rem] rounded-lg border bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none cursor-pointer ${
                newSession ? 'border-[var(--brand)]' : 'border-[var(--border)]'
              }`}
            >
              <option value="">{isBn ? 'বেছে নিন' : 'Select'}</option>
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s} {s === currentSession ? (isBn ? '(বর্তমান)' : '(Current)') : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Info Card */}
      <div className="bg-[var(--brand-light)] border border-[var(--brand)] rounded-[0.75rem] p-[0.875rem]">
        <div className="flex items-center gap-[0.5rem] mb-[0.375rem]">
          <Info size={14} className="text-[var(--brand)]" />
          <span className="text-[0.6875rem] font-semibold text-[var(--brand)]">
            {isBn ? 'প্রমোশন পদ্ধতি' : 'Promotion Method'}
          </span>
        </div>
        <p className="text-[0.6875rem] text-[var(--brand)] leading-[1.5]">
          {isBn
            ? 'ছাত্রদের ডেটা কপি করা হবে। পূর্ববর্তী সেশনের সকল তথ্য (শ্রেণি, রুটিন, পরীক্ষা, উপস্থিতি) অক্ষুণ্ণ থাকবে। নতুন সেশনে ছাত্র নতুন আইডিসহ যুক্ত হবে।'
            : 'Student data will be copied. Previous session data (class, routine, exams, attendance) remains intact. Student is added to new session with a new ID.'}
        </p>
      </div>
    </div>
  )
})
