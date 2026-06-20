import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
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
  GraduationCap,
  QrCode,
  IdCard,
  ClipboardCheck,
  UserX,
  MoreVertical,
  ChevronDown,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
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
import { sectionCls, sectionTitleCls, inputCls, selectCls, btnPrimary } from '@/lib/styles'
import { openPrintWindow } from '@/lib/pdf'
import * as XLSX from 'xlsx'
import { generateAttendanceSheetHTML } from './pdfTemplates/attendanceSheet'
import { generateScheduleReportHTML } from './pdfTemplates/scheduleReport'
import { generateExamRoutineGridPDF } from './pdfTemplates/examRoutinePdfTemplate'
import type { ExamRoutineGridData, ExamRoutineGridCell, ExamRoutinePDFOptions } from './pdfTemplates/examRoutinePdfTemplate'
import { generateInvigilatorGuardListPDF } from './pdfTemplates/invigilatorPdfTemplate'
import type { InvigilatorGridData, InvigilatorGridDay, InvigilatorGridRow, InvigilatorPDFOptions } from './pdfTemplates/invigilatorPdfTemplate'
import { ExamRoutinePDFOptionsModal } from '@/components/shared/ExamRoutinePDFOptionsModal'
import { InvigilatorPDFOptionsModal } from '@/components/shared/InvigilatorPDFOptionsModal'
import AdmitCardsTab from './AdmitCardsTab'

