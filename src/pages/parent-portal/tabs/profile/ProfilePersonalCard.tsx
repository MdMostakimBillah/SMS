import React from 'react'
import {
  User,
  ShieldCheck,
} from 'lucide-react'
import type { PortalChild } from '../../types'

interface ProfilePersonalCardProps {
  child: PortalChild
  isBn: boolean
}

export const ProfilePersonalCard = React.memo(function ProfilePersonalCard({
  child,
  isBn,
}: ProfilePersonalCardProps) {
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-emerald-500" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              {isBn ? 'ব্যক্তিগত ও বাসস্থান বিবরণ' : 'Personal & Residence Records'}
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
            {isBn ? 'ব্যক্তিগত' : 'Personal'}
          </span>
        </div>

        {/* 2-Column Minimal Attributes Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/30 space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] block">
              {isBn ? 'জন্ম তারিখ' : 'Date of Birth'}
            </span>
            <span className="font-semibold text-[var(--text-primary)] block">
              {child.dob || '—'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/30 space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] block">
              {isBn ? 'লিঙ্গ' : 'Gender'}
            </span>
            <span className="font-semibold text-[var(--text-primary)] block">
              {child.gender || '—'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/30 space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] block">
              {isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
            </span>
            <span className="font-bold text-[var(--text-primary)] block">
              {child.bloodGroup || '—'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/30 space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] block">
              {isBn ? 'ধর্ম ও জাতীয়তা' : 'Religion / Nation'}
            </span>
            <span className="font-semibold text-[var(--text-primary)] block truncate" title={`${child.religion || 'Islam'} · ${child.nationality || 'Bangladeshi'}`}>
              {child.religion ? child.religion.split(' / ')[0] : 'Islam'} · {child.nationality || 'Bangladeshi'}
            </span>
          </div>
        </div>

        {/* Clean Address Rows */}
        <div className="divide-y divide-[var(--border)]/40 text-xs">
          <div className="py-2 space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium block">
              {isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}
            </span>
            <p className="text-[var(--text-primary)] font-medium leading-relaxed">
              {child.presentAddress || (isBn ? 'ঠিকানা লিপিবদ্ধ নেই' : 'No address recorded')}
            </p>
          </div>

          <div className="py-2 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium block">
                {isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
              </span>
              {child.district && (
                <span className="text-[0.625rem] text-[var(--text-muted)] font-mono">
                  {child.district}
                </span>
              )}
            </div>
            <p className="text-[var(--text-primary)] font-medium leading-relaxed">
              {child.permanentAddress || child.presentAddress || (isBn ? 'ঠিকানা লিপিবদ্ধ নেই' : 'No address recorded')}
            </p>
          </div>
        </div>
      </div>

      {/* Institutional Standing Minimal Note */}
      <div className="mt-4 p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium truncate">
            {isBn ? 'প্রাতিষ্ঠানিক শৃঙ্খলা: নিয়মিত ও সক্রিয়' : 'Institutional Standing: Regular & Good Standing'}
          </span>
        </div>
        <span className="text-[0.625rem] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
          {isBn ? 'সক্রিয়' : 'Active'}
        </span>
      </div>
    </div>
  )
})
