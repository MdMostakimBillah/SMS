import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  MapPin,
  Users,
  X,
  Clock,
  CheckCircle,
  UserCheck,
  LayoutGrid,
  Building,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Download,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useExamStore } from '@/store/examStore'
import type { ExamRoom, ExamRoutine } from '@/store/examStore'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  startOfDay,
} from 'date-fns'

const sectionCls = 'bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-[14px] mb-[14px]'
const sectionTitleCls = 'flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]'
const inputCls =
  'h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border'
const selectCls =
  'h-8 px-2 pr-7 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2712%27%20height%3D%2712%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%2394a3b8%27%20stroke-width%3D%272%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpolyline%20points%3D%276%209%2012%2015%2018%209%27%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-no-repeat bg-[position:right_8px_center] hover:border-[var(--brand)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/20 transition-all'
const btnPrimary =
  'flex items-center gap-[5px] py-[7px] px-[14px] rounded-lg bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]'

type SubTab = 'routine' | 'rooms' | 'seats' | 'invigilators' | 'attendance'

const statusStyles: Record<string, { bg: string; color: string; dot: string; label: string; labelBn: string }> = {
  completed: { bg: 'var(--green-light)', color: 'var(--green)', dot: 'var(--green)', label: 'Completed', labelBn: 'সম্পন্ন' },
  'in-progress': { bg: 'var(--amber-light)', color: 'var(--amber)', dot: 'var(--amber)', label: 'In Progress', labelBn: 'চলমান' },
  upcoming: { bg: 'var(--brand-light)', color: 'var(--brand)', dot: 'var(--brand)', label: 'Upcoming', labelBn: 'আসন্ন' },
}

function getAutoStatus(dateStr: string): 'completed' | 'in-progress' | 'upcoming' {
  const examDate = startOfDay(parseISO(dateStr))
  const today = startOfDay(new Date())
  if (isBefore(examDate, today)) return 'completed'
  if (isSameDay(examDate, today)) return 'in-progress'
  return 'upcoming'
}

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']

