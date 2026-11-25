import React from 'react'
import { ShieldCheck } from 'lucide-react'
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
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {isBn ? 'ব্যক্তিগত ও বাসস্থান বিবরণ' : 'Personal & Residence Records'}
          </h3>
          <span className="text-xs text-[var(--text-muted)] shrink-0">
            {isBn ? 'ব্যক্তিগত' : 'Personal'}
          </span>
        </div>

        {/* 2-Column Tonal Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs mb-3">
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] block">
              {isBn ? 'জন্ম তারিখ' : 'Date of Birth'}
            </span>
            <span className="font-semibold text-[var(--text-primary)] block tabular-nums">
              {child.dob || '—'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] block">
              {isBn ? 'লিঙ্গ' : 'Gender'}
            </span>
            <span className="font-semibold text-[var(--text-primary)] block capitalize">
              {child.gender || '—'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] block">
              {isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400 block">
              {child.bloodGroup || '—'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] block">
              {isBn ? 'ধর্ম ও জাতীয়তা' : 'Religion / Nation'}
            </span>
            <span
              className="font-semibold text-[var(--text-primary)] block truncate"
              title={`${child.religion || 'Islam'} · ${child.nationality || 'Bangladeshi'}`}
            >
              {child.religion ? child.religion.split(' / ')[0] : 'Islam'} · {child.nationality || 'Bangladeshi'}
            </span>
          </div>
        </div>

        {/* Clean Address Rows */}
        <div className="divide-y divide-[var(--border)] text-xs">
          <div className="py-2.5 space-y-0.5">
            <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium block">
              {isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}
            </span>
            <p className="text-[var(--text-primary)] font-medium leading-relaxed">
              {child.presentAddress || (isBn ? 'ঠিকানা লিপিবদ্ধ নেই' : 'No address recorded')}
            </p>
          </div>

          <div className="py-2.5 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium block">
                {isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
              </span>
              {child.district && (
                <span className="text-[0.6875rem] text-[var(--text-muted)] font-mono">
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

      {/* Institutional Standing Strip */}
      <div className="mt-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck size={14} className="text-[var(--text-secondary)] shrink-0" />
          <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium truncate">
            {isBn ? 'প্রাতিষ্ঠানিক শৃঙ্খলা: নিয়মিত ও সক্রিয়' : 'Institutional Standing: Regular & Good'}
          </span>
        </div>
        <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)] shrink-0">
          {isBn ? 'সক্রিয়' : 'Active'}
        </span>
      </div>
    </div>
  )
})
