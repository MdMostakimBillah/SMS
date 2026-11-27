import React, { useState, useMemo, useCallback } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from 'date-fns'
import type { PortalChild, LeaveRequest } from '../types'
import { AttendanceKpiCards } from './attendance/AttendanceKpiCards'
import { AttendanceCalendarView } from './attendance/AttendanceCalendarView'
import type { AttendanceDayInfo } from './attendance/AttendanceCalendarView'
import { SelectedDateCard } from './attendance/SelectedDateCard'
import { LeaveRequestsCard } from './attendance/LeaveRequestsCard'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useClassStore } from '@/store/classStore'
import { getChildAttendanceStats, isPunchLate } from '../utils/dataMappers'
import { matchRoutineForStudent, isDateRoutineWeekend, formatPunchMethod } from '@/lib/routineUtils'

interface AttendanceTabProps {
  child: PortalChild
  leaveRequests: LeaveRequest[]
  onOpenLeaveModal: () => void
  onUpdateLeaveStatus?: (leaveId: string, status: 'approved' | 'rejected') => void
  onCancelLeave?: (leaveId: string) => void
  isBn: boolean
}

export const AttendanceTab = React.memo(function AttendanceTab({
  child,
  leaveRequests,
  onOpenLeaveModal,
  onUpdateLeaveStatus,
  onCancelLeave,
  isBn,
}: AttendanceTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())

  const attendance = useAttendanceStore((s) => s.attendance)
  const classes = useClassStore((s) => s.classes)
  const routines = useClassStore((s) => s.routines)

  const routine = useMemo(() => {
    return matchRoutineForStudent(child.class, child.section, classes, routines)
  }, [child.class, child.section, classes, routines])

  const stats = useMemo(() => {
    void attendance
    void routine
    return getChildAttendanceStats(child.id, currentMonth, child.class, child.section)
  }, [child.id, currentMonth, child.class, child.section, attendance, routine])

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const getDayStatus = useCallback(
    (day: Date): AttendanceDayInfo => {
      const dateKey = format(day, 'yyyy-MM-dd')
      const rec = attendance[dateKey]?.[child.id]
      if (rec) {
        if (rec.status === 'present') {
          const inPunch = rec.punches?.find((p) => p.type === 'in')
          const outPunch = [...(rec.punches || [])].reverse().find((p) => p.type === 'out')
          const isLate = isPunchLate(inPunch?.time)
          return {
            status: isLate ? 'late' : 'present',
            label: isLate ? (isBn ? 'দেরি' : 'Late') : (isBn ? 'উপস্থিত' : 'Present'),
            timeIn: inPunch?.time || (rec.punches?.length ? '09:00 AM' : '—'),
            timeOut: outPunch?.time || '—',
            verification: formatPunchMethod(inPunch?.method, isBn),
            note: rec.note,
          }
        }
        if (rec.status === 'absent') {
          return {
            status: 'absent',
            label: isBn ? 'অনুপস্থিত' : 'Absent',
            timeIn: '—',
            timeOut: '—',
            verification: isBn ? 'অনুপস্থিত' : 'Absent',
            note: rec.note,
          }
        }
        if (rec.status === 'on-leave') {
          return {
            status: 'leave',
            label: isBn ? 'অনুমোদিত ছুটি' : 'Leave',
            timeIn: '—',
            timeOut: '—',
            verification: formatPunchMethod('leave', isBn),
            note: rec.note,
          }
        }
      }

      const isWeekend = isDateRoutineWeekend(day, routine)
      if (isWeekend) {
        return {
          status: 'weekend',
          label: isBn ? 'সাপ্তাহিক ছুটি' : 'Weekend',
          timeIn: '—',
          timeOut: '—',
          verification: formatPunchMethod('weekend', isBn),
        }
      }

      if (day > new Date()) {
        return {
          status: 'upcoming',
          label: isBn ? 'আসন্ন' : 'Upcoming',
          timeIn: '—',
          timeOut: '—',
          verification: '—',
        }
      }

      return {
        status: 'unrecorded',
        label: isBn ? 'লিপিবদ্ধ নয়' : 'Not Recorded',
        timeIn: '—',
        timeOut: '—',
        verification: '—',
      }
    },
    [routine, attendance, child.id, isBn]
  )

  const selectedStatus = getDayStatus(selectedDay)

  return (
    <div className="space-y-4">
      <AttendanceKpiCards
        isBn={isBn}
        workingDays={stats.workingDays}
        presentDays={stats.presentDays}
        absentDays={stats.absentDays}
        lateDays={stats.lateDays}
        leaveDays={stats.leaveDays}
        attendanceRate={stats.attendanceRate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AttendanceCalendarView
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          calendarDays={calendarDays}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          getDayStatus={getDayStatus}
          isBn={isBn}
        />

        <div className="space-y-4">
          <SelectedDateCard
            selectedDay={selectedDay}
            statusInfo={selectedStatus}
            isBn={isBn}
          />

          <LeaveRequestsCard
            leaveRequests={leaveRequests}
            onOpenLeaveModal={onOpenLeaveModal}
            onUpdateLeaveStatus={onUpdateLeaveStatus}
            onCancelLeave={onCancelLeave}
            isBn={isBn}
          />
        </div>
      </div>
    </div>
  )
})
