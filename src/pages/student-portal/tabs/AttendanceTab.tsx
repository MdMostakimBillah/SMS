import React, { useState, useMemo } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
} from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
} from 'date-fns'
import type { StudentProfile, StudentLeaveRequest } from '../types'
import { useAttendanceStore } from '@/store/attendanceStore'
import { getStudentAttendanceStats } from '../utils/studentPortalMapper'

interface AttendanceTabProps {
  student: StudentProfile
  leaveRequests: StudentLeaveRequest[]
  onOpenLeaveModal: () => void
  isBn: boolean
}

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']

export const AttendanceTab = React.memo(function AttendanceTab({
  student,
  leaveRequests,
  onOpenLeaveModal,
  isBn,
}: AttendanceTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const attendance = useAttendanceStore((s) => s.attendance)

  // Real stats
  const stats = useMemo(() => {
    return getStudentAttendanceStats(student.id, currentMonth)
  }, [student.id, currentMonth, attendance])

  // Calendar dates
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const getDayStatus = (day: Date) => {
    const dayOfWeek = day.getDay()
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6
    const dateKey = format(day, 'yyyy-MM-dd')
    const rec = attendance[dateKey]?.[student.id]

    if (rec?.status === 'present') return 'present'
    if (rec?.status === 'absent') return 'absent'
    if (rec?.status === 'on-leave') return 'leave'
    if (isWeekend) return 'weekend'
    return 'none'
  }

  return (
    <div className="space-y-4">
      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
          <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">
            {isBn ? 'কার্যদিবস' : 'Working Days'}
          </span>
          <div className="text-xl font-bold text-[var(--text-primary)] mt-0.5">{stats.workingDays}</div>
        </div>

        <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
          <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">
            {isBn ? 'উপস্থিত দিন' : 'Days Present'}
          </span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.presentDays}</div>
        </div>

        <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
          <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">
            {isBn ? 'অনুপস্থিত' : 'Days Absent'}
          </span>
          <div className="text-xl font-bold text-rose-500 mt-0.5">{stats.absentDays}</div>
        </div>

        <div className="p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xs">
          <span className="text-[0.6875rem] text-[var(--text-secondary)] font-medium">
            {isBn ? 'উপস্থিতির হার' : 'Attendance Rate'}
          </span>
          <div className="text-xl font-bold text-[var(--brand)] mt-0.5">{stats.attendanceRate}</div>
        </div>
      </div>

      {/* Calendar & Leave Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Card (2 Cols) */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs">
          {/* Month Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar size={16} className="text-[var(--brand)]" />
              <span>{format(currentMonth, 'MMMM yyyy')}</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {(isBn ? WEEKDAYS_BN : WEEKDAYS_EN).map((d, i) => (
              <div key={i} className="text-[0.6875rem] font-semibold text-[var(--text-muted)] py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              const status = getDayStatus(day)
              const isCurrMonth = day.getMonth() === currentMonth.getMonth()

              let bgClass = 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
              if (status === 'present') bgClass = 'bg-emerald-500 text-white font-bold'
              else if (status === 'absent') bgClass = 'bg-rose-500 text-white font-bold'
              else if (status === 'leave') bgClass = 'bg-amber-500 text-white font-bold'
              else if (status === 'weekend') bgClass = 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 font-normal'

              return (
                <div
                  key={idx}
                  className={`h-10 rounded-xl flex flex-col items-center justify-center text-xs transition-transform ${
                    isCurrMonth ? 'opacity-100' : 'opacity-30'
                  } ${bgClass}`}
                >
                  <span>{format(day, 'd')}</span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-[var(--border)] text-[0.6875rem] text-[var(--text-secondary)] flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{isBn ? 'উপস্থিত' : 'Present'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />{isBn ? 'অনুপস্থিত' : 'Absent'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />{isBn ? 'ছুটি' : 'Leave'}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />{isBn ? 'সাপ্তাহিক ছুটি' : 'Weekend'}</span>
          </div>
        </div>

        {/* Leave Requests Card (1 Col) */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'ছুটির আবেদনসমূহ' : 'Leave Requests'}
              </h3>
              <button
                type="button"
                onClick={onOpenLeaveModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--brand)] text-white text-xs font-medium hover:opacity-90"
              >
                <Plus size={13} />
                <span>{isBn ? 'আবেদন' : 'Apply'}</span>
              </button>
            </div>

            {leaveRequests.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {leaveRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[var(--text-primary)] capitalize">{req.type} Leave</span>
                      <span
                        className={`text-[0.625rem] px-1.5 py-0.2 rounded font-medium ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-[0.6875rem] text-[var(--text-secondary)]">
                      {req.startDate} to {req.endDate}
                    </p>
                    <p className="text-[0.6875rem] text-[var(--text-muted)] line-clamp-1 italic">"{req.reason}"</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[var(--text-muted)] text-xs">
                <AlertCircle size={24} className="mx-auto mb-1 opacity-50" />
                <p>{isBn ? 'কোনো ছুটির আবেদন নেই' : 'No leave requests submitted'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
