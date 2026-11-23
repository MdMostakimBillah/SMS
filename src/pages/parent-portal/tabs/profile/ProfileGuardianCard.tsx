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
  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-indigo-500" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              {isBn ? 'পিতামাতা ও অভিভাবকের বিবরণ' : 'Parents & Legal Guardian Profile'}
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
            {isBn ? 'পরিবার' : 'Family'}
          </span>
        </div>

        {/* Father & Mother 2-Column Minimal Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Father */}
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/40 space-y-1">
            <span className="text-[0.6875rem] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              {isBn ? 'পিতার বিবরণ' : "Father's Details"}
            </span>
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {child.fatherName || '—'}
            </p>
            {child.fatherOccupation && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">
                {child.fatherOccupation}
              </p>
            )}
            {child.fatherPhone ? (
              <a
                href={`tel:${child.fatherPhone}`}
                className="inline-flex items-center gap-1 text-[0.6875rem] text-[var(--brand)] hover:underline pt-0.5"
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
              <p className="text-[0.625rem] text-[var(--text-muted)] font-mono">
                NID: {child.fatherNid}
              </p>
            )}
          </div>

          {/* Mother */}
          <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/40 space-y-1">
            <span className="text-[0.6875rem] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              {isBn ? 'মাতার বিবরণ' : "Mother's Details"}
            </span>
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {child.motherName || '—'}
            </p>
            {child.motherOccupation && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">
                {child.motherOccupation}
              </p>
            )}
            {child.motherPhone ? (
              <a
                href={`tel:${child.motherPhone}`}
                className="inline-flex items-center gap-1 text-[0.6875rem] text-[var(--brand)] hover:underline pt-0.5"
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
              <p className="text-[0.625rem] text-[var(--text-muted)] font-mono">
                NID: {child.motherNid}
              </p>
            )}
          </div>
        </div>

        {/* Authorized Guardian Row */}
        <div className="divide-y divide-[var(--border)]/40 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-[var(--text-muted)] font-normal">
              {isBn ? 'আইনগত অভিভাবক' : 'Legal Guardian'}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {child.guardianName} {child.guardianRelation ? `(${child.guardianRelation})` : ''}
            </span>
          </div>

          {child.guardianPhone && (
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--text-muted)] font-normal">
                {isBn ? 'অভিভাবকের নম্বর' : 'Guardian Contact'}
              </span>
              <a href={`tel:${child.guardianPhone}`} className="text-[var(--brand)] font-medium hover:underline">
                {child.guardianPhone}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact Minimal Strip */}
      <div className="mt-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
            {isBn ? 'জরুরি যোগাযোগ:' : 'Emergency Contact:'}
          </span>
          <span className="font-bold text-[var(--text-primary)] truncate font-mono text-xs">
            {child.emergencyContact || child.guardianPhone || child.fatherPhone || '—'}
          </span>
        </div>

        {(child.emergencyContact || child.guardianPhone || child.fatherPhone) && (
          <a
            href={`tel:${child.emergencyContact || child.guardianPhone || child.fatherPhone}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.6875rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors shrink-0"
          >
            <Phone size={10} />
            <span>{isBn ? 'কল' : 'Call'}</span>
          </a>
        )}
      </div>
    </div>
  )
})
