import React, { useRef, useState, useEffect } from 'react'
import {
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Eye,
  ExternalLink,
  GraduationCap,
  LogOut,
  User,
  Users,
  XCircle,
} from 'lucide-react'
import type { AttendanceStatus } from '@/store/teacherStore'
import type { StatusFilter } from '../helpers'

interface TodayTabProps {
  isBn: boolean
  date: string
  setDate: (val: string) => void
  statusFilter: StatusFilter
  setStatusFilter: (val: StatusFilter) => void
  todayFiltered: {
    id: string
    name: string
    nameBn: string
    nameEn: string
    photo: string
    type: 'staff' | 'student'
    designation: string
    dept: string
    attStatus: AttendanceStatus
    inTime: string
    outTime: string
    isLate: boolean
  }[]
  paginatedToday: any[]
  empPage: number
  setEmpPage: (val: number | ((p: number) => number)) => void
  empPerPage: number
  setEmpPerPage: (val: number) => void
  todayTotalPages: number
  stats: { present: number; absent: number; onLeave: number }
  filteredEmployees: any[]
  filteredStudents: any[]
  selectedEmployees: string[]
  setSelectedEmployees: React.Dispatch<React.SetStateAction<string[]>>
  setViewPerson: (val: { id: string; name: string; type: 'teacher' | 'student' } | null) => void
  setShowMarkAll: (val: boolean) => void
  statusFilters: { key: StatusFilter; labelBn: string; labelEn: string; color: string }[]
  statusBadge: (s: AttendanceStatus) => React.ReactNode
}

