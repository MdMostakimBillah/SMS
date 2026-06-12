import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarRange,
  CalendarX,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  GraduationCap,
  LogOut,
  MoreVertical,
  Search,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'

import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useScrollLock } from '@/hooks/useScrollLock'
import { AttendancePDFOptionsModal } from '@/components/shared/AttendancePDFOptionsModal'
import type { AttendancePDFOptions } from '@/components/shared/AttendancePDFOptionsModal'
import type { AttendanceStatus, DayAttendance } from '@/store/teacherStore'
import { genSinglePDF, genStudentSinglePDF } from './pdfTemplates'
import DeviceTab from './DeviceTab'
import { today, twentyDaysAgo, toBnNum, getDaysBetween, shortDate, dayName, isFriday, setGlobalBn } from './helpers'
import type { Tab, StatusFilter } from './helpers'

export default function AttendancePage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { isMobile } = useWindowSize()
  const { teachers, departments, attendance, markAllPresent } = useTeacherStore()
  const students = useSessionStudents()
  const { classes } = useClassStore()
  setGlobalBn(isBn)

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const allSections = useMemo(() => {
    const sectionSet = new Set<string>()
    classes.forEach((cls) => cls.sections.forEach((s) => sectionSet.add(s.name)))
    return Array.from(sectionSet).sort()
  }, [classes])

  const [activeTab, setActiveTab] = useState<Tab>('today')
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
  const [showStudentPreview, setShowStudentPreview] = useState(false)
  const [showEmployeePreview, setShowEmployeePreview] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [empPage, setEmpPage] = useState(1)
  const [empPerPage, setEmpPerPage] = useState(20)
  const [stuPage, setStuPage] = useState(1)
  const [stuPerPage, setStuPerPage] = useState(20)
  const [showEmployeeActionMenu, setShowEmployeeActionMenu] = useState(false)
  const [showStudentActionMenu, setShowStudentActionMenu] = useState(false)
  const employeeActionMenuRef = useRef<HTMLDivElement>(null)
  const studentActionMenuRef = useRef<HTMLDivElement>(null)
  // Device tab state moved to DeviceTab component
  useScrollLock(
    showMarkAll ||
      viewPerson !== null ||
      viewStudent !== null ||
      showStudentPDF ||
      showEmployeePDF ||
      showStudentPreview ||
      showEmployeePreview
  )

  // Device functions moved to DeviceTab component

  // Click outside handlers for action menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeActionMenuRef.current && !employeeActionMenuRef.current.contains(event.target as Node)) {
        setShowEmployeeActionMenu(false)
      }
      if (studentActionMenuRef.current && !studentActionMenuRef.current.contains(event.target as Node)) {
        setShowStudentActionMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const getDeptName = (id: string) => {
    const d = departments.find((x) => x.id === id)
    return d ? (isBn ? d.nameBn : d.name) : '—'
  }

  // Today's filtered employees + students with punch data
  const todayFiltered = useMemo(() => {
    const staff = filteredEmployees.map((t) => {
      const da = dayAtt[t.id]
      const status: AttendanceStatus = da?.status || 'absent'
      const inPunch = da?.punches?.find((p) => p.type === 'in')
      const outPunch = [...(da?.punches || [])].reverse().find((p) => p.type === 'out')
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
      const rand = Math.random()
      const status: AttendanceStatus = rand < 0.85 ? 'present' : rand < 0.95 ? 'absent' : 'on-leave'
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
        inTime: status === 'present' ? '08:00' : '—',
        outTime: status === 'present' ? '15:00' : '—',
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
        })
      )
      win.document.close()
      setTimeout(() => win.print(), 800)
    },
    [teachers, getPersonMonthData, getDeptName, isBn]
  )

  const getStudentMonthData = useCallback(
    (_studentId: string) => {
      return rangeDays.map((ds) => {
        if (isFriday(ds)) {
          return {
            date: ds,
            status: 'on-leave' as AttendanceStatus,
            punches: [],
            isWeeklyHoliday: true,
          }
        }
        const rand = Math.random()
        const status: AttendanceStatus = rand < 0.85 ? 'present' : rand < 0.95 ? 'absent' : 'on-leave'
        return { date: ds, status, punches: [], isWeeklyHoliday: false }
      })
    },
    [rangeDays]
  )

  const downloadStudentSinglePDF = useCallback(
    (studentId: string, studentName: string, className: string, section: string) => {
      const data = getStudentMonthData(studentId)
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(genStudentSinglePDF({ name: studentName, id: studentId, className, section, rows: data, isBn }))
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

        // Create compact day grid - show P/A/L/W for each day
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

      // Day headers for compact grid
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

        // Create compact day grid
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

      // Day headers for compact grid
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

  const previewStudentPDFFromOpts = useCallback(
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
    },
    [filteredStudents, selectedStudents, getStudentMonthData, dateFrom, dateTo, rangeDays]
  )

  const previewEmployeePDFFromOpts = useCallback(
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
        <td style="padding:4px;font-size:8px">${t.dept}</td>
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
  <th style="width:65px">ID</th>
  <th style="width:100px">${optsIsBn ? 'নাম' : 'Name'}</th>
  <th style="width:60px">${optsIsBn ? 'বিভাগ' : 'Dept'}</th>
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
    },
    [filteredEmployees, selectedEmployees, getPersonMonthData, getDeptName, dateFrom, dateTo, rangeDays]
  )

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

  const sel =
    'px-[0.5625rem] py-[0.4375rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer outline-none'

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
      {viewPerson && createPortal(
        <div className="modal-overlay">
          <div className="modal-content modal-box max-h-[85vh] overflow-hidden flex flex-col" style={{ maxWidth: '40.625rem' }}>
            <div className="px-[1.125rem] py-3.5 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--brand-light)]">
              {(() => {
                const t = teachers.find((te) => te.id === viewPerson.id)
                const photoUrl = t?.photo
                return photoUrl ? (
                  <img src={photoUrl} className="w-10 h-10 rounded-full object-cover border-2 border-[var(--brand)]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] border-2 border-[var(--brand)] flex items-center justify-center text-[var(--brand)] font-bold text-[0.875rem]">
                    {viewPerson.name.charAt(0)}
                  </div>
                )
              })()}
              <div className="flex-1">
                <div className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{viewPerson.name}</div>
                <div className="text-[0.6875rem] text-[var(--brand)] font-mono">
                  {viewPerson.id} · {dateFrom} → {dateTo}
                </div>
              </div>
              <button
                onClick={() => setViewPerson(null)}
                className="w-7 h-7 rounded-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
              >
                <X size={14} className="text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-[1.125rem] py-3.5">
              {(() => {
                const data = getPersonMonthData(viewPerson.id)
                const present = data.filter((d) => d.status === 'present').length
                const absent = data.filter((d) => d.status === 'absent').length
                const leave = data.filter((d) => d.status === 'on-leave').length
                const t = teachers.find((te) => te.id === viewPerson.id)
                const inTime = t?.inTime || '08:00'
                const lateCount = data.filter((d) => {
                  if (d.status !== 'present') return false
                  const firstIn = d.punches.find((p) => p.type === 'in')
                  return firstIn && firstIn.time > inTime
                }).length
                const avgIn = (() => {
                  const ins = data
                    .filter((d) => d.status === 'present')
                    .map((d) => {
                      const f = d.punches.find((p) => p.type === 'in')
                      return f ? f.time : null
                    })
                    .filter(Boolean) as string[]
                  if (ins.length === 0) return '—'
                  const mins = ins.map((ti) => parseInt(ti.split(':')[0]) * 60 + parseInt(ti.split(':')[1]))
                  const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
                  return `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`
                })()
                return (
                  <>
                    <div className="grid grid-cols-5 gap-2 mb-3.5">
                      {[
                        {
                          l: isBn ? 'উপস্থিত' : 'Present',
                          vBn: toBnNum(present),
                          vEn: String(present),
                          c: 'var(--green)',
                          bg: 'var(--green-light)',
                        },
                        {
                          l: isBn ? 'অনুপস্থিত' : 'Absent',
                          vBn: toBnNum(absent),
                          vEn: String(absent),
                          c: 'var(--red)',
                          bg: 'var(--red-light)',
                        },
                        {
                          l: isBn ? 'ছুটিতে' : 'Leave',
                          vBn: toBnNum(leave),
                          vEn: String(leave),
                          c: 'var(--amber)',
                          bg: 'var(--amber-light)',
                        },
                        {
                          l: isBn ? 'বিলম্ব' : 'Late',
                          vBn: toBnNum(lateCount),
                          vEn: String(lateCount),
                          c: 'var(--red)',
                          bg: 'var(--red-light)',
                        },
                        {
                          l: isBn ? 'গড় ইন' : 'Avg In',
                          vBn: avgIn,
                          vEn: avgIn,
                          c: 'var(--brand)',
                          bg: 'var(--brand-light)',
                        },
                      ].map((s) => (
                        <div key={s.l} className="p-2 rounded-[0.5rem] text-center" style={{ background: s.bg }}>
                          <div className="text-lg font-bold" style={{ color: s.c }}>
                            {isBn ? s.vBn : s.vEn}
                          </div>
                          <div className="text-[0.5625rem]" style={{ color: s.c }}>
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                    <table className="w-full border-collapse text-[0.6875rem]">
                      <thead>
                        <tr className="bg-[var(--bg-secondary)]">
                          <th className="p-[0.3125rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)] w-[1.5rem]">
                            #
                          </th>
                          <th className="p-[0.3125rem] text-left text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'তারিখ' : 'Date'}
                          </th>
                          <th className="p-[0.3125rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'ইন' : 'In'}
                          </th>
                          <th className="p-[0.3125rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'আউট' : 'Out'}
                          </th>
                          <th className="p-[0.3125rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'অবস্থা' : 'Status'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((d, i) => {
                          const firstIn = d.punches.find((p) => p.type === 'in')
                          const lastOut = [...d.punches].reverse().find((p) => p.type === 'out')
                          const isLate = firstIn && firstIn.time > inTime
                          return (
                            <tr key={d.date} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                              <td className="p-[0.3125rem] text-center text-[0.5625rem] text-[var(--text-muted)]">{i + 1}</td>
                              <td className="p-[0.3125rem]">
                                <div className="text-[0.625rem] font-medium text-[var(--text-primary)]">{d.date}</div>
                                <div className="text-[0.5rem] text-[var(--text-muted)]">{dayName(d.date)}</div>
                              </td>
                              <td className="p-[0.3125rem] text-center">
                                <span
                                  className={`text-[0.5625rem] font-mono font-semibold px-[0.3125rem] py-[0.0625rem] rounded ${
                                    firstIn
                                      ? isLate
                                        ? 'bg-[var(--amber-light)] text-[var(--amber)]'
                                        : 'bg-[var(--green-light)] text-[var(--green)]'
                                      : 'text-[var(--text-muted)]'
                                  }`}
                                >
                                  {firstIn?.time || '—'}
                                </span>
                              </td>
                              <td className="p-[0.3125rem] text-center">
                                <span className="text-[0.5625rem] font-mono text-[var(--text-secondary)]">{lastOut?.time || '—'}</span>
                              </td>
                              <td className="p-[0.3125rem] text-center">
                                <span
                                  className={`text-[0.5625rem] font-semibold px-[0.375rem] py-[0.0625rem] rounded-[0.5rem] ${
                                    d.status === 'present'
                                      ? 'bg-[var(--green-light)] text-[var(--green)]'
                                      : d.status === 'absent'
                                        ? 'bg-[var(--red-light)] text-[var(--red)]'
                                        : 'bg-[var(--amber-light)] text-[var(--amber)]'
                                  }`}
                                >
                                  {d.status === 'present'
                                    ? isBn
                                      ? 'উপস্থিত'
                                      : 'Present'
                                    : d.status === 'absent'
                                      ? isBn
                                        ? 'অনুপস্থিত'
                                        : 'Absent'
                                      : isBn
                                        ? 'ছুটিতে'
                                        : 'Leave'}
                                </span>
                                {isLate && <span className="text-[0.4375rem] text-[var(--amber)] font-bold ml-1">LATE</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </>
                )
              })()}
            </div>
            <div className="px-[1.125rem] py-3 border-t border-[var(--border)] flex gap-2 justify-end">
              <button
                onClick={() => setViewPerson(null)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
              <button
                onClick={() => downloadSinglePDF(viewPerson.id, viewPerson.name)}
                className="flex items-center gap-[0.3125rem] px-3.5 py-2 rounded-lg bg-[var(--red)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
              >
                <FileText size={13} />
                PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Student Detail Modal */}
      {viewStudent && createPortal(
        <div className="modal-overlay">
          <div className="modal-content modal-box max-h-[85vh] overflow-hidden flex flex-col" style={{ maxWidth: '37.5rem' }}>
            <div className="px-[1.125rem] py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--brand-light)]">
              <div>
                <div className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">{viewStudent.name}</div>
                <div className="text-[0.6875rem] text-[var(--brand)] font-mono">
                  {viewStudent.id} · {viewStudent.class} · {isBn ? 'সেকশন' : 'Section'}: {viewStudent.section}
                </div>
              </div>
              <button
                onClick={() => setViewStudent(null)}
                className="w-7 h-7 rounded-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
              >
                <X size={14} className="text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-[1.125rem] py-3.5">
              {(() => {
                const data = getStudentMonthData(viewStudent.id)
                const present = data.filter((d) => d.status === 'present').length
                const absent = data.filter((d) => d.status === 'absent').length
                const leave = data.filter((d) => d.status === 'on-leave' && !d.isWeeklyHoliday).length
                const weeklyHoliday = data.filter((d) => d.isWeeklyHoliday).length
                return (
                  <>
                    <div className="grid grid-cols-5 gap-2 mb-3.5">
                      {[
                        {
                          l: isBn ? 'মোট' : 'Total',
                          vBn: toBnNum(data.length),
                          vEn: String(data.length),
                          c: 'var(--brand)',
                          bg: 'var(--brand-light)',
                        },
                        {
                          l: isBn ? 'উপস্থিত' : 'Present',
                          vBn: toBnNum(present),
                          vEn: String(present),
                          c: 'var(--green)',
                          bg: 'var(--green-light)',
                        },
                        {
                          l: isBn ? 'অনুপস্থিত' : 'Absent',
                          vBn: toBnNum(absent),
                          vEn: String(absent),
                          c: 'var(--red)',
                          bg: 'var(--red-light)',
                        },
                        {
                          l: isBn ? 'ছুটিতে' : 'Leave',
                          vBn: toBnNum(leave),
                          vEn: String(leave),
                          c: 'var(--amber)',
                          bg: 'var(--amber-light)',
                        },
                        {
                          l: isBn ? 'সাপ্তাহিক ছুটি' : 'W.Holiday',
                          vBn: toBnNum(weeklyHoliday),
                          vEn: String(weeklyHoliday),
                          c: 'var(--purple)',
                          bg: 'var(--purple-light)',
                        },
                      ].map((s) => (
                        <div key={s.l} className="p-2.5 rounded-[0.625rem] text-center" style={{ background: s.bg }}>
                          <div className="text-xl font-bold" style={{ color: s.c }}>
                            {isBn ? s.vBn : s.vEn}
                          </div>
                          <div className="text-[0.625rem]" style={{ color: s.c }}>
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                    <table className="w-full border-collapse text-[0.6875rem]">
                      <thead>
                        <tr className="bg-[var(--bg-secondary)]">
                          <th className="p-[0.375rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            #
                          </th>
                          <th className="p-[0.375rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'তারিখ' : 'Date'}
                          </th>
                          <th className="p-[0.375rem] text-left text-[0.625rem] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'অবস্থা' : 'Status'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((d, i) => (
                          <tr key={d.date} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                            <td className="px-2 py-[0.3125rem] text-[var(--text-muted)]">{i + 1}</td>
                            <td className="px-2 py-[0.3125rem]">
                              <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">{d.date}</div>
                              <div className="text-[0.5625rem] text-[var(--text-muted)]">{dayName(d.date)}</div>
                            </td>
                            <td className="px-2 py-[0.3125rem]">
                              {d.isWeeklyHoliday ? (
                                <span className="text-[0.625rem] font-semibold px-[0.4375rem] py-[0.125rem] rounded-[0.625rem] bg-[var(--purple-light)] text-[var(--purple)]">
                                  {isBn ? 'সাপ্তাহিক ছুটি' : 'Weekly Holiday'}
                                </span>
                              ) : (
                                <span
                                  className={`text-[0.625rem] font-semibold px-[0.4375rem] py-[0.125rem] rounded-[0.625rem] ${
                                    d.status === 'present'
                                      ? 'bg-[var(--green-light)] text-[var(--green)]'
                                      : d.status === 'absent'
                                        ? 'bg-[var(--red-light)] text-[var(--red)]'
                                        : 'bg-[var(--amber-light)] text-[var(--amber)]'
                                  }`}
                                >
                                  {d.status === 'present'
                                    ? isBn
                                      ? 'উপস্থিত'
                                      : 'Present'
                                    : d.status === 'absent'
                                      ? isBn
                                        ? 'অনুপস্থিত'
                                        : 'Absent'
                                      : isBn
                                        ? 'ছুটিতে'
                                        : 'Leave'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )
              })()}
            </div>
            <div className="px-[1.125rem] py-3 border-t border-[var(--border)] flex gap-2 justify-end">
              <button
                onClick={() => setViewStudent(null)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
              >
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
              <button
                onClick={() => downloadStudentSinglePDF(viewStudent.id, viewStudent.name, viewStudent.class, viewStudent.section)}
                className="flex items-center gap-[0.3125rem] px-3.5 py-2 rounded-lg bg-[var(--red)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
              >
                <FileText size={13} />
                PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
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
      <div className="flex gap-1.5 mb-3.5 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[0.625rem] text-[0.75rem] cursor-pointer transition-all ${
              activeTab === tab.key
                ? 'font-semibold'
                : 'font-normal border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)]'
            }`}
            style={
              activeTab === tab.key
                ? {
                    border: `1.5px solid ${tab.color}`,
                    background: `${tab.color}15`,
                    color: tab.color,
                  }
                : {}
            }
          >
            <tab.Icon size={15} />
            {isBn ? tab.labelBn : tab.labelEn}
          </button>
        ))}
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

      {/* Filter + Date Range for Student tab */}
      {activeTab === 'student' && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-[0.5625rem] py-[0.3125rem] flex-1 min-w-[10rem]">
            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
              className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
            />
            {studentSearch && (
              <button
                onClick={() => setStudentSearch('')}
                className="border-none bg-transparent cursor-pointer text-[var(--text-muted)] flex"
              >
                <X size={11} />
              </button>
            )}
          </div>
          <select
            value={fClass}
            onChange={(e) => {
              setFClass(e.target.value)
              setFSection('')
            }}
            className={sel}
          >
            <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select value={fSection} onChange={(e) => setFSection(e.target.value)} className={sel}>
            <option value="">{isBn ? 'সব সেকশন' : 'All Sections'}</option>
            {fClass
              ? (sectionsMap[fClass] || []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              : allSections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
          </select>
          {(fClass || fSection || studentSearch) && (
            <button
              onClick={() => {
                setFClass('')
                setFSection('')
                setStudentSearch('')
              }}
              className="px-2 py-[0.1875rem] rounded-[0.375rem] bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.625rem] cursor-pointer"
            >
              ✕
            </button>
          )}
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

      {/* Filter + Date Range for Employee tab */}
      {activeTab === 'employee' && (
        <>
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-[0.5625rem] py-[0.3125rem] flex-1 min-w-[10rem]">
              <Search size={13} className="text-[var(--text-muted)] shrink-0" />
              <input
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
                className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
              />
              {employeeSearch && (
                <button
                  onClick={() => setEmployeeSearch('')}
                  className="border-none bg-transparent cursor-pointer text-[var(--text-muted)] flex"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <select value={fDeptEmp} onChange={(e) => setFDeptEmp(e.target.value)} className={sel}>
              <option value="">{isBn ? 'সব বিভাগ' : 'All Depts'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {isBn ? d.nameBn : d.name}
                </option>
              ))}
            </select>
            {(fDeptEmp || employeeSearch) && (
              <button
                onClick={() => {
                  setFDeptEmp('')
                  setEmployeeSearch('')
                }}
                className="px-2 py-[0.1875rem] rounded-[0.375rem] bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.625rem] cursor-pointer"
              >
                ✕
              </button>
            )}
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3.5">
            {[
              {
                lBn: 'মোট',
                lEn: 'Total',
                v: filteredEmployees.length,
                Icon: Users,
                c: 'var(--brand)',
                bg: 'var(--brand-light)',
              },
              {
                lBn: 'গড় উপস্থিতি',
                lEn: 'Avg Present',
                v: rangeDays.length
                  ? Math.round(
                      (filteredEmployees.reduce(
                        (sum, t) => sum + rangeDays.filter((ds) => attendance[ds]?.[t.id]?.status === 'present').length,
                        0
                      ) /
                        (filteredEmployees.length * rangeDays.length)) *
                        100
                    ) + '%'
                  : '0%',
                Icon: CheckCircle,
                c: 'var(--green)',
                bg: 'var(--green-light)',
              },
              {
                lBn: 'মোট দিন',
                lEn: 'Total Days',
                v: rangeDays.length,
                Icon: CalendarRange,
                c: 'var(--brand)',
                bg: 'var(--brand-light)',
              },
              {
                lBn: 'সাপ্তাহিক ছুটি',
                lEn: 'Weekends',
                v: rangeDays.filter((ds) => isFriday(ds)).length,
                Icon: CalendarX,
                c: 'var(--purple)',
                bg: 'var(--purple-light)',
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

          {/* Export buttons */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[0.75rem] text-[var(--text-secondary)]">
                {isBn ? `মোট ${filteredEmployees.length} জন কর্মচারী` : `${filteredEmployees.length} employees`}
              </span>
              {selectedEmployees.length > 0 && (
                <span className="text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-[0.1875rem] rounded-[0.375rem] font-medium">
                  {selectedEmployees.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <div className="relative" ref={employeeActionMenuRef}>
              <button
                onClick={() => setShowEmployeeActionMenu(!showEmployeeActionMenu)}
                className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-lg bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-[0.75rem] cursor-pointer font-medium"
              >
                <MoreVertical size={13} />
                {isBn ? 'অ্যাকশন' : 'Action'}
                <ChevronDown size={12} />
              </button>
              {showEmployeeActionMenu && (
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
                      exportEmployeeExcel()
                      setShowEmployeeActionMenu(false)
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
                      setShowEmployeePDF(true)
                      setShowEmployeeActionMenu(false)
                    }}
                    disabled={selectedEmployees.length === 0}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      border: 'none',
                      background: 'transparent',
                      color: selectedEmployees.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: selectedEmployees.length === 0 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      opacity: selectedEmployees.length === 0 ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (selectedEmployees.length > 0) e.currentTarget.style.background = 'var(--red-light)' }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FileText size={14} style={{ color: 'var(--red)' }} />
                    {isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                    {selectedEmployees.length > 0 && ` (${selectedEmployees.length})`}
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
                  <button
                    onClick={() => {
                      setShowEmployeePreview(true)
                      setShowEmployeeActionMenu(false)
                    }}
                    disabled={selectedEmployees.length === 0}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      border: 'none',
                      background: 'transparent',
                      color: selectedEmployees.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: selectedEmployees.length === 0 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      opacity: selectedEmployees.length === 0 ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (selectedEmployees.length > 0) e.currentTarget.style.background = 'var(--brand-light)' }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Eye size={14} style={{ color: 'var(--brand)' }} />
                    {isBn ? 'প্রিভিউ' : 'Preview'}
                    {selectedEmployees.length > 0 && ` (${selectedEmployees.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Employee Table */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full border-collapse text-[0.6875rem]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.25rem]">
                      <input
                        type="checkbox"
                        checked={filteredEmployees.length > 0 && filteredEmployees.every((t) => selectedEmployees.includes(t.id))}
                        onChange={() => {
                          if (filteredEmployees.every((t) => selectedEmployees.includes(t.id))) setSelectedEmployees([])
                          else setSelectedEmployees(filteredEmployees.map((t) => t.id))
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
                      {isBn ? 'পদবি' : 'Designation'}
                    </th>
                    <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[4.375rem]">
                      {isBn ? 'ইন টাইম' : 'In-Time'}
                    </th>
                    <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[4.375rem]">
                      {isBn ? 'আউট টাইম' : 'Out-Time'}
                    </th>
                    <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[3.75rem]">
                      {isBn ? 'অবস্থা' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((t) => {
                    const da = dayAtt[t.id]
                    const st: AttendanceStatus = da?.status || 'absent'
                    const inPunch = da?.punches?.find((p) => p.type === 'in')
                    const outPunch = [...(da?.punches || [])].reverse().find((p) => p.type === 'out')
                    const isLate = inPunch && t.inTime && inPunch.time > t.inTime
                    return (
                      <tr
                        key={t.id}
                        className={`border-b border-[var(--border)] transition-colors ${
                          selectedEmployees.includes(t.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'hover:bg-[var(--bg-secondary)]'
                        }`}
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
                        <td className="p-[0.375rem]">
                          <div
                            className="flex items-center gap-1.5 cursor-pointer"
                            onClick={() =>
                              setViewPerson({
                                id: t.id,
                                name: isBn ? t.nameBn || t.nameEn : t.nameEn,
                                type: 'teacher',
                              })
                            }
                          >
                            <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">
                              {isBn ? t.nameBn || t.nameEn : t.nameEn}
                            </div>
                            <ExternalLink size={10} className="text-[var(--text-muted)]" />
                          </div>
                          <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">{t.id}</div>
                        </td>
                        <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{getDeptName(t.departmentId)}</td>
                        <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{t.designation || '—'}</td>
                        <td className="p-[0.375rem] text-center">
                          {st === 'present' && inPunch ? (
                            <span
                              className={`text-[0.625rem] font-mono font-semibold px-2 py-[0.125rem] rounded ${isLate ? 'bg-[var(--amber-light)] text-[var(--amber)]' : 'bg-[var(--green-light)] text-[var(--green)]'}`}
                            >
                              {inPunch.time}
                            </span>
                          ) : (
                            <span className="text-[0.625rem] text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="p-[0.375rem] text-center">
                          {st === 'present' && outPunch ? (
                            <span className="text-[0.625rem] font-mono font-medium text-[var(--text-secondary)]">{outPunch.time}</span>
                          ) : (
                            <span className="text-[0.625rem] text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="p-[0.375rem] text-center">
                          {statusBadge(st)}
                          {isLate && st === 'present' && <span className="text-[0.5rem] text-[var(--amber)] font-semibold ml-1">LATE</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">
                        <Users size={28} className="block mx-auto mb-2 opacity-30" />
                        {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No employees found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[0.6875rem] text-[var(--text-muted)]">
              <span>📊 P=Present, A=Absent, L=Late, W=Weekend · {isBn ? 'নামে ক্লিক করুন বিস্তারিত দেখতে' : 'Click name for details'}</span>
              <span>
                {rangeDays.length} {isBn ? 'দিন' : 'days'} · {filteredEmployees.length} {isBn ? 'কর্মচারী' : 'employees'}
              </span>
            </div>
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">
                  {(empPage - 1) * empPerPage + 1}–{Math.min(empPage * empPerPage, filteredEmployees.length)} / {filteredEmployees.length}
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
                    ...(Array.from({ length: Math.min(empTotalPages, 5) }, (_, i) => {
                      const start = Math.max(1, Math.min(empPage - 2, empTotalPages - 4))
                      const pg = start + i
                      return pg <= empTotalPages
                        ? ([
                            <span key={pg} className="text-[0.6875rem]">
                              {pg}
                            </span>,
                            () => setEmpPage(pg),
                            empPage === pg,
                          ] as const)
                        : null
                    }).filter(Boolean) as [React.ReactNode, () => void, boolean][]),
                    [
                      <ChevronRight size={12} />,
                      () => setEmpPage((p) => Math.min(empTotalPages, p + 1)),
                      empPage === empTotalPages,
                    ] as const,
                    [<ChevronsRight size={12} />, () => setEmpPage(empTotalPages), empPage === empTotalPages] as const,
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
      )}

      {/* ==================== TAB: TODAY ==================== */}
      {activeTab === 'today' && (
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
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.6875rem] font-medium text-[var(--text-muted)]">{isBn ? 'ফিল্টার:' : 'Filter:'}</span>
              {statusFilters.map((sf) => (
                <button
                  key={sf.key}
                  onClick={() => {
                    setStatusFilter(sf.key)
                    setEmpPage(1)
                  }}
                  className={`px-3 py-[0.3125rem] rounded-lg text-[0.6875rem] cursor-pointer border transition-all ${
                    statusFilter === sf.key
                      ? 'font-semibold'
                      : 'font-normal border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}
                  style={
                    statusFilter === sf.key
                      ? {
                          borderColor: sf.color,
                          background: `${sf.color}18`,
                          color: sf.color,
                        }
                      : {}
                  }
                >
                  {isBn ? sf.labelBn : sf.labelEn}
                </button>
              ))}
              <span className="text-[0.6875rem] text-[var(--text-muted)] ml-1">
                ({todayFiltered.length} {isBn ? 'জন' : 'staff'})
              </span>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full border-collapse text-[0.6875rem]">
                <thead>
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
      )}

      {/* ==================== TAB: RANGE ==================== */}
      {activeTab === 'range' && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3.5">
            {[
              {
                lBn: 'মোট',
                lEn: 'Total',
                v: filteredEmployees.length,
                Icon: Users,
                c: 'var(--brand)',
                bg: 'var(--brand-light)',
              },
              {
                lBn: 'গড় উপস্থিতি',
                lEn: 'Avg Present',
                v: rangeDays.length
                  ? Math.round(
                      (filteredEmployees.reduce(
                        (sum, t) => sum + rangeDays.filter((ds) => attendance[ds]?.[t.id]?.status === 'present').length,
                        0
                      ) /
                        (filteredEmployees.length * rangeDays.length)) *
                        100
                    ) + '%'
                  : '0%',
                Icon: CheckCircle,
                c: 'var(--green)',
                bg: 'var(--green-light)',
              },
              {
                lBn: 'মোট দিন',
                lEn: 'Total Days',
                v: rangeDays.length,
                Icon: CalendarRange,
                c: 'var(--brand)',
                bg: 'var(--brand-light)',
              },
              {
                lBn: 'সাপ্তাহিক ছুটি',
                lEn: 'Weekends',
                v: rangeDays.filter((ds) => isFriday(ds)).length,
                Icon: CalendarX,
                c: 'var(--purple)',
                bg: 'var(--purple-light)',
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

          {/* Export buttons */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[0.75rem] text-[var(--text-secondary)]">
                {isBn
                  ? `${filteredEmployees.length} জন কর্মচারী · ${rangeDays.length} দিন`
                  : `${filteredEmployees.length} employees · ${rangeDays.length} days`}
              </span>
              {selectedEmployees.length > 0 && (
                <span className="text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-[0.1875rem] rounded-[0.375rem] font-medium">
                  {selectedEmployees.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={exportEmployeeExcel}
                className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.75rem] cursor-pointer font-medium"
              >
                <FileSpreadsheet size={13} />
                Excel
              </button>
              <button
                onClick={() => setShowEmployeePDF(true)}
                disabled={selectedEmployees.length === 0}
                className={`flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-lg text-[0.75rem] font-medium ${
                  selectedEmployees.length === 0
                    ? 'bg-[var(--border-2)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                    : 'bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] cursor-pointer'
                }`}
              >
                <FileText size={13} />
                PDF {selectedEmployees.length > 0 && `(${selectedEmployees.length})`}
              </button>
            </div>
          </div>

          {/* Range Table */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full border-collapse text-[0.6875rem]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.25rem]">
                      <input
                        type="checkbox"
                        checked={filteredEmployees.length > 0 && filteredEmployees.every((t) => selectedEmployees.includes(t.id))}
                        onChange={() => {
                          if (filteredEmployees.every((t) => selectedEmployees.includes(t.id))) setSelectedEmployees([])
                          else setSelectedEmployees(filteredEmployees.map((t) => t.id))
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
                      {isBn ? 'পদবি' : 'Designation'}
                    </th>
                    {rangeDays.map((ds) => (
                      <th key={ds} className="p-[0.375rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] min-w-[2.25rem]">
                        <div>{shortDate(ds)}</div>
                        <div className="text-[0.5rem] font-normal">{dayName(ds)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b border-[var(--border)] transition-colors ${
                        selectedEmployees.includes(t.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'hover:bg-[var(--bg-secondary)]'
                      }`}
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
                      <td className="p-[0.375rem]">
                        <div
                          className="flex items-center gap-1.5 cursor-pointer"
                          onClick={() =>
                            setViewPerson({
                              id: t.id,
                              name: isBn ? t.nameBn || t.nameEn : t.nameEn,
                              type: 'teacher',
                            })
                          }
                        >
                          <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">{isBn ? t.nameBn || t.nameEn : t.nameEn}</div>
                          <ExternalLink size={10} className="text-[var(--text-muted)]" />
                        </div>
                        <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">{t.id}</div>
                      </td>
                      <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{getDeptName(t.departmentId)}</td>
                      <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{t.designation || '—'}</td>
                      {rangeDays.map((ds) => {
                        if (isFriday(ds))
                          return (
                            <td key={ds} className="p-[0.25rem] text-center">
                              {weeklyHolidayBadge()}
                            </td>
                          )
                        const s = getStatus(attendance[ds]?.[t.id])
                        return (
                          <td key={ds} className="p-[0.25rem] text-center">
                            {statusBadge(s)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={4 + rangeDays.length} className="p-10 text-center text-[var(--text-muted)]">
                        <Users size={28} className="block mx-auto mb-2 opacity-30" />
                        {isBn ? 'কোনো কর্মচারী পাওয়া যায়নি' : 'No employees found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[0.6875rem] text-[var(--text-muted)]">
              <span>📊 P=Present, A=Absent, L=Late, W=Weekend · {isBn ? 'নামে ক্লিক করুন বিস্তারিত দেখতে' : 'Click name for details'}</span>
              <span>
                {rangeDays.length} {isBn ? 'দিন' : 'days'} · {filteredEmployees.length} {isBn ? 'কর্মচারী' : 'employees'}
              </span>
            </div>
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">
                  {(empPage - 1) * empPerPage + 1}–{Math.min(empPage * empPerPage, filteredEmployees.length)} / {filteredEmployees.length}
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
                  const start = Math.max(1, Math.min(empPage - 2, empTotalPages - 4))
                  return Array.from({ length: Math.min(5, empTotalPages) }, (_, i) => start + i).map((p) => (
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
                      () => setEmpPage((p) => Math.min(empTotalPages, p + 1)),
                      empPage === empTotalPages,
                    ] as const,
                    [<ChevronsRight size={12} />, () => setEmpPage(empTotalPages), empPage === empTotalPages] as const,
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
      )}

      {/* ==================== TAB: DEVICE ==================== */}
      {activeTab === 'device' && <DeviceTab isBn={isBn} date={date} />}
      {/* ==================== TAB: DEVICE END ==================== */}
      {/* ==================== TAB: STUDENT ==================== */}
      {activeTab === 'student' && (
        <>
          <div className="flex items-center justify-between mb-[0.625rem] flex-wrap gap-[0.625rem]">
            <div className="flex items-center gap-2.5">
              <span className="text-[0.75rem] text-[var(--text-secondary)]">
                {isBn ? `মোট ${filteredStudents.length} জন শিক্ষার্থী` : `${filteredStudents.length} students`}
              </span>
              {selectedStudents.length > 0 && (
                <span className="text-[0.6875rem] text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-[0.1875rem] rounded-[0.375rem] font-medium">
                  {selectedStudents.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <div className="relative" ref={studentActionMenuRef}>
              <button
                onClick={() => setShowStudentActionMenu(!showStudentActionMenu)}
                className="flex items-center gap-[0.3125rem] px-3 py-[0.4375rem] rounded-lg bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-[0.75rem] cursor-pointer font-medium"
              >
                <MoreVertical size={13} />
                {isBn ? 'অ্যাকশন' : 'Action'}
                <ChevronDown size={12} />
              </button>
              {showStudentActionMenu && (
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
                      exportStudentExcel()
                      setShowStudentActionMenu(false)
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
                      setShowStudentPDF(true)
                      setShowStudentActionMenu(false)
                    }}
                    disabled={selectedStudents.length === 0}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      border: 'none',
                      background: 'transparent',
                      color: selectedStudents.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      opacity: selectedStudents.length === 0 ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (selectedStudents.length > 0) e.currentTarget.style.background = 'var(--red-light)' }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <FileText size={14} style={{ color: 'var(--red)' }} />
                    {isBn ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                    {selectedStudents.length > 0 && ` (${selectedStudents.length})`}
                  </button>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '0 0.5rem' }} />
                  <button
                    onClick={() => {
                      setShowStudentPreview(true)
                      setShowStudentActionMenu(false)
                    }}
                    disabled={selectedStudents.length === 0}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      border: 'none',
                      background: 'transparent',
                      color: selectedStudents.length === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8125rem',
                      cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      opacity: selectedStudents.length === 0 ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { if (selectedStudents.length > 0) e.currentTarget.style.background = 'var(--brand-light)' }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Eye size={14} style={{ color: 'var(--brand)' }} />
                    {isBn ? 'প্রিভিউ' : 'Preview'}
                    {selectedStudents.length > 0 && ` (${selectedStudents.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[0.875rem] overflow-hidden">
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full border-collapse text-[0.6875rem]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.25rem]">
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudents.includes(s.id))}
                        onChange={() => {
                          if (filteredStudents.every((s) => selectedStudents.includes(s.id))) setSelectedStudents([])
                          else setSelectedStudents(filteredStudents.map((s) => s.id))
                        }}
                        className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                      />
                    </th>
                    <th className="p-2 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.25rem]"></th>
                    <th className="p-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[8.75rem]">
                      {isBn ? 'নাম' : 'Name'}
                    </th>
                    <th className="p-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[3.75rem]">
                      {isBn ? 'শ্রেণি' : 'Class'}
                    </th>
                    <th className="p-2 text-left text-[0.625rem] font-semibold text-[var(--text-muted)] min-w-[3.125rem]">
                      {isBn ? 'সেকশন' : 'Section'}
                    </th>
                    {rangeDays.map((ds) => (
                      <th key={ds} className="p-[0.375rem] text-center text-[0.5625rem] font-semibold text-[var(--text-muted)] min-w-[2.25rem]">
                        <div>{shortDate(ds)}</div>
                        <div className="text-[0.5rem] font-normal">{dayName(ds)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-b border-[var(--border)] transition-colors ${
                        selectedStudents.includes(s.id) ? 'bg-[rgba(99,102,241,0.04)]' : 'hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(s.id)}
                          onChange={() =>
                            setSelectedStudents((prev) => (prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]))
                          }
                          className="w-[0.8125rem] h-[0.8125rem] cursor-pointer accent-[var(--brand)]"
                        />
                      </td>
                      <td className="p-[0.375rem] text-center">
                        <div className="w-[1.875rem] h-[2.25rem] rounded-[0.3125rem] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto">
                          {s.photo ? (
                            <img src={s.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={13} className="text-[var(--text-muted)]" />
                          )}
                        </div>
                      </td>
                      <td className="p-[0.375rem]">
                        <div
                          className="flex items-center gap-1.5 cursor-pointer"
                          onClick={() =>
                            setViewStudent({
                              id: s.id,
                              name: isBn ? s.nameBn || s.nameEn : s.nameEn,
                              class: s.class,
                              section: s.section || '—',
                            })
                          }
                        >
                          <div className="text-[0.6875rem] font-medium text-[var(--text-primary)]">{isBn ? s.nameBn || s.nameEn : s.nameEn}</div>
                          <ExternalLink size={10} className="text-[var(--text-muted)]" />
                        </div>
                        <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono">{s.id}</div>
                      </td>
                      <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{s.class}</td>
                      <td className="p-[0.375rem] text-[0.625rem] text-[var(--text-secondary)]">{s.section || '—'}</td>
                      {rangeDays.map((ds) => {
                        if (isFriday(ds))
                          return (
                            <td key={ds} className="p-[0.25rem] text-center">
                              {weeklyHolidayBadge()}
                            </td>
                          )
                        const st = getStatus(attendance[ds]?.[s.id])
                        return (
                          <td key={ds} className="p-[0.25rem] text-center">
                            {statusBadge(st)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5 + rangeDays.length} className="p-10 text-center text-[var(--text-muted)]">
                        <Users size={28} className="block mx-auto mb-2 opacity-30" />
                        {isBn ? 'কোনো শিক্ষার্থী পাওয়া যায়নি' : 'No students found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[0.6875rem] text-[var(--text-muted)]">
              <span>
                📊 P=Present, A=Absent, L=Late, W=Weekend, E=Early Out ·{' '}
                {isBn ? 'নামে ক্লিক করুন বিস্তারিত দেখতে' : 'Click name for details'}
              </span>
              <span>
                {rangeDays.length} {isBn ? 'দিন' : 'days'} · {filteredStudents.length} {isBn ? 'শিক্ষার্থী' : 'students'}
              </span>
            </div>
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">
                  {(stuPage - 1) * stuPerPage + 1}–{Math.min(stuPage * stuPerPage, filteredStudents.length)} / {filteredStudents.length}
                </span>
                <select
                  value={stuPerPage}
                  onChange={(e) => {
                    setStuPerPage(Number(e.target.value))
                    setStuPage(1)
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
                    [<ChevronsLeft size={12} />, () => setStuPage(1), stuPage === 1] as const,
                    [<ChevronLeft size={12} />, () => setStuPage((p) => Math.max(1, p - 1)), stuPage === 1] as const,
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
                  const start = Math.max(1, Math.min(stuPage - 2, stuTotalPages - 4))
                  return Array.from({ length: Math.min(5, stuTotalPages) }, (_, i) => start + i).map((p) => (
                    <button
                      key={p}
                      onClick={() => setStuPage(p)}
                      className={`w-7 h-7 rounded-md border bg-[var(--bg-primary)] text-xs cursor-pointer ${p === stuPage ? 'border-[var(--brand)] bg-[var(--brand)] text-white font-semibold' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
                    >
                      {p}
                    </button>
                  ))
                })()}
                {(
                  [
                    [
                      <ChevronRight size={12} />,
                      () => setStuPage((p) => Math.min(stuTotalPages, p + 1)),
                      stuPage === stuTotalPages,
                    ] as const,
                    [<ChevronsRight size={12} />, () => setStuPage(stuTotalPages), stuPage === stuTotalPages] as const,
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
      )}

      {/* Student PDF Options Modal */}
      {showStudentPDF && (
        <AttendancePDFOptionsModal
          count={filteredStudents.length}
          isBn={isBn}
          type="student"
          onClose={() => setShowStudentPDF(false)}
          onDownload={exportStudentPDFFromOpts}
          onPreview={previewStudentPDFFromOpts}
        />
      )}

      {/* Employee PDF Options Modal */}
      {showEmployeePDF && (
        <AttendancePDFOptionsModal
          count={filteredEmployees.length}
          isBn={isBn}
          type="employee"
          onClose={() => setShowEmployeePDF(false)}
          onDownload={exportEmployeePDFFromOpts}
          onPreview={previewEmployeePDFFromOpts}
        />
      )}

      {/* Student Preview Modal */}
      {showStudentPreview && (
        <AttendancePDFOptionsModal
          count={selectedStudents.length || filteredStudents.length}
          isBn={isBn}
          type="student"
          onClose={() => setShowStudentPreview(false)}
          onDownload={(opts) => {
            exportStudentPDFFromOpts(opts)
            setShowStudentPreview(false)
          }}
          onPreview={(opts) => {
            previewStudentPDFFromOpts(opts)
            setShowStudentPreview(false)
          }}
        />
      )}

      {/* Employee Preview Modal */}
      {showEmployeePreview && (
        <AttendancePDFOptionsModal
          count={selectedEmployees.length || filteredEmployees.length}
          isBn={isBn}
          type="employee"
          onClose={() => setShowEmployeePreview(false)}
          onDownload={(opts) => {
            exportEmployeePDFFromOpts(opts)
            setShowEmployeePreview(false)
          }}
          onPreview={(opts) => {
            previewEmployeePDFFromOpts(opts)
            setShowEmployeePreview(false)
          }}
        />
      )}
    </div>
  )
}
