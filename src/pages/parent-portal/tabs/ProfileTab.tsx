import React from 'react'
import { Award, Shield, MapPin, Heart, CreditCard } from 'lucide-react'
import type { PortalChild } from '../types'

interface ProfileTabProps {
  child: PortalChild
  onOpenIdCard: () => void
  isBn: boolean
}

export const ProfileTab = React.memo(function ProfileTab({
  child,
  onOpenIdCard,
  isBn,
}: ProfileTabProps) {
  return (
    <div className="space-y-4">
      {/* Top Profile Hero Card */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {child.photo ? (
            <img
              src={child.photo}
              alt={child.nameEn}
              className="w-20 h-20 rounded-xl object-cover border border-[var(--border)]"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xl">
              {child.nameEn.charAt(0)}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)]">
                  {isBn ? child.nameBn : child.nameEn}
                </h2>
                <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">
                  {child.class} · {isBn ? 'শাখা' : 'Sec'} {child.section} · {isBn ? 'রোল নং:' : 'Roll No:'}{' '}
                  <span className="font-semibold text-[var(--text-primary)]">{child.roll}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenIdCard}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--brand)] hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-opacity flex items-center justify-center gap-1.5 self-center sm:self-auto cursor-pointer border-none"
              >
                <CreditCard size={14} />
                <span>{isBn ? 'ডিজিটাল আইডি কার্ড' : 'Digital ID Card'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <span className="px-2.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] font-medium">
                {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section})
              </span>
              <span className="px-2.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] font-medium">
                {isBn ? 'সেশন:' : 'Session:'} {child.academicYear}
              </span>
              <span className="px-2.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] font-medium">
                {isBn ? 'রক্তের গ্রুপ:' : 'Blood:'} {child.bloodGroup}
              </span>
              <span className="px-2.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.6875rem] font-medium">
                {isBn ? 'লিঙ্গ:' : 'Gender:'} {child.gender}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Academic Details */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
            <Award size={16} className="text-[var(--brand)]" />
            <h3 className="text-xs font-bold text-[var(--text-primary)]">
              {isBn ? 'একাডেমিক তথ্য' : 'Academic Information'}
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'শ্রেণি ও বিভাগ' : 'Class & Section'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{child.class} - {child.section}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'ক্লাস রোল নং' : 'Class Roll'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{child.roll}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'শিক্ষাবর্ষ' : 'Academic Year'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{child.academicYear}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{child.dob}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{child.classTeacherName}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--text-muted)]">{isBn ? 'শিক্ষকের ইমেইল' : 'Teacher Email'}</span>
              <span className="text-[var(--text-secondary)]">{child.classTeacherEmail}</span>
            </div>
          </div>
        </div>

        {/* Guardian & Parents Info */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
            <Shield size={16} className="text-[var(--brand)]" />
            <h3 className="text-xs font-bold text-[var(--text-primary)]">
              {isBn ? 'পিতামাতা ও অভিভাবকের তথ্য' : 'Parent & Guardian Information'}
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'পিতার নাম' : "Father's Name"}</span>
              <span className="font-semibold text-[var(--text-primary)]">{child.fatherName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'পিতার ফোন' : "Father's Phone"}</span>
              <span className="text-[var(--text-secondary)]">{child.fatherPhone}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'মাতার নাম' : "Mother's Name"}</span>
              <span className="font-semibold text-[var(--text-primary)]">{child.motherName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'মাতার ফোন' : "Mother's Phone"}</span>
              <span className="text-[var(--text-secondary)]">{child.motherPhone}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'আইনগত অভিভাবক' : 'Legal Guardian'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{child.guardianName} ({child.guardianRelation})</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--text-muted)]">{isBn ? 'জরুরি যোগাযোগ' : 'Emergency Contact'}</span>
              <span className="font-semibold text-[var(--text-primary)]">{child.emergencyContact}</span>
            </div>
          </div>
        </div>

        {/* Address & Residential Info */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
            <MapPin size={16} className="text-[var(--brand)]" />
            <h3 className="text-xs font-bold text-[var(--text-primary)]">
              {isBn ? 'ঠিকানা ও বাসস্থান' : 'Address Details'}
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="text-[var(--text-muted)] font-medium mb-1">{isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}</div>
              <div className="text-[var(--text-primary)] bg-[var(--bg-secondary)] p-2.5 rounded-lg border border-[var(--border)]">
                {child.presentAddress}
              </div>
            </div>
            <div>
              <div className="text-[var(--text-muted)] font-medium mb-1">{isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</div>
              <div className="text-[var(--text-primary)] bg-[var(--bg-secondary)] p-2.5 rounded-lg border border-[var(--border)]">
                {child.presentAddress}
              </div>
            </div>
          </div>
        </div>

        {/* Medical & Health Notice */}
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
            <Heart size={16} className="text-[var(--brand)]" />
            <h3 className="text-xs font-bold text-[var(--text-primary)]">
              {isBn ? 'স্বাস্থ্য ও জরুরি তথ্য' : 'Health & Emergency Info'}
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}</span>
              <span className="font-bold text-[var(--text-primary)]">{child.bloodGroup}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'অ্যালার্জি সংক্রান্ত তথ্য' : 'Known Allergies'}</span>
              <span className="text-[var(--text-secondary)]">{isBn ? 'কোনো অ্যালার্জি নেই' : 'None recorded'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-muted)]">{isBn ? 'বিশেষ চিকিৎসা নির্দেশনা' : 'Medical Advisory'}</span>
              <span className="text-[var(--text-secondary)]">{isBn ? 'স্বাভাবিক' : 'Normal / Fit'}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[var(--text-muted)]">{isBn ? 'জরুরি হাসপাতাল সংযোগ' : 'Emergency Hospital'}</span>
              <span className="text-[var(--text-secondary)]">Popular Diagnostic Hospital, Dhanmondi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