export const TodayTab = React.memo(function TodayTab({
  isBn,
  date,
  setDate,
  statusFilter,
  setStatusFilter,
  todayFiltered,
  paginatedToday,
  empPage,
  setEmpPage,
  empPerPage,
  setEmpPerPage,
  todayTotalPages,
  stats,
  filteredEmployees,
  filteredStudents,
  selectedEmployees,
  setSelectedEmployees,
  setViewPerson,
  setShowMarkAll,
  statusFilters,
  statusBadge,
}: TodayTabProps) {
  const filterTabsRef = useRef<HTMLDivElement>(null)
  const filterTabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [sliderStyle, setSliderStyle] = useState({ left: '0px', width: '0px', background: 'var(--brand)' })

  useEffect(() => {
    const el = filterTabRefs.current[statusFilter]
    const container = filterTabsRef.current
    if (el && container) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const scrollLeft = container.scrollLeft || 0
      const activeFilter = statusFilters.find((f) => f.key === statusFilter)
      setSliderStyle({
        left: `${elRect.left - containerRect.left + scrollLeft}px`,
        width: `${elRect.width}px`,
        background: activeFilter?.color || 'var(--brand)',
      })
    }
  }, [statusFilter, statusFilters])

  return (
    <>
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-3.5">
        {[
          {
            lBn: 'মোট',
            lEn: 'Total',
            v: filteredEmployees.length + filteredStudents.length,
            Icon: Users,
            c: 'var(--brand)',
            bg: 'var(--brand-light)',
          },
          {
            lBn: 'স্টাফ',
            lEn: 'Staff',
            v: filteredEmployees.length,
            Icon: Briefcase,
            c: 'var(--brand)',
            bg: 'var(--brand-light)',
          },
          {
            lBn: 'শিক্ষার্থী',
            lEn: 'Students',
            v: filteredStudents.length,
            Icon: GraduationCap,
            c: 'var(--green)',
            bg: 'var(--green-light)',
          },
          {
            lBn: 'অনুপস্থিত',
            lEn: 'Absent',
            v: stats.absent,
            Icon: XCircle,
            c: 'var(--red)',
            bg: 'var(--red-light)',
          },
          {
            lBn: 'ছুটিতে',
            lEn: 'Leave',
            v: stats.onLeave,
            Icon: Clock,
            c: 'var(--amber)',
            bg: 'var(--amber-light)',
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

      {/* Date + Mark All + Status Filter */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3.5 mb-3.5">
        <div className="flex items-center gap-2.5 flex-wrap mb-3">
          <Calendar size={14} className="text-[var(--text-muted)]" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-2.5 py-[0.375rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs outline-none"
          />
          <div className="flex-1" />
          <button
            onClick={() => setShowMarkAll(true)}
            className="flex items-center gap-[0.3125rem] px-3.5 py-[0.4375rem] rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-xs cursor-pointer font-medium"
          >
            <CheckCircle size={13} />
            {isBn ? 'সবাইকে উপস্থিত করুন' : 'Mark All Present'}
          </button>
        </div>
        {/* Status filter buttons */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-[0.6875rem] font-medium text-[var(--text-muted)] shrink-0">{isBn ? 'ফিল্টার:' : 'Filter:'}</span>
          <div ref={filterTabsRef} className="relative flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1 shrink-0">
            {statusFilters.map((sf) => (
              <button
                key={sf.key}
                ref={(el) => { filterTabRefs.current[sf.key] = el }}
                onClick={() => {
                  setStatusFilter(sf.key)
                  setEmpPage(1)
                  const btn = filterTabRefs.current[sf.key]
                  const container = filterTabsRef.current
                  if (btn && container) {
                    const cRect = container.getBoundingClientRect()
                    const bRect = btn.getBoundingClientRect()
                    if (bRect.left < cRect.left || bRect.right > cRect.right) {
                      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                    }
                  }
                }}
                className="relative z-10 px-3 py-1 rounded-md text-[0.625rem] font-medium cursor-pointer transition-colors duration-200"
                style={{ color: statusFilter === sf.key ? '#fff' : 'var(--text-muted)' }}
              >
                {isBn ? sf.labelBn : sf.labelEn}
              </button>
            ))}
            <div
              className="absolute top-1 bottom-1 rounded-md [transition:left_300ms_ease-out,width_300ms_ease-out,background-color_300ms_ease-out]"
              style={{
                left: sliderStyle.left,
                width: sliderStyle.width,
                background: sliderStyle.background,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
          <span className="text-[0.6875rem] text-[var(--text-muted)] ml-1 shrink-0">
            ({todayFiltered.length} {isBn ? 'জন' : 'staff'})
          </span>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full border-collapse text-[0.6875rem]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.25rem]">
                  <input
                    type="checkbox"
                    checked={todayFiltered.length > 0 && todayFiltered.every((t) => selectedEmployees.includes(t.id))}
                    onChange={() => {
                      if (todayFiltered.every((t) => selectedEmployees.includes(t.id))) setSelectedEmployees([])
                      else setSelectedEmployees(todayFiltered.map((t) => t.id))
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
                  {isBn ? 'পদবি' : 'Desig'}
                </th>
                <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[4.375rem]">
                  <div className="flex items-center justify-center gap-1">
                    <LogOut size={10} />
                    {isBn ? 'ইন টাইম' : 'In-Time'}
                  </div>
                </th>
                <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[4.375rem]">
                  <div className="flex items-center justify-center gap-1">
                    <LogOut size={10} />
                    {isBn ? 'আউট টাইম' : 'Out-Time'}
                  </div>
                </th>
                <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[3.75rem]">
                  {isBn ? 'অবস্থা' : 'Status'}
                </th>
                <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[3.125rem]">
                  {isBn ? 'অ্যাকশন' : 'Action'}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedToday.map((t) => {
                const isPresent = t.attStatus === 'present'
                return (
                  <tr
                    key={t.id}
                    className={`border-b border-[var(--border)] transition-colors ${
                      selectedEmployees.includes(t.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'hover:bg-[var(--bg-secondary)]'
                    } ${t.isLate && isPresent ? 'bg-[rgba(245,158,11,0.04)]' : ''}`}
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
                    <td className="p-2">
                      <div
                        className="flex items-center gap-1.5 cursor-pointer"
                        onClick={() =>
                          setViewPerson({
                            id: t.id,
                            name: t.name,
                            type: 'teacher',
                          })
                        }
                      >
                        <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">{t.name}</div>
                        <ExternalLink size={10} className="text-[var(--text-muted)]" />
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">{t.id}</div>
                        <span
                          className={`text-[0.4375rem] px-[0.25rem] py-[0.0625rem] rounded font-semibold ${
                            t.type === 'staff'
                              ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                              : 'bg-[var(--green-light)] text-[var(--green)]'
                          }`}
                        >
                          {t.type === 'staff' ? 'STAFF' : 'STU'}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-[0.625rem] text-[var(--text-secondary)]">{t.dept}</td>
                    <td className="p-2 text-[0.625rem] text-[var(--text-secondary)]">{t.designation || '—'}</td>
                    <td className="p-2 text-center">
                      {isPresent && t.inTime !== '—' ? (
                        <span
                          className={`text-[0.625rem] font-mono font-semibold px-2 py-[0.125rem] rounded ${
                            t.isLate ? 'bg-[var(--amber-light)] text-[var(--amber)]' : 'bg-[var(--green-light)] text-[var(--green)]'
                          }`}
                        >
                          {t.inTime}
                        </span>
                      ) : (
                        <span className="text-[0.625rem] text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {isPresent && t.outTime !== '—' ? (
                        <span className="text-[0.625rem] font-mono font-medium text-[var(--text-secondary)]">{t.outTime}</span>
                      ) : (
                        <span className="text-[0.625rem] text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {statusBadge(t.attStatus)}
                      {t.isLate && isPresent && <span className="text-[0.5rem] text-[var(--amber)] font-semibold ml-1">LATE</span>}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() =>
                          setViewPerson({
                            id: t.id,
                            name: t.name,
                            type: 'teacher',
                          })
                        }
                        className="w-[1.625rem] h-[1.625rem] rounded-[0.375rem] bg-[var(--brand-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--brand)] mx-auto"
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {todayFiltered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-[var(--text-muted)]">
                    <Users size={28} className="block mx-auto mb-2 opacity-30" />
                    {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No employees found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Footer info */}
        <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[0.6875rem] text-[var(--text-muted)]">
          <span>📊 P=Present, A=Absent, L=Late · {isBn ? 'নামে ক্লিক করুন বিস্তারিত দেখতে' : 'Click name for details'}</span>
          <span>
            {todayFiltered.length} {isBn ? 'জন' : 'total'} ({filteredEmployees.length} {isBn ? 'স্টাফ' : 'staff'} +{' '}
            {filteredStudents.length} {isBn ? 'শিক্ষার্থী' : 'students'}) ·{' '}
            {new Date(date).toLocaleDateString('en', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        {/* Pagination */}
        <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              {(empPage - 1) * empPerPage + 1}–{Math.min(empPage * empPerPage, todayFiltered.length)} / {todayFiltered.length}
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
              const start = Math.max(1, Math.min(empPage - 2, todayTotalPages - 4))
              return Array.from({ length: Math.min(5, todayTotalPages) }, (_, i) => start + i).map((p) => (
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
                  () => setEmpPage((p) => Math.min(todayTotalPages, p + 1)),
                  empPage === todayTotalPages,
                ] as const,
                [<ChevronsRight size={12} />, () => setEmpPage(todayTotalPages), empPage === todayTotalPages] as const,
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
