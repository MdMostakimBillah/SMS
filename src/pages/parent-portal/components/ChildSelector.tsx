import React, { useState, useRef, useEffect } from 'react'
import {
  Users,
  ChevronDown,
  GraduationCap,
  CreditCard,
  FileText,
  MessageSquare,
  Phone,
  ShieldCheck,
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

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Active Child Identity & Switcher */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            {activeChild.photo ? (
              <img
                src={activeChild.photo}
                alt={activeChild.nameEn}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[var(--brand)] shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center font-bold text-lg border-2 border-[var(--brand)]">
                {activeChild.nameEn.charAt(0)}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[0.625rem] border-2 border-[var(--bg-primary)]"
              title={isBn ? 'সক্রিয় শিক্ষার্থী' : 'Active Student'}
            >
              <ShieldCheck size={11} />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative inline-block" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label={isBn ? 'সন্তান পরিবর্তন করুন' : 'Switch Child'}
                className="flex items-center gap-2 text-left cursor-pointer group bg-transparent border-none p-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate">
                      {isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn}
                    </h2>
                    {childrenList.length > 1 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-[var(--brand)]/10 text-[var(--brand)]">
                        <Users size={10} />
                        {isBn ? `${childrenList.length} জন সন্তান` : `${childrenList.length} Children`}
                      </span>
                    )}
                  </div>
                  <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5">
                    {activeChild.class} · {isBn ? 'শাখা' : 'Sec'}: {activeChild.section} · {isBn ? 'রোল' : 'Roll'}: {activeChild.roll}
                  </p>
                </div>
                {childrenList.length > 1 && (
                  <ChevronDown
                    size={16}
                    className={`text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Child Switcher Dropdown */}
              {dropdownOpen && childrenList.length > 1 && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg z-50 overflow-hidden py-1">
                  <div className="px-3 py-1.5 text-[0.6875rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                    {isBn ? 'সন্তান পরিবর্তন করুন' : 'Switch Child'}
                  </div>
                  {childrenList.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectChild(c)
                        setDropdownOpen(false)
                      }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors cursor-pointer border-none ${
                        c.id === activeChild.id
                          ? 'bg-[var(--brand)]/10 text-[var(--brand)]'
                          : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      {c.photo ? (
                        <img src={c.photo} alt={c.nameEn} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--brand)]/20 text-[var(--brand)] flex items-center justify-center font-bold text-xs shrink-0">
                          {c.nameEn.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[0.8125rem] font-semibold truncate">
                          {isBn ? c.nameBn || c.nameEn : c.nameEn}
                        </div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)] truncate">
                          {c.class} · {isBn ? 'রোল' : 'Roll'}: {c.roll}
                        </div>
                      </div>
                      {c.id === activeChild.id && (
                        <span className="w-2 h-2 rounded-full bg-[var(--brand)] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[0.6875rem]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium">
                <GraduationCap size={11} className="text-[var(--brand)]" />
                {isBn ? 'সেশন:' : 'Session:'} {activeChild.academicYear}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium">
                {isBn ? 'রক্তের গ্রুপ:' : 'Blood:'} {activeChild.bloodGroup}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium">
                <Phone size={11} className="text-emerald-500" />
                {isBn ? 'শিক্ষক:' : 'Teacher:'} {activeChild.classTeacherName}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Parent Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onOpenPayModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white shadow-xs hover:opacity-95 transition-all cursor-pointer border-none"
          >
            <CreditCard size={14} />
            {isBn ? 'ফি পরিশোধ করুন' : 'Pay Online'}
          </button>

          <button
            type="button"
            onClick={handleIdCardClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
            title={isBn ? 'শিক্ষার্থীর ডিজিটাল আইডি কার্ড দেখুন' : 'View Student Digital ID Card'}
          >
            <FileText size={14} className="text-[var(--brand)]" />
            {isBn ? 'আইডি কার্ড' : 'ID Card'}
          </button>

          <button
            type="button"
            onClick={handleContactClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
            title={isBn ? 'শ্রেণি শিক্ষককে বার্তা পাঠান' : 'Contact Class Teacher'}
          >
            <MessageSquare size={14} className="text-blue-500" />
            {isBn ? 'বার্তা পাঠান' : 'Message'}
          </button>
        </div>
      </div>
    </div>
  )
})
