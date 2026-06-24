import React from 'react'
import {
  CalendarRange,
  CalendarX,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  User,
  Users,
} from 'lucide-react'
import type { AttendanceStatus } from '@/store/teacherStore'
import { shortDate, dayName, isFriday } from '../helpers'

interface RangeTabProps {
  isBn: boolean
  filteredEmployees: any[]
  paginatedEmployees: any[]
  rangeDays: string[]
  empPage: number
  setEmpPage: (val: number | ((p: number) => number)) => void
  empPerPage: number
  setEmpPerPage: (val: number) => void
  empTotalPages: number
  selectedEmployees: string[]
  setSelectedEmployees: React.Dispatch<React.SetStateAction<string[]>>
  setViewPerson: (val: { id: string; name: string; type: 'teacher' | 'student' } | null) => void
  attendance: Record<string, any>
  showEmployeePDF: boolean
  setShowEmployeePDF: (val: boolean) => void
  exportEmployeeExcel: () => void
  statusBadge: (s: AttendanceStatus) => React.ReactNode
  weeklyHolidayBadge: () => React.ReactNode
  getDeptName: (id: string) => string
  getStatus: (dayData?: any) => AttendanceStatus
}

export const RangeTab = React.memo(function RangeTab({
  isBn,
  filteredEmployees,
  paginatedEmployees,
  rangeDays,
  empPage,
  setEmpPage,
  empPerPage,
  setEmpPerPage,
  empTotalPages,
  selectedEmployees,
  setSelectedEmployees,
  setViewPerson,
  attendance,
  setShowEmployeePDF,
  exportEmployeeExcel,
  statusBadge,
  weeklyHolidayBadge,
  getDeptName,
  getStatus,
}: RangeTabProps) {
  return (
    <>
      {/* Stats cards */}
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
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-[var(--text-secondary)]">
            {isBn
              ? `${filteredEmployees.length} জন কর্মচারী · ${rangeDays.length} দিন`
              : `${filteredEmployees.length} employees · ${rangeDays.length} days`}
          </span>
          {selectedEmployees.length > 0 && (
            <span className="text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-[0.1875rem] rounded-[0.375rem] font-medium">
              {selectedEmployees.length} {isBn ? 'নির্বাচিত' : 'selected'}
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={exportEmployeeExcel}
            className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.75rem] cursor-pointer font-medium"
          >
            <FileSpreadsheet size={13} />
            Excel
          </button>
          <button
            onClick={() => setShowEmployeePDF(true)}
            disabled={selectedEmployees.length === 0}
            className={`flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-lg text-[0.75rem] font-medium ${
              selectedEmployees.length === 0
                ? 'bg-[var(--border-2)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                : 'bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] cursor-pointer'
            }`}
          >
            <FileText size={13} />
            PDF {selectedEmployees.length > 0 && `(${selectedEmployees.length})`}
          </button>
        </div>
      </div>

      {/* Range Table */}
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
                      <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">{isBn ? t.nameBn || t.nameEn : t.nameEn}</div>
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
                    const s = getStatus(attendance[ds]?.[t.id])
                    return (
                      <td key={ds} className="p-[0.25rem] text-center">
                        {statusBadge(s)}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={4 + rangeDays.length} className="p-10 text-center text-[var(--text-muted)]">
                    <Users size={28} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No employees found'}
                  </td>
                </tr>
              )}
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
