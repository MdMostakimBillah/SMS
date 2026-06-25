import React, { useRef } from 'react'
import {
  CalendarRange,
  CalendarX,
  CheckCircle,
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

interface EmployeeTabProps {
  isBn: boolean
  dateFrom: string
  setDateFrom: (val: string) => void
  dateTo: string
  setDateTo: (val: string) => void
  employeeSearch: string
  setEmployeeSearch: (val: string) => void
  fDeptEmp: string
  setFDeptEmp: (val: string) => void
  filteredEmployees: any[]
  paginatedEmployees: any[]
  empPage: number
  setEmpPage: (val: number | ((p: number) => number)) => void
  empPerPage: number
  setEmpPerPage: (val: number) => void
  empTotalPages: number
  rangeDays: string[]
  attendance: Record<string, any>
  selectedEmployees: string[]
  setSelectedEmployees: React.Dispatch<React.SetStateAction<string[]>>
  setViewPerson: (val: { id: string; name: string; type: 'teacher' | 'student' } | null) => void
  showEmployeePDF: boolean
  setShowEmployeePDF: (val: boolean) => void
  exportEmployeeExcel: () => void
  departments: any[]
  statusBadge: (s: AttendanceStatus) => React.ReactNode
  weeklyHolidayBadge: () => React.ReactNode
  getStatus: (dayData?: any) => AttendanceStatus
  getDeptName: (id: string) => string
}

export const EmployeeTab = React.memo(function EmployeeTab({
  isBn,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  employeeSearch,
  setEmployeeSearch,
  fDeptEmp,
  setFDeptEmp,
  filteredEmployees,
  paginatedEmployees,
  empPage,
  setEmpPage,
  empPerPage,
  setEmpPerPage,
  empTotalPages,
  rangeDays,
  attendance,
  selectedEmployees,
  setSelectedEmployees,
  setViewPerson,
  setShowEmployeePDF,
  exportEmployeeExcel,
  departments,
  statusBadge,
  weeklyHolidayBadge,
  getStatus,
  getDeptName,
}: EmployeeTabProps) {
  const sel =
    'px-[0.5625rem] py-[0.4375rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer outline-none'

  const [showEmployeeActionMenu, setShowEmployeeActionMenu] = React.useState(false)
  const employeeActionMenuRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeActionMenuRef.current && !employeeActionMenuRef.current.contains(event.target as Node)) {
        setShowEmployeeActionMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* Filter + Date Range for Employee tab */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-[0.5625rem] py-[0.3125rem] flex-1 min-w-[10rem]">
          <Search size={13} className="text-[var(--text-muted)] shrink-0" />
          <input
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
            className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
          />
          {employeeSearch && (
            <button
              onClick={() => setEmployeeSearch('')}
              className="border-none bg-transparent cursor-pointer text-[var(--text-muted)] flex"
            >
              <X size={11} />
            </button>
          )}
        </div>
        <select value={fDeptEmp} onChange={(e) => setFDeptEmp(e.target.value)} className={sel}>
          <option value="">{isBn ? 'সব বিভাগ' : 'All Depts'}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {isBn ? d.nameBn : d.name}
            </option>
          ))}
        </select>
        {(fDeptEmp || employeeSearch) && (
          <button
            onClick={() => {
              setFDeptEmp('')
              setEmployeeSearch('')
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3.5">
        {[
          {
            lBn: 'মোট',
            lEn: 'Total',
            v: filteredEmployees.length,
            Icon: Users,
            c: 'var(--brand)',
            bg: 'var(--brand-light)',
          },
          {
            lBn: 'গড় উপস্থিতি',
            lEn: 'Avg Present',
            v: rangeDays.length
              ? Math.round(
                  (filteredEmployees.reduce(
                    (sum, t) => sum + rangeDays.filter((ds) => attendance[ds]?.[t.id]?.status === 'present').length,
                    0
                  ) /
                    (filteredEmployees.length * rangeDays.length)) *
                    100
                ) + '%'
              : '0%',
            Icon: CheckCircle,
            c: 'var(--green)',
            bg: 'var(--green-light)',
          },
          {
            lBn: 'মোট দিন',
            lEn: 'Total Days',
            v: rangeDays.length,
            Icon: CalendarRange,
            c: 'var(--brand)',
            bg: 'var(--brand-light)',
          },
          {
            lBn: 'সাপ্তাহিক ছুটি',
            lEn: 'Weekends',
            v: rangeDays.filter((ds) => isFriday(ds)).length,
            Icon: CalendarX,
            c: 'var(--purple)',
            bg: 'var(--purple-light)',
          },
        ].map((s) => (
          <div key={s.lEn} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-[2.375rem] h-[2.375rem] rounded-[0.625rem] flex items-center justify-center shrink-0" style={{ background: s.bg }}>
              <s.Icon size={18} style={{ color: s.c }} />
            </div>
            <div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{s.v}</div>
              <div className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? s.lBn : s.lEn}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-[var(--text-secondary)]">
            {isBn ? `মোট ${filteredEmployees.length} জন কর্মচারী` : `${filteredEmployees.length} employees`}
          </span>
          {selectedEmployees.length > 0 && (
            <span className="text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-[0.1875rem] rounded-[0.375rem] font-medium">
              {selectedEmployees.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </span>
          )}
        </div>
        <div className="relative" ref={employeeActionMenuRef}>
          <button
            onClick={() => setShowEmployeeActionMenu(!showEmployeeActionMenu)}
            className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-lg bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-[0.75rem] cursor-pointer font-medium"
          >
            <MoreVertical size={13} />
            {isBn ? 'অ্যাকশন' : 'Action'}
            <ChevronDown size={12} />
          </button>
          {showEmployeeActionMenu && (
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
                  exportEmployeeExcel()
                  setShowEmployeeActionMenu(false)
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
                  setShowEmployeePDF(true)
                  setShowEmployeeActionMenu(false)
                }}
                disabled={selectedEmployees.length === 0}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 0.875rem',
                  border: 'none',
                  background: 'transparent',
                  color: selectedEmployees.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontSize: '0.8125rem',
                  cursor: selectedEmployees.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  opacity: selectedEmployees.length === 0 ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (selectedEmployees.length > 0) e.currentTarget.style.background = 'var(--red-light)' }}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <FileText size={14} style={{ color: 'var(--red)' }} />
                {isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                {selectedEmployees.length > 0 && ` (${selectedEmployees.length})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full border-collapse text-[0.6875rem]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.25rem]">
                  <input
                    type="checkbox"
                    checked={filteredEmployees.length > 0 && filteredEmployees.every((t) => selectedEmployees.includes(t.id))}
                    onChange={() => {
                      if (filteredEmployees.every((t) => selectedEmployees.includes(t.id))) setSelectedEmployees([])
                      else setSelectedEmployees(filteredEmployees.map((t) => t.id))
                    }}
                    className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                  />
                </th>
                <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.25rem]"></th>
                <th className="p-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[8.75rem]">
                  {isBn ? 'নাম' : 'Name'}
                </th>
                <th className="p-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[5rem]">
                  {isBn ? 'বিভাগ' : 'Dept'}
                </th>
                <th className="p-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[5rem]">
                  {isBn ? 'পদবি' : 'Designation'}
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
              {paginatedEmployees.map((t) => (
                <tr
                  key={t.id}
                  className={`border-b border-[var(--border)] transition-colors ${
                    selectedEmployees.includes(t.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(t.id)}
                      onChange={() =>
                        setSelectedEmployees((prev) => (prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]))
                      }
                      className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                    />
                  </td>
                  <td className="p-[0.375rem] text-center">
                    <div className="w-[1.875rem] h-[2.25rem] rounded-[0.3125rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto">
                      {t.photo ? (
                        <img src={t.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={13} className="text-[var(--text-muted)]" />
                      )}
                    </div>
                  </td>
                  <td className="p-[0.375rem]">
                    <div
                      className="flex items-center gap-1.5 cursor-pointer"
                      onClick={() =>
                        setViewPerson({
                          id: t.id,
                          name: isBn ? t.nameBn || t.nameEn : t.nameEn,
                          type: 'teacher',
                        })
                      }
                    >
                      <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">
                        {isBn ? t.nameBn || t.nameEn : t.nameEn}
                      </div>
                      <ExternalLink size={10} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">{t.id}</div>
                  </td>
                  <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{getDeptName(t.departmentId)}</td>
                  <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{t.designation || '—'}</td>
                  {rangeDays.map((ds) => {
                    if (isFriday(ds))
                      return (
                        <td key={ds} className="p-[0.25rem] text-center">
                          {weeklyHolidayBadge()}
                        </td>
                      )
                    const st = getStatus(attendance[ds]?.[t.id])
                    return (
                      <td key={ds} className="p-[0.25rem] text-center">
                        {statusBadge(st)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[0.6875rem] text-[var(--text-muted)]">
          <span>📊 P=Present, A=Absent, L=Late, W=Weekend · {isBn ? 'নামে ক্লিক করুন বিস্তারিত দেখতে' : 'Click name for details'}</span>
          <span>
            {rangeDays.length} {isBn ? 'দিন' : 'days'} · {filteredEmployees.length} {isBn ? 'কর্মচারী' : 'employees'}
          </span>
        </div>
        <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              {(empPage - 1) * empPerPage + 1}–{Math.min(empPage * empPerPage, filteredEmployees.length)} / {filteredEmployees.length}
            </span>
            <select
              value={empPerPage}
              onChange={(e) => {
                setEmpPerPage(Number(e.target.value))
                setEmpPage(1)
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
                [<ChevronsLeft size={12} />, () => setEmpPage(1), empPage === 1] as const,
                [<ChevronLeft size={12} />, () => setEmpPage((p) => Math.max(1, p - 1)), empPage === 1] as const,
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
              const start = Math.max(1, Math.min(empPage - 2, empTotalPages - 4))
              return Array.from({ length: Math.min(5, empTotalPages) }, (_, i) => start + i).map((p) => (
                <button
                  key={p}
                  onClick={() => setEmpPage(p)}
                  className={`w-7 h-7 rounded-md border bg-[var(--bg-primary)] text-xs cursor-pointer ${p === empPage ? 'border-[var(--brand)] bg-[var(--brand)] text-white font-semibold' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {p}
                </button>
              ))
            })()}
            {(
              [
                [
                  <ChevronRight size={12} />,
                  () => setEmpPage((p) => Math.min(empTotalPages, p + 1)),
                  empPage === empTotalPages,
                ] as const,
                [<ChevronsRight size={12} />, () => setEmpPage(empTotalPages), empPage === empTotalPages] as const,
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
