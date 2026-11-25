import React from 'react'
import {
  Users,
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
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--border)] mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {isBn ? 'পিতামাতা ও অভিভাবকের বিবরণ' : 'Parents & Legal Guardian Profile'}
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] shrink-0">
            {isBn ? 'পরিবার' : 'Family'}
          </span>
        </div>

        {/* Father & Mother 2-Column Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Father */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-1">
            <span className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
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
                className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-[var(--brand)] hover:underline pt-0.5 no-underline"
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
              <p className="text-[0.6875rem] text-[var(--text-muted)] font-mono">
                NID: {child.fatherNid}
              </p>
            )}
          </div>

          {/* Mother */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-1">
            <span className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
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
                className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-[var(--brand)] hover:underline pt-0.5 no-underline"
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
            <span className="font-semibold text-[var(--text-primary)] text-right">
              {child.guardianName || '—'} {child.guardianRelation ? `(${child.guardianRelation})` : ''}
            </span>
          </div>

          {child.guardianPhone && (
            <div className="flex items-center justify-between py-2.5 gap-2">
              <span className="text-[var(--text-secondary)]">
                {isBn ? 'অভিভাবকের নম্বর' : 'Guardian Contact'}
              </span>
              <a href={`tel:${child.guardianPhone}`} className="text-[var(--brand)] font-semibold hover:underline no-underline">
                {child.guardianPhone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact Strip */}
      <div className="mt-4 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium shrink-0">
            {isBn ? 'জরুরি:' : 'Emergency:'}
          </span>
          <span className="font-semibold text-[var(--text-primary)] truncate font-mono text-xs">
            {emergencyNum || '—'}
          </span>
        </div>

        {emergencyNum && (
          <a
            href={`tel:${emergencyNum}`}
            className="h-7 inline-flex items-center gap-1 px-2.5 rounded-lg text-[0.6875rem] font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors shrink-0 no-underline"
          >
            <Phone size={11} />
            <span>{isBn ? 'কল' : 'Call'}</span>
          </a>
        )}
      </div>
    </div>
  )
})
