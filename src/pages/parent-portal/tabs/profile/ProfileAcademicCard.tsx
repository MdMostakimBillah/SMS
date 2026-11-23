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
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-[var(--brand)]" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              {isBn ? 'একাডেমিক ও প্রাতিষ্ঠানিক তথ্য' : 'Academic & Enrollment Profile'}
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
            {child.class}
          </span>
        </div>

        {/* Clean Key-Value Rows */}
        <div className="divide-y divide-[var(--border)]/40 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-[var(--text-muted)] font-normal">
              {isBn ? 'শ্রেণি ও শাখা' : 'Class & Section'}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {child.class} - {child.section}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-[var(--text-muted)] font-normal">
              {isBn ? 'শ্রেণি রোল নম্বর' : 'Class Roll No'}
            </span>
            <span className="font-bold text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
              {child.roll}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-[var(--text-muted)] font-normal">
              {isBn ? 'শিক্ষাবর্ষ / সেশন' : 'Academic Session'}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {child.academicYear}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-[var(--text-muted)] font-normal">
              {isBn ? 'ভর্তির তারিখ' : 'Admission Date'}
            </span>
            <span className="font-medium text-[var(--text-secondary)]">
              {child.admissionDate ? new Date(child.admissionDate).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB') : (isBn ? 'অনুমোদিত' : 'Active')}
            </span>
          </div>

          {child.previousSchool && (
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--text-muted)] font-normal">
                {isBn ? 'পূর্ববর্তী প্রতিষ্ঠান' : 'Previous School'}
              </span>
              <span className="font-medium text-[var(--text-secondary)] truncate max-w-[170px]" title={child.previousSchool}>
                {child.previousSchool}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Designated Class Teacher Box */}
      <div className="mt-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.6875rem] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <User size={11} className="text-[var(--brand)]" />
            <span>{isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</span>
          </span>
          <span className="text-[0.625rem] text-[var(--text-muted)] font-medium">
            {child.class} ({child.section})
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-[var(--text-primary)] truncate">
              {child.classTeacherName || (isBn ? 'নিয়োজিত শিক্ষক' : 'Assigned Teacher')}
            </p>
            <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">
              {child.classTeacherEmail || child.classTeacherPhone || (isBn ? 'শ্রেণি তত্ত্বাবধায়ক' : 'Class Supervisor')}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {child.classTeacherPhone && (
              <a
                href={`tel:${child.classTeacherPhone}`}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                title={isBn ? 'কল করুন' : 'Call'}
              >
                <Phone size={12} />
              </a>
            )}
            {child.classTeacherEmail && (
              <a
                href={`mailto:${child.classTeacherEmail}`}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
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
