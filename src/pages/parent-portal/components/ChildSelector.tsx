import React, { useState } from 'react'
import {
  ChevronDown,
  CreditCard,
  FileText,
  UserCheck,
  Search,
} from 'lucide-react'
import type { PortalChild } from '../types'
import { AdminStudentSearchDropdown } from './AdminStudentSearchDropdown'

interface ChildSelectorProps {
  childrenList: PortalChild[]
  activeChild: PortalChild
  onSelectChild: (child: PortalChild) => void
  onOpenIdCard?: () => void
  onOpenIdCardModal?: () => void
  onOpenPayModal: () => void
  onOpenContact?: () => void
  onOpenMessage?: () => void
  isBn: boolean
  isSuperAdmin?: boolean
  isInstitutionAdmin?: boolean
  isLocalPC?: boolean
  isLocalServer?: boolean
}

export const ChildSelector = React.memo(function ChildSelector({
  childrenList,
  activeChild,
  onSelectChild,
  onOpenIdCard,
  onOpenIdCardModal,
  onOpenPayModal,
  onOpenContact,
  onOpenMessage,
  isBn,
  isSuperAdmin = true,
  isInstitutionAdmin,
  isLocalPC = false,
  isLocalServer = false,
}: ChildSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleIdCardClick = onOpenIdCardModal || onOpenIdCard
  const handleContactClick = onOpenMessage || onOpenContact

  const isAdminMode = Boolean(isInstitutionAdmin ?? isSuperAdmin ?? false)
  const canSwitchStudent = Boolean(
    (isAdminMode && childrenList.length > 0) || childrenList.length > 1
  )

  const displayName = isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn
  const isActiveStudent = activeChild.status === 'active' || activeChild.status === 'approved' || !activeChild.status

  const storageLabel = isLocalPC
    ? isBn ? 'লোকাল পিসি স্টোরেজ' : 'Local PC Storage'
    : isLocalServer
    ? isBn ? 'ভিপিএস ডাটাবেজ' : 'VPS Database'
    : isBn ? 'ক্লাউড ডাটাবেজ' : 'Cloud Database'

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Student Identity */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="relative shrink-0">
            {activeChild.photo ? (
              <img
                src={activeChild.photo}
                alt={activeChild.nameEn}
                className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl object-cover bg-slate-100 dark:bg-white/[0.06] border border-[var(--border)] shadow-2xs"
              />
            ) : (
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xl border border-[var(--border)] shadow-2xs">
                {(activeChild.nameEn || 'S').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {/* Top row: Name, Switcher, ID & Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {canSwitchStudent ? (
                <button
                  type="button"
                  onClick={() => setDropdownOpen(true)}
                  aria-label={isBn ? 'সন্তান পরিবর্তন করুন' : 'Switch Child'}
                  className="inline-flex items-center gap-1.5 text-left cursor-pointer group bg-transparent border-none p-0 max-w-full"
                >
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate">
                    {displayName}
                  </h2>
                  <ChevronDown
                    size={16}
                    className="text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors shrink-0"
                  />
                </button>
              ) : (
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)] truncate">
                  {displayName}
                </h2>
              )}

              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.6875rem] font-mono font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                ID: {activeChild.id}
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{isActiveStudent ? (isBn ? 'সক্রিয় শিক্ষার্থী' : 'Active Student') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[0.6875rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]/70" />
                <span>{storageLabel}</span>
              </span>
            </div>

            {/* Bottom row: Structured Academic & Profile Badges */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                  {isBn ? 'শ্রেণি:' : 'Class:'}
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {activeChild.class || '—'}
                  {activeChild.section ? ` · ${isBn ? 'শাখা' : 'Sec'} ${activeChild.section}` : ''}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                  {isBn ? 'রোল:' : 'Roll:'}
                </span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {activeChild.roll || '—'}
                </span>
              </div>

              {activeChild.academicYear && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                  <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                    {isBn ? 'সেশন:' : 'Session:'}
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {activeChild.academicYear}
                  </span>
                </div>
              )}

              {activeChild.bloodGroup && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]">
                  <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                    {isBn ? 'রক্তের গ্রুপ:' : 'Blood:'}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {activeChild.bloodGroup}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Clean Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap shrink-0">
          {isAdminMode && childrenList.length > 0 && (
            <button
              type="button"
              onClick={() => setDropdownOpen(true)}
              aria-label={isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}
              className="h-8.5 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer shadow-2xs"
              title={isBn ? 'অন্যান্য শিক্ষার্থী অনুসন্ধান বা নির্বাচন করুন' : 'Search and select another student'}
            >
              <Search size={13} className="shrink-0 text-[var(--text-muted)]" />
              <span className="truncate">{isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleIdCardClick}
            className="h-8.5 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer shadow-2xs"
            title={isBn ? 'শিক্ষার্থীর ডিজিটাল আইডি কার্ড দেখুন' : 'View Student Digital ID Card'}
          >
            <FileText size={13} className="shrink-0 text-[var(--text-muted)]" />
            <span className="truncate">{isBn ? 'আইডি কার্ড' : 'ID Card'}</span>
          </button>

          <button
            type="button"
            onClick={handleContactClick}
            className="h-8.5 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer shadow-2xs"
            title={isBn ? 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষকদের তালিকা ও যোগাযোগ' : 'Class & Subject Teachers Directory'}
          >
            <UserCheck size={13} className="shrink-0 text-[var(--text-muted)]" />
            <span className="truncate">{isBn ? 'শিক্ষক পরিচিতি' : 'Teachers'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenPayModal}
            className="h-8.5 flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold bg-[var(--brand)] hover:opacity-90 text-white transition-opacity cursor-pointer border-none shadow-xs"
          >
            <CreditCard size={13} className="shrink-0" />
            <span className="truncate">{isBn ? 'ফি পরিশোধ' : 'Pay Online'}</span>
          </button>
        </div>
      </div>

      {/* Student Switcher / Search Modal */}
      {dropdownOpen && canSwitchStudent && (
        <AdminStudentSearchDropdown
          childrenList={childrenList}
          activeChild={activeChild}
          onSelectChild={onSelectChild}
          onClose={() => setDropdownOpen(false)}
          isBn={isBn}
          isLocalPC={isLocalPC}
        />
      )}
    </div>
  )
})
