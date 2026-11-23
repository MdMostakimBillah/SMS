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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Single Student Identity */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            {activeChild.photo ? (
              <img
                src={activeChild.photo}
                alt={activeChild.nameEn}
                className="w-12 h-12 rounded-lg object-cover border border-[var(--border)]"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center font-bold text-base">
                {activeChild.nameEn.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {canSwitchStudent ? (
                <button
                  type="button"
                  onClick={() => setDropdownOpen(true)}
                  aria-label={isBn ? 'সন্তান পরিবর্তন করুন' : 'Switch Child'}
                  className="flex items-center gap-1.5 text-left cursor-pointer group bg-transparent border-none p-0"
                >
                  <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate">
                    {isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn}
                  </h2>
                  <ChevronDown
                    size={16}
                    className="text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors"
                  />
                </button>
              ) : (
                <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)] truncate">
                  {isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn}
                </h2>
              )}
            </div>

            <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">
              {activeChild.class} · {isBn ? 'শাখা' : 'Sec'}: {activeChild.section} · {isBn ? 'রোল' : 'Roll'}: {activeChild.roll}
            </p>

            {/* Subtle Info Chips */}
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[0.6875rem]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                <GraduationCap size={11} className="text-[var(--text-muted)]" />
                {isBn ? 'সেশন:' : 'Session:'} {activeChild.academicYear}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                {isBn ? 'রক্ত:' : 'Blood:'} {activeChild.bloodGroup}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                {isBn ? 'শিক্ষক:' : 'Teacher:'} {childTeacherShort(activeChild.classTeacherName)}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
                  isLocalPC
                    ? 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : isLocalServer
                    ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isLocalPC ? (
                  <Laptop size={11} className="text-amber-500" />
                ) : isLocalServer ? (
                  <Server size={11} className="text-indigo-500" />
                ) : (
                  <Cloud size={11} className="text-emerald-500" />
                )}
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
            </div>
          </div>
        </div>

        {/* Right: Actions & Admin Student Search Button */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Prominent Student Search Button in Perfect Position */}
          {canSwitchStudent && (
            <button
              type="button"
              onClick={() => setDropdownOpen(true)}
              aria-label={isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold border border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all cursor-pointer shadow-xs"
              title={isBn ? 'অন্যান্য শিক্ষার্থী অনুসন্ধান বা নির্বাচন করুন' : 'Search and select another student'}
            >
              <Search size={14} />
              <span>{isBn ? 'শিক্ষার্থী খুঁজুন' : 'Search Student'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPayModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer border-none"
          >
            <CreditCard size={14} />
            {isBn ? 'ফি পরিশোধ' : 'Pay Online'}
          </button>

          <button
            type="button"
            onClick={handleIdCardClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-gray-400 transition-colors cursor-pointer"
            title={isBn ? 'শিক্ষার্থীর ডিজিটাল আইডি কার্ড দেখুন' : 'View Student Digital ID Card'}
          >
            <FileText size={14} className="text-[var(--text-muted)]" />
            {isBn ? 'আইডি কার্ড' : 'ID Card'}
          </button>

          <button
            type="button"
            onClick={handleContactClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-gray-400 transition-colors cursor-pointer"
            title={isBn ? 'শ্রেণি ও বিষয়ভিত্তিক শিক্ষকদের তালিকা ও যোগাযোগ' : 'Class & Subject Teachers Directory'}
          >
            <UserCheck size={14} className="text-[var(--text-muted)]" />
            {isBn ? 'শিক্ষক পরিচিতি' : 'Teachers'}
          </button>
        </div>
      </div>

      {/* Admin Student Search Modal in Perfect Centered Position */}
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

function childTeacherShort(name: string): string {
  if (!name) return ''
  return name.length > 18 ? name.slice(0, 16) + '...' : name
}
