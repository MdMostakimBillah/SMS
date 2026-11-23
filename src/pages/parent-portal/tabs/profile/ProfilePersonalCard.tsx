import React from 'react'
import {
  User,
  Calendar,
  Heart,
  Globe,
  MapPin,
  Home,
  ShieldCheck,
  CheckCircle2,
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
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'ব্যক্তিগত ও বাসস্থান বিবরণ' : 'Personal & Residence Records'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'জন্ম তারিখ, ধর্ম, জাতীয়তা ও ঠিকানা' : 'Demographics, religion, nationality & addresses'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[0.625rem] font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {isBn ? 'ব্যক্তিগত' : 'Personal'}
          </span>
        </div>

        {/* 2-Column Attributes Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 space-y-0.5">
            <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1">
              <Calendar size={11} />
              <span>{isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</span>
            </div>
            <div className="font-bold text-[var(--text-primary)]">
              {child.dob || '—'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 space-y-0.5">
            <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1">
              <User size={11} />
              <span>{isBn ? 'লিঙ্গ' : 'Gender'}</span>
            </div>
            <div className="font-bold text-[var(--text-primary)]">
              {child.gender || '—'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 space-y-0.5">
            <div className="text-[0.6875rem] text-red-600 dark:text-red-400 flex items-center gap-1">
              <Heart size={11} />
              <span>{isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}</span>
            </div>
            <div className="font-bold text-red-600 dark:text-red-400">
              {child.bloodGroup || '—'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 space-y-0.5">
            <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1">
              <Globe size={11} />
              <span>{isBn ? 'ধর্ম ও জাতীয়তা' : 'Religion / Nation'}</span>
            </div>
            <div className="font-bold text-[var(--text-primary)] truncate">
              {child.religion ? child.religion.split(' / ')[0] : 'Islam'} · {child.nationality || 'Bangladeshi'}
            </div>
          </div>
        </div>

        {/* Address Cards */}
        <div className="space-y-2.5 text-xs">
          {/* Present Address */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/30 space-y-1">
            <div className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-[var(--text-muted)]">
              <MapPin size={12} className="text-[var(--brand)]" />
              <span>{isBn ? 'বর্তমান ঠিকানা' : 'Present / Residential Address'}</span>
            </div>
            <p className="text-[var(--text-primary)] font-medium leading-relaxed">
              {child.presentAddress || (isBn ? 'ঠিকানা লিপিবদ্ধ নেই' : 'No address recorded')}
            </p>
          </div>

          {/* Permanent Address */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/30 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-[var(--text-muted)]">
                <Home size={12} className="text-emerald-500" />
                <span>{isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</span>
              </div>
              {child.district && (
                <span className="text-[0.625rem] font-semibold text-[var(--text-muted)] px-1.5 py-0.2 rounded bg-[var(--surface)] border border-[var(--border)]">
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

      {/* Institutional Standing Status Bar */}
      <div className="mt-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">
              {isBn ? 'প্রাতিষ্ঠানিক শৃঙ্খলা ও স্বাস্থ্য রেকর্ড' : 'Good Standing & Health Record'}
            </p>
            <p className="text-[0.6875rem] text-emerald-700/80 dark:text-emerald-400/80">
              {isBn ? 'নিয়মিত শিক্ষার্থী, আচরণ স্বাভাবিক' : 'Full compliance, physically fit & active'}
            </p>
          </div>
        </div>
        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
      </div>
    </div>
  )
})
