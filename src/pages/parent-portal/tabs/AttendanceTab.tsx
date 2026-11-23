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
import { getChildAttendanceStats } from '../utils/dataMappers'
import { matchRoutineForStudent, isDateRoutineWeekend, formatPunchMethod } from '@/lib/routineUtils'

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
  const classes = useClassStore((s) => s.classes)
  const routines = useClassStore((s) => s.routines)

  // Resolve child's class routine to derive accurate weekends
  const routine = useMemo(() => {
    return matchRoutineForStudent(child.class, child.section, classes, routines)
  }, [child.class, child.section, classes, routines])

  // Real statistics derived from attendanceStore and routine
  const stats = useMemo(() => {
    return getChildAttendanceStats(child.id, currentMonth, child.class, child.section)
  }, [child.id, currentMonth, child.class, child.section, attendance, routine])

  // Calendar dates generation aligned with 7 weekdays
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  // Real daily attendance resolver for the selected child with routine weekends
  const getDayStatus = useCallback(
    (day: Date): AttendanceDayInfo => {
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

      const dateKey = format(day, 'yyyy-MM-dd')
      const rec = attendance[dateKey]?.[child.id]
      if (rec) {
        if (rec.status === 'present') {
          const inPunch = rec.punches?.find((p) => p.type === 'in')
          const outPunch = [...(rec.punches || [])].reverse().find((p) => p.type === 'out')
          const isLate = inPunch?.time && inPunch.time > '09:15'
          return {
            status: isLate ? 'late' : 'present',
            label: isLate ? (isBn ? 'দেরি' : 'Late') : (isBn ? 'উপস্থিত' : 'Present'),
            timeIn: inPunch?.time || (rec.punches?.length ? '09:00 AM' : '—'),
            timeOut: outPunch?.time || '—',
            verification: formatPunchMethod(inPunch?.method, isBn),
          }
        }
        if (rec.status === 'absent') {
          return {
            status: 'absent',
            label: isBn ? 'অনুপস্থিত' : 'Absent',
            timeIn: '—',
            timeOut: '—',
            verification: isBn ? 'অনুপস্থিত' : 'Absent',
          }
        }
        if (rec.status === 'on-leave') {
          return {
            status: 'leave',
            label: isBn ? 'অনুমোদিত ছুটি' : 'Leave',
            timeIn: '—',
            timeOut: '—',
            verification: formatPunchMethod('leave', isBn),
          }
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
      {/* Monthly Attendance Summary Row */}
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
        {/* Calendar View (2 spans) */}
        <AttendanceCalendarView
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          calendarDays={calendarDays}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          getDayStatus={getDayStatus}
          isBn={isBn}
        />

        {/* Selected Date Details & Leave Applications (1 span) */}
        <div className="space-y-4">
          <SelectedDateCard
            selectedDay={selectedDay}
            statusInfo={selectedStatus}
            isBn={isBn}
          />

          <LeaveRequestsCard
            leaveRequests={leaveRequests}
            onOpenLeaveModal={onOpenLeaveModal}
            isBn={isBn}
          />
        </div>
      </div>
    </div>
  )
})
