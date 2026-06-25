import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  CalendarCheck,
  CalendarRange,
  CalendarX,
  CheckCircle,
  Clock,
  Fingerprint,
  GraduationCap,
  LogOut,
  XCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'

import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useScrollLock } from '@/hooks/useScrollLock'
import { useTabSlider } from '@/hooks/useTabSlider'
import { AttendancePDFOptionsModal } from '@/components/shared/AttendancePDFOptionsModal'
import type { AttendancePDFOptions } from '@/components/shared/AttendancePDFOptionsModal'
import type { AttendanceStatus, DayAttendance } from '@/store/teacherStore'
import { genSinglePDF, genStudentSinglePDF } from './pdfTemplates'
import DeviceTab from './DeviceTab'
import { today, twentyDaysAgo, getDaysBetween, isFriday, setGlobalBn } from './helpers'
import type { Tab, StatusFilter } from './helpers'

import { TodayTab } from './tabs/TodayTab'
import { RangeTab } from './tabs/RangeTab'
import { EmployeeTab } from './tabs/EmployeeTab'
import { StudentTab } from './tabs/StudentTab'
import { PersonDetailModal } from './modals/PersonDetailModal'
import { StudentDetailModal } from './modals/StudentDetailModal'

export default function AttendancePage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { isMobile, isTablet } = useWindowSize()
  const { teachers, departments, attendance, markAllPresent } = useTeacherStore()
  const students = useSessionStudents()
  const { classes, institution } = useClassStore()
  setGlobalBn(isBn)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const allSections = useMemo(() => {
    const sectionSet = new Set<string>()
    classes.forEach((cls) => cls.sections.forEach((s) => sectionSet.add(s.name)))
    return Array.from(sectionSet).sort()
  }, [classes])

  const [activeTab, setActiveTab] = useState<Tab>('today')
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({
    activeTab,
    tabRefs,
    sliderRef,
    scrollIntoView: true,
  })

  const [date, setDate] = useState(today())
  const [dateFrom, setDateFrom] = useState(twentyDaysAgo())
  const [dateTo, setDateTo] = useState(today())
  const [showMarkAll, setShowMarkAll] = useState(false)
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewPerson, setViewPerson] = useState<{
    id: string
    name: string
    type: 'teacher' | 'student'
  } | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [fDeptEmp, setFDeptEmp] = useState('')
  const [viewStudent, setViewStudent] = useState<{
    id: string
    name: string
    class: string
    section: string
  } | null>(null)
  const [showStudentPDF, setShowStudentPDF] = useState(false)
  const [showEmployeePDF, setShowEmployeePDF] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [empPage, setEmpPage] = useState(1)
  const [empPerPage, setEmpPerPage] = useState(20)
  const [stuPage, setStuPage] = useState(1)
  const [stuPerPage, setStuPerPage] = useState(20)

  useScrollLock(
    showMarkAll ||
      viewPerson !== null ||
      viewStudent !== null ||
      showStudentPDF ||
      showEmployeePDF
  )

  useEffect(() => {
    setEmpPage(1)
  }, [employeeSearch, fDeptEmp, empPerPage])
  useEffect(() => {
    setStuPage(1)
  }, [studentSearch, fClass, fSection, stuPerPage])
  useEffect(() => {
    setEmpPage(1)
    setStuPage(1)
  }, [activeTab])

  const dayAtt = attendance[date] || {}
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])

  const filteredStudents = useMemo(() => {
    let l = students.filter((s) => s.status === 'approved')
    if (fClass) l = l.filter((s) => s.class === fClass)
    if (fSection) l = l.filter((s) => s.section === fSection)
    if (studentSearch) {
      const q = studentSearch.toLowerCase()
      l = l.filter((s) => s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(studentSearch) || s.id.toLowerCase().includes(q))
    }
    return l
  }, [students, fClass, fSection, studentSearch])

  const filteredEmployees = useMemo(() => {
    let l = activeTeachers
    if (fDeptEmp) l = l.filter((t) => t.departmentId === fDeptEmp)
    if (employeeSearch) {
      const q = employeeSearch.toLowerCase()
      l = l.filter((t) => t.nameEn.toLowerCase().includes(q) || t.nameBn.includes(employeeSearch) || t.id.toLowerCase().includes(q))
    }
    return l
  }, [activeTeachers, fDeptEmp, employeeSearch])

  const getDeptName = useCallback((id: string) => {
    const d = departments.find((x) => x.id === id)
    return d ? (isBn ? d.nameBn : d.name) : '—'
  }, [departments, isBn])

  const todayFiltered = useMemo(() => {
    const staff = filteredEmployees.map((t) => {
      const da = dayAtt[t.id]
      const status: AttendanceStatus = da?.status || 'absent'
      const inPunch = da?.punches?.find((p: any) => p.type === 'in')
      const outPunch = [...(da?.punches || [])].reverse().find((p: any) => p.type === 'out')
      const isLate = inPunch && t.inTime && inPunch.time > t.inTime
      return {
        id: t.id,
        name: isBn ? t.nameBn || t.nameEn : t.nameEn,
        nameBn: t.nameBn,
        nameEn: t.nameEn,
        photo: t.photo,
        type: 'staff' as const,
        designation: t.designation || '',
        dept: getDeptName(t.departmentId),
        attStatus: status,
        inTime: inPunch?.time || '—',
        outTime: outPunch?.time || '—',
        isLate: !!isLate,
      }
    })
    const stu = filteredStudents.map((s) => {
      const dayData = attendance[date]?.[s.id]
      const status: AttendanceStatus = dayData?.status || 'absent'
      const inPunch = dayData?.punches?.find((p: any) => p.type === 'in')
      const outPunch = dayData?.punches?.filter((p: any) => p.type === 'out').pop()
      return {
        id: s.id,
        name: isBn ? s.nameBn || s.nameEn : s.nameEn,
        nameBn: s.nameBn,
        nameEn: s.nameEn,
        photo: '',
        type: 'student' as const,
        designation: `${s.class} · ${s.section || '—'}`,
        dept: isBn ? 'শিক্ষার্থী' : 'Student',
        attStatus: status,
        inTime: inPunch?.time || '—',
        outTime: outPunch?.time || '—',
        isLate: false,
      }
    })
    let l = [...staff, ...stu]
    if (statusFilter === 'present') l = l.filter((t) => t.attStatus === 'present')
    else if (statusFilter === 'absent') l = l.filter((t) => t.attStatus === 'absent')
    else if (statusFilter === 'on-leave') l = l.filter((t) => t.attStatus === 'on-leave')
    return l
  }, [filteredEmployees, filteredStudents, dayAtt, statusFilter, isBn, getDeptName])

  const todayTotalPages = Math.max(1, Math.ceil(todayFiltered.length / empPerPage))
  const paginatedToday = useMemo(
    () => todayFiltered.slice((empPage - 1) * empPerPage, empPage * empPerPage),
    [todayFiltered, empPage, empPerPage]
  )
  const rangeDays = useMemo(() => getDaysBetween(dateFrom, dateTo), [dateFrom, dateTo])

  const empTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / empPerPage))
  const paginatedEmployees = useMemo(
    () => filteredEmployees.slice((empPage - 1) * empPerPage, empPage * empPerPage),
    [filteredEmployees, empPage, empPerPage]
  )

  const stuTotalPages = Math.max(1, Math.ceil(filteredStudents.length / stuPerPage))
  const paginatedStudents = useMemo(
    () => filteredStudents.slice((stuPage - 1) * stuPerPage, stuPage * stuPerPage),
    [filteredStudents, stuPage, stuPerPage]
  )

  const stats = useMemo(() => {
    let present = 0,
      absent = 0,
      onLeave = 0
    activeTeachers.forEach((t) => {
      const s = dayAtt[t.id]?.status
      if (s === 'present') present++
      else if (s === 'absent') absent++
      else if (s === 'on-leave') onLeave++
    })
    return { present, absent, onLeave }
  }, [activeTeachers, dayAtt])

  const handleMarkAll = () => {
    markAllPresent(date)
    setShowMarkAll(false)
  }

  const getStatus = (dayData?: DayAttendance): AttendanceStatus => dayData?.status || 'absent'

  const getPersonMonthData = useCallback(
    (personId: string) => {
      return rangeDays.map((ds) => {
        const da = attendance[ds]?.[personId]
        return {
          date: ds,
          status: da?.status || 'absent',
          punches: da?.punches || [],
        }
      })
    },
    [rangeDays, attendance]
  )

  const downloadSinglePDF = useCallback(
    (personId: string, personName: string) => {
      const teacher = teachers.find((t) => t.id === personId)
      const data = getPersonMonthData(personId)
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(
        genSinglePDF({
          name: personName,
          id: personId,
          photo: teacher?.photo || '',
          designation: teacher?.designation || '',
          deptName: teacher ? getDeptName(teacher.departmentId) : '',
          inTime: teacher?.inTime || '08:00',
          outTime: teacher?.outTime || '16:00',
          rows: data,
          isBn,
          institutionName: institution.name,
        })
      )
      win.document.close()
      setTimeout(() => win.print(), 800)
    },
    [teachers, getPersonMonthData, getDeptName, isBn]
  )

  const getStudentMonthData = useCallback(
    (studentId: string) => {
      return rangeDays.map((ds) => {
        if (isFriday(ds)) {
          return {
            date: ds,
            status: 'on-leave' as AttendanceStatus,
            punches: [],
            isWeeklyHoliday: true,
          }
        }
        const dayData = attendance[ds]?.[studentId]
        const status: AttendanceStatus = dayData?.status || 'absent'
        return { date: ds, status, punches: dayData?.punches || [], isWeeklyHoliday: false }
      })
    },
    [rangeDays, attendance]
  )

  const downloadStudentSinglePDF = useCallback(
    (studentId: string, studentName: string, className: string, section: string) => {
      const data = getStudentMonthData(studentId)
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(genStudentSinglePDF({ name: studentName, id: studentId, className, section, rows: data, isBn, institutionName: institution.name }))
      win.document.close()
      setTimeout(() => win.print(), 800)
    },
    [getStudentMonthData, isBn]
  )

  const exportStudentExcel = useCallback(() => {
    const data = filteredStudents.map((s, i) => {
      const days = getStudentMonthData(s.id)
      return {
        '#': i + 1,
        ID: s.id,
        Name: isBn ? s.nameBn || s.nameEn : s.nameEn,
        Class: s.class,
        Section: s.section || '—',
        Present: days.filter((d) => d.status === 'present').length,
        Absent: days.filter((d) => d.status === 'absent').length,
        Leave: days.filter((d) => d.status === 'on-leave').length,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Student Attendance')
    XLSX.writeFile(wb, `student_attendance_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filteredStudents, getStudentMonthData, isBn])

  const exportEmployeeExcel = useCallback(() => {
    const data = filteredEmployees.map((t, i) => {
      const days = getPersonMonthData(t.id)
      return {
        '#': i + 1,
        ID: t.id,
        Name: isBn ? t.nameBn || t.nameEn : t.nameEn,
        Department: getDeptName(t.departmentId),
        Designation: t.designation || '—',
        Present: days.filter((d) => d.status === 'present').length,
        Absent: days.filter((d) => d.status === 'absent').length,
        Leave: days.filter((d) => d.status === 'on-leave').length,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Attendance')
    XLSX.writeFile(wb, `employee_attendance_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filteredEmployees, getPersonMonthData, getDeptName, isBn])

  const exportStudentPDFFromOpts = useCallback(
    (opts: AttendancePDFOptions) => {
      const { title, orientation, isBn: optsIsBn } = opts
      const selectedList = filteredStudents.filter((s) => selectedStudents.includes(s.id))

      const generateStudentRow = (s: any, idx: number) => {
        const days = getStudentMonthData(s.id)
        const p = days.filter((d: any) => d.status === 'present').length
        const a = days.filter((d: any) => d.status === 'absent').length
        const l = days.filter((d: any) => d.status === 'on-leave' && !d.isWeeklyHoliday).length
        const w = days.filter((d: any) => d.isWeeklyHoliday).length

        const dayGrid = rangeDays
          .map((_ds, di) => {
            const dayData = days[di]
            if (dayData?.isWeeklyHoliday)
              return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#f3e8ff;color:#8b5cf6;border:0.5px solid #e5e7eb">W</td>'
            if (dayData?.status === 'present')
              return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#d1fae5;color:#059669;border:0.5px solid #e5e7eb">P</td>'
            if (dayData?.status === 'absent')
              return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fee2e2;color:#dc2626;border:0.5px solid #e5e7eb">A</td>'
            return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fef3c7;color:#d97706;border:0.5px solid #e5e7eb">L</td>'
          })
          .join('')

        return `<tr class="${idx % 2 === 1 ? 'alt' : ''}">
        <td style="padding:4px;font-size:9px">${idx + 1}</td>
        <td style="padding:4px;font-size:8px;font-family:monospace;color:#6366f1">${s.id}</td>
        <td style="padding:4px;font-size:9px;font-weight:500">${optsIsBn ? s.nameBn || s.nameEn : s.nameEn}</td>
        <td style="padding:4px;font-size:8px">${s.class}</td>
        <td style="padding:4px;font-size:8px">${s.section || '—'}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#059669">${p}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#dc2626">${a}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#d97706">${l}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#8b5cf6">${w}</td>
        ${dayGrid}
      </tr>`
      }

      const rowsHtml = selectedList.map((s, i) => generateStudentRow(s, i)).join('')

      const dayHeaders = rangeDays
        .map((ds) => {
          const dayNum = ds.slice(8, 10)
          const dayName = isFriday(ds) ? 'F' : new Date(ds).toLocaleDateString('en', { weekday: 'narrow' })
          return `<th style="width:16px;padding:2px;font-size:6px;text-align:center">${dayNum}<br/>${dayName}</th>`
        })
        .join('')

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>@page{size:A4 ${orientation};margin:6mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #6366f1;margin-bottom:8px}.logo{width:28px;height:28px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}.ttl{text-align:center;font-size:11px;font-weight:700;margin-bottom:3px}.sub{text-align:center;font-size:8px;color:#666;margin-bottom:8px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:3px;text-align:left;font-size:7px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:3px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:8px;padding-top:5px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:11px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:7px;color:#888">Student Monthly Attendance</div></div></div>
<div class="ttl">${title}</div>
<div class="sub">${optsIsBn ? 'মোট' : 'Total'}: ${selectedList.length} ${optsIsBn ? 'জন' : 'students'} · ${dateFrom} → ${dateTo} · ${rangeDays.length} ${optsIsBn ? 'দিন' : 'days'}</div>
<table><thead><tr>
  <th style="width:20px">#</th>
  <th style="width:65px">ID</th>
  <th style="width:100px">${optsIsBn ? 'নাম' : 'Name'}</th>
  <th style="width:35px">${optsIsBn ? 'শ্রেণি' : 'C'}</th>
  <th style="width:25px">${optsIsBn ? 'সে' : 'S'}</th>
  <th style="width:20px">P</th>
  <th style="width:20px">A</th>
  <th style="width:20px">L</th>
  <th style="width:20px">W</th>
  ${dayHeaders}
</tr></thead><tbody>${rowsHtml}</tbody></table>
<div class="ftr"><span>EduTech School Management System</span><div>${optsIsBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 800)
      setShowStudentPDF(false)
    },
    [filteredStudents, selectedStudents, getStudentMonthData, dateFrom, dateTo, rangeDays]
  )

  const exportEmployeePDFFromOpts = useCallback(
    (opts: AttendancePDFOptions) => {
      const { title, orientation, isBn: optsIsBn } = opts
      const selectedList = filteredEmployees.filter((t) => selectedEmployees.includes(t.id))

      const generateEmployeeRow = (t: any, idx: number) => {
        const days = getPersonMonthData(t.id)
        const p = days.filter((d: any) => d.status === 'present').length
        const a = days.filter((d: any) => d.status === 'absent').length
        const l = days.filter((d: any) => d.status === 'on-leave').length
        const w = rangeDays.filter((ds) => isFriday(ds)).length

        const dayGrid = rangeDays
          .map((ds, di) => {
            if (isFriday(ds))
              return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#f3e8ff;color:#8b5cf6;border:0.5px solid #e5e7eb">W</td>'
            const dayData = days[di]
            if (dayData?.status === 'present')
              return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#d1fae5;color:#059669;border:0.5px solid #e5e7eb">P</td>'
            if (dayData?.status === 'absent')
              return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fee2e2;color:#dc2626;border:0.5px solid #e5e7eb">A</td>'
            return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fef3c7;color:#d97706;border:0.5px solid #e5e7eb">L</td>'
          })
          .join('')

        return `<tr class="${idx % 2 === 1 ? 'alt' : ''}">
        <td style="padding:4px;font-size:9px">${idx + 1}</td>
        <td style="padding:4px;font-size:8px;font-family:monospace;color:#6366f1">${t.id}</td>
        <td style="padding:4px;font-size:9px;font-weight:500">${optsIsBn ? t.nameBn || t.nameEn : t.nameEn}</td>
        <td style="padding:4px;font-size:8px">${getDeptName(t.departmentId)}</td>
        <td style="padding:4px;font-size:8px">${t.designation || '—'}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#059669">${p}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#dc2626">${a}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#d97706">${l}</td>
        <td style="padding:4px;text-align:center;font-size:8px;font-weight:600;color:#8b5cf6">${w}</td>
        ${dayGrid}
      </tr>`
      }

      const rowsHtml = selectedList.map((t, i) => generateEmployeeRow(t, i)).join('')

      const dayHeaders = rangeDays
        .map((ds) => {
          const dayNum = ds.slice(8, 10)
          const dayName = isFriday(ds) ? 'F' : new Date(ds).toLocaleDateString('en', { weekday: 'narrow' })
          return `<th style="width:16px;padding:2px;font-size:6px;text-align:center">${dayNum}<br/>${dayName}</th>`
        })
        .join('')

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>@page{size:A4 ${orientation};margin:6mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #6366f1;margin-bottom:8px}.logo{width:28px;height:28px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}.ttl{text-align:center;font-size:11px;font-weight:700;margin-bottom:3px}.sub{text-align:center;font-size:8px;color:#666;margin-bottom:8px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:3px;text-align:left;font-size:7px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:3px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:8px;padding-top:5px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:11px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:7px;color:#888">Employee Monthly Attendance</div></div></div>
<div class="ttl">${title}</div>
<div class="sub">${optsIsBn ? 'মোট' : 'Total'}: ${selectedList.length} ${optsIsBn ? 'জন' : 'employees'} · ${dateFrom} → ${dateTo} · ${rangeDays.length} ${optsIsBn ? 'দিন' : 'days'}</div>
<table><thead><tr>
  <th style="width:20px">#</th>
  <th style="width:75px">ID</th>
  <th style="width:100px">${optsIsBn ? 'নাম' : 'Name'}</th>
  <th style="width:70px">${optsIsBn ? 'বিভাগ' : 'Dept'}</th>
  <th style="width:60px">${optsIsBn ? 'পদবি' : 'Desig'}</th>
  <th style="width:20px">P</th>
  <th style="width:20px">A</th>
  <th style="width:20px">L</th>
  <th style="width:20px">W</th>
  ${dayHeaders}
</tr></thead><tbody>${rowsHtml}</tbody></table>
<div class="ftr"><span>EduTech School Management System</span><div>${optsIsBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(html)
      win.document.close()
      setTimeout(() => win.print(), 800)
      setShowEmployeePDF(false)
    },
    [filteredEmployees, selectedEmployees, getPersonMonthData, getDeptName, dateFrom, dateTo, rangeDays]
  )

  const studentAttendanceRecords = useMemo(() => {
    return filteredStudents.map((s) => ({
      id: s.id,
      nameEn: s.nameEn,
      nameBn: s.nameBn,
      class: s.class,
      section: s.section || '',
      days: getStudentMonthData(s.id),
    }))
  }, [filteredStudents, getStudentMonthData])

  const employeeAttendanceRecords = useMemo(() => {
    return filteredEmployees.map((t) => ({
      id: t.id,
      nameEn: t.nameEn,
      nameBn: t.nameBn,
      dept: getDeptName(t.departmentId),
      designation: t.designation || '',
      days: getPersonMonthData(t.id),
    }))
  }, [filteredEmployees, getPersonMonthData, getDeptName])

  const tabs = [
    {
      key: 'today' as Tab,
      labelBn: 'আজকের উপস্থিতি',
      labelEn: "Today's",
      Icon: CalendarCheck,
      color: 'var(--green)',
    },
    {
      key: 'range' as Tab,
      labelBn: 'তারিখ পরিসীমা',
      labelEn: 'Date Range',
      Icon: CalendarRange,
      color: 'var(--brand)',
    },
    {
      key: 'device' as Tab,
      labelBn: 'ডিভাইস',
      labelEn: 'Device',
      Icon: Fingerprint,
      color: '#7C3AED',
    },
    {
      key: 'employee' as Tab,
      labelBn: 'কর্মচারী',
      labelEn: 'Employee',
      Icon: Briefcase,
      color: 'var(--amber)',
    },
    {
      key: 'student' as Tab,
      labelBn: 'শিক্ষার্থী',
      labelEn: 'Student',
      Icon: GraduationCap,
      color: 'var(--teal)',
    },
  ]

  const statusFilters: {
    key: StatusFilter
    labelBn: string
    labelEn: string
    color: string
  }[] = [
    { key: 'all', labelBn: 'সব', labelEn: 'All', color: 'var(--brand)' },
    {
      key: 'present',
      labelBn: 'উপস্থিত',
      labelEn: 'Present',
      color: 'var(--green)',
    },
    {
      key: 'absent',
      labelBn: 'অনুপস্থিত',
      labelEn: 'Absent',
      color: 'var(--red)',
    },
    {
      key: 'on-leave',
      labelBn: 'ছুটিতে',
      labelEn: 'Leave',
      color: 'var(--amber)',
    },
  ]

  const statusBadge = (s: AttendanceStatus) => {
    const m = {
      present: { bg: 'var(--green-light)', c: 'var(--green)', l: 'P' },
      absent: { bg: 'var(--red-light)', c: 'var(--red)', l: 'A' },
      'on-leave': { bg: 'var(--amber-light)', c: 'var(--amber)', l: 'L' },
    }
    const x = m[s]
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-[0.25rem] text-[0.5625rem] font-bold"
        style={{ background: x.bg, color: x.c }}
      >
        {x.l}
      </span>
    )
  }

  const weeklyHolidayBadge = () => {
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-[0.25rem] text-[0.5625rem] font-bold"
        style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}
      >
        W
      </span>
    )
  }

  const legendItems = [
    {
      l: 'P',
      label: isBn ? 'উপস্থিত' : 'Present',
      color: 'var(--green)',
      bg: 'var(--green-light)',
      Icon: CheckCircle,
    },
    {
      l: 'A',
      label: isBn ? 'অনুপস্থিত' : 'Absent',
      color: 'var(--red)',
      bg: 'var(--red-light)',
      Icon: XCircle,
    },
    {
      l: 'L',
      label: isBn ? 'বিলম্ব' : 'Late',
      color: 'var(--amber)',
      bg: 'var(--amber-light)',
      Icon: Clock,
    },
    {
      l: 'W',
      label: isBn ? 'সাপ্তাহিক ছুটি' : 'Weekend',
      color: 'var(--purple)',
      bg: 'var(--purple-light)',
      Icon: CalendarX,
    },
    {
      l: 'E',
      label: isBn ? 'শীঘ্র প্রস্থান' : 'Early Out',
      color: '#0284c7',
      bg: '#e0f2fe',
      Icon: LogOut,
    },
  ]

  return (
    <div>
      {/* Mark All Confirm */}
      {showMarkAll && createPortal(
        <div className="modal-overlay">
          <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-3">
              {isBn ? 'সবাইকে উপস্থিত করুন?' : 'Mark All Present?'}
            </h3>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mb-4">
              {isBn
                ? `${activeTeachers.length} জন শিক্ষককে উপস্থিত হিসেবে চিহ্নিত করা হবে।`
                : `${activeTeachers.length} teachers will be marked present.`}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMarkAll(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleMarkAll}
                className="px-3.5 py-2 rounded-lg bg-[var(--green)] border-0 text-white text-[0.8125rem] font-semibold cursor-pointer"
              >
                {isBn ? 'নিশ্চিত করুন' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Single Person Detail Modal */}
      {viewPerson && (
        <PersonDetailModal
          viewPerson={viewPerson}
          teachers={teachers}
          getPersonMonthData={getPersonMonthData}
          isBn={isBn}
          dateFrom={dateFrom}
          dateTo={dateTo}
          downloadSinglePDF={downloadSinglePDF}
          setViewPerson={setViewPerson}
        />
      )}

      {/* Student Detail Modal */}
      {viewStudent && (
        <StudentDetailModal
          viewStudent={viewStudent}
          getStudentMonthData={getStudentMonthData}
          isBn={isBn}
          downloadStudentSinglePDF={downloadStudentSinglePDF}
          setViewStudent={setViewStudent}
        />
      )}

      {/* Header */}
      <div className={`flex gap-2.5 mb-4 flex-wrap ${isMobile ? 'flex-col items-start' : 'items-center'}`}>
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-[1.125rem]' : 'text-[1.375rem]'}`}>
            {isBn ? 'উপস্থিতি ব্যবস্থাপনা' : 'Attendance Management'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {isBn ? 'শিক্ষক, কর্মচারী এবং ছাত্রদের উপস্থিতি ট্র্যাক করুন' : 'Track teacher, employee and student attendance'}
          </p>
        </div>
        {/* Legend Box */}
        <div
          className={`bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.625rem] px-3 py-2 flex flex-wrap gap-[0.625rem] shrink-0 ${isMobile ? 'w-full gap-1.5' : ''}`}
        >
          {legendItems.map((item) => (
            <div key={item.l} className="flex items-center gap-1">
              <span
                className="inline-flex items-center justify-center w-[1.125rem] h-[1.125rem] rounded-[0.25rem] text-[0.5rem] font-bold"
                style={{ background: item.bg, color: item.color }}
              >
                <item.Icon size={10} />
              </span>
              <span className="text-[0.625rem] text-[var(--text-secondary)] font-medium">
                {item.l}={item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="relative glass rounded-xl mt-3 mb-3 w-full">
        <div className={`relative flex gap-[0.375rem] p-[0.3125rem] rounded-[inherit] ${isMobile || isTablet ? 'overflow-x-auto flex-nowrap' : 'flex-wrap'}`}>
          {/* Sliding indicator */}
          <div
            ref={sliderRef}
            className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] transition-all duration-300 ease-out z-0"
            style={{
              background: tabs.find((t) => t.key === activeTab)?.color || 'var(--brand)',
              boxShadow: `0 2px 8px ${tabs.find((t) => t.key === activeTab)?.color || 'var(--brand)'}40`,
            }}
          />
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => { if (el) tabRefs.current.set(tab.key, el) }}
              onClick={() => setActiveTab(tab.key)}
              className={`relative z-10 flex items-center justify-center gap-[0.375rem] py-2 px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${isMobile || isTablet ? 'shrink-0' : 'flex-1'} ${
                activeTab === tab.key ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={{ background: 'transparent' }}
            >
              <tab.Icon size={15} />
              {isBn ? tab.labelBn : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter + Date Range (for teacher tabs) */}
      {(activeTab === 'today' || activeTab === 'range') && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center gap-2 flex-wrap">
          <span className="text-[0.6875rem] font-medium text-[var(--text-muted)]">{isBn ? 'অবস্থা:' : 'Status:'}</span>
          {statusFilters.map((sf) => (
            <button
              key={sf.key}
              onClick={() => setStatusFilter(sf.key)}
              className={`px-3 py-1 rounded-lg text-[0.6875rem] cursor-pointer border ${
                statusFilter === sf.key
                  ? 'font-semibold'
                  : 'font-normal border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
              style={
                statusFilter === sf.key
                  ? {
                      border: `1px solid ${sf.color}`,
                      background: `${sf.color}18`,
                      color: sf.color,
                    }
                  : {}
              }
            >
              {isBn ? sf.labelBn : sf.labelEn}
            </button>
          ))}
          <div className="flex-1" />
          <CalendarRange size={14} className="text-[var(--text-muted)]" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-[0.3125rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.6875rem] outline-none"
          />
          <span className="text-[0.6875rem] text-[var(--text-muted)]">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-[0.3125rem] rounded-[0.4375rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.6875rem] outline-none"
          />
        </div>
      )}

      {/* ==================== TAB: TODAY ==================== */}
      {activeTab === 'today' && (
        <TodayTab
          isBn={isBn}
          date={date}
          setDate={setDate}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          todayFiltered={todayFiltered}
          paginatedToday={paginatedToday}
          empPage={empPage}
          setEmpPage={setEmpPage}
          empPerPage={empPerPage}
          setEmpPerPage={setEmpPerPage}
          todayTotalPages={todayTotalPages}
          stats={stats}
          filteredEmployees={filteredEmployees}
          filteredStudents={filteredStudents}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
          setViewPerson={setViewPerson}
          setShowMarkAll={setShowMarkAll}
          statusFilters={statusFilters}
          statusBadge={statusBadge}
        />
      )}

      {/* ==================== TAB: RANGE ==================== */}
      {activeTab === 'range' && (
        <RangeTab
          isBn={isBn}
          filteredEmployees={filteredEmployees}
          paginatedEmployees={paginatedEmployees}
          rangeDays={rangeDays}
          empPage={empPage}
          setEmpPage={setEmpPage}
          empPerPage={empPerPage}
          setEmpPerPage={setEmpPerPage}
          empTotalPages={empTotalPages}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
          setViewPerson={setViewPerson}
          attendance={attendance}
          showEmployeePDF={showEmployeePDF}
          setShowEmployeePDF={setShowEmployeePDF}
          exportEmployeeExcel={exportEmployeeExcel}
          statusBadge={statusBadge}
          weeklyHolidayBadge={weeklyHolidayBadge}
          getDeptName={getDeptName}
          getStatus={getStatus}
        />
      )}

      {/* ==================== TAB: DEVICE ==================== */}
      {activeTab === 'device' && <DeviceTab isBn={isBn} date={date} />}

      {/* ==================== TAB: EMPLOYEE ==================== */}
      {activeTab === 'employee' && (
        <EmployeeTab
          isBn={isBn}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          employeeSearch={employeeSearch}
          setEmployeeSearch={setEmployeeSearch}
          fDeptEmp={fDeptEmp}
          setFDeptEmp={setFDeptEmp}
          filteredEmployees={filteredEmployees}
          paginatedEmployees={paginatedEmployees}
          empPage={empPage}
          setEmpPage={setEmpPage}
          empPerPage={empPerPage}
          setEmpPerPage={setEmpPerPage}
          empTotalPages={empTotalPages}
          rangeDays={rangeDays}
          attendance={attendance}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
          setViewPerson={setViewPerson}
          showEmployeePDF={showEmployeePDF}
          setShowEmployeePDF={setShowEmployeePDF}
          exportEmployeeExcel={exportEmployeeExcel}
          departments={departments}
          statusBadge={statusBadge}
          weeklyHolidayBadge={weeklyHolidayBadge}
          getStatus={getStatus}
          getDeptName={getDeptName}
        />
      )}

      {/* ==================== TAB: STUDENT ==================== */}
      {activeTab === 'student' && (
        <StudentTab
          isBn={isBn}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          fClass={fClass}
          setFClass={setFClass}
          fSection={fSection}
          setFSection={setFSection}
          classOptions={classOptions}
          sectionsMap={sectionsMap}
          allSections={allSections}
          filteredStudents={filteredStudents}
          paginatedStudents={paginatedStudents}
          stuPage={stuPage}
          setStuPage={setStuPage}
          stuPerPage={stuPerPage}
          setStuPerPage={(val) => setStuPerPage(Number(val))}
          stuTotalPages={stuTotalPages}
          rangeDays={rangeDays}
          attendance={attendance}
          selectedStudents={selectedStudents}
          setSelectedStudents={setSelectedStudents}
          setViewStudent={setViewStudent}
          showStudentPDF={showStudentPDF}
          setShowStudentPDF={setShowStudentPDF}
          exportStudentExcel={exportStudentExcel}
          statusBadge={statusBadge}
          weeklyHolidayBadge={weeklyHolidayBadge}
          getStatus={getStatus}
        />
      )}

      {/* Student PDF Options Modal */}
      {showStudentPDF && (
        <AttendancePDFOptionsModal
          count={filteredStudents.length}
          isBn={isBn}
          type="student"
          records={studentAttendanceRecords}
          dateFrom={dateFrom}
          dateTo={dateTo}
          rangeDays={rangeDays}
          onClose={() => setShowStudentPDF(false)}
          onDownload={exportStudentPDFFromOpts}
        />
      )}

      {/* Employee PDF Options Modal */}
      {showEmployeePDF && (
        <AttendancePDFOptionsModal
          count={filteredEmployees.length}
          isBn={isBn}
          type="employee"
          records={employeeAttendanceRecords}
          dateFrom={dateFrom}
          dateTo={dateTo}
          rangeDays={rangeDays}
          onClose={() => setShowEmployeePDF(false)}
          onDownload={exportEmployeePDFFromOpts}
        />
      )}
    </div>
  )
}
