import React, { useState } from 'react'
import {
  ChevronDown,
  GraduationCap,
  CreditCard,
  FileText,
  UserCheck,
  Search,
  Cloud,
  Server,
  Laptop,
  Heart,
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

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Student Identity */}
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div className="relative shrink-0">
            {activeChild.photo ? (
              <img
                src={activeChild.photo}
                alt={activeChild.nameEn}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-[var(--border)] bg-[var(--bg-secondary)]"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--brand-light)] border border-[var(--border)] text-[var(--brand)] flex items-center justify-center font-bold text-xl">
                {(activeChild.nameEn || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--surface)] ${
                isActiveStudent ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              title={isActiveStudent ? (isBn ? 'সক্রিয় শিক্ষার্থী' : 'Active Student') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {canSwitchStudent ? (
                <button
                  type="button"
                  onClick={() => setDropdownOpen(true)}
                  aria-label={isBn ? 'সন্তান পরিবর্তন করুন' : 'Switch Child'}
                  className="inline-flex items-center gap-1.5 text-left cursor-pointer group bg-transparent border-none p-0 max-w-full"
                >
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate">
                    {displayName}
                  </h2>
                  <ChevronDown
                    size={17}
                    className="text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors shrink-0"
                  />
                </button>
              ) : (
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] truncate">
                  {displayName}
                </h2>
              )}

              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.6875rem] font-semibold bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] font-mono">
                {activeChild.id}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1 flex-wrap">
              <span>
                {isBn ? 'শ্রেণি:' : 'Class:'}{' '}
                <strong className="font-semibold text-[var(--text-primary)]">{activeChild.class || '—'}</strong>
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span>
                {isBn ? 'শাখা:' : 'Sec:'}{' '}
                <strong className="font-semibold text-[var(--text-primary)]">{activeChild.section || '—'}</strong>
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span>
                {isBn ? 'রোল:' : 'Roll:'}{' '}
                <strong className="font-semibold text-[var(--text-primary)] tabular-nums">{activeChild.roll || '—'}</strong>
              </span>
            </div>

            {/* Metadata Chips */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap text-[0.6875rem] font-medium">
              {activeChild.academicYear && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  <GraduationCap size={12} className="text-[var(--brand)] shrink-0" />
                  <span>{isBn ? 'সেশন:' : 'Session:'} {activeChild.academicYear}</span>
                </span>
              )}

              {activeChild.bloodGroup && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Heart size={12} className="shrink-0" />
                  <span>{isBn ? 'রক্ত:' : 'Blood:'} {activeChild.bloodGroup}</span>
                </span>
              )}

              {activeChild.classTeacherName && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] max-w-full">
                  <UserCheck size={12} className="text-[var(--teal)] shrink-0" />
                  <span className="shrink-0">{isBn ? 'শ্রেণি শিক্ষক:' : 'Teacher:'}</span>
                  <span className="truncate max-w-[11rem] sm:max-w-none text-[var(--text-primary)] font-semibold">
                    {activeChild.classTeacherName}
                  </span>
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium ${
                  isLocalPC
                    ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : isLocalServer
                    ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {isLocalPC ? (
                  <Laptop size={12} className="shrink-0" />
                ) : isLocalServer ? (
                  <Server size={12} className="shrink-0" />
                ) : (
                  <Cloud size={12} className="shrink-0" />
                )}
                <span>
                  {isLocalPC
                    ? isBn
                      ? 'লোকাল পিসি স্টোরেজ'
                      : 'Local PC Storage'
                    : isLocalServer
                    ? isBn
                      ? 'ভিপিএস ডাটাবেজ'
                      : 'VPS Database'
                    : isBn
                    ? 'ক্লাউড ডাটাবেজ'
                    : 'Cloud Database'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="pt-3 border-t border-[var(--border)] lg:border-t-0 lg:pt-0 shrink-0">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:flex-wrap">
            {isAdminMode && childrenList.length > 0 && (
              <button
                type="button"
                onClick={() => setDropdownOpen(true)}
                aria-label={isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}
                className="h-9 flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-semibold bg-[var(--brand-light)] text-[var(--brand)] border transition-all cursor-pointer hover:opacity-90 w-full sm:w-auto"
                style={{ borderColor: 'color-mix(in srgb, var(--brand) 30%, transparent)' }}
                title={isBn ? 'অন্যান্য শিক্ষার্থী অনুসন্ধান বা নির্বাচন করুন' : 'Search and select another student'}
              >
                <Search size={14} className="shrink-0" />
                <span className="truncate">{isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenPayModal}
              className={`h-9 flex items-center justify-center gap-1.5 px-4 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer border-none shadow-xs ${
                !(isAdminMode && childrenList.length > 0) ? 'col-span-2 sm:col-span-1 w-full sm:w-auto' : 'w-full sm:w-auto'
              }`}
            >
              <CreditCard size={14} className="shrink-0" />
              <span className="truncate">{isBn ? 'ফি পরিশোধ' : 'Pay Online'}</span>
            </button>

            <button
              type="button"
              onClick={handleIdCardClick}
              className="h-9 flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors cursor-pointer w-full sm:w-auto"
              title={isBn ? 'শিক্ষার্থীর ডিজিটাল আইডি কার্ড দেখুন' : 'View Student Digital ID Card'}
            >
              <FileText size={14} className="text-[var(--text-secondary)] shrink-0" />
              <span className="truncate">{isBn ? 'আইডি কার্ড' : 'ID Card'}</span>
            </button>

            <button
              type="button"
              onClick={handleContactClick}
              className="h-9 flex items-center justify-center gap-1.5 px-3.5 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors cursor-pointer w-full sm:w-auto"
              title={isBn ? 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষকদের তালিকা ও যোগাযোগ' : 'Class & Subject Teachers Directory'}
            >
              <UserCheck size={14} className="text-[var(--text-secondary)] shrink-0" />
              <span className="truncate">{isBn ? 'শিক্ষক পরিচিতি' : 'Teachers'}</span>
            </button>
          </div>
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
