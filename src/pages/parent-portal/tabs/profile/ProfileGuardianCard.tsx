import React from 'react'
import {
  Shield,
  Phone,
  User,
  Heart,
  AlertCircle,
  Briefcase,
  CreditCard,
} from 'lucide-react'
import type { PortalChild } from '../../types'

interface ProfileGuardianCardProps {
  child: PortalChild
  isBn: boolean
}

export const ProfileGuardianCard = React.memo(function ProfileGuardianCard({
  child,
  isBn,
}: ProfileGuardianCardProps) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'পিতামাতা ও অভিভাবকের বিবরণ' : 'Parents & Legal Guardian Profile'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'পিতা, মাতা ও আইনগত অভিভাবকের তথ্য' : 'Verified parent & guardian contact records'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[0.625rem] font-bold rounded-md bg-indigo-500/10 text-indigo-500">
            {isBn ? 'পরিবার' : 'Family'}
          </span>
        </div>

        {/* Father & Mother Sub-Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Father Box */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                <User size={12} className="text-[var(--brand)]" />
                <span>{isBn ? 'পিতার বিবরণ' : "Father's Info"}</span>
              </span>
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {child.fatherName || '—'}
            </p>
            {child.fatherOccupation && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1">
                <Briefcase size={11} />
                <span>{child.fatherOccupation}</span>
              </p>
            )}
            {child.fatherPhone ? (
              <a
                href={`tel:${child.fatherPhone}`}
                className="inline-flex items-center gap-1 text-[0.6875rem] text-[var(--brand)] hover:underline pt-1"
              >
                <Phone size={11} />
                <span>{child.fatherPhone}</span>
              </a>
            ) : (
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'ফোন নেই' : 'No phone'}
              </p>
            )}
            {child.fatherNid && (
              <p className="text-[0.625rem] text-[var(--text-muted)] flex items-center gap-1 font-mono">
                <CreditCard size={10} />
                <span>NID: {child.fatherNid}</span>
              </p>
            )}
          </div>

          {/* Mother Box */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                <Heart size={12} className="text-rose-500" />
                <span>{isBn ? 'মাতার বিবরণ' : "Mother's Info"}</span>
              </span>
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {child.motherName || '—'}
            </p>
            {child.motherOccupation && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1">
                <Briefcase size={11} />
                <span>{child.motherOccupation}</span>
              </p>
            )}
            {child.motherPhone ? (
              <a
                href={`tel:${child.motherPhone}`}
                className="inline-flex items-center gap-1 text-[0.6875rem] text-[var(--brand)] hover:underline pt-1"
              >
                <Phone size={11} />
                <span>{child.motherPhone}</span>
              </a>
            ) : (
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'ফোন নেই' : 'No phone'}
              </p>
            )}
            {child.motherNid && (
              <p className="text-[0.625rem] text-[var(--text-muted)] flex items-center gap-1 font-mono">
                <CreditCard size={10} />
                <span>NID: {child.motherNid}</span>
              </p>
            )}
          </div>
        </div>

        {/* Legal Guardian Summary Row */}
        <div className="p-3 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)] text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)] font-medium">
              {isBn ? 'আইনগত অভিভাবক' : 'Authorized Guardian'}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {child.guardianName} ({child.guardianRelation})
            </span>
          </div>
          {child.guardianPhone && (
            <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]/40 text-[0.6875rem]">
              <span className="text-[var(--text-muted)]">{isBn ? 'অভিভাবকের নম্বর' : 'Guardian Contact'}</span>
              <a href={`tel:${child.guardianPhone}`} className="text-[var(--brand)] font-medium hover:underline">
                {child.guardianPhone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact Highlight Box */}
      <div className="mt-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle size={16} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[var(--text-primary)] text-xs truncate">
              {isBn ? 'জরুরি যোগাযোগ নম্বর' : 'Emergency Contact'}
            </p>
            <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">
              {child.emergencyContact || child.guardianPhone || child.fatherPhone || child.motherPhone || '—'}
            </p>
          </div>
        </div>

        {(child.emergencyContact || child.guardianPhone || child.fatherPhone) && (
          <a
            href={`tel:${child.emergencyContact || child.guardianPhone || child.fatherPhone}`}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-semibold text-xs hover:bg-amber-600 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs no-underline"
          >
            <Phone size={12} />
            <span>{isBn ? 'জরুরি কল' : 'Call'}</span>
          </a>
        )}
      </div>
    </div>
  )
})
