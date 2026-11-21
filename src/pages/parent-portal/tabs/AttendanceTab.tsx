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

interface AttendanceTabProps {
  child: PortalChild
  leaveRequests: LeaveRequest[]
  onOpenLeaveModal: () => void
  isBn: boolean
}

export const AttendanceTab = React.memo(function AttendanceTab({
  child: _child,
  leaveRequests,
  onOpenLeaveModal,
  isBn,
}: AttendanceTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())

  // Calendar dates generation aligned with 7 weekdays
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  // Mock status generator for realistic daily view
  const getDayStatus = (day: Date) => {
    const dayOfWeek = day.getDay()
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Fri/Sat in BD
    if (isWeekend) return { status: 'weekend', label: isBn ? 'ছুটি' : 'Weekend' }

    const dayNum = day.getDate()
    if (dayNum === 12 || dayNum === 13) return { status: 'leave', label: isBn ? 'অনুমোদিত ছুটি' : 'Leave', timeIn: '—' }
    if (dayNum === 18) return { status: 'absent', label: isBn ? 'অনুপস্থিত' : 'Absent', timeIn: '—' }
    if (dayNum === 5 || dayNum === 20) return { status: 'late', label: isBn ? 'বিলম্বে উপস্থিত' : 'Late', timeIn: '09:20 AM', timeOut: '02:30 PM' }

    return { status: 'present', label: isBn ? 'উপস্থিত' : 'Present', timeIn: '08:52 AM', timeOut: '02:30 PM' }
  }

  const selectedStatus = getDayStatus(selectedDay)

  return (
    <div className="space-y-4">
      {/* Monthly Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-[var(--text-muted)] font-semibold uppercase">{isBn ? 'মোট কর্মদিবস' : 'Working Days'}</div>
          <div className="text-[1.25rem] font-extrabold text-[var(--text-primary)] mt-1">22</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-emerald-600 font-semibold uppercase">{isBn ? 'উপস্থিত দিন' : 'Present Days'}</div>
          <div className="text-[1.25rem] font-extrabold text-emerald-600 mt-1">19</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-red-500 font-semibold uppercase">{isBn ? 'অনুপস্থিত' : 'Absent Days'}</div>
          <div className="text-[1.25rem] font-extrabold text-red-500 mt-1">1</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-amber-500 font-semibold uppercase">{isBn ? 'দেরিতে প্রবেশ' : 'Late Days'}</div>
          <div className="text-[1.25rem] font-extrabold text-amber-500 mt-1">2</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-blue-500 font-semibold uppercase">{isBn ? 'ছুটি ভোগ' : 'Leave Days'}</div>
          <div className="text-[1.25rem] font-extrabold text-blue-500 mt-1">2</div>
        </div>
        <div className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] text-[var(--brand)] font-semibold uppercase">{isBn ? 'উপস্থিতির হার' : 'Attendance %'}</div>
          <div className="text-[1.25rem] font-extrabold text-[var(--brand)] mt-1">95.4%</div>
        </div>
      </div>

      {/* Main Grid & Log Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar (2 spans) */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
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
                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent"
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
                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Weekdays Row */}
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {(isBn ? WEEKDAYS_BN : WEEKDAYS_EN).map((day) => (
              <div key={day} className="text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] py-1.5">
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

              let bgCls = 'bg-[var(--bg-secondary)]/40 text-[var(--text-muted)]'
              let dotCls = ''

              if (info.status === 'present') {
                bgCls = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                dotCls = 'bg-emerald-500'
              } else if (info.status === 'absent') {
                bgCls = 'bg-red-500/10 text-red-600 border-red-500/20'
                dotCls = 'bg-red-500'
              } else if (info.status === 'late') {
                bgCls = 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                dotCls = 'bg-amber-500'
              } else if (info.status === 'leave') {
                bgCls = 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                dotCls = 'bg-blue-500'
              } else if (info.status === 'weekend') {
                bgCls = 'bg-[var(--bg-secondary)]/20 text-[var(--text-muted)]/60'
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
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[var(--border)] text-[0.6875rem] text-[var(--text-muted)] flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {isBn ? 'উপস্থিত' : 'Present'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" /> {isBn ? 'অনুপস্থিত' : 'Absent'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> {isBn ? 'দেরি' : 'Late'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> {isBn ? 'অনুমোদিত ছুটি' : 'Leave'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> {isBn ? 'সাপ্তাহিক ছুটি' : 'Weekend'}
            </span>
          </div>
        </div>

        {/* Selected Date Details & Leave Applications (1 span) */}
        <div className="space-y-4">
          {/* Selected Date Details */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[var(--brand)]" />
                <h3 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
                  {format(selectedDay, 'EEEE, MMM d, yyyy')}
                </h3>
              </div>
              <span className="text-[0.625rem] font-bold uppercase px-2 py-0.5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)]">
                {selectedStatus.label}
              </span>
            </div>

            <div className="space-y-2 text-[0.75rem]">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-secondary)]">
                <span className="text-[var(--text-muted)]">{isBn ? 'প্রবেশ (In Time):' : 'In Time:'}</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedStatus.timeIn || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-secondary)]">
                <span className="text-[var(--text-muted)]">{isBn ? 'প্রস্থান (Out Time):' : 'Out Time:'}</span>
                <span className="font-bold text-[var(--text-primary)]">{selectedStatus.timeOut || '—'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-secondary)]">
                <span className="text-[var(--text-muted)]">{isBn ? 'ডিভাইস যাচাই:' : 'Verification:'}</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <ShieldCheck size={13} /> {isBn ? 'আরএফআইডি কার্ড #০১' : 'RFID Smart Card'}
                </span>
              </div>
            </div>
          </div>

          {/* Leave Application Management */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
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
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold bg-[var(--brand)] text-white cursor-pointer border-none"
              >
                <Plus size={12} />
                {isBn ? 'নতুন আবেদন' : 'Apply'}
              </button>
            </div>

            {leaveRequests.length > 0 ? (
              <div className="space-y-2">
                {leaveRequests.map((req) => (
                  <div key={req.id} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.75rem] font-bold text-[var(--text-primary)] capitalize">
                        {req.type} Leave
                      </span>
                      <span
                        className={`text-[0.625rem] font-bold px-1.5 py-0.2 rounded-full ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : req.status === 'rejected'
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
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
