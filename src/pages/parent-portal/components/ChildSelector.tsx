import React, { useState } from 'react'
import {
  ChevronDown,
  Search,
  FileText,
  UserCheck,
  CreditCard,
} from 'lucide-react'
import type { PortalChild } from '../types'
import { AdminStudentSearchDropdown } from './AdminStudentSearchDropdown'

interface ChildSelectorProps {
  childrenList: PortalChild[]
  activeChild: PortalChild
  onSelectChild: (child: PortalChild) => void
  onOpenIdCard?: () => void
  onOpenIdCardModal?: () => void
  onOpenPayModal?: () => void
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
    <div className="py-2 px-1">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Student Identity */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative shrink-0">
            {activeChild.photo ? (
              <img
                src={activeChild.photo}
                alt={activeChild.nameEn}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover bg-slate-900 border border-slate-200/80 dark:border-[var(--border)] shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#131b26] text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-xs shrink-0">
                {(activeChild.nameEn || 'S').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Top row: Name, Switcher, & Active Badge */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {canSwitchStudent ? (
                <button
                  type="button"
                  onClick={() => setDropdownOpen(true)}
                  aria-label={isBn ? 'সন্তান পরিবর্তন করুন' : 'Switch Child'}
                  className="inline-flex items-center gap-1.5 text-left cursor-pointer group bg-transparent border-none p-0 max-w-full"
                >
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate">
                    {displayName}
                  </h2>
                  <ChevronDown
                    size={18}
                    className="text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors shrink-0"
                  />
                </button>
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] truncate">
                  {displayName}
                </h2>
              )}

              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  {isActiveStudent
                    ? isBn ? 'সক্রিয় শিক্ষার্থী' : 'Active student'
                    : isBn ? 'নিষ্ক্রিয়' : 'Inactive'}
                </span>
              </span>

              <span className="sr-only">{storageLabel}</span>
            </div>

            {/* Bottom row: Clean Metadata (ID, Class · Sec, Roll, Blood) */}
            <div className="flex items-center gap-x-6 sm:gap-x-8 gap-y-1 text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)] font-normal">{isBn ? 'আইডি' : 'ID'}</span>
                <span className="font-bold text-[var(--text-primary)]">{activeChild.id}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)] font-normal">{isBn ? 'শ্রেণি' : 'Class'}</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {activeChild.class || '—'}
                  <span className="font-normal text-[var(--text-muted)] mx-1">·</span>
                  {isBn ? 'শাখা' : 'Sec'} {activeChild.section || (isBn ? 'সাধারণ' : 'General')}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)] font-normal">{isBn ? 'রোল' : 'Roll'}</span>
                <span className="font-bold text-[var(--text-primary)] tabular-nums">{activeChild.roll || '—'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)] font-normal">{isBn ? 'রক্তের গ্রুপ' : 'Blood'}</span>
                <span className="font-bold text-[var(--text-primary)]">{activeChild.bloodGroup || 'O+'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Clean Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {isAdminMode && childrenList.length > 0 && (
            <button
              type="button"
              onClick={() => setDropdownOpen(true)}
              aria-label={isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}
              className="h-8.5 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer shadow-2xs"
              title={isBn ? 'অন্যান্য শিক্ষার্থী অনুসন্ধান বা নির্বাচন করুন' : 'Search and select another student'}
            >
              <Search size={13} className="shrink-0 text-[var(--text-muted)]" />
              <span>{isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleIdCardClick}
            aria-label={isBn ? 'আইডি কার্ড' : 'ID Card'}
            className="h-8.5 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer shadow-2xs"
            title={isBn ? 'শিক্ষার্থীর ডিজিটাল আইডি কার্ড দেখুন' : 'View Student Digital ID Card'}
          >
            <FileText size={13} className="shrink-0 text-[var(--text-muted)]" />
            <span>{isBn ? 'আইডি কার্ড' : 'ID Card'}</span>
          </button>

          <button
            type="button"
            onClick={handleContactClick}
            aria-label={isBn ? 'শিক্ষক পরিচিতি' : 'Teachers'}
            className="h-8.5 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors cursor-pointer shadow-2xs"
            title={isBn ? 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষকদের তালিকা ও যোগাযোগ' : 'Class & Subject Teachers Directory'}
          >
            <UserCheck size={13} className="shrink-0 text-[var(--text-muted)]" />
            <span>{isBn ? 'শিক্ষক পরিচিতি' : 'Teachers'}</span>
          </button>

          {onOpenPayModal && (
            <button
              type="button"
              onClick={onOpenPayModal}
              aria-label={isBn ? 'ফি পরিশোধ' : 'Pay Online'}
              className="h-8.5 flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer border-none shadow-xs"
            >
              <CreditCard size={13} className="shrink-0" />
              <span>{isBn ? 'ফি পরিশোধ' : 'Pay Online'}</span>
            </button>
          )}
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
