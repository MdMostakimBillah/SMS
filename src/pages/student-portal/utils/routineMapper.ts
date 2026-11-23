import type { StudentProfile, StudentDayRoutine, StudentRoutinePeriod } from '../types'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'

const DAYS_EN = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAYS_BN = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার']

export function formatMinutesToTime(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

export function parseTimeToMinutes(timeStr?: string, defaultMinutes = 480): number {
  if (!timeStr || typeof timeStr !== 'string') return defaultMinutes
  const parts = timeStr.trim().split(':')
  if (parts.length < 2) return defaultMinutes
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return defaultMinutes
  return h * 60 + m
}

export function getStudentWeeklyRoutine(student: StudentProfile): StudentDayRoutine[] {
  if (!student || !student.class) return []

  const classState = useClassStore.getState()
  const classes = classState.classes || []
  const routines = classState.routines || []
  const teachers = useTeacherStore.getState().teachers || []
  const subjects = useTeacherStore.getState().subjects || []
  const institution = classState.institution

  const sClass = student.class.toLowerCase().trim()
  const matchedClass = classes.find(
    (c) =>
      c.id === student.class ||
      c.name.toLowerCase().trim() === sClass ||
      c.name.toLowerCase().trim() === `class ${sClass}` ||
      sClass === `class ${c.name.toLowerCase().trim()}`
  )

  const classId = matchedClass?.id || student.class
  const routine = routines.find((r) => r.classId === classId)

  const defaultDuration = routine?.periodDuration || 40
  const startMins = parseTimeToMinutes(institution?.startTime, 480)
  const weekendDays = routine?.weekendDays ?? [5] // Default Friday is weekend

  // Current day in 0-6 index where Saturday is 0
  const jsDay = new Date().getDay() // 0=Sunday, 6=Saturday
  const todaySatIndex = jsDay === 6 ? 0 : jsDay + 1

  return DAYS_EN.map((dayNameEn, dayIdx) => {
    const isToday = dayIdx === todaySatIndex
    const isWeekend = weekendDays.includes(dayIdx)
    const dayPeriods: StudentRoutinePeriod[] = []

    if (!isWeekend && routine?.periods && routine.periods[dayIdx]) {
      const slots = routine.periods[dayIdx]
      let currentPeriodStart = startMins

      slots.forEach((slot, pIdx) => {
        const duration = routine.periodDurations?.[pIdx] || defaultDuration
        const startTimeStr = formatMinutesToTime(currentPeriodStart)
        const endTimeStr = formatMinutesToTime(currentPeriodStart + duration)
        currentPeriodStart += duration

        if (slot && (slot.subjectId || slot.teacherId)) {
          const sub = subjects.find((s) => s.id === slot.subjectId)
          const tch = teachers.find((t) => t.id === slot.teacherId)

          dayPeriods.push({
            periodIndex: pIdx + 1,
            periodLabel: `Period ${pIdx + 1}`,
            startTime: startTimeStr,
            endTime: endTimeStr,
            subjectId: slot.subjectId,
            subjectName: sub?.name || slot.subjectId || 'Subject',
            subjectNameBn: sub?.nameBn || sub?.name || slot.subjectId || 'বিষয়',
            teacherId: slot.teacherId,
            teacherName: tch?.nameEn || tch?.nameBn || 'Teacher',
            room: slot.sectionId ? `Sec ${slot.sectionId}` : undefined,
          })
        }
      })
    }

    return {
      dayIndex: dayIdx,
      dayNameEn,
      dayNameBn: DAYS_BN[dayIdx],
      isToday,
      isWeekend,
      periods: dayPeriods,
    }
  })
}
