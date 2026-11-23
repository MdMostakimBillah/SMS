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

  // Institution Admin and Super Admin can search and select all students.
  // Parents can ONLY see their own child's account and cannot shift to other students.
  const canSwitchStudent = Boolean((isInstitutionAdmin ?? isSuperAdmin ?? false) && childrenList.length > 0)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 sm:p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 lg:gap-4">
        {/* Left: Single Student Identity */}
        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
          <div className="relative shrink-0 mt-0.5">
            {activeChild.photo ? (
              <img
                src={activeChild.photo}
                alt={activeChild.nameEn}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-[var(--border)]"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center font-bold text-lg">
                {activeChild.nameEn.charAt(0)}
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--surface)] ${
                activeChild.status === 'active' || !activeChild.status ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              title={activeChild.status === 'active' || !activeChild.status ? 'Active Student' : 'Inactive'}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {canSwitchStudent ? (
                <button
                  type="button"
                  onClick={() => setDropdownOpen(true)}
                  aria-label={isBn ? 'সন্তান পরিবর্তন করুন' : 'Switch Child'}
                  className="flex items-center gap-1.5 text-left cursor-pointer group bg-transparent border-none p-0 max-w-full"
                >
                  <h2 className="text-[1.0625rem] sm:text-[1.25rem] font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate">
                    {isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn}
                  </h2>
                  <ChevronDown
                    size={16}
                    className="text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors shrink-0"
                  />
                </button>
              ) : (
                <h2 className="text-[1.0625rem] sm:text-[1.25rem] font-bold text-[var(--text-primary)] truncate">
                  {isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn}
                </h2>
              )}
            </div>

            <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">
              {activeChild.class} · {isBn ? 'শাখা' : 'Sec'}: {activeChild.section} · {isBn ? 'রোল' : 'Roll'}: {activeChild.roll}
            </p>

            {/* Subtle Info Chips */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap text-[0.6875rem]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                <GraduationCap size={11} className="text-[var(--text-muted)] shrink-0" />
                <span>{isBn ? 'সেশন:' : 'Session:'} {activeChild.academicYear}</span>
              </span>

              {activeChild.bloodGroup && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  <Heart size={11} className="text-rose-500 shrink-0" />
                  <span>{isBn ? 'রক্ত:' : 'Blood:'} {activeChild.bloodGroup}</span>
                </span>
              )}

              {activeChild.classTeacherName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] max-w-full">
                  <UserCheck size={11} className="text-[var(--text-muted)] shrink-0" />
                  <span className="shrink-0">{isBn ? 'শিক্ষক:' : 'Teacher:'}</span>
                  <span className="truncate max-w-[11rem] sm:max-w-none text-[var(--text-primary)] font-medium">
                    {activeChild.classTeacherName}
                  </span>
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
                  isLocalPC
                    ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : isLocalServer
                    ? 'border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isLocalPC ? (
                  <Laptop size={11} className="shrink-0 text-amber-500" />
                ) : isLocalServer ? (
                  <Server size={11} className="shrink-0 text-indigo-500" />
                ) : (
                  <Cloud size={11} className="shrink-0 text-emerald-500" />
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

        {/* Right / Bottom on mobile: Professional Action Buttons */}
        <div className="pt-3 border-t border-[var(--border)]/70 lg:border-t-0 lg:pt-0 shrink-0">
          <div
            className={`w-full sm:w-auto ${
              canSwitchStudent
                ? 'grid grid-cols-2 gap-2 sm:flex sm:items-center'
                : 'grid grid-cols-2 gap-2 sm:flex sm:items-center'
            }`}
          >
            {/* Prominent Student Search Button for Admins */}
            {canSwitchStudent && (
              <button
                type="button"
                onClick={() => setDropdownOpen(true)}
                aria-label={isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}
                className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-[0.75rem] font-semibold border border-[var(--brand)]/30 bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all cursor-pointer shadow-2xs w-full sm:w-auto"
                title={isBn ? 'অন্যান্য শিক্ষার্থী অনুসন্ধান বা নির্বাচন করুন' : 'Search and select another student'}
              >
                <Search size={14} className="shrink-0" />
                <span className="truncate">{isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenPayModal}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-[0.75rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer border-none shadow-2xs ${
                !canSwitchStudent ? 'col-span-2 sm:col-span-1 w-full sm:w-auto' : 'w-full sm:w-auto'
              }`}
            >
              <CreditCard size={14} className="shrink-0" />
              <span className="truncate">{isBn ? 'ফি পরিশোধ' : 'Pay Online'}</span>
            </button>

            <button
              type="button"
              onClick={handleIdCardClick}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)]/60 transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
              title={isBn ? 'শিক্ষার্থীর ডিজিটাল আইডি কার্ড দেখুন' : 'View Student Digital ID Card'}
            >
              <FileText size={14} className="text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{isBn ? 'আইডি কার্ড' : 'ID Card'}</span>
            </button>

            <button
              type="button"
              onClick={handleContactClick}
              className="flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)]/60 transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
              title={isBn ? 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষকদের তালিকা ও যোগাযোগ' : 'Class & Subject Teachers Directory'}
            >
              <UserCheck size={14} className="text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{isBn ? 'শিক্ষক পরিচিতি' : 'Teachers'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Student Search Modal */}
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
