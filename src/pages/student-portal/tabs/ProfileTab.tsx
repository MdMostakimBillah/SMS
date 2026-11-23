import React, { useState } from 'react'
import {
  User,
  GraduationCap,
  Users,
  IdCard,
  Copy,
  Check,
} from 'lucide-react'
import type { StudentProfile } from '../types'

interface ProfileTabProps {
  student: StudentProfile
  onOpenIdCard: () => void
  isBn: boolean
}

export const ProfileTab = React.memo(function ProfileTab({
  student,
  onOpenIdCard,
  isBn,
}: ProfileTabProps) {
  const [copiedId, setCopiedId] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(student.id).then(() => {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    })
  }
  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.nameEn}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[var(--border)] bg-[var(--bg-secondary)]"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--brand)] flex items-center justify-center font-bold text-2xl">
              {student.nameEn.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
              {isBn ? student.nameBn || student.nameEn : student.nameEn}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {isBn ? 'শ্রেণি:' : 'Class:'} <strong className="text-[var(--text-primary)]">{student.class}</strong> •{' '}
              {isBn ? 'শাখা:' : 'Sec:'} <strong className="text-[var(--text-primary)]">{student.section || 'A'}</strong> •{' '}
              {isBn ? 'রোল:' : 'Roll:'} <strong className="text-[var(--text-primary)]">{student.roll}</strong>
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1 text-[0.6875rem] font-mono bg-[var(--bg-secondary)] hover:bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)] text-[var(--brand)] cursor-pointer transition-colors"
                title={isBn ? 'আইডি কপি করুন' : 'Click to copy ID'}
              >
                <span>ID: {student.id}</span>
                {copiedId ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} className="text-[var(--text-muted)]" />}
              </button>
              {student.bloodGroup && (
                <span className="text-[0.6875rem] px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-600 font-semibold border border-rose-200 dark:border-rose-900/40">
                  {student.bloodGroup}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenIdCard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-semibold hover:opacity-90 self-start sm:self-auto cursor-pointer"
        >
          <IdCard size={15} />
          <span>{isBn ? 'ডিজিটাল আইডি কার্ড' : 'Digital ID Card'}</span>
        </button>
      </div>

      {/* Grid: 3 Clean Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Academic Details */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] mb-3">
            <GraduationCap size={16} className="text-[var(--brand)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {isBn ? 'একাডেমিক তথ্য' : 'Academic Record'}
            </h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'শ্রেণি ও শাখা' : 'Class & Section'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.class} - {student.section || 'A'}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'রোল নম্বর' : 'Roll Number'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.roll}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'শিক্ষাবর্ষ / সেশন' : 'Academic Session'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.academicYear || '2025-26'}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.classTeacherName || (isBn ? 'নির্ধারিত নয়' : 'Not assigned')}</span>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] mb-3">
            <User size={16} className="text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {isBn ? 'ব্যক্তিগত তথ্য' : 'Personal Details'}
            </h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.dob || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'লিঙ্গ' : 'Gender'}</span>
              <span className="font-semibold text-[var(--text-primary)] capitalize">{student.gender || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'ধর্ম' : 'Religion'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.religion || 'Islam'}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'জাতীয়তা' : 'Nationality'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.nationality || 'Bangladeshi'}</span>
            </div>
          </div>
        </div>

        {/* Guardian & Contact */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] mb-3">
            <Users size={16} className="text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {isBn ? 'অভিভাবক ও যোগাযোগ' : 'Guardian & Contact'}
            </h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'পিতার নাম' : "Father's Name"}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.fatherName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'মাতার নাম' : "Mother's Name"}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.motherName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'অভিভাবক ও ফোন' : 'Guardian Phone'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{student.guardianPhone || student.fatherPhone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)] block text-[0.6875rem]">{isBn ? 'ঠিকানা' : 'Present Address'}</span>
              <span className="font-semibold text-[var(--text-primary)] line-clamp-1">{student.presentAddress || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
