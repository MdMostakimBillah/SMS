import React, { useRef } from 'react'
import {
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Search,
  User,
  Users,
  X,
} from 'lucide-react'
import type { AttendanceStatus } from '@/store/teacherStore'
import { shortDate, dayName, isFriday } from '../helpers'

interface StudentTabProps {
  isBn: boolean
  dateFrom: string
  setDateFrom: (val: string) => void
  dateTo: string
  setDateTo: (val: string) => void
  studentSearch: string
  setStudentSearch: (val: string) => void
  fClass: string
  setFClass: (val: string) => void
  fSection: string
  setFSection: (val: string) => void
  classOptions: string[]
  sectionsMap: Record<string, string[]>
  allSections: string[]
  filteredStudents: any[]
  paginatedStudents: any[]
  stuPage: number
  setStuPage: (val: number | ((p: number) => number)) => void
  stuPerPage: number
  setStuPerPage: (val: string) => void
  stuTotalPages: number
  rangeDays: string[]
  attendance: Record<string, any>
  selectedStudents: string[]
  setSelectedStudents: React.Dispatch<React.SetStateAction<string[]>>
  setViewStudent: (val: { id: string; name: string; class: string; section: string } | null) => void
  showStudentPDF: boolean
  setShowStudentPDF: (val: boolean) => void
  exportStudentExcel: () => void
  statusBadge: (s: AttendanceStatus) => React.ReactNode
  weeklyHolidayBadge: () => React.ReactNode
  getStatus: (dayData?: any) => AttendanceStatus
}

