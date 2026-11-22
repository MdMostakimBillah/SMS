import React, { useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import type { PortalChild, LeaveRequest } from '../types'
import { WEEKDAYS_EN, WEEKDAYS_BN } from '@/pages/exams/step2/tabs/types'
import { AttendanceKpiCards } from './attendance/AttendanceKpiCards'
import { useAttendanceStore } from '@/store/attendanceStore'
import { getChildAttendanceStats } from '../utils/dataMappers'

interface AttendanceTabProps {
  child: PortalChild
  leaveRequests: LeaveRequest[]
  onOpenLeaveModal: () => void
  isBn: boolean
}

export const AttendanceTab = React.memo(function AttendanceTab({
  child,
  leaveRequests,
  onOpenLeaveModal,
  isBn,
}: AttendanceTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const attendance = useAttendanceStore((s) => s.attendance)

  // Real statistics derived from database / local store
  const stats = useMemo(() => {
    return getChildAttendanceStats(child.id, currentMonth)
  }, [child.id, currentMonth, attendance])

  // Calendar dates generation aligned with 7 weekdays
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  // Real daily attendance resolver for the selected child
  const getDayStatus = (day: Date) => {
    const dayOfWeek = day.getDay()
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Fri/Sat in BD
    if (isWeekend) return { status: 'weekend', label: isBn ? 'ছুটি' : 'Weekend' }

    const dateKey = format(day, 'yyyy-MM-dd')
    const rec = attendance[dateKey]?.[child.id]
    if (rec) {
      if (rec.status === 'present') {
        const inPunch = rec.punches?.find((p) => p.type === 'in')?.time || '09:00 AM'
        const outPunch = rec.punches?.find((p) => p.type === 'out')?.time || '02:30 PM'
        return {
          status: 'present',
          label: isBn ? 'উপস্থিত' : 'Present',
          timeIn: inPunch,
          timeOut: outPunch,
        }
      }
      if (rec.status === 'absent') {
        return { status: 'absent', label: isBn ? 'অনুপস্থিত' : 'Absent', timeIn: '—' }
      }
      if (rec.status === 'on-leave') {
        return { status: 'leave', label: isBn ? 'অনুমোদিত ছুটি' : 'Leave', timeIn: '—' }
      }
    }

    if (day > new Date()) {
      return { status: 'upcoming', label: isBn ? 'আসন্ন' : 'Upcoming', timeIn: '—' }
    }

    return { status: 'unrecorded', label: isBn ? 'লিপিবদ্ধ নয়' : 'Not Recorded', timeIn: '—' }
  }

  const selectedStatus = getDayStatus(selectedDay)

  return (
    <div className="space-y-4">
      {/* Monthly Attendance Summary Row - Dashboard Style Top Cards */}
      <AttendanceKpiCards
        isBn={isBn}
        workingDays={stats.workingDays}
        presentDays={stats.presentDays}
        absentDays={stats.absentDays}
        lateDays={stats.lateDays}
        leaveDays={stats.leaveDays}
        attendanceRate={stats.attendanceRate}
      />

      {/* Main Grid & Log Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar (2 spans) */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[var(--brand)]" />
              <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)]">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(new Date())}
                className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] cursor-pointer"
              >
                {isBn ? 'আজ' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Weekdays Row */}
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {(isBn ? WEEKDAYS_BN : WEEKDAYS_EN).map((day) => (
              <div key={day} className="text-center text-[0.6875rem] font-semibold text-[var(--text-secondary)] py-1.5">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
              const isTodayDate = isToday(day)
              const isSelected = isSameDay(day, selectedDay)
              const info = getDayStatus(day)

              const statusMap: Record<string, { bg: string; dot: string }> = {
                present: { bg: 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)]', dot: 'bg-[var(--brand)]' },
                absent: { bg: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]', dot: 'bg-neutral-400' },
                late: { bg: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]', dot: 'bg-neutral-500' },
                leave: { bg: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]', dot: 'bg-neutral-400' },
                weekend: { bg: 'bg-[var(--bg-secondary)]/50 text-[var(--text-muted)] border-transparent', dot: '' },
              }
              const { bg: bgCls, dot: dotCls } = statusMap[info.status] || {
                bg: 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]',
                dot: '',
              }

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[3.25rem] p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  } ${bgCls} ${
                    isSelected ? 'ring-2 ring-[var(--brand)] ring-offset-1 border-[var(--brand)]' : ''
                  } ${isTodayDate ? 'font-bold' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[0.75rem] font-semibold">{format(day, 'd')}</span>
                    {dotCls && <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />}
                  </div>
                  <div className="text-[0.5625rem] truncate font-medium">{info.label}</div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border)] text-[0.6875rem] text-[var(--text-secondary)] flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--brand)]" /> {isBn ? 'উপস্থিত' : 'Present'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" /> {isBn ? 'অনুপস্থিত' : 'Absent'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-500" /> {isBn ? 'দেরি' : 'Late'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-400" /> {isBn ? 'অনুমোদিত ছুটি' : 'Leave'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-300" /> {isBn ? 'সাপ্তাহিক ছুটি' : 'Weekend'}
            </span>
          </div>
        </div>

        {/* Selected Date Details & Leave Applications (1 span) */}
        <div className="space-y-4">
          {/* Selected Date Details */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--brand)]" />
                <h3 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
                  {format(selectedDay, 'EEEE, MMM d, yyyy')}
                </h3>
              </div>
              <span className="text-[0.625rem] font-bold uppercase px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                {selectedStatus.label}
              </span>
            </div>

            <div className="space-y-2 text-[0.75rem]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                <span className="text-[var(--text-secondary)]">{isBn ? 'প্রবেশ (In Time):' : 'In Time:'}</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedStatus.timeIn || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                <span className="text-[var(--text-secondary)]">{isBn ? 'প্রস্থান (Out Time):' : 'Out Time:'}</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedStatus.timeOut || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                <span className="text-[var(--text-secondary)]">{isBn ? 'ডিভাইস যাচাই:' : 'Verification:'}</span>
                <span className="font-medium text-[var(--text-primary)] flex items-center gap-1">
                  <ShieldCheck size={13} className="text-[var(--brand)]" /> {isBn ? 'আরএফআইডি কার্ড #০১' : 'RFID Smart Card'}
                </span>
              </div>
            </div>
          </div>

          {/* Leave Application Management */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[var(--brand)]" />
                <h3 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
                  {isBn ? 'ছুটির আবেদন' : 'Leave Requests'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onOpenLeaveModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 cursor-pointer border-none"
              >
                <Plus size={12} />
                {isBn ? 'নতুন আবেদন' : 'Apply'}
              </button>
            </div>

            {leaveRequests.length > 0 ? (
              <div className="space-y-2">
                {leaveRequests.map((req) => (
                  <div key={req.id} className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.75rem] font-bold text-[var(--text-primary)] capitalize">
                        {req.type} Leave
                      </span>
                      <span className="text-[0.625rem] font-bold px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]">
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[0.6875rem] text-[var(--text-secondary)] line-clamp-2">{req.reason}</p>
                    <div className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                      {req.startDate} → {req.endDate}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-[0.75rem] text-[var(--text-muted)]">
                {isBn ? 'কোনো ছুটির আবেদন করা হয়নি' : 'No leave applications'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
