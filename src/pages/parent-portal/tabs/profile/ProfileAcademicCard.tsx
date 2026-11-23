import React from 'react'
import {
  GraduationCap,
  Calendar,
  Hash,
  Award,
  Phone,
  Mail,
  School,
  Star,
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
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'একাডেমিক ও প্রাতিষ্ঠানিক তথ্য' : 'Academic & Enrollment Profile'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'শ্রেণি, রোল ও শিক্ষক তথ্য' : 'Class, roll & teacher credentials'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[0.625rem] font-bold rounded-md bg-[var(--brand)]/10 text-[var(--brand)]">
            {child.class}
          </span>
        </div>

        {/* Info Rows */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]/60">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5">
              <GraduationCap size={13} className="text-[var(--text-muted)]" />
              <span>{isBn ? 'শ্রেণি ও শাখা' : 'Class & Section'}</span>
            </span>
            <span className="font-bold text-[var(--text-primary)]">
              {child.class} - {child.section}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]/60">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5">
              <Hash size={13} className="text-[var(--text-muted)]" />
              <span>{isBn ? 'শ্রেণি রোল নম্বর' : 'Class Roll No'}</span>
            </span>
            <span className="font-bold text-[var(--text-primary)] px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)]">
              {child.roll}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]/60">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5">
              <Calendar size={13} className="text-[var(--text-muted)]" />
              <span>{isBn ? 'শিক্ষাবর্ষ / সেশন' : 'Academic Session'}</span>
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {child.academicYear}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]/60">
            <span className="text-[var(--text-muted)] flex items-center gap-1.5">
              <Award size={13} className="text-[var(--text-muted)]" />
              <span>{isBn ? 'ভর্তির তারিখ' : 'Admission Date'}</span>
            </span>
            <span className="font-semibold text-[var(--text-secondary)]">
              {child.admissionDate ? new Date(child.admissionDate).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB') : (isBn ? 'অনুমোদিত' : 'Active')}
            </span>
          </div>

          {child.previousSchool && (
            <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]/60">
              <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                <School size={13} className="text-[var(--text-muted)]" />
                <span>{isBn ? 'পূর্ববর্তী শিক্ষাপ্রতিষ্ঠান' : 'Previous School'}</span>
              </span>
              <span className="font-semibold text-[var(--text-secondary)] truncate max-w-[180px]">
                {child.previousSchool}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Class Teacher Highlight Box */}
      <div className="mt-4 p-3.5 rounded-xl border border-[var(--brand)]/40 bg-[var(--bg-secondary)]/50 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Star size={13} className="text-[var(--brand)] fill-[var(--brand)]" />
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {isBn ? 'শ্রেণি শিক্ষক' : 'Designated Class Teacher'}
            </span>
          </div>
          <span className="text-[0.625rem] font-semibold text-[var(--brand)]">
            {child.class} ({child.section})
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {child.classTeacherName || (isBn ? 'নিয়োজিত শিক্ষক' : 'Assigned Teacher')}
            </p>
            <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">
              {child.classTeacherEmail || child.classTeacherPhone || (isBn ? 'শ্রেণি তত্ত্বাবধায়ক' : 'Class Supervisor')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {child.classTeacherPhone && (
              <a
                href={`tel:${child.classTeacherPhone}`}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
                title={isBn ? 'কল করুন' : 'Call'}
              >
                <Phone size={13} />
              </a>
            )}
            {child.classTeacherEmail && (
              <a
                href={`mailto:${child.classTeacherEmail}`}
                className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors"
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