export const StudentTab = React.memo(function StudentTab({
  isBn,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  studentSearch,
  setStudentSearch,
  fClass,
  setFClass,
  fSection,
  setFSection,
  classOptions,
  sectionsMap,
  allSections,
  filteredStudents,
  paginatedStudents,
  stuPage,
  setStuPage,
  stuPerPage,
  setStuPerPage,
  stuTotalPages,
  rangeDays,
  attendance,
  selectedStudents,
  setSelectedStudents,
  setViewStudent,
  setShowStudentPDF,
  exportStudentExcel,
  statusBadge,
  weeklyHolidayBadge,
  getStatus,
}: StudentTabProps) {
  const sel =
    'px-[0.5625rem] py-[0.4375rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer outline-none'

  const [showStudentActionMenu, setShowStudentActionMenu] = React.useState(false)
  const studentActionMenuRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (studentActionMenuRef.current && !studentActionMenuRef.current.contains(event.target as Node)) {
        setShowStudentActionMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Filter + Date Range for Student tab */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-[0.5625rem] py-[0.3125rem] flex-1 min-w-[10rem]">
          <Search size={13} className="text-[var(--text-muted)] shrink-0" />
          <input
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
            className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
          />
          {studentSearch && (
            <button
              onClick={() => setStudentSearch('')}
              className="border-none bg-transparent cursor-pointer text-[var(--text-muted)] flex"
            >
              <X size={11} />
            </button>
          )}
        </div>
        <select
          value={fClass}
          onChange={(e) => {
            setFClass(e.target.value)
            setFSection('')
          }}
          className={sel}
        >
          <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
          {classOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={fSection} onChange={(e) => setFSection(e.target.value)} className={sel}>
          <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
          {fClass
            ? (sectionsMap[fClass] || []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))
            : allSections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
        </select>
        {(fClass || fSection || studentSearch) && (
          <button
            onClick={() => {
              setFClass('')
              setFSection('')
              setStudentSearch('')
            }}
            className="px-2 py-[0.1875rem] rounded-[0.375rem] bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.625rem] cursor-pointer"
          >
            ✕
          </button>
        )}
        <div className="flex-1" />
        <CalendarRange size={14} className="text-[var(--text-muted)]" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-2 py-[0.3125rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.6875rem] outline-none"
        />
        <span className="text-[0.6875rem] text-[var(--text-muted)]">—</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-2 py-[0.3125rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.6875rem] outline-none"
        />
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-[0.625rem] flex-wrap gap-[0.625rem]">
        <div className="flex items-center gap-2.5">
          <span className="text-[0.75rem] text-[var(--text-secondary)]">
            {isBn ? `মোট ${filteredStudents.length} জন শিক্ষার্থী` : `${filteredStudents.length} students`}
          </span>
          {selectedStudents.length > 0 && (
            <span className="text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-[0.1875rem] rounded-[0.375rem] font-medium">
              {selectedStudents.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </span>
          )}
        </div>
        <div className="relative" ref={studentActionMenuRef}>
          <button
            onClick={() => setShowStudentActionMenu(!showStudentActionMenu)}
            className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-lg bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-[0.75rem] cursor-pointer font-medium"
          >
            <MoreVertical size={13} />
            {isBn ? 'অ্যাকশন' : 'Action'}
            <ChevronDown size={12} />
          </button>
          {showStudentActionMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.375rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: '12.5rem',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => {
                  exportStudentExcel()
                  setShowStudentActionMenu(false)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
                {isBn ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
              </button>
              <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
              <button
                onClick={() => {
                  setShowStudentPDF(true)
                  setShowStudentActionMenu(false)
                }}
                disabled={selectedStudents.length === 0}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  border: 'none',
                  background: 'transparent',
                  color: selectedStudents.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  opacity: selectedStudents.length === 0 ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (selectedStudents.length > 0) e.currentTarget.style.background = 'var(--red-light)' }}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <FileText size={14} style={{ color: 'var(--red)' }} />
                {isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                {selectedStudents.length > 0 && ` (${selectedStudents.length})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full border-collapse text-[0.6875rem]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.25rem]">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudents.includes(s.id))}
                    onChange={() => {
                      if (filteredStudents.every((s) => selectedStudents.includes(s.id))) setSelectedStudents([])
                      else setSelectedStudents(filteredStudents.map((s) => s.id))
                    }}
                    className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                  />
                </th>
                <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.25rem]"></th>
                <th className="p-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[8.75rem]">
                  {isBn ? 'নাম' : 'Name'}
                </th>
                <th className="p-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[3.75rem]">
                  {isBn ? 'শ্রেণি' : 'Class'}
                </th>
                <th className="p-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[3.125rem]">
                  {isBn ? 'সেকশন' : 'Section'}
                </th>
                {rangeDays.map((ds) => (
                  <th key={ds} className="p-[0.375rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] min-w-[2.25rem]">
                    <div>{shortDate(ds)}</div>
                    <div className="text-[0.5rem] font-normal">{dayName(ds)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-[var(--border)] transition-colors ${
                    selectedStudents.includes(s.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(s.id)}
                      onChange={() =>
                        setSelectedStudents((prev) => (prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]))
                      }
                      className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                    />
                  </td>
                  <td className="p-[0.375rem] text-center">
                    <div className="w-[1.875rem] h-[2.25rem] rounded-[0.3125rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto">
                      {s.photo ? (
                        <img src={s.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={13} className="text-[var(--text-muted)]" />
                      )}
                    </div>
                  </td>
                  <td className="p-[0.375rem]">
                    <div
                      className="flex items-center gap-1.5 cursor-pointer"
                      onClick={() =>
                        setViewStudent({
                          id: s.id,
                          name: isBn ? s.nameBn || s.nameEn : s.nameEn,
                          class: s.class,
                          section: s.section || '—',
                        })
                      }
                    >
                      <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">{isBn ? s.nameBn || s.nameEn : s.nameEn}</div>
                      <ExternalLink size={10} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">{s.id}</div>
                  </td>
                  <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{s.class}</td>
                  <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{s.section || '—'}</td>
                  {rangeDays.map((ds) => {
                    if (isFriday(ds))
                      return (
                        <td key={ds} className="p-[0.25rem] text-center">
                          {weeklyHolidayBadge()}
                        </td>
                      )
                    const st = getStatus(attendance[ds]?.[s.id])
                    return (
                      <td key={ds} className="p-[0.25rem] text-center">
                        {statusBadge(st)}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5 + rangeDays.length} className="p-10 text-center text-[var(--text-muted)]">
                    <Users size={28} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[0.6875rem] text-[var(--text-muted)]">
          <span>
            📊 P=Present, A=Absent, L=Late, W=Weekend, E=Early Out ·{' '}
            {isBn ? 'নামে ক্লিক করুন বিস্তারিত দেখতে' : 'Click name for details'}
          </span>
          <span>
            {rangeDays.length} {isBn ? 'দিন' : 'days'} · {filteredStudents.length} {isBn ? 'শিক্ষার্থী' : 'students'}
          </span>
        </div>
        <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              {(stuPage - 1) * stuPerPage + 1}–{Math.min(stuPage * stuPerPage, filteredStudents.length)} / {filteredStudents.length}
            </span>
            <select
              value={stuPerPage}
              onChange={(e) => {
                setStuPerPage(e.target.value)
                setStuPage(1)
              }}
              className="px-1.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.6875rem] text-[var(--text-secondary)]"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-[0.1875rem]">
            {(
              [
                [<ChevronsLeft size={12} />, () => setStuPage(1), stuPage === 1] as const,
                [<ChevronLeft size={12} />, () => setStuPage((p) => Math.max(1, p - 1)), stuPage === 1] as const,
              ] as [React.ReactNode, () => void, boolean][]
            ).map(([ic, a, d], i) => (
              <button
                key={i}
                onClick={a}
                disabled={d}
                className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer disabled:cursor-default disabled:text-[var(--text-muted)]"
              >
                {ic}
              </button>
            ))}
            {(() => {
              const start = Math.max(1, Math.min(stuPage - 2, stuTotalPages - 4))
              return Array.from({ length: Math.min(5, stuTotalPages) }, (_, i) => start + i).map((p) => (
                <button
                  key={p}
                  onClick={() => setStuPage(p)}
                  className={`w-7 h-7 rounded-md border bg-[var(--bg-primary)] text-xs cursor-pointer ${p === stuPage ? 'border-[var(--brand)] bg-[var(--brand)] text-white font-semibold' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {p}
                </button>
              ))
            })()}
            {(
              [
                [
                  <ChevronRight size={12} />,
                  () => setStuPage((p) => Math.min(stuTotalPages, p + 1)),
                  stuPage === stuTotalPages,
                ] as const,
                [<ChevronsRight size={12} />, () => setStuPage(stuTotalPages), stuPage === stuTotalPages] as const,
              ] as [React.ReactNode, () => void, boolean][]
            ).map(([ic, a, d], i) => (
              <button
                key={i}
                onClick={a}
                disabled={d}
                className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer disabled:cursor-default disabled:text-[var(--text-muted)]"
              >
                {ic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
})