export default function Step2Schedule() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const teachers = useTeacherStore((s) => s.teachers)
  const subjects = useTeacherStore((s) => s.subjects)
  const students = useSessionStudents()
  const isBn = language === 'bn'
  const currentSession = useClassStore((s) => s.institution.currentSession)

  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const examConfigs = useMemo(() => allExamConfigs.filter((e) => e.session === currentSession), [allExamConfigs, currentSession])
  const routines = useExamStore((s) => s.routines)
  const rooms = useExamStore((s) => s.rooms)
  const seatPlans = useExamStore((s) => s.seatPlans)
  const invigilators = useExamStore((s) => s.invigilators)
  const addRoutine = useExamStore((s) => s.addRoutine)
  const deleteRoutine = useExamStore((s) => s.deleteRoutine)
  const addRoom = useExamStore((s) => s.addRoom)
  const updateRoom = useExamStore((s) => s.updateRoom)
  const deleteRoom = useExamStore((s) => s.deleteRoom)
  const addSeatPlan = useExamStore((s) => s.addSeatPlan)
  const removeSeatPlan = useExamStore((s) => s.removeSeatPlan)
  const addInvigilator = useExamStore((s) => s.addInvigilator)
  const removeInvigilator = useExamStore((s) => s.removeInvigilator)

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('rooms')
  const [selectedExamId, setSelectedExamId] = useState(examConfigs.find((e) => e.isActive)?.id || '')

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const active = examConfigs.find((e) => e.isActive)
    if (active?.startDate) {
      try { return startOfMonth(parseISO(active.startDate)) } catch {}
    }
    return new Date()
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayDetail, setShowDayDetail] = useState(false)

  // Routine form
  const [showRoutineForm, setShowRoutineForm] = useState(false)
  const [routineForm, setRoutineForm] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
    date: '',
    startTime: '',
    endTime: '',
    roomNo: '',
  })
  const [routineOrientation, setRoutineOrientation] = useState<'landscape' | 'portrait'>('landscape')

  // Student count for routine form class/section
  const routineStudentCount = useMemo(() => {
    if (!routineForm.classId) return 0
    return students.filter(
      (s) => s.status === 'approved' && s.class === routineForm.classId && (!routineForm.sectionId || s.section === routineForm.sectionId)
    ).length
  }, [students, routineForm.classId, routineForm.sectionId])

  // Auto-suggest room based on student count
  const suggestedRoom = useMemo(() => {
    if (routineStudentCount === 0) return null
    return rooms.find((r) => r.isActive && r.capacity >= routineStudentCount) || null
  }, [rooms, routineStudentCount])

  // Room form
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [editRoom, setEditRoom] = useState<ExamRoom | null>(null)
  const [roomForm, setRoomForm] = useState({ roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' })

  // Seat plan
  const [seatClassId, setSeatClassId] = useState('')
  const [seatSectionId, setSeatSectionId] = useState('')
  const [assignRoomStudentId, setAssignRoomStudentId] = useState('')
  const [assignRoomId, setAssignRoomId] = useState('')

  // Invigilator form
  const [showInvigForm, setShowInvigForm] = useState(false)
  const [invigForm, setInvigForm] = useState({ roomId: '', teacherId: '', date: '', shift: 'morning' as 'morning' | 'afternoon' })

  const selectedExam = useMemo(() => examConfigs.find((e) => e.id === selectedExamId) || null, [examConfigs, selectedExamId])

  // Calendar date range from exam
  const calendarRange = useMemo(() => {
    if (!selectedExam?.startDate || !selectedExam?.endDate) return null
    try {
      const start = parseISO(selectedExam.startDate)
      const end = parseISO(selectedExam.endDate)
      return { start, end }
    } catch {
      return null
    }
  }, [selectedExam])

  // Auto-navigate calendar to exam start month when exam changes
  useEffect(() => {
    if (calendarRange) {
      setCurrentMonth(startOfMonth(calendarRange.start))
    }
  }, [calendarRange])

  const filteredRoutines = useMemo(
    () => (selectedExamId ? routines.filter((r) => r.examId === selectedExamId) : routines),
    [routines, selectedExamId]
  )

  // Room usage on selected date
  const roomUsage = useMemo(() => {
    if (!routineForm.date) return {}
    const usage: Record<string, number> = {}
    const dayRoutines = filteredRoutines.filter((r) => r.date === routineForm.date)
    for (const r of dayRoutines) {
      usage[r.roomNo] = (usage[r.roomNo] || 0) + 1
    }
    return usage
  }, [filteredRoutines, routineForm.date])

  const filteredSeatPlans = useMemo(
    () => (selectedExamId ? seatPlans.filter((sp) => sp.examId === selectedExamId) : seatPlans),
    [seatPlans, selectedExamId]
  )

  const filteredInvigilators = useMemo(
    () => (selectedExamId ? invigilators.filter((i) => i.examId === selectedExamId) : invigilators),
    [invigilators, selectedExamId]
  )

  const { classes } = useClassStore()
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  // Students for selected seat class/section
  const sectionStudents = useMemo(() => {
    if (!seatClassId || !seatSectionId) return []
    return students.filter((s) => s.status === 'approved' && s.class === seatClassId && s.section === seatSectionId)
  }, [students, seatClassId, seatSectionId])

  // Map studentId to seat plan for quick lookup
  const seatPlanByStudent = useMemo(() => {
    const map = new Map<string, (typeof filteredSeatPlans)[0]>()
    for (const sp of filteredSeatPlans) {
      map.set(sp.studentId, sp)
    }
    return map
  }, [filteredSeatPlans])

  // Subjects filtered by selected class/section in routine form, excluding subjects already scheduled on the selected date
  const routineFormSections = useMemo(
    () => (routineForm.classId ? sectionsMap[routineForm.classId] || [] : []),
    [routineForm.classId, sectionsMap]
  )

  const routineFormSubjects = useMemo(() => {
    if (!routineForm.classId) return subjects
    const classObj = classes.find((c) => c.name === routineForm.classId)
    if (!classObj) return subjects

    let classSubjects: typeof subjects = []

    // Check if section has its own subjectIds
    if (routineForm.sectionId) {
      const section = classObj.sections.find((s) => s.name === routineForm.sectionId)
      if (section?.subjectIds && section.subjectIds.length > 0) {
        classSubjects = subjects.filter((s) => section.subjectIds!.includes(s.id))
      }
    }

    // Fall back to class-level subjectIds
    if (classSubjects.length === 0 && classObj.subjectIds?.length > 0) {
      classSubjects = subjects.filter((s) => classObj.subjectIds.includes(s.id))
    }
    if (classSubjects.length === 0) classSubjects = subjects

    // Filter out subjects already scheduled on any day for this exam
    const scheduledSubjectIds = new Set(
      filteredRoutines
        .filter((r) => r.classId === routineForm.classId && r.sectionId === (routineForm.sectionId || 'A'))
        .map((r) => r.subjectId)
    )
    return classSubjects.filter((s) => !scheduledSubjectIds.has(s.id))
  }, [classes, routineForm.classId, routineForm.sectionId, routineForm.date, subjects, filteredRoutines])

  const handleSaveRoutine = useCallback(() => {
    if (!selectedExamId || !routineForm.classId || !routineForm.subjectId || !routineForm.date) return
    addRoutine({
      examId: selectedExamId,
      classId: routineForm.classId,
      sectionId: routineForm.sectionId || 'A',
      subjectId: routineForm.subjectId,
      date: routineForm.date,
      startTime: routineForm.startTime || '09:00',
      endTime: routineForm.endTime || '12:00',
      roomNo: routineForm.roomNo || 'R-101',
      status: getAutoStatus(routineForm.date),
    })
    setShowRoutineForm(false)
    setRoutineForm({ classId: '', sectionId: '', subjectId: '', date: '', startTime: '', endTime: '', roomNo: '' })
  }, [selectedExamId, routineForm, addRoutine])

  const handleSaveRoom = () => {
    if (!roomForm.roomNo || !roomForm.roomName) return
    if (editRoom) {
      updateRoom(editRoom.id, { ...roomForm, capacity: Number(roomForm.capacity) || 40, isActive: true })
    } else {
      addRoom({ ...roomForm, capacity: Number(roomForm.capacity) || 40, isActive: true })
    }
    setShowRoomForm(false)
    setEditRoom(null)
    setRoomForm({ roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' })
  }

  const handleAutoSeat = () => {
    if (!selectedExamId || !seatClassId || !seatSectionId) return
    const sectionStu = students
      .filter((s) => s.status === 'approved' && s.class === seatClassId && s.section === seatSectionId)
    if (sectionStu.length === 0) return
    // Remove existing seat plans for this class/section
    const existing = filteredSeatPlans.filter(
      (sp) => sp.classId === seatClassId && sp.sectionId === seatSectionId
    )
    for (const sp of existing) removeSeatPlan(sp.id)
    // Create seat plans without rooms (room assigned manually later)
    let seatNo = 1
    for (const student of sectionStu) {
      addSeatPlan({
        examId: selectedExamId,
        roomId: '',
        studentId: student.id,
        classId: seatClassId,
        sectionId: seatSectionId,
        seatNo,
        roll: student.roll || String(seatNo),
      })
      seatNo++
    }
  }

  const handleAssignSingleSeat = (studentId: string) => {
    if (!selectedExamId || !seatClassId || !seatSectionId || !assignRoomId) return
    // Remove existing seat plan for this student
    const existing = filteredSeatPlans.find((sp) => sp.studentId === studentId)
    if (existing) removeSeatPlan(existing.id)
    // Get next seat number for this room
    const roomSeats = filteredSeatPlans.filter((sp) => sp.roomId === assignRoomId)
    const nextSeatNo = roomSeats.length > 0 ? Math.max(...roomSeats.map((s) => s.seatNo)) + 1 : 1
    const student = students.find((s) => s.id === studentId)
    addSeatPlan({
      examId: selectedExamId,
      roomId: assignRoomId,
      studentId,
      classId: seatClassId,
      sectionId: seatSectionId,
      seatNo: nextSeatNo,
      roll: student?.roll || String(nextSeatNo),
    })
    setAssignRoomStudentId('')
    setAssignRoomId('')
  }

  const downloadSeatPlanPDF = () => {
    if (!selectedExamId) return
    const examName = selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''
    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#4f46e5'

    // Group seat plans by class-section
    const grouped = new Map<string, typeof filteredSeatPlans>()
    for (const sp of filteredSeatPlans) {
      const key = `${sp.classId}-${sp.sectionId}`
      const existing = grouped.get(key) || []
      existing.push(sp)
      grouped.set(key, existing)
    }

    for (const [, plans] of grouped) {
      plans.sort((a, b) => a.seatNo - b.seatNo)
    }

    const CARDS_PER_PAGE = 20
    const allGroups = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    let pagesHTML = ''
    for (const [groupKey, plans] of allGroups) {
      const [cls, sec] = groupKey.split('-')
      const totalPages = Math.ceil(plans.length / CARDS_PER_PAGE)

      for (let page = 0; page < totalPages; page++) {
        const startIdx = page * CARDS_PER_PAGE
        const pagePlans = plans.slice(startIdx, startIdx + CARDS_PER_PAGE)

        const cards = pagePlans.map((sp) => {
          const student = studentMap.get(sp.studentId)
          const room = roomMap.get(sp.roomId)
          const isAssigned = !!sp.roomId
          const initials = (student?.nameEn || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

          const photoHTML = student?.photo
            ? `<img src="${student.photo}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid #e2e8f0"/>`
            : `<div style="width:56px;height:56px;border-radius:50%;background:${brandColor}15;color:${brandColor};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;border:2px solid ${brandColor}20">${initials}</div>`

          const seatBadge = isAssigned
            ? `<div style="position:absolute;top:-8px;right:-8px;width:28px;height:28px;border-radius:50%;background:${brandColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;box-shadow:0 2px 6px ${brandColor}40">${sp.seatNo}</div>`
            : ''

          const bottomBadges = isAssigned
            ? `<div style="margin-top:12px;display:flex;align-items:center;justify-content:center;gap:6px">
                <span style="font-size:9px;padding:2px 8px;border-radius:20px;background:${brandColor};color:#fff;font-weight:500">${isBn ? 'আসন' : 'Seat'}: ${sp.seatNo}</span>
                <span style="font-size:9px;padding:2px 8px;border-radius:20px;background:#ccfbf1;color:#0d9488;font-weight:500">${room?.roomNo || '?'}</span>
              </div>`
            : `<div style="margin-top:12px;text-align:center"><span style="font-size:9px;color:#94a3b8;font-style:italic">${isBn ? 'আসন বরাদ্দ হয়নি' : 'Not assigned'}</span></div>`

          const borderColor = isAssigned ? '#22c55e' : '#e2e8f0'
          const bgColor = isAssigned ? '#f0fdf4' : '#fff'

          return `<div style="position:relative;width:140px;border:2px solid ${borderColor};border-radius:16px;padding:16px;background:${bgColor};page-break-inside:avoid">
            ${seatBadge}
            <div style="display:flex;justify-content:center;margin-bottom:12px">${photoHTML}</div>
            <div style="text-align:center">
              <div style="font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${student?.nameEn || '-'}</div>
              <div style="font-size:10px;color:#64748b;margin-top:2px">${cls} - ${sec}</div>
              <div style="font-size:10px;color:#64748b">${isBn ? 'রোল' : 'Roll'}: ${sp.roll}</div>
              <div style="font-size:9px;color:#94a3b8;margin-top:4px">${examName}</div>
            </div>
            ${bottomBadges}
          </div>`
        }).join('')

        pagesHTML += `
          <div class="page">
            <div class="header">
              <h1>${examName}</h1>
              <h2>${isBn ? 'আসন পরিকল্পনা' : 'Seat Plan'} — ${cls} ${isBn ? 'শ্রেণি' : 'Class'} ${sec} ${isBn ? 'সেকশন' : 'Section'}</h2>
              <div class="info">${isBn ? 'মোট শিক্ষার্থী' : 'Total Students'}: ${plans.length} ${isBn ? 'জন' : ''} ${totalPages > 1 ? `| ${isBn ? 'পৃষ্ঠা' : 'Page'} ${page + 1}/${totalPages}` : ''}</div>
            </div>
            <div class="cards-grid">${cards}</div>
            <div class="footer">
              ${isBn ? 'তারিখ' : 'Date'}: ${new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US')} |
              ${isBn ? 'স্কুল' : 'School'}: ${isBn ? 'এডুটেক স্কুল' : 'EduTech School'}
            </div>
          </div>
        `
      }
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>${examName} - Seat Plan</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        @page{size:A4 portrait;margin:10mm}
        body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;background:#fff;font-size:10px}
        .page{page-break-after:always;padding:15px}
        .page:last-child{page-break-after:auto}
        .header{text-align:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid ${brandColor}}
        h1{font-size:16px;color:${brandColor};margin-bottom:2px}
        h2{font-size:11px;color:#64748b;font-weight:400;margin-top:2px}
        .info{font-size:10px;color:#94a3b8;margin-top:4px}
        .cards-grid{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}
        .footer{margin-top:12px;padding-top:8px;border-top:1px solid #e2e8f0;text-align:center;font-size:8px;color:#94a3b8}
        @media print{
          body{padding:0;margin:0}
          @page{size:A4 portrait;margin:8mm}
          .page{padding:10px}
        }
      </style>
    </head><body>${pagesHTML}</body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${examName.replace(/\s+/g, '_')}_Seat_Plan.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSaveInvig = () => {
    if (!selectedExamId || !invigForm.roomId || !invigForm.teacherId || !invigForm.date) return
    addInvigilator({
      examId: selectedExamId,
      roomId: invigForm.roomId,
      teacherId: invigForm.teacherId,
      date: invigForm.date,
      session: invigForm.shift,
      shift: invigForm.shift,
    })
    setShowInvigForm(false)
    setInvigForm({ roomId: '', teacherId: '', date: '', shift: 'morning' })
  }

  const subjectMap = useMemo(() => {
    const map = new Map<string, (typeof subjects)[0]>()
    for (const s of subjects) map.set(s.id, s)
    return map
  }, [subjects])

  const studentMap = useMemo(() => {
    const map = new Map<string, (typeof students)[0]>()
    for (const s of students) map.set(s.id, s)
    return map
  }, [students])

  const roomMap = useMemo(() => {
    const map = new Map<string, (typeof rooms)[0]>()
    for (const r of rooms) map.set(r.id, r)
    return map
  }, [rooms])

  const teacherMap = useMemo(() => {
    const map = new Map<string, (typeof teachers)[0]>()
    for (const t of teachers) map.set(t.id, t)
    return map
  }, [teachers])

  const roomCapacityMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const sp of seatPlans) {
      map.set(sp.roomId, (map.get(sp.roomId) || 0) + 1)
    }
    return map
  }, [seatPlans])

  // ── Calendar computations ──
  const calendarDays = useMemo(() => {
    if (!calendarRange) {
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
      return eachDayOfInterval({ start: calStart, end: calEnd })
    }
    // Only show days within the exam date range for the current month
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const rangeStart = calendarRange.start < monthStart ? monthStart : calendarRange.start
    const rangeEnd = calendarRange.end > monthEnd ? monthEnd : calendarRange.end
    if (rangeStart > rangeEnd) return []
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd })
  }, [currentMonth, calendarRange])

  const routinesByDate = useMemo(() => {
    const map = new Map<string, ExamRoutine[]>()
    for (const r of filteredRoutines) {
      const existing = map.get(r.date) || []
      existing.push(r)
      map.set(r.date, existing)
    }
    return map
  }, [filteredRoutines])

  const getRoutinesForDay = useCallback(
    (day: Date) => {
      const key = format(day, 'yyyy-MM-dd')
      return routinesByDate.get(key) || []
    },
    [routinesByDate]
  )

  const selectedDayRoutines = useMemo(() => {
    if (!selectedDate) return []
    return getRoutinesForDay(selectedDate)
  }, [selectedDate, getRoutinesForDay])

  const examDayCount = useMemo(() => {
    if (!calendarRange) return 0
    return eachDayOfInterval({ start: calendarRange.start, end: calendarRange.end }).length
  }, [calendarRange])

  const completedDays = useMemo(() => {
    return filteredRoutines.filter((r) => getAutoStatus(r.date) === 'completed').length
  }, [filteredRoutines])

  const upcomingDays = useMemo(() => {
    return filteredRoutines.filter((r) => getAutoStatus(r.date) === 'upcoming').length
  }, [filteredRoutines])

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exams')}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[16px] font-bold text-[var(--text-primary)]">
              {isBn ? 'ধাপ ২: সময়সূচী ও আসন পরিকল্পনা' : 'Step 2: Schedule & Seat Planning'}
            </h1>
            <p className="text-[11px] text-[var(--text-muted)]">
              {isBn ? 'রুটিন, কক্ষ, আসন ও ইনভিজিলেটর ব্যবস্থাপনা' : 'Routine, rooms, seating & invigilator management'}
            </p>
          </div>
        </div>
      </div>

      {/* Exam Selector */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className={`${selectCls} max-w-[300px]`}>
          <option value="">{isBn ? 'সকল পরীক্ষা' : 'All Exams'}</option>
          {examConfigs.map((e) => (
            <option key={e.id} value={e.id}>
              {isBn ? e.nameBn : e.name} {e.isActive ? '(Active)' : ''}
            </option>
          ))}
        </select>
        {selectedExam && (
          <span className="ml-3 text-[11px] text-[var(--text-muted)]">
            {selectedExam.startDate} — {selectedExam.endDate}
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] flex gap-2 overflow-x-auto">
        {[
          { key: 'rooms' as SubTab, label: isBn ? 'কক্ষ' : 'Rooms', icon: <Building size={14} />, count: rooms.length },
          { key: 'routine' as SubTab, label: isBn ? 'রুটিন' : 'Routine', icon: <Calendar size={14} />, count: filteredRoutines.length },
          {
            key: 'seats' as SubTab,
            label: isBn ? 'আসন পরিকল্পনা' : 'Seat Plan',
            icon: <LayoutGrid size={14} />,
            count: filteredSeatPlans.length,
          },
          {
            key: 'invigilators' as SubTab,
            label: isBn ? 'ইনভিজিলেটর' : 'Invigilators',
            icon: <UserCheck size={14} />,
            count: filteredInvigilators.length,
          },
          { key: 'attendance' as SubTab, label: isBn ? 'উপস্থিতি' : 'Attendance', icon: <Users size={14} /> },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border-none transition-all whitespace-nowrap ${activeSubTab === t.key ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && <span className="text-[10px] opacity-70">({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ═══ ROUTINE TAB – FULL-SCREEN CALENDAR ═══ */}
        {activeSubTab === 'routine' && (
          <div className="flex flex-col h-full">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className={`${sectionCls} !mb-0 flex items-center gap-3`}>
                <div className="w-9 h-9 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
                  <Calendar size={16} className="text-[var(--brand)]" />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[var(--text-primary)]">{examDayCount}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{isBn ? 'পরীক্ষার দিন' : 'Exam Days'}</div>
                </div>
              </div>
              <div className={`${sectionCls} !mb-0 flex items-center gap-3`}>
                <div className="w-9 h-9 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
                  <BookOpen size={16} className="text-[var(--brand)]" />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[var(--text-primary)]">{filteredRoutines.length}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{isBn ? 'মোট রুটিন' : 'Total Routines'}</div>
                </div>
              </div>
              <div className={`${sectionCls} !mb-0 flex items-center gap-3`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--green-light)' }}>
                  <CheckCircle size={16} style={{ color: 'var(--green)' }} />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[var(--text-primary)]">{completedDays}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{isBn ? 'সম্পন্ন' : 'Completed'}</div>
                </div>
              </div>
              <div className={`${sectionCls} !mb-0 flex items-center gap-3`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--amber-light)' }}>
                  <Clock size={16} style={{ color: 'var(--amber)' }} />
                </div>
                <div>
                  <div className="text-[16px] font-bold text-[var(--text-primary)]">{upcomingDays}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{isBn ? 'আসন্ন' : 'Upcoming'}</div>
                </div>
              </div>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="text-[15px] font-bold text-[var(--text-primary)] min-w-[160px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => {
                    setCurrentMonth(new Date())
                    setSelectedDate(new Date())
                  }}
                  className="ml-2 px-3 py-1.5 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] text-[11px] font-medium cursor-pointer border border-[var(--brand)] hover:shadow-sm"
                >
                  {isBn ? 'আজ' : 'Today'}
                </button>
              </div>
              {filteredRoutines.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={routineOrientation}
                    onChange={(e) => setRoutineOrientation(e.target.value as 'landscape' | 'portrait')}
                    className="h-7 px-2 pr-7 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2710%27%20height%3D%2710%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%2394a3b8%27%20stroke-width%3D%272%27%3E%3Cpolyline%20points%3D%276%209%2012%2015%2018%209%27%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_6px_center] hover:border-[var(--brand)] transition-all"
                  >
                    <option value="landscape">{isBn ? 'ল্যান্ডস্কেপ' : 'Landscape'}</option>
                    <option value="portrait">{isBn ? 'পোর্ট্রেট' : 'Portrait'}</option>
                  </select>
                <button
                  onClick={() => {
                    const examName = selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''

                    // Get brand color from CSS variable
                    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#4f46e5'

                    // Group routines by date
                    const byDate = new Map<string, typeof filteredRoutines>()
                    for (const r of filteredRoutines) {
                      const existing = byDate.get(r.date) || []
                      existing.push(r)
                      byDate.set(r.date, existing)
                    }
                    const sortedDates = [...byDate.keys()].sort()

                    // Get unique class names for columns
                    const classNames = [...new Set(filteredRoutines.map((r) => r.classId))].sort()

                    // Build date rows
                    const dateRows = sortedDates.map((date, idx) => {
                      const dayRoutines = byDate.get(date) || []
                      const weekday = new Date(date).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'short' })
                      const bgColor = idx % 2 === 0 ? '#fff' : '#f8fafc'
                      const classCells = classNames.map((cls) => {
                        const cellRoutines = dayRoutines.filter((r) => r.classId === cls)
                        if (cellRoutines.length === 0) return `<td style="padding:4px 6px;border:1px solid #e2e8f0;background:${bgColor}"></td>`
                        const items = cellRoutines.map((r) => {
                          const subject = subjectMap.get(r.subjectId)
                          const subjName = isBn ? subject?.nameBn : subject?.name || ''
                          return `<div style="margin-bottom:2px"><strong style="color:#1e293b;font-size:9px">${subjName}</strong> <span style="font-size:7px;color:#fff;background:${brandColor};padding:1px 4px;border-radius:3px;font-weight:600">Sec ${r.sectionId}</span><br/><span style="font-size:8px;color:#64748b">${r.startTime}–${r.endTime}</span> <span style="font-size:8px;color:#94a3b8">${r.roomNo}</span></div>`
                        }).join('')
                        return `<td style="padding:4px 6px;border:1px solid #e2e8f0;background:${bgColor};vertical-align:top;text-align:center">${items}</td>`
                      }).join('')
                      return `<tr>
                        <td style="padding:4px 6px;border:1px solid #e2e8f0;background:${bgColor};white-space:nowrap;text-align:center"><strong style="font-size:9px">${date}</strong><br/><span style="font-size:8px;color:#94a3b8">${weekday}</span></td>
                        ${classCells}
                      </tr>`
                    }).join('')

                    const classHeaders = classNames.map((cls) => `<th style="background:${brandColor};color:#fff;padding:5px 8px;border:1px solid ${brandColor};text-align:center;font-weight:600;font-size:10px;white-space:nowrap">${cls}</th>`).join('')

                    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
                      <title>${examName} - Routine</title>
                      <style>
                        *{margin:0;padding:0;box-sizing:border-box}
                        @page{size:A4 ${routineOrientation};margin:10mm}
                        body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;padding:15px;color:#1e293b;background:#fff;font-size:10px}
                        .header{text-align:center;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid ${brandColor}}
                        h1{font-size:16px;color:${brandColor};margin-bottom:2px}
                        h2{font-size:11px;color:#64748b;font-weight:400;margin-top:2px}
                        .info{font-size:10px;color:#94a3b8;margin-top:4px}
                        table{width:auto;border-collapse:collapse;font-size:9px}
                        th{padding:5px 8px;border:1px solid ${brandColor};text-align:center;font-weight:600;font-size:10px}
                        td{border:1px solid #e2e8f0;text-align:center}
                        .footer{margin-top:12px;padding-top:8px;border-top:1px solid #e2e8f0;text-align:center;font-size:8px;color:#94a3b8}
                        @media print{
                          body{padding:0;margin:0}
                          @page{size:A4 ${routineOrientation};margin:8mm}
                          th{color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
                          td{-webkit-print-color-adjust:exact;print-color-adjust:exact}
                        }
                      </style>
                    </head><body>
                      <div class="header">
                        <h1>${examName}</h1>
                        <h2>${isBn ? 'পরীক্ষার সময়সূচী' : 'Exam Routine'}</h2>
                        <div class="info">${selectedExam?.startDate || ''} — ${selectedExam?.endDate || ''}</div>
                      </div>
                      <div style="display:flex;justify-content:center">
                      <table>
                        <thead><tr>
                          <th style="background:${brandColor};color:#fff;padding:5px 8px;border:1px solid ${brandColor};text-align:center;font-weight:600;font-size:10px;white-space:nowrap">${isBn ? 'তারিখ' : 'Date'}</th>
                          ${classHeaders}
                        </tr></thead>
                        <tbody>${dateRows}</tbody>
                      </table>
                      </div>
                      <div class="footer">${isBn ? 'ইহা সিস্টেম দ্বারা নির্মিত' : 'System Generated'} • ${new Date().toLocaleDateString()}</div>
                    </body></html>`

                    const blob = new Blob([html], { type: 'text/html' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${examName.replace(/\s+/g, '_')}_Routine.html`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[var(--brand)] text-white text-[11px] font-medium cursor-pointer border-none hover:shadow-sm"
                >
                  <Download size={13} />
                  {isBn ? 'রুটিন ডাউনলোড' : 'Download Routine'}
                </button>
                </div>
              )}
            </div>

            {/* Calendar Grid */}
            <div className={`${sectionCls} !mb-0 flex-1 flex flex-col`}>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {(isBn ? WEEKDAYS_BN : WEEKDAYS_EN).map((day) => (
                  <div key={day} className="text-center text-[11px] font-semibold text-[var(--text-muted)] py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 flex-1">
                {calendarDays.map((day, idx) => {
                  const dayRoutines = getRoutinesForDay(day)
                  const today = isToday(day)
                  const selected = selectedDate && isSameDay(day, selectedDate)
                  const hasRoutine = dayRoutines.length > 0
                  const hasCompleted = dayRoutines.some((r) => getAutoStatus(r.date) === 'completed')
                  const hasInProgress = dayRoutines.some((r) => getAutoStatus(r.date) === 'in-progress')
                  const hasUpcoming = dayRoutines.some((r) => getAutoStatus(r.date) === 'upcoming')

                  let borderStyle = ''
                  if (hasCompleted) borderStyle = 'border-[var(--green)]'
                  else if (hasInProgress) borderStyle = 'border-[var(--amber)]'
                  else if (hasUpcoming) borderStyle = 'border-[var(--brand)]'

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDate(day)
                        setShowDayDetail(true)
                      }}
                      className={`
                        relative min-h-[72px] p-1.5 rounded-xl border-2 cursor-pointer transition-all
                        ${today ? 'border-[var(--brand)] bg-[var(--brand-light)] shadow-md ring-1 ring-[var(--brand)]/30' : ''}
                        ${!today && !hasRoutine ? 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)] hover:shadow-sm' : ''}
                        ${!today && hasRoutine ? `${borderStyle} bg-[var(--bg-primary)] hover:shadow-md` : ''}
                        ${selected ? 'ring-2 ring-[var(--brand)] ring-offset-1' : ''}
                      `}
                    >
                      {/* Today badge */}
                      {today && (
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-full bg-[var(--brand)] text-white text-[7px] font-bold uppercase tracking-wider">
                          {isBn ? 'আজ' : 'Today'}
                        </div>
                      )}
                      {/* Date number */}
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`
                            text-[11px] font-semibold
                            ${today ? 'w-5 h-5 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[10px]' : 'text-[var(--text-primary)]'}
                          `}
                        >
                          {format(day, 'd')}
                        </span>
                        {hasRoutine && (
                          <span className="text-[9px] font-bold text-[var(--text-muted)]">{dayRoutines.length}</span>
                        )}
                      </div>

                      {/* Routine dots / mini cards */}
                      {hasRoutine && (
                        <div className="space-y-0.5">
                          {dayRoutines.slice(0, 3).map((r) => {
                            const st = statusStyles[getAutoStatus(r.date)]
                            const subject = subjectMap.get(r.subjectId)
                            return (
                              <div
                                key={r.id}
                                className="flex items-center gap-1 px-1 py-0.5 rounded-md text-[8px] font-medium truncate"
                                style={{ background: st.bg, color: st.color }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ background: st.dot }}
                                />
                                <span className="truncate">{isBn ? subject?.nameBn : subject?.name}</span>
                                {r.classId && <span className="opacity-70 shrink-0">{r.classId}</span>}
                              </div>
                            )
                          })}
                          {dayRoutines.length > 3 && (
                            <div className="text-[8px] text-[var(--text-muted)] text-center">
                              +{dayRoutines.length - 3} {isBn ? 'আরও' : 'more'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Day Detail Panel */}
            {showDayDetail && selectedDate && (
              <div className="mt-3">
                <div className={sectionCls}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={sectionTitleCls}>
                      <Calendar size={15} className="text-[var(--brand)]" />
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRoutineForm({
                            classId: '',
                            sectionId: '',
                            subjectId: '',
                            date: format(selectedDate!, 'yyyy-MM-dd'),
                            startTime: '',
                            endTime: '',
                            roomNo: '',
                          })
                          setShowRoutineForm(true)
                        }}
                        className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[var(--brand)] text-white text-[11px] font-medium cursor-pointer border-none"
                      >
                        <Plus size={12} />
                        {isBn ? 'যোগ করুন' : 'Add'}
                      </button>
                      <button
                        onClick={() => setShowDayDetail(false)}
                        className="w-6 h-6 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {selectedDayRoutines.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDayRoutines
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((routine) => {
                          const subject = subjectMap.get(routine.subjectId)
                          const st = statusStyles[getAutoStatus(routine.date)]
                          return (
                            <div
                              key={routine.id}
                              className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:shadow-sm transition-all"
                            >
                              <div className="flex flex-col items-center shrink-0 w-12">
                                <div className="text-[10px] text-[var(--text-muted)]">{routine.startTime}</div>
                                <div className="w-px h-3 bg-[var(--border)]" />
                                <div className="text-[10px] text-[var(--text-muted)]">{routine.endTime}</div>
                              </div>
                              <div className="w-px h-10 rounded-full shrink-0" style={{ background: st.dot }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                                    {isBn ? subject?.nameBn : subject?.name}
                                  </span>
                                  <span
                                    className="text-[9px] py-[1px] px-[5px] rounded-[4px] font-medium"
                                    style={{ background: st.bg, color: st.color }}
                                  >
                                    {isBn ? st.labelBn : st.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                                  <span className="flex items-center gap-1">
                                    <MapPin size={9} />
                                    {routine.roomNo}
                                  </span>
                                  <span>{routine.classId} {routine.sectionId}</span>
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteRoutine(routine.id)
                                  }}
                                  className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                      <Calendar size={24} className="mx-auto mb-2 opacity-30" />
                      {isBn ? 'এই দিনে কোনো রুটিন নেই' : 'No routines on this day'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ ROOMS TAB ═══ */}
        {activeSubTab === 'rooms' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">
                {rooms.length} {isBn ? 'টি কক্ষ' : 'rooms'}
              </span>
              <button
                onClick={() => {
                  setShowRoomForm(true)
                  setEditRoom(null)
                  setRoomForm({ roomNo: '', roomName: '', capacity: '40', building: 'Main', floor: '1st' })
                }}
                className={btnPrimary}
              >
                <Plus size={14} />
                {isBn ? 'নতুন কক্ষ' : 'New Room'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {rooms.map((room) => {
                const assignedSeats = roomCapacityMap.get(room.id) || 0
                const utilization = room.capacity > 0 ? Math.round((assignedSeats / room.capacity) * 100) : 0
                return (
                  <div key={room.id} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] p-[14px] transition-all hover:shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--text-primary)]">{room.roomNo}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {room.roomName} · {room.building} · {room.floor}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditRoom(room)
                            setRoomForm({
                              roomNo: room.roomNo,
                              roomName: room.roomName,
                              capacity: String(room.capacity),
                              building: room.building,
                              floor: room.floor,
                            })
                            setShowRoomForm(true)
                          }}
                          className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--brand)]"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) deleteRoom(room.id)
                          }}
                          className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span>
                        {assignedSeats}/{room.capacity} {isBn ? 'আসন' : 'seats'}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: utilization > 90 ? 'var(--red)' : utilization > 70 ? 'var(--amber)' : 'var(--green)' }}
                      >
                        {utilization}% {isBn ? 'ব্যবহৃত' : 'used'}
                      </span>
                    </div>
                    <div className="mt-2 h-[5px] bg-[var(--border)] rounded-[3px]">
                      <div
                        className="h-full rounded-[3px] transition-all"
                        style={{
                          width: utilization > 0 ? `${Math.max(utilization, 5)}%` : '0%',
                          background: utilization > 90 ? 'var(--red)' : utilization > 70 ? 'var(--amber)' : 'var(--green)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ═══ SEATS TAB ═══ */}
        {activeSubTab === 'seats' && (
          <>
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <LayoutGrid size={15} className="text-[var(--brand)]" />
                {isBn ? 'আসন বরাদ্দ' : 'Seat Assignment'}
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                  <select
                    value={seatClassId}
                    onChange={(e) => {
                      setSeatClassId(e.target.value)
                      setSeatSectionId('')
                    }}
                    className={`${selectCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select
                    value={seatSectionId}
                    onChange={(e) => setSeatSectionId(e.target.value)}
                    className={`${selectCls} w-full`}
                    disabled={!seatClassId}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {(sectionsMap[seatClassId] || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleAutoSeat}
                    disabled={!seatClassId || !seatSectionId || !selectedExamId}
                    className={`${btnPrimary} text-[11px] ${!seatClassId || !seatSectionId || !selectedExamId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <LayoutGrid size={13} />
                    {isBn ? 'অটো বরাদ্দ' : 'Auto Assign'}
                  </button>
                  {filteredSeatPlans.length > 0 && (
                    <button
                      onClick={downloadSeatPlanPDF}
                      className="px-3 py-2 rounded-lg bg-[var(--teal-light)] border border-[var(--teal)]/20 text-[var(--teal)] text-[11px] font-medium cursor-pointer hover:shadow-sm flex items-center gap-1.5"
                    >
                      <Download size={13} />
                      {isBn ? 'আসন পরিকল্পনা ডাউনলোড' : 'Download Seat Plan'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Student Cards Grid */}
            {seatClassId && seatSectionId ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {sectionStudents.map((student) => {
                  const seatPlan = seatPlanByStudent.get(student.id)
                  const room = seatPlan ? roomMap.get(seatPlan.roomId) : null
                  const isAssigned = !!seatPlan
                  const initials = student.nameEn.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <div
                      key={student.id}
                      className={`
                        relative rounded-2xl border-2 p-4 transition-all cursor-pointer
                        ${isAssigned
                          ? 'border-[var(--green)] bg-[var(--green-light)]/30 hover:shadow-md'
                          : 'border-dashed border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)] hover:shadow-sm'
                        }
                      `}
                      onClick={() => {
                        if (!isAssigned) {
                          setAssignRoomStudentId(student.id)
                          setAssignRoomId('')
                        }
                      }}
                    >
                      {/* Seat badge */}
                      {isAssigned && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[10px] font-bold shadow-md">
                          {seatPlan.seatNo}
                        </div>
                      )}

                      {/* Photo / Avatar */}
                      <div className="flex justify-center mb-3">
                        {student.photo ? (
                          <img src={student.photo} alt={student.nameEn} className="w-14 h-14 rounded-full object-cover border-2 border-[var(--border)]" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)] text-[16px] font-bold border-2 border-[var(--brand)]/20">
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="text-center">
                        <div className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{student.nameEn}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {student.class} - {student.section}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {isBn ? 'রোল' : 'Roll'}: {student.roll}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] mt-1 truncate">
                          {selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''}
                        </div>
                      </div>

                      {/* Seat / Room info */}
                      {isAssigned ? (
                        <div className="mt-3 flex items-center justify-center gap-1.5">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--brand)] text-white font-medium">
                            {isBn ? 'আসন' : 'Seat'}: {seatPlan.seatNo}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--teal-light)] text-[var(--teal)] font-medium">
                            {room?.roomNo || '?'}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 text-center">
                          <span className="text-[9px] text-[var(--text-muted)] italic">
                            {isBn ? 'আসন বরাদ্দ হয়নি' : 'Click to assign'}
                          </span>
                        </div>
                      )}

                      {/* Remove button */}
                      {isAssigned && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(isBn ? 'আসন বাতিল করবেন?' : 'Remove seat?')) removeSeatPlan(seatPlan.id)
                          }}
                          className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={`${sectionCls} text-center py-10`}>
                <LayoutGrid size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[13px] text-[var(--text-muted)]">
                  {isBn ? 'শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select class & section to view students'}
                </p>
              </div>
            )}

            {/* Assign Room Modal */}
            {assignRoomStudentId && (
              <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
                <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[320px] w-full p-5 border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{isBn ? 'কক্ষ বরাদ্দ' : 'Assign Room'}</h3>
                    <button
                      onClick={() => setAssignRoomStudentId('')}
                      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[12px] text-[var(--text-secondary)]">
                      {sectionStudents.find((s) => s.id === assignRoomStudentId)?.nameEn}
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
                      <select
                        value={assignRoomId}
                        onChange={(e) => setAssignRoomId(e.target.value)}
                        className={`${selectCls} w-full`}
                      >
                        <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                        {rooms.filter((r) => r.isActive).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.roomNo} ({r.capacity} {isBn ? 'আসন' : 'seats'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button
                      onClick={() => setAssignRoomStudentId('')}
                      className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => handleAssignSingleSeat(assignRoomStudentId)}
                      disabled={!assignRoomId}
                      className={`${btnPrimary} text-[12px] ${!assignRoomId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isBn ? 'বরাদ্দ করুন' : 'Assign'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ INVIGILATORS TAB ═══ */}
        {activeSubTab === 'invigilators' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] text-[var(--text-secondary)]">
                {filteredInvigilators.length} {isBn ? 'জন ইনভিজিলেটর' : 'invigilators'}
              </span>
              <button
                onClick={() => {
                  setShowInvigForm(true)
                  setInvigForm({ roomId: '', teacherId: '', date: '', shift: 'morning' })
                }}
                className={btnPrimary}
              >
                <Plus size={14} />
                {isBn ? 'নতুন নিয়োগ' : 'New Assignment'}
              </button>
            </div>
            <div className="space-y-2">
              {filteredInvigilators.map((inv) => {
                const teacher = teacherMap.get(inv.teacherId)
                const room = roomMap.get(inv.roomId)
                return (
                  <div key={inv.id} className={`${sectionCls} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] flex items-center justify-center">
                        <UserCheck size={14} className="text-[var(--brand)]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--text-primary)]">{teacher?.nameEn || inv.teacherId}</div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <MapPin size={10} />
                            {room?.roomNo || inv.roomId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {inv.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {inv.shift}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Remove?')) removeInvigilator(inv.id)
                      }}
                      className="w-6 h-6 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)]"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )
              })}
              {filteredInvigilators.length === 0 && (
                <div className={`${sectionCls} text-center py-10`}>
                  <UserCheck size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                  <p className="text-[13px] text-[var(--text-muted)]">
                    {isBn ? 'কোনো ইনভিজিলেটর নিয়োগ হয়নি' : 'No invigilators assigned'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ ATTENDANCE TAB ═══ */}
        {activeSubTab === 'attendance' && (
          <div className={sectionCls}>
            <div className={sectionTitleCls}>
              <Users size={15} className="text-[var(--brand)]" />
              {isBn ? 'পরীক্ষাভিত্তিক উপস্থিতি' : 'Exam-wise Student Attendance'}
            </div>
            <div className="text-center py-10 text-[var(--text-muted)] text-[12px]">
              <Users size={24} className="mx-auto mb-2 opacity-30" />
              {isBn ? 'পরীক্ষার দিনে উপস্থিতি নেওয়া হবে' : 'Attendance will be taken on exam day'}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Routine Form Modal ═══ */}
      {showRoutineForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[420px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{isBn ? 'নতুন রুটিন' : 'New Routine'}</h3>
              <button
                onClick={() => setShowRoutineForm(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                  <select
                    value={routineForm.classId}
                    onChange={(e) => {
                      const classId = e.target.value
                      const count = students.filter((s) => s.status === 'approved' && s.class === classId).length
                      const room = rooms.find((r) => r.isActive && r.capacity >= count)
                      setRoutineForm((p) => ({ ...p, classId, sectionId: '', subjectId: '', roomNo: room?.roomNo || '' }))
                    }}
                    className={`${selectCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select
                    value={routineForm.sectionId}
                    onChange={(e) => {
                      const sectionId = e.target.value
                      const count = students.filter((s) => s.status === 'approved' && s.class === routineForm.classId && s.section === sectionId).length
                      const room = rooms.find((r) => r.isActive && r.capacity >= count)
                      setRoutineForm((p) => ({ ...p, sectionId, subjectId: '', roomNo: room?.roomNo || '' }))
                    }}
                    className={`${selectCls} w-full`}
                    disabled={!routineForm.classId}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {routineFormSections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
                <select
                  value={routineForm.subjectId}
                  onChange={(e) => setRoutineForm((p) => ({ ...p, subjectId: e.target.value }))}
                  className={`${selectCls} w-full`}
                  disabled={!routineForm.classId}
                >
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {routineFormSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {isBn ? s.nameBn : s.name}
                    </option>
                  ))}
                </select>
                {routineForm.classId && routineFormSubjects.length === 0 && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {isBn ? 'এই শ্রেণিতে কোনো বিষয় নেই' : 'No subjects for this class'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
                <input
                  type="date"
                  value={routineForm.date}
                  onChange={(e) => setRoutineForm((p) => ({ ...p, date: e.target.value }))}
                  className={`${inputCls} w-full`}
                  min={selectedExam?.startDate || ''}
                  max={selectedExam?.endDate || ''}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শুরু' : 'Start'}</label>
                  <input
                    type="time"
                    value={routineForm.startTime}
                    onChange={(e) => setRoutineForm((p) => ({ ...p, startTime: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শেষ' : 'End'}</label>
                  <input
                    type="time"
                    value={routineForm.endTime}
                    onChange={(e) => setRoutineForm((p) => ({ ...p, endTime: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
                <select
                  value={routineForm.roomNo}
                  onChange={(e) => setRoutineForm((p) => ({ ...p, roomNo: e.target.value }))}
                  className={`${selectCls} w-full`}
                >
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {rooms.map((r) => {
                    const used = roomUsage[r.roomNo] || 0
                    const pct = r.capacity > 0 ? Math.round((used / r.capacity) * 100) : 0
                    return (
                      <option key={r.id} value={r.roomNo}>
                        {r.roomNo} ({r.capacity}) {used > 0 ? `- ${pct}% ${isBn ? 'ব্যবহৃত' : 'used'}` : ''}
                      </option>
                    )
                  })}
                </select>
                {routineForm.classId && routineStudentCount > 0 && (
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {isBn ? `শিক্ষার্থী: ${routineStudentCount} জন` : `Students: ${routineStudentCount}`}
                    {suggestedRoom && routineForm.roomNo !== suggestedRoom.roomNo && (
                      <span className="text-[var(--brand)] ml-1 cursor-pointer hover:underline" onClick={() => setRoutineForm((p) => ({ ...p, roomNo: suggestedRoom.roomNo }))}>
                        {isBn ? `(${suggestedRoom.roomNo} সাজেস্টেড)` : `(Suggest: ${suggestedRoom.roomNo})`}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowRoutineForm(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveRoutine} className={`${btnPrimary} text-[12px]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Room Form Modal ═══ */}
      {showRoomForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                {editRoom ? (isBn ? 'কক্ষ এডিট' : 'Edit Room') : isBn ? 'নতুন কক্ষ' : 'New Room'}
              </h3>
              <button
                onClick={() => {
                  setShowRoomForm(false)
                  setEditRoom(null)
                }}
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'কক্ষ নম্বর' : 'Room No'}
                  </label>
                  <input
                    value={roomForm.roomNo}
                    onChange={(e) => setRoomForm((p) => ({ ...p, roomNo: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="R-101"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                    {isBn ? 'কক্ষের নাম' : 'Room Name'}
                  </label>
                  <input
                    value={roomForm.roomName}
                    onChange={(e) => setRoomForm((p) => ({ ...p, roomName: e.target.value }))}
                    className={`${inputCls} w-full`}
                    placeholder="Room 101"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                  {isBn ? 'ধারণক্ষমতা' : 'Capacity'}
                </label>
                <input
                  type="number"
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm((p) => ({ ...p, capacity: e.target.value }))}
                  className={`${inputCls} w-full`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিল্ডিং' : 'Building'}</label>
                  <input
                    value={roomForm.building}
                    onChange={(e) => setRoomForm((p) => ({ ...p, building: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফ্লোর' : 'Floor'}</label>
                  <input
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm((p) => ({ ...p, floor: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setShowRoomForm(false)
                  setEditRoom(null)
                }}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveRoom} className={`${btnPrimary} text-[12px]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Invigilator Form Modal ═══ */}
      {showInvigForm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{isBn ? 'ইনভিজিলেটর নিয়োগ' : 'Assign Invigilator'}</h3>
              <button
                onClick={() => setShowInvigForm(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                <select
                  value={invigForm.teacherId}
                  onChange={(e) => setInvigForm((p) => ({ ...p, teacherId: e.target.value }))}
                  className={`${selectCls} w-full`}
                >
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
                <select
                  value={invigForm.roomId}
                  onChange={(e) => setInvigForm((p) => ({ ...p, roomId: e.target.value }))}
                  className={`${selectCls} w-full`}
                >
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
                  <input
                    type="date"
                    value={invigForm.date}
                    onChange={(e) => setInvigForm((p) => ({ ...p, date: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিফট' : 'Shift'}</label>
                  <select
                    value={invigForm.shift}
                    onChange={(e) => setInvigForm((p) => ({ ...p, shift: e.target.value as 'morning' | 'afternoon' }))}
                    className={`${selectCls} w-full`}
                  >
                    <option value="morning">{isBn ? 'সকাল' : 'Morning'}</option>
                    <option value="afternoon">{isBn ? 'বিকাল' : 'Afternoon'}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowInvigForm(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveInvig} className={`${btnPrimary} text-[12px]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
