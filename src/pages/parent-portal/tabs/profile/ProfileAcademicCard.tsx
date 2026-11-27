import React from 'react'
import {
  Phone,
  Mail,
} from 'lucide-react'
import type { PortalChild } from '../../types'

interface ProfileAcademicCardProps {
  child: PortalChild
  isBn: boolean
}

export const ProfileAcademicCard = React.memo(function ProfileAcademicCard({
  child,
  isBn,
}: ProfileAcademicCardProps) {
  return (
    <div className="card--premium bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              style={{
                width: '0.1875rem',
                height: '0.875rem',
                background: 'var(--purple)',
                borderRadius: '0.125rem',
                flexShrink: 0,
              }}
            />
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {isBn ? 'একাডেমিক ও প্রাতিষ্ঠানিক তথ্য' : 'Academic & Enrollment Profile'}
            </h3>
          </div>
          <span className="text-xs font-semibold text-[var(--brand)] shrink-0">
            {child.class}
          </span>
        </div>

        <div className="divide-y divide-[var(--border)] text-xs">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-secondary)]">
              {isBn ? 'শ্রেণি ও শাখা' : 'Class & Section'}
            </span>
            <span className="font-medium text-[var(--text-primary)]">
              {child.class} · {child.section || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-secondary)]">
              {isBn ? 'শ্রেণি রোল নম্বর' : 'Class Roll No'}
            </span>
            <span className="font-semibold text-[var(--text-primary)] tabular-nums">
              {child.roll || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-secondary)]">
              {isBn ? 'শিক্ষাবর্ষ / সেশন' : 'Academic Session'}
            </span>
            <span className="font-medium text-[var(--text-primary)]">
              {child.academicYear || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-secondary)]">
              {isBn ? 'ভর্তির তারিখ' : 'Admission Date'}
            </span>
            <span className="font-medium text-[var(--text-primary)]">
              {child.admissionDate
                ? new Date(child.admissionDate).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB')
                : isBn ? 'অনুমোদিত' : 'Active'}
            </span>
          </div>

          {child.previousSchool && (
            <div className="flex items-center justify-between py-2.5 gap-2">
              <span className="text-[var(--text-secondary)] shrink-0">
                {isBn ? 'পূর্ববর্তী প্রতিষ্ঠান' : 'Previous School'}
              </span>
              <span className="font-medium text-[var(--text-primary)] truncate max-w-[170px]" title={child.previousSchool}>
                {child.previousSchool}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Designated Class Teacher Strip */}
      <div className="mt-4 p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
            {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
          </span>
          <span className="text-[0.6875rem] text-[var(--text-muted)]">
            {child.class} ({child.section || '—'})
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">
              {child.classTeacherName || (isBn ? 'নির্ধারিত নয়' : 'Not assigned yet')}
            </p>
            <p className="text-[0.6875rem] text-[var(--text-secondary)] truncate mt-0.5">
              {child.classTeacherEmail || child.classTeacherPhone || (isBn ? 'শ্রেণি তত্ত্বাবধায়ক' : 'Class Supervisor')}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {child.classTeacherPhone && (
              <a
                href={`tel:${child.classTeacherPhone}`}
                className="w-7 h-7 rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] flex items-center justify-center transition-colors"
                title={isBn ? 'কল করুন' : 'Call'}
              >
                <Phone size={12} />
              </a>
            )}
            {child.classTeacherEmail && (
              <a
                href={`mailto:${child.classTeacherEmail}`}
                className="w-7 h-7 rounded-lg bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--brand)] flex items-center justify-center transition-colors"
                title={isBn ? 'ইমেইল পাঠান' : 'Send Email'}
              >
                <Mail size={12} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
