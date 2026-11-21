import React, { useState, useRef, useEffect } from 'react'
import {
  ChevronDown,
  GraduationCap,
  CreditCard,
  FileText,
  MessageSquare,
} from 'lucide-react'
import type { PortalChild } from '../types'

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
}: ChildSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleIdCardClick = onOpenIdCardModal || onOpenIdCard
  const handleContactClick = onOpenMessage || onOpenContact

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Parents can ONLY see their own child's account and cannot shift to other students
  const canSwitchStudent = isSuperAdmin && childrenList.length > 1

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
            <div className="relative inline-block" ref={dropdownRef}>
              {canSwitchStudent ? (
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-label={isBn ? 'সন্তান পরিবর্তন করুন' : 'Switch Child'}
                  className="flex items-center gap-2 text-left cursor-pointer group bg-transparent border-none p-0"
                >
                  <div className="min-w-0">
                    <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate">
                      {isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn}
                    </h2>
                    <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">
                      {activeChild.class} · {isBn ? 'শাখা' : 'Sec'}: {activeChild.section} · {isBn ? 'রোল' : 'Roll'}: {activeChild.roll}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ) : (
                <div className="min-w-0">
                  <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)] truncate">
                    {isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn}
                  </h2>
                  <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">
                    {activeChild.class} · {isBn ? 'শাখা' : 'Sec'}: {activeChild.section} · {isBn ? 'রোল' : 'Roll'}: {activeChild.roll}
                  </p>
                </div>
              )}

              {/* Super Admin Student Switcher Dropdown */}
              {dropdownOpen && canSwitchStudent && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg z-50 overflow-hidden py-1">
                  <div className="px-3 py-1.5 text-[0.6875rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                    {isBn ? 'শিক্ষার্থী নির্বাচন (সুপার অ্যাডমিন)' : 'Select Student (Super Admin)'}
                  </div>
                  {childrenList.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectChild(c)
                        setDropdownOpen(false)
                      }}
                      className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors cursor-pointer border-none ${
                        c.id === activeChild.id
                          ? 'bg-[var(--bg-secondary)] text-[var(--brand)] font-semibold'
                          : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      {c.photo ? (
                        <img src={c.photo} alt={c.nameEn} className="w-7 h-7 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                          {c.nameEn.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[0.8125rem] truncate">
                          {isBn ? c.nameBn || c.nameEn : c.nameEn}
                        </div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)] truncate">
                          {c.class} · {isBn ? 'রোল' : 'Roll'}: {c.roll}
                        </div>
                      </div>
                      {c.id === activeChild.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
            </div>
          </div>
        </div>

        {/* Right: Quick Parent Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
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
            title={isBn ? 'শ্রেণি শিক্ষককে বার্তা পাঠান' : 'Contact Class Teacher'}
          >
            <MessageSquare size={14} className="text-[var(--text-muted)]" />
            {isBn ? 'বার্তা পাঠান' : 'Message'}
          </button>
        </div>
      </div>
    </div>
  )
})

function childTeacherShort(name: string): string {
  if (!name) return ''
  return name.length > 18 ? name.slice(0, 16) + '...' : name
}
