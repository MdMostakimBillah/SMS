import React from 'react'
import {
  Phone,
  AlertCircle,
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
  const emergencyNum = child.emergencyContact || child.guardianPhone || child.fatherPhone || ''

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {isBn ? 'পিতামাতা ও অভিভাবকের বিবরণ' : 'Parents & Legal Guardian Profile'}
          </h3>
          <span className="text-xs text-[var(--text-muted)] shrink-0">
            {isBn ? 'পরিবার' : 'Family'}
          </span>
        </div>

        {/* Father & Mother 2-Column Tonal Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] space-y-1">
            <span className="text-[0.6875rem] font-medium text-[var(--text-muted)] block">
              {isBn ? 'পিতার বিবরণ' : "Father's Details"}
            </span>
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {child.fatherName || '—'}
            </p>
            {child.fatherOccupation && (
              <p className="text-[0.6875rem] text-[var(--text-secondary)] truncate">
                {child.fatherOccupation}
              </p>
            )}
            {child.fatherPhone ? (
              <a
                href={`tel:${child.fatherPhone}`}
                className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-[var(--brand)] hover:underline pt-0.5 no-underline tabular-nums"
              >
                <Phone size={10} />
                <span>{child.fatherPhone}</span>
              </a>
            ) : (
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'ফোন নেই' : 'No phone'}
              </p>
            )}
            {child.fatherNid && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] font-mono">
                NID: {child.fatherNid}
              </p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.03] space-y-1">
            <span className="text-[0.6875rem] font-medium text-[var(--text-muted)] block">
              {isBn ? 'মাতার বিবরণ' : "Mother's Details"}
            </span>
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
              {child.motherName || '—'}
            </p>
            {child.motherOccupation && (
              <p className="text-[0.6875rem] text-[var(--text-secondary)] truncate">
                {child.motherOccupation}
              </p>
            )}
            {child.motherPhone ? (
              <a
                href={`tel:${child.motherPhone}`}
                className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-[var(--brand)] hover:underline pt-0.5 no-underline tabular-nums"
              >
                <Phone size={10} />
                <span>{child.motherPhone}</span>
              </a>
            ) : (
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'ফোন নেই' : 'No phone'}
              </p>
            )}
            {child.motherNid && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] font-mono">
                NID: {child.motherNid}
              </p>
            )}
          </div>
        </div>

        {/* Authorized Guardian Row */}
        <div className="divide-y divide-[var(--border)] text-xs">
          <div className="flex items-center justify-between py-2.5 gap-2">
            <span className="text-[var(--text-secondary)]">
              {isBn ? 'আইনগত অভিভাবক' : 'Legal Guardian'}
            </span>
            <span className="font-medium text-[var(--text-primary)] text-right">
              {child.guardianName || '—'} {child.guardianRelation ? `(${child.guardianRelation})` : ''}
            </span>
          </div>

          {child.guardianPhone && (
            <div className="flex items-center justify-between py-2.5 gap-2">
              <span className="text-[var(--text-secondary)]">
                {isBn ? 'অভিভাবকের নম্বর' : 'Guardian Contact'}
              </span>
              <a href={`tel:${child.guardianPhone}`} className="text-[var(--brand)] font-medium hover:underline no-underline tabular-nums">
                {child.guardianPhone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact Strip */}
      <div className="mt-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle size={13} className="text-[var(--text-secondary)] shrink-0" />
          <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium shrink-0">
            {isBn ? 'জরুরি:' : 'Emergency:'}
          </span>
          <span className="font-semibold text-[var(--text-primary)] truncate font-mono text-xs tabular-nums">
            {emergencyNum || '—'}
          </span>
        </div>

        {emergencyNum && (
          <a
            href={`tel:${emergencyNum}`}
            className="h-7 inline-flex items-center gap-1 px-2.5 rounded-lg text-[0.6875rem] font-semibold bg-[var(--surface)] text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors shrink-0 no-underline"
          >
            <Phone size={11} />
            <span>{isBn ? 'কল' : 'Call'}</span>
          </a>
        )}
      </div>
    </div>
  )
})
