import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  HardDrive,
  Cloud,
  IdCard,
  ChevronDown,
  User,
} from 'lucide-react'
import type { StudentProfile } from '../types'
import { useClassStore } from '@/store/classStore'

interface StudentPortalHeaderProps {
  student: StudentProfile
  studentsList: StudentProfile[]
  onSelectStudent: (studentId: string) => void
  onOpenIdCard: () => void
  isLocalPC: boolean
  isLocalServer: boolean
  isInstitutionAdmin: boolean
  isBn: boolean
}

export const StudentPortalHeader = React.memo(function StudentPortalHeader({
  student,
  studentsList,
  onSelectStudent,
  onOpenIdCard,
  isLocalPC,
  isLocalServer,
  isInstitutionAdmin,
  isBn,
}: StudentPortalHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClassFilter, setSelectedClassFilter] = useState('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const classes = useClassStore((s) => s.classes)

  const availableClasses = useMemo(() => {
    const list = classes.map((c) => c.name)
    studentsList.forEach((s) => {
      if (s.class && !list.includes(s.class)) list.push(s.class)
    })
    return ['all', ...list]
  }, [classes, studentsList])

  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      if (selectedClassFilter !== 'all' && s.class !== selectedClassFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const name = (s.nameEn || '').toLowerCase()
        const nameBn = (s.nameBn || '').toLowerCase()
        const roll = (s.roll || '').toLowerCase()
        const id = (s.id || '').toLowerCase()
        return name.includes(q) || nameBn.includes(q) || roll.includes(q) || id.includes(q)
      }
      return true
    })
  }, [studentsList, selectedClassFilter, searchQuery])

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-xs mb-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Avatar + Details */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
          <div className="relative shrink-0">
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.nameEn}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-[var(--border)] bg-[var(--bg-secondary)]"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--brand)] flex items-center justify-center font-bold text-xl">
                {student.nameEn.charAt(0) || <User size={24} />}
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--surface)] ${
                student.status === 'active' || !student.status ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] truncate">
                {isBn ? student.nameBn || student.nameEn : student.nameEn}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]">
                {isBn ? 'রোল:' : 'Roll:'} {student.roll || 'N/A'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1 flex-wrap">
              <span>{isBn ? 'শ্রেণি:' : 'Class:'} <strong className="text-[var(--text-primary)]">{student.class}</strong></span>
              <span>•</span>
              <span>{isBn ? 'শাখা:' : 'Sec:'} <strong className="text-[var(--text-primary)]">{student.section || 'A'}</strong></span>
              <span>•</span>
              <span className="font-mono text-[0.6875rem] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                ID: {student.id}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Storage Badge + Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:justify-end w-full lg:w-auto pt-3 border-t border-[var(--border)]/70 lg:border-t-0 lg:pt-0">
          {/* Storage Mode Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              isLocalPC
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-800/40'
                : 'bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 border-indigo-300/60 dark:border-indigo-800/40'
            }`}
            title={
              isLocalPC
                ? 'Running entirely on Local PC Storage (File Vault). Your data is secure and never lost on clearing cache.'
                : 'Running on Cloud Provider Central Database. Syncing in real time.'
            }
          >
            {isLocalPC ? <HardDrive size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" /> : <Cloud size={15} className="shrink-0 text-indigo-600 dark:text-indigo-400" />}
            <div className="flex flex-col text-left">
              <span className="font-semibold leading-tight">
                {isLocalPC
                  ? isBn ? 'লোকাল পিসি স্টোরেজ' : 'Local PC Storage'
                  : isLocalServer
                    ? isBn ? 'ব্যক্তিগত সার্ভার (VPS)' : 'Personal VPS'
                    : isBn ? 'ক্লাউড ডাটাবেজ' : 'Cloud Provider DB'}
              </span>
              <span className="text-[0.625rem] opacity-80 leading-tight">
                {isLocalPC
                  ? isBn ? 'অফলাইন সুরক্ষিত ভল্ট' : 'Secure Local Vault'
                  : isBn ? 'রিয়েল-টাইম সিঙ্ক' : 'Live Cloud Sync'}
              </span>
            </div>
          </div>

          {/* Digital ID Card Button */}
          <button
            type="button"
            onClick={onOpenIdCard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] text-xs font-medium cursor-pointer transition-colors"
          >
            <IdCard size={15} className="text-[var(--brand)]" />
            <span>{isBn ? 'ডিজিটাল আইডি' : 'Digital ID'}</span>
          </button>

          {/* Admin Student Switcher Dropdown */}
          {isInstitutionAdmin && studentsList.length > 1 && (
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-medium cursor-pointer shadow-xs hover:opacity-95 transition-opacity"
              >
                <span>{isBn ? 'শিক্ষার্থী পরিবর্তন' : 'Switch Student'}</span>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 p-2 text-xs">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder={isBn ? 'নাম / রোল / আইডি...' : 'Search name, roll, id...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                    />
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none"
                    >
                      {availableClasses.map((c) => (
                        <option key={c} value={c}>
                          {c === 'all' ? (isBn ? 'সব শ্রেণি' : 'All Classes') : c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          onSelectStudent(s.id)
                          setDropdownOpen(false)
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors ${
                          s.id === student.id
                            ? 'bg-[var(--brandLight)] text-[var(--brand)] font-semibold'
                            : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{isBn ? s.nameBn || s.nameEn : s.nameEn}</p>
                          <p className="text-[0.6875rem] text-[var(--text-secondary)]">
                            {s.class} • Sec {s.section || 'A'} • Roll {s.roll}
                          </p>
                        </div>
                      </button>
                    ))}
                    {filteredStudents.length === 0 && (
                      <div className="p-3 text-center text-[var(--text-muted)]">
                        {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No student found'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
