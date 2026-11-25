import React from 'react'
import {
  GraduationCap,
  Phone,
  Mail,
  User,
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
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border)] mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center shrink-0">
              <GraduationCap size={16} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {isBn ? 'একাডেমিক ও প্রাতিষ্ঠানিক তথ্য' : 'Academic & Enrollment Profile'}
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] shrink-0">
            {child.class}
          </span>
        </div>

        {/* Clean Key-Value Rows */}
        <div className="divide-y divide-[var(--border)] text-xs">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-secondary)]">
              {isBn ? 'শ্রেণি ও শাখা' : 'Class & Section'}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {child.class} - {child.section || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-secondary)]">
              {isBn ? 'শ্রেণি রোল নম্বর' : 'Class Roll No'}
            </span>
            <span className="font-bold text-[var(--text-primary)] px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] tabular-nums">
              {child.roll || '—'}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-[var(--text-secondary)]">
              {isBn ? 'শিক্ষাবর্ষ / সেশন' : 'Academic Session'}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
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

      {/* Designated Class Teacher Box */}
      <div className="mt-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
            <User size={11} className="text-[var(--brand)]" />
            <span>{isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</span>
          </span>
          <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
            {child.class} ({child.section || '—'})
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-[var(--text-primary)] truncate">
              {child.classTeacherName || (isBn ? 'নির্ধারিত নয়' : 'Not assigned yet')}
            </p>
            <p className="text-[0.6875rem] text-[var(--text-secondary)] truncate mt-0.5">
              {child.classTeacherEmail || child.classTeacherPhone || (isBn ? 'শ্রেণি তত্ত্বাবধায়ক' : 'Class Supervisor')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {child.classTeacherPhone && (
              <a
                href={`tel:${child.classTeacherPhone}`}
                className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] flex items-center justify-center transition-colors"
                title={isBn ? 'কল করুন' : 'Call'}
              >
                <Phone size={13} />
              </a>
            )}
            {child.classTeacherEmail && (
              <a
                href={`mailto:${child.classTeacherEmail}`}
                className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] flex items-center justify-center transition-colors"
                title={isBn ? 'ইমেইল পাঠান' : 'Send Email'}
              >
                <Mail size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
