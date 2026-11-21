import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, Database, HardDrive, Check, Users } from 'lucide-react'
import type { PortalChild } from '../types'

interface AdminStudentSearchDropdownProps {
  childrenList: PortalChild[]
  activeChild: PortalChild
  onSelectChild: (child: PortalChild) => void
  onClose: () => void
  isBn: boolean
  isLocalPC: boolean
}

export const AdminStudentSearchDropdown = React.memo(function AdminStudentSearchDropdown({
  childrenList,
  activeChild,
  onSelectChild,
  onClose,
  isBn,
  isLocalPC,
}: AdminStudentSearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto focus search input on open
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Extract unique classes for quick filter
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>()
    childrenList.forEach((c) => {
      if (c.class) set.add(c.class)
    })
    return Array.from(set).sort()
  }, [childrenList])

  // Filter students by query (name, roll, class, section, id, guardian, phone) & class
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return childrenList.filter((c) => {
      const matchesClass = selectedClass === 'all' || c.class === selectedClass
      if (!matchesClass) return false
      if (!q) return true

      return (
        c.nameEn.toLowerCase().includes(q) ||
        (c.nameBn && c.nameBn.includes(q)) ||
        c.roll.toLowerCase().includes(q) ||
        c.class.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.fatherName && c.fatherName.toLowerCase().includes(q)) ||
        (c.guardianName && c.guardianName.toLowerCase().includes(q)) ||
        (c.emergencyContact && c.emergencyContact.includes(q))
      )
    })
  }, [childrenList, searchQuery, selectedClass])

  return (
    <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg z-50 overflow-hidden">
      {/* Header with Title & Storage Source Indicator */}
      <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Users size={14} className="text-[var(--brand)] shrink-0" />
            <span className="text-[0.75rem] font-bold text-[var(--text-primary)] truncate">
              {isBn ? 'শিক্ষার্থী নির্বাচন ও অনুসন্ধান' : 'Search & Select Student'}
            </span>
          </div>

          {/* Database vs Local PC Storage Mode Indicator */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.625rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shrink-0"
            title={
              isLocalPC
                ? isBn
                  ? 'লোকাল পিসির ফাইল ও মেমোরি থেকে লোড করা'
                  : 'Loaded from Local PC offline file storage'
                : isBn
                ? 'সেন্ট্রাল ডাটাবেস থেকে লোড করা'
                : 'Connected to Central Server Database'
            }
          >
            {isLocalPC ? <HardDrive size={10} className="text-[var(--text-muted)]" /> : <Database size={10} className="text-[var(--brand)]" />}
            <span>{isLocalPC ? (isBn ? 'লোকাল পিসি' : 'Local PC') : (isBn ? 'ডাটাবেস' : 'Database')}</span>
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isBn
                ? 'নাম, রোল, শ্রেণি বা আইডি দিয়ে খুঁজুন...'
                : 'Search by name, roll, class, or ID...'
            }
            className="w-full pl-8 pr-7 py-1.5 text-[0.75rem] rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--brand)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-0"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Class Filter & Count */}
        <div className="flex items-center justify-between gap-2 text-[0.6875rem]">
          <span className="text-[var(--text-secondary)] font-mono">
            {filteredStudents.length} / {childrenList.length} {isBn ? 'শিক্ষার্থী' : 'students'}
          </span>

          {uniqueClasses.length > 1 && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2 py-0.5 rounded text-[0.6875rem] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] outline-none cursor-pointer"
            >
              <option value="all">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Scrollable Students List */}
      <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]/60">
        {filteredStudents.length === 0 ? (
          <div className="py-8 text-center text-[0.75rem] text-[var(--text-muted)]">
            {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No matching students found'}
          </div>
        ) : (
          filteredStudents.map((c) => {
            const isSelected = c.id === activeChild.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelectChild(c)
                  onClose()
                }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors cursor-pointer border-none ${
                  isSelected
                    ? 'bg-[var(--bg-secondary)] text-[var(--brand)] font-semibold'
                    : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {c.photo ? (
                  <img src={c.photo} alt={c.nameEn} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[var(--border)]" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                    {c.nameEn.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[0.8125rem] truncate font-medium">
                    {isBn ? c.nameBn || c.nameEn : c.nameEn}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)] truncate">
                    {c.class} · {isBn ? 'শাখা' : 'Sec'}: {c.section} · {isBn ? 'রোল' : 'Roll'}: {c.roll}
                  </div>
                </div>
                {isSelected && <Check size={14} className="text-[var(--brand)] shrink-0" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
})