type SubTab = 'routine' | 'rooms' | 'seats' | 'invigilators' | 'attendance' | 'admit-cards'

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
  const teachers = useTeacherStore((s) => s.teachers)
  const subjects = useTeacherStore((s) => s.subjects)
  const students = useSessionStudents()
  const isBn = useBn()
  const { isMobile } = useWindowSize()

  const currentSession = useClassStore((s) => s.institution.currentSession)

  const allExamConfigs = useExamStore((s) => s.examConfigs)
  const examConfigs = useMemo(() => allExamConfigs.filter((e) => e.session === currentSession), [allExamConfigs, currentSession])
  const routines = useExamStore((s) => s.routines)
  const rooms = useExamStore((s) => s.rooms)
  const seatPlans = useExamStore((s) => s.seatPlans)
  const invigilators = useExamStore((s) => s.invigilators)
  const attendances = useExamStore((s) => s.attendances)
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)

  const sessionExamIds = useMemo(() => new Set(examConfigs.map((e) => e.id)), [examConfigs])
  const sessionRoutines = useMemo(() => routines.filter((r) => sessionExamIds.has(r.examId)), [routines, sessionExamIds])
  const sessionSeatPlans = useMemo(() => seatPlans.filter((sp) => sessionExamIds.has(sp.examId)), [seatPlans, sessionExamIds])
  const sessionInvigilators = useMemo(() => invigilators.filter((i) => sessionExamIds.has(i.examId)), [invigilators, sessionExamIds])
  const sessionAttendances = useMemo(() => attendances.filter((a) => sessionExamIds.has(a.examId)), [attendances, sessionExamIds])
  const sessionSubjectMarkConfigs = useMemo(() => subjectMarkConfigs.filter((s) => sessionExamIds.has(s.examId)), [subjectMarkConfigs, sessionExamIds])
  const addAttendance = useExamStore((s) => s.addAttendance)
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
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  const updateTabSlider = useCallback(() => {
    const activeEl = tabRefs.current.get(activeSubTab)
    const slider = sliderRef.current
    if (!activeEl || !slider) return
    const container = slider.parentElement
    if (!container) return
    const containerRect = container.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    slider.style.width = `${activeRect.width}px`
    slider.style.transform = `translateX(${activeRect.left - containerRect.left + container.scrollLeft}px)`
  }, [activeSubTab])

  useEffect(() => {
    updateTabSlider()
    const activeEl = tabRefs.current.get(activeSubTab)
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
    window.addEventListener('resize', updateTabSlider)
    return () => window.removeEventListener('resize', updateTabSlider)
  }, [updateTabSlider])

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
  const [showExamRoutinePDF, setShowExamRoutinePDF] = useState(false)
  const [showExamRoutineActionMenu, setShowExamRoutineActionMenu] = useState(false)
  const examRoutineActionMenuRef = useRef<HTMLDivElement>(null)
  const [showInvigPDF, setShowInvigPDF] = useState(false)
  const [invigGuardType, setInvigGuardType] = useState<'class' | 'room'>('class')
  const [showInvigActionMenu, setShowInvigActionMenu] = useState(false)
  const invigActionMenuRef = useRef<HTMLDivElement>(null)

  // Student count for routine form class/section
  const routineStudentCount = useMemo(() => {
    if (!routineForm.classId) return 0
    return students.filter(
      (s) => s.status === 'approved' && s.active !== false && s.class === routineForm.classId && (!routineForm.sectionId || s.section === routineForm.sectionId)
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
  const [invigAssignType, setInvigAssignType] = useState<'room' | 'class'>('room')
  const [invigForm, setInvigForm] = useState({ roomId: '', teacherId: '', date: '', shift: 'morning' as 'morning' | 'afternoon', classSection: '' })

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
    () => (selectedExamId ? sessionRoutines.filter((r) => r.examId === selectedExamId) : sessionRoutines),
    [sessionRoutines, selectedExamId]
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
    () => (selectedExamId ? sessionSeatPlans.filter((sp) => sp.examId === selectedExamId) : sessionSeatPlans),
    [sessionSeatPlans, selectedExamId]
  )

  const filteredInvigilators = useMemo(
    () => (selectedExamId ? sessionInvigilators.filter((i) => i.examId === selectedExamId) : sessionInvigilators),
    [sessionInvigilators, selectedExamId]
  )

  const filteredAttendances = useMemo(
    () => (selectedExamId ? sessionAttendances.filter((a) => a.examId === selectedExamId) : sessionAttendances),
    [sessionAttendances, selectedExamId]
  )

  // QR Scanner state
  const [attClassId, setAttClassId] = useState('')
  const [attSectionId, setAttSectionId] = useState('')
  const [attDate, setAttDate] = useState('')
  const [attShift, setAttShift] = useState<'morning' | 'afternoon'>('morning')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [lastScanned, setLastScanned] = useState('')

  const { classes } = useClassStore()
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  // Students for selected seat class/section
  const sectionStudents = useMemo(() => {
    if (!seatClassId || !seatSectionId) return []
    return students.filter((s) => s.status === 'approved' && s.active !== false && s.class === seatClassId && s.section === seatSectionId)
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

  const handleDownloadReport = () => {
    if (!selectedExam) {
      alert(isBn ? 'প্রথমে একটি সক্রিয় পরীক্ষা নির্বাচন করুন' : 'Select an active exam first')
      return
    }
    const inst = useClassStore.getState().institution
    const teachers = useTeacherStore.getState().teachers
    const html = generateScheduleReportHTML({
      exam: selectedExam,
      routines: filteredRoutines,
      rooms,
      seatPlans: filteredSeatPlans,
      invigilators: filteredInvigilators,
      subjects,
      teachers,
      classes,
      isBn,
      schoolName: inst.name,
      schoolNameBn: inst.nameBn,
      schoolAddress: inst.address,
    })
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>${isBn ? 'পরীক্ষার সময়সূচি প্রতিবেদন' : 'Exam Schedule Report'}</title>
      <style>
        @page{size:A4 landscape;margin:12mm}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:20px}
        @media print{
          body{background:#fff;padding:0}
          *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        }
      </style>
    </head><body>${html}
      <script>setTimeout(()=>window.print(),600)</script>
    </body></html>`)
    win.document.close()
  }

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
      .filter((s) => s.status === 'approved' && s.active !== false && s.class === seatClassId && s.section === seatSectionId)
    if (sectionStu.length === 0) return
    // Remove existing seat plans for this class/section
    const existing = filteredSeatPlans.filter(
      (sp) => sp.classId === seatClassId && sp.sectionId === seatSectionId
    )
    for (const sp of existing) removeSeatPlan(sp.id)
    // Find room from routine for this class/section
    const routine = routines.find((r) => r.examId === selectedExamId && r.classId === seatClassId && r.sectionId === seatSectionId)
    const matchedRoom = routine ? rooms.find((rm) => rm.roomNo === routine.roomNo && rm.isActive) : null
    // Create seat plans
    let seatNo = 1
    for (const student of sectionStu) {
      addSeatPlan({
        examId: selectedExamId,
        roomId: matchedRoom?.id || '',
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
    if (!selectedExamId || !seatClassId || !seatSectionId) return
    const examName = selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''
    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#4f46e5'

    // Only seat plans for selected class-section
    const plans = filteredSeatPlans
      .filter((sp) => sp.classId === seatClassId && sp.sectionId === seatSectionId)
      .sort((a, b) => a.seatNo - b.seatNo)

    if (plans.length === 0) return

    const CARDS_PER_PAGE = 20
    const totalPages = Math.ceil(plans.length / CARDS_PER_PAGE)

    let pagesHTML = ''
    for (let page = 0; page < totalPages; page++) {
      const startIdx = page * CARDS_PER_PAGE
      const pagePlans = plans.slice(startIdx, startIdx + CARDS_PER_PAGE)

        const cards = pagePlans.map((sp) => {
          const student = studentMap.get(sp.studentId)
          const room = roomMap.get(sp.roomId)
          const isAssigned = !!sp.roomId
          const initials = (student?.nameEn || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

          const photoHTML = student?.photo
            ? `<img src="${student.photo}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid ${brandColor}"/>`
            : `<div style="width:64px;height:64px;border-radius:50%;background:${brandColor}15;color:${brandColor};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;border:2px solid ${brandColor}">${initials}</div>`

          const seatRoomHTML = isAssigned
            ? `<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0">
                <div style="background:${brandColor};color:#fff;border-radius:8px;padding:4px 12px;text-align:center">
                  <div style="font-size:8px;opacity:0.8">${isBn ? 'আসন নং' : 'SEAT'}</div>
                  <div style="font-size:16px;font-weight:700;line-height:1">${sp.seatNo}</div>
                </div>
                <div style="background:#ccfbf1;color:#0d9488;border-radius:8px;padding:4px 12px;text-align:center;border:1px solid #99f6e4">
                  <div style="font-size:8px;opacity:0.8">${isBn ? 'কক্ষ' : 'ROOM'}</div>
                  <div style="font-size:14px;font-weight:700;line-height:1">${room?.roomNo || '-'}</div>
                </div>
              </div>`
            : ''

          const today = new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })

          return `<div style="width:180px;border:2px solid ${brandColor};border-radius:12px;overflow:hidden;page-break-inside:avoid;background:#fff">
            <div style="background:${brandColor};color:#fff;text-align:center;padding:8px">
              <div style="font-size:9px;font-weight:700;letter-spacing:1px">${isBn ? 'আসন পরিকল্পনা' : 'SEAT PLAN'}</div>
              <div style="font-size:8px;opacity:0.8;margin-top:2px">${isBn ? 'সানরাইজ একাডেমি' : 'Sunrise Academy'}</div>
            </div>
            <div style="padding:12px;text-align:center">
              <div style="display:flex;justify-content:center;margin-bottom:8px">${photoHTML}</div>
              <div style="font-size:13px;font-weight:700;color:#1e293b;line-height:1.2;margin-bottom:4px">${student?.nameEn || '-'}</div>
              <div style="font-size:10px;color:#64748b;margin-bottom:2px">
                ${isBn ? 'শ্রেণি' : 'Class'}: <b>${seatClassId}</b> ${isBn ? 'সেকশন' : 'Sec'}: <b>${seatSectionId}</b>
              </div>
              <div style="font-size:10px;color:#64748b;margin-bottom:8px">
                ${isBn ? 'রোল' : 'Roll'}: <b>${sp.roll}</b>
              </div>
              ${seatRoomHTML}
              <div style="border-top:1px solid #e2e8f0;padding-top:8px;margin-top:8px">
                <div style="font-size:10px;font-weight:600;color:${brandColor}">${examName}</div>
                <div style="font-size:8px;color:#94a3b8;margin-top:2px">${today}</div>
              </div>
            </div>
          </div>`
        }).join('')

        pagesHTML += `
          <div class="page">
            <div class="header">
              <h1>${examName}</h1>
              <h2>${isBn ? 'আসন পরিকল্পনা' : 'Seat Plan'} — ${seatClassId} ${isBn ? 'শ্রেণি' : 'Class'} ${seatSectionId} ${isBn ? 'সেকশন' : 'Section'}</h2>
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
        .cards-grid{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}
        .footer{margin-top:12px;padding-top:8px;border-top:1px solid #e2e8f0;text-align:center;font-size:8px;color:#94a3b8}
        @media print{
          *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
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
    if (!selectedExamId || !invigForm.teacherId || !invigForm.date) return
    if (invigAssignType === 'room' && !invigForm.roomId) return
    if (invigAssignType === 'class' && !invigForm.classSection) return

    addInvigilator({
      examId: selectedExamId,
      teacherId: invigForm.teacherId,
      date: invigForm.date,
      shift: invigForm.shift,
      assignType: invigAssignType,
      roomId: invigAssignType === 'room' ? invigForm.roomId : '',
      classSection: invigAssignType === 'class' ? invigForm.classSection : '',
    })
    setShowInvigForm(false)
    setInvigForm({ roomId: '', teacherId: '', date: '', shift: 'morning', classSection: '' })
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
    for (const r of filteredRoutines) {
      map.set(r.roomNo, (map.get(r.roomNo) || 0) + 1)
    }
    return map
  }, [filteredRoutines])

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

  // Click-outside handler for exam routine action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (examRoutineActionMenuRef.current && !examRoutineActionMenuRef.current.contains(event.target as Node)) {
        setShowExamRoutineActionMenu(false)
      }
    }
    if (showExamRoutineActionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExamRoutineActionMenu])

  // Exam routine grid data for PDF
  const examRoutineGridData: ExamRoutineGridData = useMemo(() => {
    const examName = selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''
    const examDateRange = selectedExam ? `${selectedExam.startDate} — ${selectedExam.endDate}` : ''

    const byDate = new Map<string, ExamRoutine[]>()
    for (const r of filteredRoutines) {
      const existing = byDate.get(r.date) || []
      existing.push(r)
      byDate.set(r.date, existing)
    }
    const sortedDates = [...byDate.keys()].sort()

    const dates = sortedDates.map((date) => {
      const weekday = new Date(date).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'short' })
      return { date, weekday }
    })

    const classNames = [...new Set(filteredRoutines.map((r) => r.classId))].sort()

    const grid: Record<string, Record<string, ExamRoutineGridCell[]>> = {}
    for (const date of sortedDates) {
      grid[date] = {}
      const dayRoutines = byDate.get(date) || []
      for (const cls of classNames) {
        const cellRoutines = dayRoutines.filter((r) => r.classId === cls)
        grid[date][cls] = cellRoutines.map((r) => {
          const subject = subjectMap.get(r.subjectId)
          const subjName = isBn ? subject?.nameBn : subject?.name || ''
          return {
            subject: subjName || '',
            section: `Sec ${r.sectionId}`,
            time: `${r.startTime}–${r.endTime}`,
            room: r.roomNo,
          }
        })
      }
    }

    return { dates, classNames, grid, examName, examDateRange }
  }, [filteredRoutines, selectedExam, isBn, subjectMap])

  const handleExamRoutinePDF = useCallback(
    (opts: ExamRoutinePDFOptions) => {
      const html = generateExamRoutineGridPDF(examRoutineGridData, { ...opts, institutionName: useClassStore.getState().institution.name })
      openPrintWindow(opts.title || examRoutineGridData.examName || 'Exam Routine', html)
      setShowExamRoutinePDF(false)
    },
    [examRoutineGridData]
  )

  const handleExamRoutineExcel = useCallback(() => {
    const { dates, classNames, grid, examName } = examRoutineGridData

    const rows = dates.map((d) => {
      const row: Record<string, string> = { Date: d.date, Day: d.weekday }
      for (const cls of classNames) {
        const cells = grid[d.date]?.[cls] || []
        row[cls] = cells.map((c) => `${c.subject} (${c.section}) ${c.time} ${c.room}`).join('\n')
      }
      return row
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.sheet_add_aoa(ws, [
      [examName],
      [examRoutineGridData.examDateRange],
      [],
    ], { origin: 'A1' })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Routine')
    XLSX.writeFile(wb, `${examName.replace(/\s+/g, '_')}_Routine_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [examRoutineGridData])

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

  // Click-outside handler for invigilator action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (invigActionMenuRef.current && !invigActionMenuRef.current.contains(event.target as Node)) {
        setShowInvigActionMenu(false)
      }
    }
    if (showInvigActionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showInvigActionMenu])

  // Invigilator guard list grid data
  const invigilatorGridData: InvigilatorGridData = useMemo(() => {
    const examName = selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''

    const filtered = filteredInvigilators.filter((inv) => inv.assignType === invigGuardType)

    const byDate = new Map<string, typeof filtered>()
    for (const inv of filtered) {
      const existing = byDate.get(inv.date) || []
      existing.push(inv)
      byDate.set(inv.date, existing)
    }
    const sortedDates = Array.from(byDate.keys()).sort()

    const days: InvigilatorGridDay[] = sortedDates.map((date) => {
      const dayAssignments = byDate.get(date) || []
      const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

      const rows: InvigilatorGridRow[] = dayAssignments.map((inv) => {
        const teacher = teacherMap.get(inv.teacherId)
        const shiftLabel = inv.shift === 'morning' ? (isBn ? 'সকাল' : 'Morning') : (isBn ? 'বিকাল' : 'Afternoon')

        if (invigGuardType === 'class') {
          const [cls, sec] = inv.classSection.split('-')
          const dayRoutine = filteredRoutines.find((r) => r.date === date && r.classId === cls && r.sectionId === sec)
          const subject = dayRoutine ? subjectMap.get(dayRoutine.subjectId) : null
          const studentCount = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === cls && s.section === sec).length
          return {
            classSection: inv.classSection,
            teacher: teacher?.nameEn || inv.teacherId,
            subject: subject ? (isBn ? subject.nameBn : subject.name) : '-',
            students: studentCount,
            shift: shiftLabel,
          }
        } else {
          const room = roomMap.get(inv.roomId)
          const dayRoutines = filteredRoutines.filter((r) => r.date === date && r.roomNo === room?.roomNo)
          const subjectNames = [...new Set(dayRoutines.map((r) => {
            const subj = subjectMap.get(r.subjectId)
            return subj ? (isBn ? subj.nameBn : subj.name) : ''
          }).filter(Boolean))]
          return {
            room: room?.roomNo || inv.roomId,
            teacher: teacher?.nameEn || inv.teacherId,
            subject: subjectNames.join(', ') || '-',
            capacity: room?.capacity,
            shift: shiftLabel,
          }
        }
      })

      return { date, dateFormatted, rows }
    })

    return { type: invigGuardType, examName, days }
  }, [filteredInvigilators, invigGuardType, selectedExam, isBn, teacherMap, subjectMap, roomMap, filteredRoutines, students])

  const handleInvigPDF = useCallback(
    (opts: InvigilatorPDFOptions) => {
      const html = generateInvigilatorGuardListPDF(invigilatorGridData, { ...opts, institutionName: useClassStore.getState().institution.name })
      openPrintWindow(opts.title || invigilatorGridData.examName || 'Guard List', html)
      setShowInvigPDF(false)
    },
    [invigilatorGridData]
  )

  const handleInvigExcel = useCallback(() => {
    const { type, examName, days } = invigilatorGridData
    const isClass = type === 'class'

    const rows = days.flatMap((day) =>
      day.rows.map((row) => {
        const base: Record<string, string> = { Date: day.date }
        if (isClass) {
          base['Class-Sec'] = row.classSection || ''
          base['Teacher'] = row.teacher
          base['Subject'] = row.subject
          base['Students'] = String(row.students ?? '')
        } else {
          base['Room'] = row.room || ''
          base['Teacher'] = row.teacher
          base['Subject'] = row.subject
          base['Capacity'] = String(row.capacity ?? '')
        }
        base['Shift'] = row.shift
        return base
      })
    )

    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.sheet_add_aoa(ws, [
      [examName],
      [isClass ? 'Class / Section Wise Guard List' : 'Room / Hall Wise Guard List'],
      [],
    ], { origin: 'A1' })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Guard List')
    const fileName = `${examName.replace(/\s+/g, '_')}_${isClass ? 'Class' : 'Room'}_Guard_List_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }, [invigilatorGridData])

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/exams')}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[1rem] font-bold text-[var(--text-primary)] truncate">
              {isBn ? 'ধাপ ২: সময়সূচী ও আসন পরিকল্পনা' : 'Step 2: Schedule & Seat Planning'}
            </h1>
            <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">
              {isBn ? 'রুটিন, কক্ষ, আসন ও ইনভিজিলেটর ব্যবস্থাপনা' : 'Routine, rooms, seating & invigilator management'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.75rem] font-medium cursor-pointer font-[inherit] hover:bg-[var(--green)]/15 transition-all shrink-0"
        >
          <Download size={14} />
          {isBn ? 'রিপোর্ট' : 'Report'}
        </button>
      </div>

      {/* Exam Selector */}
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className={`${selectCls} max-w-[18.75rem]`}>
          <option value="">{isBn ? 'সকল পরীক্ষা' : 'All Exams'}</option>
          {examConfigs.map((e) => (
            <option key={e.id} value={e.id}>
              {isBn ? e.nameBn : e.name} {e.isActive ? '(Active)' : ''}
            </option>
          ))}
        </select>
        {selectedExam && (
          <span className="ml-3 text-[0.6875rem] text-[var(--text-muted)]">
            {selectedExam.startDate} — {selectedExam.endDate}
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      <div className={`relative glass rounded-xl mt-3 mb-3 w-full`}>
        <div className={`relative flex gap-[0.375rem] p-[0.3125rem] rounded-[inherit] ${isMobile ? 'overflow-x-auto flex-nowrap' : 'flex-wrap'}`}>
          {/* Sliding indicator */}
          <div
            ref={sliderRef}
            className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] transition-all duration-300 ease-out z-0"
            style={{
              background: activeSubTab === 'rooms' ? 'var(--brand)' : activeSubTab === 'routine' ? 'var(--teal)' : activeSubTab === 'seats' ? 'var(--purple)' : activeSubTab === 'invigilators' ? 'var(--amber)' : activeSubTab === 'admit-cards' ? 'var(--pink)' : 'var(--cyan)',
              boxShadow: activeSubTab === 'rooms' ? '0 4px 12px rgba(99,102,241,0.3)' : activeSubTab === 'routine' ? '0 4px 12px rgba(20,184,166,0.3)' : activeSubTab === 'seats' ? '0 4px 12px rgba(168,85,247,0.3)' : activeSubTab === 'invigilators' ? '0 4px 12px rgba(245,158,11,0.3)' : activeSubTab === 'admit-cards' ? '0 4px 12px rgba(236,72,153,0.3)' : '0 4px 12px rgba(6,182,212,0.3)',
            }}
          />
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
            { key: 'admit-cards' as SubTab, label: isBn ? 'প্রবেশপত্র' : 'Admit Cards', icon: <IdCard size={14} /> },
            { key: 'attendance' as SubTab, label: isBn ? 'পরীক্ষার উপস্থিতি' : 'Exam Attendance', icon: <Users size={14} /> },
          ].map((t) => (
            <button
              key={t.key}
              ref={(el) => { if (el) tabRefs.current.set(t.key, el) }}
              onClick={() => setActiveSubTab(t.key)}
              className={`relative z-10 flex items-center justify-center gap-[0.375rem] py-2 px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${isMobile ? 'shrink-0' : 'flex-1'} ${
                activeSubTab === t.key ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={{ background: 'transparent' }}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && <span className="text-[0.625rem] opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ═══ ROUTINE TAB – FULL-SCREEN CALENDAR ═══ */}
        {activeSubTab === 'routine' && (
          <div className="flex flex-col h-full">
            {/* Stats Row */}
            <div className="flex items-center gap-5 mb-4 flex-wrap">
              {[
                { icon: <Calendar size={14} />, value: examDayCount, label: isBn ? 'পরীক্ষার দিন' : 'Exam Days', color: 'var(--brand)' },
                { icon: <BookOpen size={14} />, value: filteredRoutines.length, label: isBn ? 'মোট রুটিন' : 'Total Routines', color: 'var(--teal)' },
                { icon: <CheckCircle size={14} />, value: completedDays, label: isBn ? 'সম্পন্ন' : 'Completed', color: 'var(--green)' },
                { icon: <Clock size={14} />, value: upcomingDays, label: isBn ? 'আসন্ন' : 'Upcoming', color: 'var(--amber)' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <span className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{s.value}</span>
                  <span className="text-[0.6875rem] text-[var(--text-muted)]">{s.label}</span>
                </div>
              ))}
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
                <h2 className="text-[0.9375rem] font-bold text-[var(--text-primary)] min-w-[10rem] text-center">
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
                  className="ml-2 px-3 py-1.5 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] text-[0.6875rem] font-medium cursor-pointer border border-[var(--brand)] hover:shadow-sm"
                >
                  {isBn ? 'আজ' : 'Today'}
                </button>
              </div>
              {filteredRoutines.length > 0 && (
                <div style={{ position: 'relative' }} ref={examRoutineActionMenuRef}>
                  <button
                    onClick={() => setShowExamRoutineActionMenu(!showExamRoutineActionMenu)}
                    className={btnPrimary}
                    style={{
                      background: 'var(--brand-light)',
                      border: '1px solid var(--brand)',
                      color: 'var(--brand)',
                    }}
                  >
                    <MoreVertical size={15} />
                    {isBn ? 'অ্যাকশন' : 'Action'}
                    <ChevronDown size={12} />
                  </button>
                  {showExamRoutineActionMenu && (
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
                          handleExamRoutineExcel()
                          setShowExamRoutineActionMenu(false)
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
                          setShowExamRoutinePDF(true)
                          setShowExamRoutineActionMenu(false)
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
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <FileText size={14} style={{ color: 'var(--red)' }} />
                        {isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Calendar Grid */}
            <div className={`${sectionCls} !mb-0 flex-1 flex flex-col`}>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {(isBn ? WEEKDAYS_BN : WEEKDAYS_EN).map((day) => (
                  <div key={day} className="text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] py-2">
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
                        relative min-h-[4.5rem] p-1.5 rounded-xl border-2 cursor-pointer transition-all
                        ${today ? 'border-[var(--brand)] bg-[var(--brand-light)] shadow-md ring-1 ring-[var(--brand)]/30' : ''}
                        ${!today && !hasRoutine ? 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)] hover:shadow-sm' : ''}
                        ${!today && hasRoutine ? `${borderStyle} bg-[var(--bg-primary)] hover:shadow-md` : ''}
                        ${selected ? 'ring-2 ring-[var(--brand)] ring-offset-1' : ''}
                      `}
                    >
                      {/* Today badge */}
                      {today && (
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-[0.0625rem] rounded-full bg-[var(--brand)] text-white text-[0.4375rem] font-bold uppercase tracking-wider">
                          {isBn ? 'আজ' : 'Today'}
                        </div>
                      )}
                      {/* Date number */}
                      <div className="flex items-center justify-between mb-0.5">
                        <span
                          className={`
                            text-[0.6875rem] font-semibold
                            ${today ? 'w-5 h-5 rounded-full bg-[var(--brand)] text-white flex items-center justify-center text-[0.625rem]' : 'text-[var(--text-primary)]'}
                          `}
                        >
                          {format(day, 'd')}
                        </span>
                        {hasRoutine && (
                          <span className="text-[0.5625rem] font-bold text-[var(--text-muted)]">{dayRoutines.length}</span>
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
                                className="flex items-center gap-1 px-1 py-0.5 rounded-md text-[0.5rem] font-medium truncate"
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
                            <div className="text-[0.5rem] text-[var(--text-muted)] text-center">
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
                        className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-medium cursor-pointer border-none"
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
                                <div className="text-[0.625rem] text-[var(--text-muted)]">{routine.startTime}</div>
                                <div className="w-px h-3 bg-[var(--border)]" />
                                <div className="text-[0.625rem] text-[var(--text-muted)]">{routine.endTime}</div>
                              </div>
                              <div className="w-px h-10 rounded-full shrink-0" style={{ background: st.dot }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                                    {isBn ? subject?.nameBn : subject?.name}
                                  </span>
                                  <span
                                    className="text-[0.5625rem] py-[0.0625rem] px-[0.3125rem] rounded-[0.25rem] font-medium"
                                    style={{ background: st.bg, color: st.color }}
                                  >
                                    {isBn ? st.labelBn : st.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-[0.625rem] text-[var(--text-muted)]">
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
                    <div className="text-center py-8 text-[var(--text-muted)] text-[0.75rem]">
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
              <span className="text-[0.75rem] text-[var(--text-secondary)]">
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
                const assignedSeats = roomCapacityMap.get(room.roomNo) || 0
                const utilization = room.capacity > 0 ? Math.round((assignedSeats / room.capacity) * 100) : 0
                return (
                  <div key={room.id} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] p-[0.875rem] transition-all hover:shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{room.roomNo}</div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)]">
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
                    <div className="flex items-center justify-between text-[0.625rem] text-[var(--text-muted)]">
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
                    <div className="mt-2 h-[0.3125rem] bg-[var(--border)] rounded-[0.1875rem]">
                      <div
                        className="h-full rounded-[0.1875rem] transition-all"
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
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
                    className={`${btnPrimary} text-[0.6875rem] ${!seatClassId || !seatSectionId || !selectedExamId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <LayoutGrid size={13} />
                    {isBn ? 'অটো বরাদ্দ' : 'Auto Assign'}
                  </button>
                  {seatClassId && seatSectionId && filteredSeatPlans.some((sp) => sp.classId === seatClassId && sp.sectionId === seatSectionId) && (
                    <button
                      onClick={downloadSeatPlanPDF}
                      className="px-3 py-2 rounded-lg bg-[var(--teal-light)] border border-[var(--teal)]/20 text-[var(--teal)] text-[0.6875rem] font-medium cursor-pointer hover:shadow-sm flex items-center gap-1.5"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sectionStudents.map((student) => {
                  const seatPlan = seatPlanByStudent.get(student.id)
                  const room = seatPlan ? roomMap.get(seatPlan.roomId) : null
                  const isAssigned = !!seatPlan
                  const initials = student.nameEn.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <div key={student.id} className="relative">
                      {/* Main Seat Card */}
                      <div
                        className={`
                          relative rounded-xl border-2 overflow-hidden transition-all
                          ${isAssigned
                            ? 'border-[var(--brand)] shadow-md'
                            : 'border-dashed border-[var(--border)] opacity-60'
                          }
                        `}
                      >
                        {/* Header */}
                        <div className="bg-[var(--brand)] text-white text-center py-2 px-3">
                          <div className="text-[0.5625rem] font-bold tracking-widest uppercase">
                            {isBn ? 'আসন পরিকল্পনা' : 'SEAT PLAN'}
                          </div>
                          <div className="text-[0.5rem] opacity-80 mt-0.5">
                            {isBn ? 'সানরাইজ একাডেমি' : 'Sunrise Academy'}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="bg-[var(--bg-primary)] p-4 text-center">
                          {/* Avatar */}
                          <div className="flex justify-center mb-2">
                            {student.photo ? (
                              <img src={student.photo} alt={student.nameEn} className="w-16 h-16 rounded-full object-cover border-2 border-[var(--brand)]" />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)] text-[1.125rem] font-bold border-2 border-[var(--brand)]">
                                {initials}
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <div className="text-[0.8125rem] font-bold text-[var(--text-primary)] leading-tight mb-1">
                            {student.nameEn}
                          </div>

                          {/* Details */}
                          <div className="space-y-0.5 mb-2">
                            <div className="text-[0.625rem] text-[var(--text-secondary)]">
                              {isBn ? 'শ্রেণি' : 'Class'}: <span className="font-semibold text-[var(--text-primary)]">{student.class}</span>
                              {' '}{isBn ? 'সেকশন' : 'Sec'}: <span className="font-semibold text-[var(--text-primary)]">{student.section}</span>
                            </div>
                            <div className="text-[0.625rem] text-[var(--text-secondary)]">
                              {isBn ? 'রোল' : 'Roll'}: <span className="font-semibold text-[var(--text-primary)]">{student.roll || '-'}</span>
                            </div>
                          </div>

                          {/* Seat & Room */}
                          {isAssigned && (
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <div className="bg-[var(--brand)] text-white rounded-lg px-3 py-1.5 text-center">
                                <div className="text-[0.5rem] opacity-80">{isBn ? 'আসন নং' : 'SEAT'}</div>
                                <div className="text-[1rem] font-bold leading-none">{seatPlan.seatNo}</div>
                              </div>
                              <div className="bg-[var(--teal-light)] text-[var(--teal)] rounded-lg px-3 py-1.5 text-center border border-[var(--teal)]/20">
                                <div className="text-[0.5rem] opacity-80">{isBn ? 'কক্ষ' : 'ROOM'}</div>
                                <div className="text-[0.875rem] font-bold leading-none">{room?.roomNo || '-'}</div>
                              </div>
                            </div>
                          )}

                          {/* Exam Name */}
                          <div className="border-t border-[var(--border)] pt-2">
                            <div className="text-[0.625rem] font-semibold text-[var(--brand)]">
                              {selectedExam ? (isBn ? selectedExam.nameBn : selectedExam.name) : ''}
                            </div>
                            <div className="text-[0.5rem] text-[var(--text-muted)] mt-0.5">
                              {new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className={`${sectionCls} text-center py-10`}>
                <LayoutGrid size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {isBn ? 'শ্রেণি ও সেকশন নির্বাচন করুন' : 'Select class & section to view students'}
                </p>
              </div>
            )}

            {/* Assign Room Modal */}
            {assignRoomStudentId && (
              <div className="modal-overlay">
                <div className="modal-box modal-content" style={{ maxWidth: '20rem' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'কক্ষ বরাদ্দ' : 'Assign Room'}</h3>
                    <button
                      onClick={() => setAssignRoomStudentId('')}
                      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[0.75rem] text-[var(--text-secondary)]">
                      {sectionStudents.find((s) => s.id === assignRoomStudentId)?.nameEn}
                    </div>
                    <div>
                      <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
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
                      className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => handleAssignSingleSeat(assignRoomStudentId)}
                      disabled={!assignRoomId}
                      className={`${btnPrimary} text-[0.75rem] ${!assignRoomId ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            {/* Mode Toggle */}
            {(() => {
              const hasRoomAssign = filteredInvigilators.some((i) => i.assignType === 'room')
              const hasClassAssign = filteredInvigilators.some((i) => i.assignType === 'class')
              return (
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => !hasClassAssign && setInvigAssignType('room')}
                      disabled={hasClassAssign}
                      className={`px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium border transition-all ${
                        hasClassAssign ? 'opacity-40 cursor-not-allowed bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]' :
                        invigAssignType === 'room'
                          ? 'bg-[var(--brand)] text-white border-[var(--brand)] cursor-pointer'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)] cursor-pointer'
                      }`}
                    >
                      <MapPin size={12} className="inline mr-1" />
                      {isBn ? 'কক্ষ/হল ভিত্তিক' : 'Room / Hall Wise'}
                    </button>
                    <button
                      onClick={() => !hasRoomAssign && setInvigAssignType('class')}
                      disabled={hasRoomAssign}
                      className={`px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium border transition-all ${
                        hasRoomAssign ? 'opacity-40 cursor-not-allowed bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]' :
                        invigAssignType === 'class'
                          ? 'bg-[var(--brand)] text-white border-[var(--brand)] cursor-pointer'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)] cursor-pointer'
                      }`}
                    >
                      <GraduationCap size={12} className="inline mr-1" />
                      {isBn ? 'শ্রেণি/সেকশন ভিত্তিক' : 'Class / Section Wise'}
                    </button>
                    <div className="flex-1" />
              {filteredInvigilators.length > 0 && (
                <div style={{ position: 'relative' }} ref={invigActionMenuRef}>
                  <button
                    onClick={() => setShowInvigActionMenu(!showInvigActionMenu)}
                    className={btnPrimary}
                    style={{
                      background: 'var(--brand-light)',
                      border: '1px solid var(--brand)',
                      color: 'var(--brand)',
                    }}
                  >
                    <MoreVertical size={15} />
                    {isBn ? 'অ্যাকশন' : 'Action'}
                    <ChevronDown size={12} />
                  </button>
                  {showInvigActionMenu && (
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
                        minWidth: '14rem',
                        zIndex: 100,
                        overflow: 'hidden',
                      }}
                    >
                      {filteredInvigilators.some((i) => i.assignType === 'class') && (
                        <>
                          <button
                            onClick={() => { setInvigGuardType('class'); handleInvigExcel(); setShowInvigActionMenu(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
                            {isBn ? 'শ্রেণি গার্ড তালিকা (এক্সেল)' : 'Class Guard List (Excel)'}
                          </button>
                          <button
                            onClick={() => { setInvigGuardType('class'); setShowInvigPDF(true); setShowInvigActionMenu(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <FileText size={14} style={{ color: 'var(--red)' }} />
                            {isBn ? 'শ্রেণি গার্ড তালিকা (পিডিএফ)' : 'Class Guard List (PDF)'}
                          </button>
                        </>
                      )}
                      {filteredInvigilators.some((i) => i.assignType === 'class') && filteredInvigilators.some((i) => i.assignType === 'room') && (
                        <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
                      )}
                      {filteredInvigilators.some((i) => i.assignType === 'room') && (
                        <>
                          <button
                            onClick={() => { setInvigGuardType('room'); handleInvigExcel(); setShowInvigActionMenu(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--green-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <FileSpreadsheet size={14} style={{ color: 'var(--green)' }} />
                            {isBn ? 'কক্ষ গার্ড তালিকা (এক্সেল)' : 'Room Guard List (Excel)'}
                          </button>
                          <button
                            onClick={() => { setInvigGuardType('room'); setShowInvigPDF(true); setShowInvigActionMenu(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <FileText size={14} style={{ color: 'var(--red)' }} />
                            {isBn ? 'কক্ষ গার্ড তালিকা (পিডিএফ)' : 'Room Guard List (PDF)'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  setShowInvigForm(true)
                  setInvigForm({ roomId: '', teacherId: '', date: '', shift: 'morning', classSection: '' })
                }}
                className={btnPrimary}
              >
                <Plus size={14} />
                {isBn ? 'নতুন নিয়োগ' : 'New Assignment'}
              </button>
                    </div>
                    {(hasRoomAssign || hasClassAssign) && (
                      <div className="text-[0.5625rem] text-[var(--text-muted)] mt-1.5">
                        {isBn
                          ? `একটি ধরনের নিয়োগ আছে — অন্য ধরনে পরিবর্তন করতে সকল ${hasRoomAssign ? 'কক্ষ/হল' : 'শ্রেণি/সেকশন'} নিয়োগ মুছুন`
                          : `One type is active — remove all ${hasRoomAssign ? 'room' : 'class'} assignments to switch`}
                      </div>
                    )}
                  </div>
                )
              })()}

            {/* Info hint */}
            <div className="text-[0.625rem] text-[var(--text-muted)] mb-3">
              {invigAssignType === 'room'
                ? (isBn ? 'প্রতিটি কক্ষ/হলে কোন শিক্ষক পরিদর্শক হবে তা নির্ধারণ করুন' : 'Assign which teacher guards each room/hall')
                : (isBn ? 'প্রতিটি শ্রেণি/সেকশনে কোন শিক্ষক পরিদর্শক হবে তা নির্ধারণ করুন' : 'Assign which teacher guards each class/section')
              }
            </div>

            {/* Calendar Grid */}
            {calendarRange ? (
              <div className={`${sectionCls} overflow-x-auto`}>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                    className="w-7 h-7 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] hover:text-[var(--brand)]"
                  >
                    ‹
                  </button>
                  <span className="text-[0.75rem] font-semibold text-[var(--text-primary)] min-w-[10rem] text-center">
                    {currentMonth.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="w-7 h-7 rounded border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] hover:text-[var(--brand)]"
                  >
                    ›
                  </button>
                </div>

                {/* Get exam days in current month */}
                {(() => {
                  const year = currentMonth.getFullYear()
                  const month = currentMonth.getMonth()
                  const daysInMonth = new Date(year, month + 1, 0).getDate()
                  const examDays: number[] = []
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                    if (dateStr >= calendarRange.start.toISOString().slice(0, 10) && dateStr <= calendarRange.end.toISOString().slice(0, 10)) {
                      const dayRoutines = filteredRoutines.filter((r) => r.date === dateStr)
                      if (dayRoutines.length > 0) examDays.push(d)
                    }
                  }

                  if (invigAssignType === 'room') {
                    // Room-wise grid: rows = rooms, columns = exam days
                    const activeRooms = rooms.filter((r) => r.isActive)
                    return (
                      <div className="min-w-[40rem]">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="text-left text-[0.625rem] font-semibold text-[var(--text-muted)] p-2 border-b border-[var(--border)] sticky left-0 bg-[var(--bg-primary)] z-10 min-w-[8rem]">
                                {isBn ? 'কক্ষ/হল' : 'Room / Hall'}
                              </th>
                              {examDays.map((d) => {
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                const dayRoutines = filteredRoutines.filter((r) => r.date === dateStr)
                                const subjectNames = [...new Set(dayRoutines.map((r) => {
                                  const subj = subjectMap.get(r.subjectId)
                                  return subj ? (isBn ? subj.nameBn : subj.name) : ''
                                }).filter(Boolean))]
                                return (
                                  <th key={d} className="text-center text-[0.5625rem] p-2 border-b border-l border-[var(--border)] min-w-[6rem]">
                                    <div className="font-semibold text-[var(--text-primary)]">{d}</div>
                                    <div className="text-[0.5rem] text-[var(--text-muted)] mt-0.5">
                                      {subjectNames.slice(0, 2).join(', ')}{subjectNames.length > 2 ? '...' : ''}
                                    </div>
                                  </th>
                                )
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {activeRooms.map((room) => (
                              <tr key={room.id}>
                                <td className="text-[0.6875rem] font-medium text-[var(--text-primary)] p-2 border-b border-[var(--border)] sticky left-0 bg-[var(--bg-primary)] z-10">
                                  <div>{room.roomNo}</div>
                                  <div className="text-[0.5rem] text-[var(--text-muted)]">{room.roomName} · {room.capacity} {isBn ? 'সিট' : 'seats'}</div>
                                </td>
                                {examDays.map((d) => {
                                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                  const assignedList = filteredInvigilators.filter((inv) => inv.assignType === 'room' && inv.roomId === room.id && inv.date === dateStr)
                                  const dayRoutines = filteredRoutines.filter((r) => r.date === dateStr && r.roomNo === room.roomNo)
                                  const hasExam = dayRoutines.length > 0
                                  const studentCount = dayRoutines.reduce((sum, r) => {
                                    return sum + students.filter((s) => s.status === 'approved' && s.active !== false && s.class === r.classId && s.section === r.sectionId).length
                                  }, 0)
                                  const subjectNames = [...new Set(dayRoutines.map((r) => {
                                    const subj = subjectMap.get(r.subjectId)
                                    return subj ? (isBn ? subj.nameBn : subj.name) : ''
                                  }).filter(Boolean))]
                                  return (
                                    <td key={d} className="text-center p-1.5 border-b border-l border-[var(--border)]">
                                      {!hasExam ? (
                                        <div className="w-full h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[0.5rem] text-[var(--text-muted)] opacity-30">
                                          —
                                        </div>
                                      ) : (
                                        <div className="space-y-1">
                                          {assignedList.map((inv) => {
                                            const teacher = teacherMap.get(inv.teacherId)
                                            return (
                                              <div
                                                key={inv.id}
                                                className="rounded-lg p-1.5 bg-[var(--brand-light)] border border-[var(--brand)]/20 cursor-pointer hover:shadow-sm transition-all"
                                                onClick={() => {
                                                  if (confirm(isBn ? 'এই নিয়োগ মুছে ফেলবেন?' : 'Remove this assignment?')) removeInvigilator(inv.id)
                                                }}
                                              >
                                                <div className="text-[0.5625rem] font-semibold text-[var(--brand)] truncate">{teacher?.nameEn || inv.teacherId}</div>
                                              </div>
                                            )
                                          })}
                                          {subjectNames.length > 0 && assignedList.length > 0 && (
                                            <div className="text-[0.5rem] text-[var(--text-muted)] truncate">
                                              {subjectNames.join(', ')}
                                            </div>
                                          )}
                                          {studentCount > 0 && assignedList.length > 0 && (
                                            <div className="text-[0.5rem] text-[var(--text-muted)]">{studentCount} {isBn ? 'জন ছাত্র' : 'students'}</div>
                                          )}
                                          <button
                                            onClick={() => {
                                              setInvigForm((p) => ({ ...p, date: dateStr }))
                                              setShowInvigForm(true)
                                            }}
                                            className="w-full h-7 rounded-lg border border-dashed border-[var(--border)] text-[0.5rem] text-[var(--text-muted)] cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all flex items-center justify-center"
                                          >
                                            +
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  } else {
                    // Class-wise grid: rows = class-sections, columns = exam days
                    const classSections = classOptions.flatMap((c) =>
                      (sectionsMap[c] || []).map((s) => ({ classId: c, sectionId: s, label: `${c}-${s}` }))
                    )
                    return (
                      <div className="min-w-[40rem]">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="text-left text-[0.625rem] font-semibold text-[var(--text-muted)] p-2 border-b border-[var(--border)] sticky left-0 bg-[var(--bg-primary)] z-10 min-w-[8rem]">
                                {isBn ? 'শ্রেণি-সেকশন' : 'Class-Section'}
                              </th>
                              {examDays.map((d) => {
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                const dayRoutines = filteredRoutines.filter((r) => r.date === dateStr)
                                const subjectNames = [...new Set(dayRoutines.map((r) => {
                                  const subj = subjectMap.get(r.subjectId)
                                  return subj ? (isBn ? subj.nameBn : subj.name) : ''
                                }).filter(Boolean))]
                                return (
                                  <th key={d} className="text-center text-[0.5625rem] p-2 border-b border-l border-[var(--border)] min-w-[6rem]">
                                    <div className="font-semibold text-[var(--text-primary)]">{d}</div>
                                    <div className="text-[0.5rem] text-[var(--text-muted)] mt-0.5">
                                      {subjectNames.slice(0, 2).join(', ')}{subjectNames.length > 2 ? '...' : ''}
                                    </div>
                                  </th>
                                )
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {classSections.map((cs) => {
                              const studentCount = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === cs.classId && s.section === cs.sectionId).length
                              return (
                                <tr key={cs.label}>
                                  <td className="text-[0.6875rem] font-medium text-[var(--text-primary)] p-2 border-b border-[var(--border)] sticky left-0 bg-[var(--bg-primary)] z-10">
                                    <div>{cs.classId} - {cs.sectionId}</div>
                                    <div className="text-[0.5rem] text-[var(--text-muted)]">{studentCount} {isBn ? 'জন ছাত্র' : 'students'}</div>
                                  </td>
                                  {examDays.map((d) => {
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                                    const assignedList = filteredInvigilators.filter((inv) => inv.assignType === 'class' && inv.classSection === cs.label && inv.date === dateStr)
                                    const dayRoutine = filteredRoutines.find((r) => r.date === dateStr && r.classId === cs.classId && r.sectionId === cs.sectionId)
                                    const subject = dayRoutine ? subjectMap.get(dayRoutine.subjectId) : null
                                    const hasExam = !!dayRoutine
                                    return (
                                      <td key={d} className="text-center p-1.5 border-b border-l border-[var(--border)]">
                                        {!hasExam ? (
                                          <div className="w-full h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[0.5rem] text-[var(--text-muted)] opacity-30">
                                            —
                                          </div>
                                        ) : (
                                          <div className="space-y-1">
                                            {assignedList.map((inv) => {
                                              const teacher = teacherMap.get(inv.teacherId)
                                              return (
                                                <div
                                                  key={inv.id}
                                                  className="rounded-lg p-1.5 bg-[var(--brand-light)] border border-[var(--brand)]/20 cursor-pointer hover:shadow-sm transition-all"
                                                  onClick={() => {
                                                    if (confirm(isBn ? 'এই নিয়োগ মুছে ফেলবেন?' : 'Remove this assignment?')) removeInvigilator(inv.id)
                                                  }}
                                                >
                                                  <div className="text-[0.5625rem] font-semibold text-[var(--brand)] truncate">{teacher?.nameEn || inv.teacherId}</div>
                                                </div>
                                              )
                                            })}
                                            {subject && assignedList.length > 0 && (
                                              <div className="text-[0.5rem] text-[var(--text-muted)] truncate">
                                                {isBn ? subject.nameBn : subject.name}
                                              </div>
                                            )}
                                            <button
                                              onClick={() => {
                                                setInvigForm((p) => ({ ...p, date: dateStr, classSection: cs.label }))
                                                setShowInvigForm(true)
                                              }}
                                              className="w-full h-7 rounded-lg border border-dashed border-[var(--border)] text-[0.5rem] text-[var(--text-muted)] cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all flex items-center justify-center"
                                            >
                                              +
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    )
                                  })}
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                })()}
              </div>
            ) : (
              <div className={`${sectionCls} text-center py-10`}>
                <Calendar size={32} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[0.8125rem] text-[var(--text-muted)]">
                  {isBn ? 'পরীক্ষা নির্বাচন করুন এবং তারিখ সীমা সেট করুন' : 'Select an exam and set date range'}
                </p>
              </div>
            )}

            {/* Assigned list summary */}
            {filteredInvigilators.length > 0 && (
              <div className="mt-3">
                <div className="text-[0.6875rem] font-semibold text-[var(--text-primary)] mb-2">
                  {isBn ? 'সকল নিয়োগ' : 'All Assignments'} ({filteredInvigilators.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredInvigilators.map((inv) => {
                    const teacher = teacherMap.get(inv.teacherId)
                    const room = inv.assignType === 'room' ? roomMap.get(inv.roomId) : null
                    return (
                      <div key={inv.id} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                        <div className="w-7 h-7 rounded-full bg-[var(--brand-light)] flex items-center justify-center flex-shrink-0">
                          <UserCheck size={12} className="text-[var(--brand)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate">{teacher?.nameEn || inv.teacherId}</div>
                          <div className="text-[0.5rem] text-[var(--text-muted)]">
                            {inv.assignType === 'room'
                              ? `${room?.roomNo || inv.roomId}`
                              : inv.classSection
                            } · {inv.date} · {inv.shift}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Remove?')) removeInvigilator(inv.id)
                          }}
                          className="w-5 h-5 rounded border border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--red)] flex-shrink-0"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {filteredInvigilators.length === 0 && calendarRange && (
              <div className={`${sectionCls} text-center py-6`}>
                <UserCheck size={28} className="mx-auto mb-2 opacity-20 text-[var(--text-muted)]" />
                <p className="text-[0.75rem] text-[var(--text-muted)]">
                  {isBn ? 'কোনো ইনভিজিলেটর নিয়োগ হয়নি' : 'No invigilators assigned'}
                </p>
              </div>
            )}
          </>
        )}

        {/* ═══ ATTENDANCE TAB ═══ */}
        {activeSubTab === 'attendance' && (
          <>
            {/* Attendance Controls */}
            <div className={sectionCls}>
              <div className={sectionTitleCls}>
                <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--brand-light)]">
                  <ClipboardCheck size={13} className="text-[var(--brand)]" />
                </div>
                {isBn ? 'পরীক্ষাভিত্তিক উপস্থিতি' : 'Exam-wise Student Attendance'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                  <select
                    value={attClassId}
                    onChange={(e) => { setAttClassId(e.target.value); setAttSectionId('') }}
                    className={`${selectCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select
                    value={attSectionId}
                    onChange={(e) => setAttSectionId(e.target.value)}
                    className={`${selectCls} w-full`}
                    disabled={!attClassId}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {(sectionsMap[attClassId] || []).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className={`${inputCls} w-full`}
                    min={selectedExam?.startDate || ''}
                    max={selectedExam?.endDate || ''}
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিফট' : 'Shift'}</label>
                  <select
                    value={attShift}
                    onChange={(e) => setAttShift(e.target.value as 'morning' | 'afternoon')}
                    className={`${selectCls} w-full`}
                  >
                    <option value="morning">{isBn ? 'সকাল' : 'Morning'}</option>
                    <option value="afternoon">{isBn ? 'বিকাল' : 'Afternoon'}</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    if (!attClassId || !attSectionId || !attDate) {
                      alert(isBn ? 'শ্রেণি, সেকশন এবং তারিখ নির্বাচন করুন' : 'Select class, section and date')
                      return
                    }
                    setShowQRScanner(true)
                  }}
                  disabled={!attClassId || !attSectionId || !attDate}
                  className={`${btnPrimary} ${!attClassId || !attSectionId || !attDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <QrCode size={14} />
                  {isBn ? 'QR স্ক্যান শুরু' : 'Start QR Scan'}
                </button>
              </div>
            </div>

            {/* QR Scanner Modal */}
            {showQRScanner && (
              <QRScannerModal
                isBn={isBn}
                examId={selectedExamId}
                classId={attClassId}
                sectionId={attSectionId}
                date={attDate}
                shift={attShift}
                students={students}
                onScan={(studentId) => {
                  const student = students.find((s) => s.id === studentId)
                  if (!student || student.class !== attClassId || student.section !== attSectionId) {
                    setLastScanned(isBn ? 'ভুল শ্রেণি/সেকশন!' : 'Wrong class/section!')
                    return
                  }
                  addAttendance({
                    examId: selectedExamId,
                    studentId: student.id,
                    classId: attClassId,
                    sectionId: attSectionId,
                    date: attDate,
                    shift: attShift,
                    status: 'present',
                    scannedBy: 'QR',
                    scannedAt: new Date().toISOString(),
                  })
                  setLastScanned(`${student.nameEn} - ${isBn ? 'উপস্থিত' : 'Present'}`)
                  setTimeout(() => setLastScanned(''), 2000)
                }}
                onClose={() => setShowQRScanner(false)}
                lastScanned={lastScanned}
              />
            )}

            {/* Attendance Summary */}
            {attClassId && attSectionId && attDate && (() => {
              const classStudents = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === attClassId && s.section === attSectionId)
              const presentIds = new Set(
                filteredAttendances
                  .filter((a) => a.classId === attClassId && a.sectionId === attSectionId && a.date === attDate)
                  .map((a) => a.studentId)
              )
              const total = classStudents.length
              const present = presentIds.size
              const absent = total - present
              const pct = total > 0 ? Math.round((present / total) * 100) : 0
              const sorted = classStudents.sort((a, b) => (a.roll || '').localeCompare(b.roll || '', undefined, { numeric: true }))

              return (
                <>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {[
                      { label: isBn ? 'মোট ছাত্র' : 'Total Students', value: total, icon: <Users size={14} />, bg: 'var(--brand-light)', color: 'var(--brand)' },
                      { label: isBn ? 'উপস্থিত' : 'Present', value: present, icon: <CheckCircle size={14} />, bg: 'var(--green-light)', color: 'var(--green)' },
                      { label: isBn ? 'অনুপস্থিত' : 'Absent', value: absent, icon: <UserX size={14} />, bg: 'var(--red-light)', color: 'var(--red)' },
                      { label: isBn ? 'হার' : 'Rate', value: `${pct}%`, icon: <ClipboardCheck size={14} />, bg: 'var(--amber-light)', color: 'var(--amber)' },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center gap-3 rounded-[0.75rem] border border-[var(--border)] bg-[var(--bg-primary)] p-3"
                      >
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-lg"
                          style={{ background: s.bg }}
                        >
                          <span style={{ color: s.color }}>{s.icon}</span>
                        </div>
                        <div>
                          <div className="text-[0.6875rem] text-[var(--text-muted)]">{s.label}</div>
                          <div className="text-[1rem] font-semibold text-[var(--text-primary)]">{s.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Attendance Sheet */}
                  <div className={sectionCls}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                          {attClassId} - {attSectionId}
                        </span>
                        <span className="text-[0.6875rem] text-[var(--text-muted)]">
                          {attDate} · {attShift === 'morning' ? (isBn ? 'সকাল' : 'Morning') : (isBn ? 'বিকাল' : 'Afternoon')}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const presentList = sorted.filter((s) => presentIds.has(s.id))
                          const absentList = sorted.filter((s) => !presentIds.has(s.id))
                          const html = generateAttendanceSheetHTML({
                            classId: attClassId,
                            sectionId: attSectionId,
                            date: attDate,
                            shift: attShift,
                            present: presentList,
                            absent: absentList,
                            totalStudents: total,
                          })
                          const win = window.open('', '_blank')
                          if (!win) return
                          win.document.write(html)
                          win.document.close()
                          setTimeout(() => win.print(), 500)
                        }}
                        className="flex items-center gap-1 text-[0.625rem] text-[var(--brand)] hover:text-[var(--brand-dark)] cursor-pointer"
                      >
                        <Download size={12} />
                        PDF
                      </button>
                    </div>

                    {/* Progress */}
                    <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)',
                        }}
                      />
                    </div>

                    {/* Student Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {sorted.map((student) => {
                        const isPresent = presentIds.has(student.id)
                        return (
                          <div
                            key={student.id}
                            className={`relative rounded-xl p-3 border transition-all duration-200 ${
                              isPresent
                                ? 'bg-[var(--green-light)] border-[var(--green)]/20 shadow-sm'
                                : 'bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--red)]/30'
                            }`}
                          >
                            <div className="absolute top-2 right-2">
                              <span
                                className="inline-block w-1.5 h-1.5 rounded-full"
                                style={{ background: isPresent ? 'var(--green)' : 'var(--red)' }}
                              />
                            </div>
                            <div className="text-[0.5625rem] text-[var(--text-muted)] mb-0.5">
                              {isBn ? 'রোল' : 'Roll'}: {student.roll || '-'}
                            </div>
                            <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate pr-3">
                              {student.nameEn}
                            </div>
                            <div className={`text-[0.5625rem] mt-1.5 font-medium ${
                              isPresent ? 'text-[var(--green)]' : 'text-[var(--red)]'
                            }`}>
                              {isPresent ? (isBn ? 'উপস্থিত' : 'Present') : (isBn ? 'অনুপস্থিত' : 'Absent')}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )
            })}

            {!attClassId && !attSectionId && (
              <div className={`${sectionCls} text-center py-10`}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--bg-secondary)] mb-3">
                  <ClipboardCheck size={22} className="text-[var(--text-muted)] opacity-40" />
                </div>
                <p className="text-[0.8125rem] text-[var(--text-muted)] mb-1">
                  {isBn ? 'শ্রেণি, সেকশন এবং তারিখ নির্বাচন করুন' : 'Select class, section and date to take attendance'}
                </p>
                <p className="text-[0.6875rem] text-[var(--text-muted)] opacity-60">
                  {isBn ? 'QR স্ক্যান বা ম্যানুয়াল এন্ট্রি দ্বারা উপস্থিতি নিন' : 'Mark attendance via QR scan or manual entry'}
                </p>
              </div>
            )}
          </>
        )}

        {/* ═══ ADMIT CARDS TAB ═══ */}
        {activeSubTab === 'admit-cards' && (
          <AdmitCardsTab
            students={students}
            selectedExamId={selectedExamId}
            examConfigs={examConfigs}
            routines={sessionRoutines}
            subjectMarkConfigs={sessionSubjectMarkConfigs}
          />
        )}
      </div>

      {/* ═══ Routine Form Modal ═══ */}
      {showRoutineForm && (
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '26.25rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'নতুন রুটিন' : 'New Routine'}</h3>
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি' : 'Class'}</label>
                  <select
                    value={routineForm.classId}
                    onChange={(e) => {
                      const classId = e.target.value
                      const count = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === classId).length
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'সেকশন' : 'Section'}</label>
                  <select
                    value={routineForm.sectionId}
                    onChange={(e) => {
                      const sectionId = e.target.value
                      const count = students.filter((s) => s.status === 'approved' && s.active !== false && s.class === routineForm.classId && s.section === sectionId).length
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
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিষয়' : 'Subject'}</label>
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
                  <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
                    {isBn ? 'এই শ্রেণিতে কোনো বিষয় নেই' : 'No subjects for this class'}
                  </p>
                )}
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শুরু' : 'Start'}</label>
                  <input
                    type="time"
                    value={routineForm.startTime}
                    onChange={(e) => setRoutineForm((p) => ({ ...p, startTime: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শেষ' : 'End'}</label>
                  <input
                    type="time"
                    value={routineForm.endTime}
                    onChange={(e) => setRoutineForm((p) => ({ ...p, endTime: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
              </div>
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
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
                  <p className="text-[0.625rem] text-[var(--text-muted)] mt-1">
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
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveRoutine} className={`${btnPrimary} text-[0.75rem]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Room Form Modal ═══ */}
      {showRoomForm && (
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '23.75rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'বিল্ডিং' : 'Building'}</label>
                  <input
                    value={roomForm.building}
                    onChange={(e) => setRoomForm((p) => ({ ...p, building: e.target.value }))}
                    className={`${inputCls} w-full`}
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'ফ্লোর' : 'Floor'}</label>
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
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveRoom} className={`${btnPrimary} text-[0.75rem]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Invigilator Form Modal ═══ */}
      {showInvigForm && (
        <div className="modal-overlay">
          <div className="modal-box modal-content" style={{ maxWidth: '23.75rem' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">{isBn ? 'ইনভিজিলেটর নিয়োগ' : 'Assign Invigilator'}</h3>
              <button
                onClick={() => setShowInvigForm(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিক্ষক' : 'Teacher'}</label>
                <select
                  value={invigForm.teacherId}
                  onChange={(e) => setInvigForm((p) => ({ ...p, teacherId: e.target.value }))}
                  className={`${selectCls} w-full`}
                >
                  <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                  {teachers.filter((t) => {
                    if (t.status !== 'active') return false
                    if (!invigForm.date) return true
                    // Hide teachers already assigned on this date
                    return !filteredInvigilators.some((inv) => inv.teacherId === t.id && inv.date === invigForm.date)
                  }).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameEn}
                    </option>
                  ))}
                </select>
                {invigForm.date && teachers.filter((t) => t.status === 'active' && filteredInvigilators.some((inv) => inv.teacherId === t.id && inv.date === invigForm.date)).length > 0 && (
                  <p className="text-[0.5625rem] text-[var(--text-muted)] mt-1">
                    {isBn ? 'অন্যান্য শ্রেণি/কক্ষে নিয়োগপ্রাপ্ত শিক্ষক লুকানো আছে' : 'Teachers assigned elsewhere on this date are hidden'}
                  </p>
                )}
              </div>
              {invigAssignType === 'room' ? (
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'কক্ষ' : 'Room'}</label>
                  <select
                    value={invigForm.roomId}
                    onChange={(e) => {
                      const roomId = e.target.value
                      const room = rooms.find((r) => r.id === roomId)
                      if (room) {
                        const routine = filteredRoutines.find((r) => r.roomNo === room.roomNo)
                        if (routine) {
                          const shift: 'morning' | 'afternoon' = routine.startTime < '12:00' ? 'morning' : 'afternoon'
                          setInvigForm((p) => ({ ...p, roomId, date: routine.date, shift }))
                        } else {
                          setInvigForm((p) => ({ ...p, roomId }))
                        }
                      } else {
                        setInvigForm((p) => ({ ...p, roomId: '' }))
                      }
                    }}
                    className={`${selectCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {rooms.filter((r) => r.isActive).map((r) => {
                      const routine = filteredRoutines.find((rt) => rt.roomNo === r.roomNo)
                      const subject = routine ? subjectMap.get(routine.subjectId) : null
                      return (
                        <option key={r.id} value={r.id}>
                          {r.roomNo} ({r.roomName}){subject ? ` - ${isBn ? subject.nameBn : subject.name}` : ''}
                        </option>
                      )
                    })}
                  </select>
                  {invigForm.roomId && (() => {
                    const room = rooms.find((r) => r.id === invigForm.roomId)
                    const routine = room ? filteredRoutines.find((r) => r.roomNo === room.roomNo) : null
                    const subject = routine ? subjectMap.get(routine.subjectId) : null
                    if (!routine) return null
                    return (
                      <div className="mt-1.5 p-2 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]/20">
                        <div className="text-[0.5625rem] text-[var(--brand)] font-medium">
                          {subject ? (isBn ? subject.nameBn : subject.name) : ''} · {routine.date} · {routine.startTime} - {routine.endTime}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শ্রেণি-সেকশন' : 'Class-Section'}</label>
                  <select
                    value={invigForm.classSection}
                    onChange={(e) => {
                      const classSection = e.target.value
                      const [classId, sectionId] = classSection.split('-')
                      const routine = filteredRoutines.find((r) => r.classId === classId && r.sectionId === sectionId)
                      if (routine) {
                        const shift: 'morning' | 'afternoon' = routine.startTime < '12:00' ? 'morning' : 'afternoon'
                        setInvigForm((p) => ({ ...p, classSection, date: routine.date, shift }))
                      } else {
                        setInvigForm((p) => ({ ...p, classSection }))
                      }
                    }}
                    className={`${selectCls} w-full`}
                  >
                    <option value="">{isBn ? 'নির্বাচন...' : 'Select...'}</option>
                    {classOptions.flatMap((c) =>
                      (sectionsMap[c] || []).map((s) => {
                        const label = `${c}-${s}`
                        const routine = filteredRoutines.find((r) => r.classId === c && r.sectionId === s)
                        const subject = routine ? subjectMap.get(routine.subjectId) : null
                        return (
                          <option key={label} value={label}>
                            {c} - {s}{subject ? ` (${isBn ? subject.nameBn : subject.name})` : ''}
                          </option>
                        )
                      })
                    )}
                  </select>
                  {invigForm.classSection && (() => {
                    const [classId, sectionId] = invigForm.classSection.split('-')
                    const routine = filteredRoutines.find((r) => r.classId === classId && r.sectionId === sectionId)
                    const subject = routine ? subjectMap.get(routine.subjectId) : null
                    if (!routine) return null
                    return (
                      <div className="mt-1.5 p-2 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)]/20">
                        <div className="text-[0.5625rem] text-[var(--brand)] font-medium">
                          {subject ? (isBn ? subject.nameBn : subject.name) : ''} · {routine.date} · {routine.startTime} - {routine.endTime}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'তারিখ' : 'Date'}</label>
                  <input
                    type="date"
                    value={invigForm.date}
                    onChange={(e) => setInvigForm((p) => ({ ...p, date: e.target.value }))}
                    className={`${inputCls} w-full`}
                    min={selectedExam?.startDate || ''}
                    max={selectedExam?.endDate || ''}
                  />
                </div>
                <div>
                  <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'শিফট' : 'Shift'}</label>
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
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button onClick={handleSaveInvig} className={`${btnPrimary} text-[0.75rem]`}>
                {isBn ? 'সংরক্ষণ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Routine PDF Modal */}
      {showExamRoutinePDF && (
        <ExamRoutinePDFOptionsModal
          count={examRoutineGridData.dates.length}
          isBn={isBn}
          gridData={examRoutineGridData}
          onClose={() => setShowExamRoutinePDF(false)}
          onDownload={handleExamRoutinePDF}
        />
      )}

      {/* Invigilator Guard List PDF Modal */}
      {showInvigPDF && (
        <InvigilatorPDFOptionsModal
          count={invigilatorGridData.days.reduce((sum, day) => sum + day.rows.length, 0)}
          isBn={isBn}
          gridData={invigilatorGridData}
          onClose={() => setShowInvigPDF(false)}
          onDownload={handleInvigPDF}
        />
      )}
    </div>
  )
}

// ─── QR Scanner Modal ───
function QRScannerModal({
  isBn,
  onScan,
  onClose,
  lastScanned,
}: {
  isBn: boolean
  examId: string
  classId: string
  sectionId: string
  date: string
  shift: string
  students: { id: string; nameEn: string; class: string; section: string; roll: string; photo: string }[]
  onScan: (studentId: string) => void
  onClose: () => void
  lastScanned: string
}) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)
  const [scannerReady, setScannerReady] = useState(false)
  const [manualId, setManualId] = useState('')

  useEffect(() => {
    let mounted = true
    let scanner: any = null

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mounted || !scannerRef.current) return

        scanner = new Html5Qrcode('qr-reader')
        html5QrCodeRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 5,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            try {
              const data = JSON.parse(decodedText)
              if (data.studentId) {
                onScan(data.studentId)
              } else if (data.id) {
                onScan(data.id)
              }
            } catch {
              // Plain text student ID
              onScan(decodedText.trim())
            }
          },
          () => {}
        )
        if (mounted) setScannerReady(true)
      } catch (err) {
        console.warn('QR Scanner error:', err)
        if (mounted) setScannerReady(false)
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
        html5QrCodeRef.current.clear().catch(() => {})
        html5QrCodeRef.current = null
      }
    }
  }, [onScan])

  const handleManualSubmit = () => {
    if (manualId.trim()) {
      onScan(manualId.trim())
      setManualId('')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-content" style={{ maxWidth: '25rem' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
            <QrCode size={16} className="inline mr-1" />
            {isBn ? 'QR স্ক্যান' : 'QR Scanner'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={16} />
          </button>
        </div>

        {/* Camera view */}
        <div id="qr-reader" ref={scannerRef} className="rounded-lg overflow-hidden mb-3 min-h-[15rem] bg-black" />

        {/* Scanner status */}
        <div className="text-center mb-3">
          {scannerReady ? (
            <span className="text-[0.625rem] text-[var(--green)] font-medium">{isBn ? 'স্ক্যানার সক্রিয় — QR কোড দেখান' : 'Scanner active — Show QR code'}</span>
          ) : (
            <span className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'স্ক্যানার চালু হচ্ছে...' : 'Starting scanner...'}</span>
          )}
        </div>

        {/* Last scanned result */}
        {lastScanned && (
          <div className={`text-center text-[0.75rem] font-semibold p-2 rounded-lg mb-3 ${
            lastScanned.includes('Present') || lastScanned.includes('উপস্থিত')
              ? 'bg-[var(--green-light)] text-[var(--green)]'
              : lastScanned.includes('Wrong') || lastScanned.includes('ভুল')
                ? 'bg-red-50 text-[var(--red)]'
                : 'bg-[var(--brand-light)] text-[var(--brand)]'
          }`}>
            {lastScanned}
          </div>
        )}

        {/* Manual entry */}
        <div className="flex gap-2">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            className={`${inputCls} flex-1`}
            placeholder={isBn ? 'ম্যানুয়াল আইডি লিখুন...' : 'Enter student ID manually...'}
          />
          <button onClick={handleManualSubmit} className={btnPrimary}>
            {isBn ? 'সাবমিট' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
