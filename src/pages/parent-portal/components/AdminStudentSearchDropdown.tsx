import React, { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, X, Database, HardDrive, Check, Users } from 'lucide-react'
import { useClassStore } from '@/store/classStore'
import { selectCls } from '@/lib/styles'
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

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const storeClasses = useClassStore((s) => s.classes)
  const sessionClasses = useClassStore((s) => s.sessionClasses)
  const currentSession = useClassStore((s) => s.institution.currentSession)

  const uniqueClasses = useMemo(() => {
    const classList = storeClasses.length > 0
      ? storeClasses
      : (sessionClasses?.[currentSession] || [])
    return classList.map((c) => ({
      name: c.name,
      label: isBn && c.nameBn ? c.nameBn : c.name,
    }))
  }, [storeClasses, sessionClasses, currentSession, isBn])

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const selNorm = selectedClass.toLowerCase().replace(/^class\s*/i, '').trim()
    return childrenList.filter((c) => {
      if (selectedClass !== 'all') {
        const studentClassNorm = (c.class || '').toLowerCase().replace(/^class\s*/i, '').trim()
        const matchesClass =
          c.class === selectedClass ||
          (c.class || '').toLowerCase() === selectedClass.toLowerCase() ||
          studentClassNorm === selNorm
        if (!matchesClass) return false
      }
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

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="modal-overlay modal-backdrop-animate fixed inset-0 z-[600] flex items-start justify-center pt-14 sm:pt-20 p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-card-animate relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <Users size={16} />
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {isBn ? 'শিক্ষার্থী নির্বাচন ও অনুসন্ধান' : 'Search & Select Student'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
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
                {isLocalPC ? <HardDrive size={12} className="text-amber-500" /> : <Database size={12} className="text-[var(--brand)]" />}
                <span>{isLocalPC ? (isBn ? 'লোকাল পিসি' : 'Local PC') : (isBn ? 'ডাটাবেস' : 'Database')}</span>
              </span>

              <button
                type="button"
                onClick={onClose}
                aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] transition-colors cursor-pointer bg-transparent"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isBn
                  ? 'নাম, রোল, শ্রেণি, আইডি বা ফোন দিয়ে খুঁজুন...'
                  : 'Search by student name, roll, class, ID, phone...'
              }
              className="w-full h-9 pl-9 pr-8 text-[0.8125rem] rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--brand)] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Class Filter & Count */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[var(--text-secondary)] font-medium tabular-nums">
              {filteredStudents.length} / {childrenList.length} {isBn ? 'শিক্ষার্থী পাওয়া গেছে' : 'students found'}
            </span>

            {uniqueClasses.length > 0 && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={`${selectCls} bg-[var(--surface)]`}
              >
                <option value="all">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls.name} value={cls.name}>
                    {cls.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Scrollable Students List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)] p-1.5">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-[0.8125rem] text-[var(--text-muted)]">
              {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No matching students found'}
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
                  className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition-colors cursor-pointer border-none ${
                    isSelected
                      ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                      : 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {c.photo ? (
                    <img
                      src={c.photo}
                      alt={c.nameEn}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--brand)] flex items-center justify-center font-bold text-sm shrink-0">
                      {(c.nameEn || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.8125rem] truncate font-semibold">
                      {isBn ? c.nameBn || c.nameEn : c.nameEn}
                    </div>
                    <div className="text-[0.6875rem] text-[var(--text-secondary)] truncate mt-0.5">
                      {c.class} · {isBn ? 'শাখা' : 'Sec'}: {c.section || '—'} · {isBn ? 'রোল' : 'Roll'}: {c.roll || '—'} · {c.id}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-[var(--brand)] shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  )
})
