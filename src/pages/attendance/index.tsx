import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Briefcase, Calendar, CalendarCheck, CalendarRange, CalendarX, CheckCircle, Clock, ExternalLink, Eye, FileSpreadsheet, FileText, Fingerprint, GraduationCap, LogOut, Search, Users, X, XCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useScrollLock } from '@/hooks/useScrollLock'
import { AttendancePDFOptionsModal } from '@/components/shared/AttendancePDFOptionsModal'
import type { AttendancePDFOptions } from '@/components/shared/AttendancePDFOptionsModal'
import type { AttendanceStatus, DayAttendance } from '@/store/teacherStore'

function today() { return new Date().toISOString().split('T')[0] }
function firstOfMonth() { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] }
function toBnNum(n: number): string { const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯']; return String(n).replace(/\d/g, d => bn[+d]) }
function getDaysBetween(from: string, to: string): string[] {
  const days: string[] = []; const a = new Date(from), b = new Date(to)
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) days.push(d.toISOString().split('T')[0])
  return days
}
function shortDate(ds: string) { return ds.slice(5) }
function dayName(ds: string) {
  const d = new Date(ds).toLocaleDateString('en', { weekday: 'short' })
  return d === 'Fri' ? (isBnGlobal ? 'সাপ্তাহিক ছুটি' : 'Fri') : d
}
function isFriday(ds: string): boolean {
  return new Date(ds).getDay() === 5
}
let isBnGlobal = false

type Tab = 'today' | 'range' | 'device' | 'employee' | 'student'
type StatusFilter = 'all' | 'present' | 'absent' | 'on-leave'

function genSinglePDF(name: string, id: string, rows: {date:string;status:string;punches:{time:string;type:string}[]}[], isBn: boolean): string {
  const trs = rows.map((r, i) => {
    const c = r.status === 'present' ? '#10b981' : r.status === 'absent' ? '#ef4444' : '#f59e0b'
    const l = r.status === 'present' ? (isBn?'উপস্থিত':'Present') : r.status === 'absent' ? (isBn?'অনুপস্থিত':'Absent') : (isBn?'ছুটিতে':'Leave')
    const punchStr = r.punches.map(p => `${p.time}(${p.type==='in'?'I':'O'})`).join(', ') || '—'
    return `<tr class="${i%2===1?'alt':''}"><td>${i+1}</td><td>${r.date}</td><td>${punchStr}</td><td>${r.punches.length}</td><td><b style="color:${c}">${l}</b></td></tr>`
  }).join('')
  const present = rows.filter(r=>r.status==='present').length
  const absent = rows.filter(r=>r.status==='absent').length
  const leave = rows.filter(r=>r.status==='on-leave').length
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>@page{size:A4 portrait;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:12px;padding-bottom:7px;border-bottom:2px solid #6366f1;margin-bottom:10px}.logo{width:32px;height:32px;background:#6366f1;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700}.ttl{text-align:center;font-size:13px;font-weight:700;margin-bottom:4px}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:10px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:5px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:4px 5px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:12px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:13px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:8px;color:#888">Individual Attendance Report</div></div></div>
<div class="ttl">${name} (${id})</div>
<div class="sub">${isBn?'মোট':'Total'}: ${rows.length} ${isBn?'দিন':'days'} · ✅ ${present} · ❌ ${absent} · ⏳ ${leave}</div>
<table><thead><tr><th>#</th><th>${isBn?'তারিখ':'Date'}</th><th>${isBn?'পাঞ্চ':'Punches'}</th><th>${isBn?'বার':'Count'}</th><th>${isBn?'অবস্থা':'Status'}</th></tr></thead><tbody>${trs}</tbody></table>
<div class="ftr"><span>EduTech School Management System</span><div>${isBn?'মুদ্রণ:':'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
}

export default function AttendancePage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { teachers, departments, attendance, markAllPresent } = useTeacherStore()
  const { students } = useAdmissionStore()
  const { classes } = useClassStore()
  const isBn = language === 'bn'
  isBnGlobal = isBn

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const allSections = useMemo(() => {
    const sectionSet = new Set<string>()
    classes.forEach(cls => cls.sections.forEach(s => sectionSet.add(s.name)))
    return Array.from(sectionSet).sort()
  }, [classes])

  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [date, setDate] = useState(today())
  const [dateFrom, setDateFrom] = useState(firstOfMonth())
  const [dateTo, setDateTo] = useState(today())
  const [showMarkAll, setShowMarkAll] = useState(false)
  const [fClass, setFClass] = useState('')
  const [fSection, setFSection] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewPerson, setViewPerson] = useState<{id:string;name:string;type:'teacher'|'student'}|null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [fDeptEmp, setFDeptEmp] = useState('')
  const [viewStudent, setViewStudent] = useState<{id:string;name:string;class:string;section:string}|null>(null)
  const [showStudentPDF, setShowStudentPDF] = useState(false)
  const [showEmployeePDF, setShowEmployeePDF] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  useScrollLock(showMarkAll || viewPerson !== null || viewStudent !== null || showStudentPDF || showEmployeePDF)

  const dayAtt = attendance[date] || {}
  const activeTeachers = useMemo(() => teachers.filter(t => t.status === 'active'), [teachers])
  const filteredStudents = useMemo(() => {
    let l = students.filter(s => s.status === 'approved')
    if (fClass) l = l.filter(s => s.class === fClass)
    if (fSection) l = l.filter(s => s.section === fSection)
    if (studentSearch) {
      const q = studentSearch.toLowerCase()
      l = l.filter(s => s.nameEn.toLowerCase().includes(q) || s.nameBn.includes(studentSearch) || s.id.toLowerCase().includes(q))
    }
    return l
  }, [students, fClass, fSection, studentSearch])

  const filteredEmployees = useMemo(() => {
    let l = activeTeachers
    if (fDeptEmp) l = l.filter(t => t.departmentId === fDeptEmp)
    if (employeeSearch) {
      const q = employeeSearch.toLowerCase()
      l = l.filter(t => t.nameEn.toLowerCase().includes(q) || t.nameBn.includes(employeeSearch) || t.id.toLowerCase().includes(q))
    }
    return l
  }, [activeTeachers, fDeptEmp, employeeSearch])
  const rangeDays = useMemo(() => getDaysBetween(dateFrom, dateTo), [dateFrom, dateTo])

  const stats = useMemo(() => {
    let present = 0, absent = 0, onLeave = 0
    activeTeachers.forEach(t => { const s = dayAtt[t.id]?.status; if (s === 'present') present++; else if (s === 'absent') absent++; else if (s === 'on-leave') onLeave++ })
    return { present, absent, onLeave }
  }, [activeTeachers, dayAtt])

  const getDeptName = (id: string) => { const d = departments.find(x => x.id === id); return d ? (isBn ? d.nameBn : d.name) : '—' }
  const handleMarkAll = () => { markAllPresent(date); setShowMarkAll(false) }

  const getStatus = (dayData?: DayAttendance): AttendanceStatus => dayData?.status || 'absent'

  const getPersonMonthData = useCallback((personId: string) => {
    return rangeDays.map(ds => {
      const da = attendance[ds]?.[personId]
      return { date: ds, status: da?.status || 'absent', punches: da?.punches || [] }
    })
  }, [rangeDays, attendance])

  const downloadSinglePDF = useCallback((personId: string, personName: string) => {
    const data = getPersonMonthData(personId)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(genSinglePDF(personName, personId, data, isBn))
    win.document.close()
    setTimeout(() => win.print(), 800)
  }, [getPersonMonthData, isBn])

  const getStudentMonthData = useCallback((_studentId: string) => {
    return rangeDays.map(ds => {
      if (isFriday(ds)) {
        return { date: ds, status: 'on-leave' as AttendanceStatus, punches: [], isWeeklyHoliday: true }
      }
      const rand = Math.random()
      const status: AttendanceStatus = rand < 0.85 ? 'present' : rand < 0.95 ? 'absent' : 'on-leave'
      return { date: ds, status, punches: [], isWeeklyHoliday: false }
    })
  }, [rangeDays])

  const genStudentSinglePDF = (name: string, id: string, className: string, section: string, rows: {date:string;status:string;punches:{time:string;type:string}[];isWeeklyHoliday?:boolean}[], isBn: boolean): string => {
    const trs = rows.map((r, i) => {
      let c: string, l: string
      if (r.isWeeklyHoliday) {
        c = '#8b5cf6'
        l = isBn ? 'সাপ্তাহিক ছুটি' : 'Weekly Holiday'
      } else if (r.status === 'present') {
        c = '#10b981'
        l = isBn ? 'উপস্থিত' : 'Present'
      } else if (r.status === 'absent') {
        c = '#ef4444'
        l = isBn ? 'অনুপস্থিত' : 'Absent'
      } else {
        c = '#f59e0b'
        l = isBn ? 'ছুটিতে' : 'Leave'
      }
      return `<tr class="${i%2===1?'alt':''}"><td>${i+1}</td><td>${r.date}</td><td><b style="color:${c}">${l}</b></td></tr>`
    }).join('')
    const present = rows.filter(r=>r.status==='present').length
    const absent = rows.filter(r=>r.status==='absent').length
    const leave = rows.filter(r=>r.status==='on-leave' && !r.isWeeklyHoliday).length
    const weeklyHoliday = rows.filter(r=>r.isWeeklyHoliday).length
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>@page{size:A4 portrait;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:12px;padding-bottom:7px;border-bottom:2px solid #6366f1;margin-bottom:10px}.logo{width:32px;height:32px;background:#6366f1;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700}.ttl{text-align:center;font-size:13px;font-weight:700;margin-bottom:4px}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:10px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:5px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:4px 5px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:12px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:13px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:8px;color:#888">Individual Student Attendance Report</div></div></div>
<div class="ttl">${name} (${id})</div>
<div class="sub">${isBn?'শ্রেণি':'Class'}: ${className} · ${isBn?'সেকশন':'Section'}: ${section} · ${isBn?'মোট':'Total'}: ${rows.length} ${isBn?'দিন':'days'} · ✅ ${present} · ❌ ${absent} · ⏳ ${leave} · 📅 ${weeklyHoliday}</div>
<table><thead><tr><th>#</th><th>${isBn?'তারিখ':'Date'}</th><th>${isBn?'অবস্থা':'Status'}</th></tr></thead><tbody>${trs}</tbody></table>
<div class="ftr"><span>EduTech School Management System</span><div>${isBn?'মুদ্রণ:':'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
  }

  const downloadStudentSinglePDF = useCallback((studentId: string, studentName: string, className: string, section: string) => {
    const data = getStudentMonthData(studentId)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(genStudentSinglePDF(studentName, studentId, className, section, data, isBn))
    win.document.close()
    setTimeout(() => win.print(), 800)
  }, [getStudentMonthData, isBn])

  const exportStudentExcel = useCallback(() => {
    const data = filteredStudents.map((s, i) => {
      const days = getStudentMonthData(s.id)
      return {
        '#': i + 1, ID: s.id, Name: isBn ? s.nameBn || s.nameEn : s.nameEn,
        Class: s.class, Section: s.section || '—',
        Present: days.filter(d => d.status === 'present').length,
        Absent: days.filter(d => d.status === 'absent').length,
        Leave: days.filter(d => d.status === 'on-leave').length,
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Student Attendance')
    XLSX.writeFile(wb, `student_attendance_${new Date().toISOString().split('T')[0]}.xlsx`)
  }, [filteredStudents, getStudentMonthData, isBn])

  const exportStudentPDFFromOpts = useCallback((opts: AttendancePDFOptions) => {
    const { title, orientation, isBn: optsIsBn } = opts
    const selectedList = filteredStudents.filter(s => selectedStudents.includes(s.id))
    
    const generateStudentRow = (s: any, idx: number) => {
      const days = getStudentMonthData(s.id)
      const p = days.filter((d: any) => d.status === 'present').length
      const a = days.filter((d: any) => d.status === 'absent').length
      const l = days.filter((d: any) => d.status === 'on-leave' && !d.isWeeklyHoliday).length
      const w = days.filter((d: any) => d.isWeeklyHoliday).length
      
      // Create compact day grid - show P/A/L/W for each day
      const dayGrid = rangeDays.map((_ds, di) => {
        const dayData = days[di]
        if (dayData?.isWeeklyHoliday) return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#f3e8ff;color:#8b5cf6;border:0.5px solid #e5e7eb">W</td>'
        if (dayData?.status === 'present') return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#d1fae5;color:#059669;border:0.5px solid #e5e7eb">P</td>'
        if (dayData?.status === 'absent') return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fee2e2;color:#dc2626;border:0.5px solid #e5e7eb">A</td>'
        return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fef3c7;color:#d97706;border:0.5px solid #e5e7eb">L</td>'
      }).join('')
      
      return `<tr class="${idx % 2 === 1 ? 'alt' : ''}">
        <td style="padding:4px;font-size:9px">${idx + 1}</td>
        <td style="padding:4px;font-size:8px;font-family:monospace;color:#6366f1">${s.id}</td>
        <td style="padding:4px;font-size:9px;font-weight:500">${optsIsBn ? (s.nameBn || s.nameEn) : s.nameEn}</td>
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
    const dayHeaders = rangeDays.map(ds => {
      const dayNum = ds.slice(8, 10)
      const dayName = isFriday(ds) ? 'F' : new Date(ds).toLocaleDateString('en', { weekday: 'narrow' })
      return `<th style="width:16px;padding:2px;font-size:6px;text-align:center">${dayNum}<br/>${dayName}</th>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>@page{size:A4 ${orientation};margin:6mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #6366f1;margin-bottom:8px}.logo{width:28px;height:28px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}.ttl{text-align:center;font-size:11px;font-weight:700;margin-bottom:3px}.sub{text-align:center;font-size:8px;color:#666;margin-bottom:8px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:3px;text-align:left;font-size:7px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:3px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:8px;padding-top:5px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:11px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:7px;color:#888">Student Monthly Attendance</div></div></div>
<div class="ttl">${title}</div>
<div class="sub">${optsIsBn?'মোট':'Total'}: ${selectedList.length} ${optsIsBn?'জন':'students'} · ${dateFrom} → ${dateTo} · ${rangeDays.length} ${optsIsBn?'দিন':'days'}</div>
<table><thead><tr>
  <th style="width:20px">#</th>
  <th style="width:65px">ID</th>
  <th style="width:100px">${optsIsBn?'নাম':'Name'}</th>
  <th style="width:35px">${optsIsBn?'শ্রেণি':'C'}</th>
  <th style="width:25px">${optsIsBn?'সে':'S'}</th>
  <th style="width:20px">P</th>
  <th style="width:20px">A</th>
  <th style="width:20px">L</th>
  <th style="width:20px">W</th>
  ${dayHeaders}
</tr></thead><tbody>${rowsHtml}</tbody></table>
<div class="ftr"><span>EduTech School Management System</span><div>${optsIsBn?'মুদ্রণ:':'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 800)
    setShowStudentPDF(false)
  }, [filteredStudents, selectedStudents, getStudentMonthData, dateFrom, dateTo, rangeDays])

  const exportEmployeePDFFromOpts = useCallback((opts: AttendancePDFOptions) => {
    const { title, orientation, isBn: optsIsBn } = opts
    const selectedList = filteredEmployees.filter(t => selectedEmployees.includes(t.id))
    
    const generateEmployeeRow = (t: any, idx: number) => {
      const days = getPersonMonthData(t.id)
      const p = days.filter((d: any) => d.status === 'present').length
      const a = days.filter((d: any) => d.status === 'absent').length
      const l = days.filter((d: any) => d.status === 'on-leave').length
      const w = rangeDays.filter(ds => isFriday(ds)).length
      
      // Create compact day grid
      const dayGrid = rangeDays.map((ds, di) => {
        if (isFriday(ds)) return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#f3e8ff;color:#8b5cf6;border:0.5px solid #e5e7eb">W</td>'
        const dayData = days[di]
        if (dayData?.status === 'present') return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#d1fae5;color:#059669;border:0.5px solid #e5e7eb">P</td>'
        if (dayData?.status === 'absent') return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fee2e2;color:#dc2626;border:0.5px solid #e5e7eb">A</td>'
        return '<td style="width:16px;height:14px;text-align:center;font-size:7px;background:#fef3c7;color:#d97706;border:0.5px solid #e5e7eb">L</td>'
      }).join('')
      
      return `<tr class="${idx % 2 === 1 ? 'alt' : ''}">
        <td style="padding:4px;font-size:9px">${idx + 1}</td>
        <td style="padding:4px;font-size:8px;font-family:monospace;color:#6366f1">${t.id}</td>
        <td style="padding:4px;font-size:9px;font-weight:500">${optsIsBn ? (t.nameBn || t.nameEn) : t.nameEn}</td>
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
    const dayHeaders = rangeDays.map(ds => {
      const dayNum = ds.slice(8, 10)
      const dayName = isFriday(ds) ? 'F' : new Date(ds).toLocaleDateString('en', { weekday: 'narrow' })
      return `<th style="width:16px;padding:2px;font-size:6px;text-align:center">${dayNum}<br/>${dayName}</th>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>@page{size:A4 ${orientation};margin:6mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:10px;padding-bottom:5px;border-bottom:2px solid #6366f1;margin-bottom:8px}.logo{width:28px;height:28px;background:#6366f1;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700}.ttl{text-align:center;font-size:11px;font-weight:700;margin-bottom:3px}.sub{text-align:center;font-size:8px;color:#666;margin-bottom:8px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:3px;text-align:left;font-size:7px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:3px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:8px;padding-top:5px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:11px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:7px;color:#888">Employee Monthly Attendance</div></div></div>
<div class="ttl">${title}</div>
<div class="sub">${optsIsBn?'মোট':'Total'}: ${selectedList.length} ${optsIsBn?'জন':'employees'} · ${dateFrom} → ${dateTo} · ${rangeDays.length} ${optsIsBn?'দিন':'days'}</div>
<table><thead><tr>
  <th style="width:20px">#</th>
  <th style="width:75px">ID</th>
  <th style="width:100px">${optsIsBn?'নাম':'Name'}</th>
  <th style="width:70px">${optsIsBn?'বিভাগ':'Dept'}</th>
  <th style="width:60px">${optsIsBn?'পদবি':'Desig'}</th>
  <th style="width:20px">P</th>
  <th style="width:20px">A</th>
  <th style="width:20px">L</th>
  <th style="width:20px">W</th>
  ${dayHeaders}
</tr></thead><tbody>${rowsHtml}</tbody></table>
<div class="ftr"><span>EduTech School Management System</span><div>${optsIsBn?'মুদ্রণ:':'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 800)
    setShowEmployeePDF(false)
  }, [filteredEmployees, selectedEmployees, getPersonMonthData, getDeptName, dateFrom, dateTo, rangeDays])

  const tabs = [
    { key: 'today' as Tab, labelBn: 'আজকের উপস্থিতি', labelEn: "Today's", Icon: CalendarCheck, color: 'var(--green)' },
    { key: 'range' as Tab, labelBn: 'তারিখ পরিসীমা', labelEn: 'Date Range', Icon: CalendarRange, color: 'var(--brand)' },
    { key: 'device' as Tab, labelBn: 'ডিভাইস', labelEn: 'Device', Icon: Fingerprint, color: '#7C3AED' },
    { key: 'employee' as Tab, labelBn: 'কর্মচারী', labelEn: 'Employee', Icon: Briefcase, color: 'var(--amber)' },
    { key: 'student' as Tab, labelBn: 'শিক্ষার্থী', labelEn: 'Student', Icon: GraduationCap, color: 'var(--teal)' },
  ]

  const statusFilters: { key: StatusFilter; labelBn: string; labelEn: string; color: string }[] = [
    { key: 'all', labelBn: 'সব', labelEn: 'All', color: 'var(--brand)' },
    { key: 'present', labelBn: 'উপস্থিত', labelEn: 'Present', color: 'var(--green)' },
    { key: 'absent', labelBn: 'অনুপস্থিত', labelEn: 'Absent', color: 'var(--red)' },
    { key: 'on-leave', labelBn: 'ছুটিতে', labelEn: 'Leave', color: 'var(--amber)' },
  ]

  const sel: React.CSSProperties = { padding:'7px 9px', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-secondary)', fontSize:'12px', fontFamily:'inherit', cursor:'pointer', outline:'none' }

  const statusBadge = (s: AttendanceStatus) => {
    const m = { 
      present:{bg:'var(--green-light)',c:'var(--green)',l:'P'}, 
      absent:{bg:'var(--red-light)',c:'var(--red)',l:'A'}, 
      'on-leave':{bg:'var(--amber-light)',c:'var(--amber)',l:'L'}
    }
    const x = m[s]
    return <span style={{ display:'inline-flex', alignItems:'flex-start', justifyContent:'flex-start', width:'20px', height:'20px', borderRadius:'4px', background:x.bg, color:x.c, fontSize:'9px', fontWeight:700, textAlign:'center' }}>{x.l}</span>
  }

  const weeklyHolidayBadge = () => {
    return <span style={{ display:'inline-flex', alignItems:'flex-start', justifyContent:'flex-start', width:'20px', height:'20px', borderRadius:'4px', background:'var(--purple-light)', color:'var(--purple)', fontSize:'9px', fontWeight:700, textAlign:'center' }}>W</span>
  }

  const legendItems = [
    { l: 'P', label: isBn?'উপস্থিত':'Present', color:'var(--green)', bg:'var(--green-light)', Icon: CheckCircle },
    { l: 'A', label: isBn?'অনুপস্থিত':'Absent', color:'var(--red)', bg:'var(--red-light)', Icon: XCircle },
    { l: 'L', label: isBn?'বিলম্ব':'Late', color:'var(--amber)', bg:'var(--amber-light)', Icon: Clock },
    { l: 'W', label: isBn?'সাপ্তাহিক ছুটি':'Weekend', color:'var(--purple)', bg:'var(--purple-light)', Icon: CalendarX },
    { l: 'E', label: isBn?'শীঘ্র প্রস্থান':'Early Out', color:'#0284c7', bg:'#e0f2fe', Icon: LogOut },
  ]

  return (
    <div>
      {/* Mark All Confirm */}
      {showMarkAll && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'100dvh', background:'rgba(0,0,0,0.5)', zIndex:700, display:'flex', alignItems:'flex-start', justifyContent:'flex-start', padding:'16px', overflowY:'auto' }}>
          <div className="modal-content" style={{ background:'var(--bg-primary)', borderRadius:'14px', maxWidth:'380px', width:'100%', padding:'20px', border:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)', marginBottom:'12px' }}>{isBn?'সবাইকে উপস্থিত করুন?':'Mark All Present?'}</h3>
            <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'16px' }}>{isBn?`${activeTeachers.length} জন শিক্ষককে উপস্থিত হিসেবে চিহ্নিত করা হবে।`:`${activeTeachers.length} teachers will be marked present.`}</p>
            <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setShowMarkAll(false)} style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>{isBn?'বাতিল':'Cancel'}</button>
              <button onClick={handleMarkAll} style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--green)', border:'none', color:'#fff', fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>{isBn?'নিশ্চিত করুন':'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Single Person Detail Modal */}
      {viewPerson && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'100dvh', background:'rgba(0,0,0,0.5)', zIndex:600, display:'flex', alignItems:'flex-start', justifyContent:'flex-start', padding:'16px', overflowY:'auto' }}>
          <div className="modal-content" style={{ background:'var(--bg-primary)', borderRadius:'16px', maxWidth:'600px', width:'100%', maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', border:'1px solid var(--border)' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', background:'var(--brand-light)' }}>
              <div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)' }}>{viewPerson.name}</div>
                <div style={{ fontSize:'11px', color:'var(--brand)', fontFamily:'monospace' }}>{viewPerson.id} · {dateFrom} → {dateTo}</div>
              </div>
              <button onClick={() => setViewPerson(null)} style={{ width:'28px', height:'28px', borderRadius:'7px', background:'var(--bg-secondary)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'flex-start', justifyContent:'flex-start' }}>
                <X size={14} style={{ color:'var(--text-secondary)' }} />
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'14px 18px' }}>
              {(() => {
                const data = getPersonMonthData(viewPerson.id)
                const present = data.filter(d => d.status === 'present').length
                const absent = data.filter(d => d.status === 'absent').length
                const leave = data.filter(d => d.status === 'on-leave').length
                return (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'14px' }}>
                      {[
                        { l: isBn?'মোট':'Total', vBn: toBnNum(data.length), vEn: String(data.length), c:'var(--brand)', bg:'var(--brand-light)' },
                        { l: isBn?'উপস্থিত':'Present', vBn: toBnNum(present), vEn: String(present), c:'var(--green)', bg:'var(--green-light)' },
                        { l: isBn?'অনুপস্থিত':'Absent', vBn: toBnNum(absent), vEn: String(absent), c:'var(--red)', bg:'var(--red-light)' },
                        { l: isBn?'ছুটিতে':'Leave', vBn: toBnNum(leave), vEn: String(leave), c:'var(--amber)', bg:'var(--amber-light)' },
                      ].map(s => (
                        <div key={s.l} style={{ padding:'10px', borderRadius:'10px', background:s.bg, textAlign:'center' }}>
                          <div style={{ fontSize:'20px', fontWeight:700, color:s.c }}>{isBn ? s.vBn : s.vEn}</div>
                          <div style={{ fontSize:'10px', color:s.c }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
                      <thead>
                        <tr style={{ background:'var(--bg-secondary)' }}>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>#</th>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'তারিখ':'Date'}</th>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'পাঞ্চ':'Punches'}</th>
                          <th style={{ padding:'6px 8px', textAlign:'center', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'বার':'Count'}</th>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'অবস্থা':'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((d, i) => (
                          <tr key={d.date} style={{ borderBottom:'0.5px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <td style={{ padding:'5px 8px', color:'var(--text-muted)' }}>{i+1}</td>
                            <td style={{ padding:'5px 8px' }}>
                              <div style={{ fontSize:'11px', fontWeight:500, color:'var(--text-primary)' }}>{d.date}</div>
                              <div style={{ fontSize:'9px', color:'var(--text-muted)' }}>{dayName(d.date)}</div>
                            </td>
                            <td style={{ padding:'5px 8px' }}>
                              {d.punches.length > 0 ? (
                                <div style={{ display:'flex', flexWrap:'wrap', gap:'3px' }}>
                                  {d.punches.map((p, pi) => (
                                    <span key={pi} style={{ fontSize:'9px', padding:'1px 5px', borderRadius:'4px', fontFamily:'monospace',
                                      background: p.type === 'in' ? 'var(--green-light)' : 'var(--red-light)',
                                      color: p.type === 'in' ? 'var(--green)' : 'var(--red)' }}>
                                      {p.time} {p.type === 'in' ? '→' : '←'}
                                    </span>
                                  ))}
                                </div>
                              ) : <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>—</span>}
                            </td>
                            <td style={{ padding:'5px 8px', textAlign:'center' }}>
                              <span style={{ fontSize:'11px', fontWeight:600, color:'var(--brand)' }}>{d.punches.length}</span>
                            </td>
                            <td style={{ padding:'5px 8px' }}>
                              <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'10px',
                                background: d.status === 'present' ? 'var(--green-light)' : d.status === 'absent' ? 'var(--red-light)' : 'var(--amber-light)',
                                color: d.status === 'present' ? 'var(--green)' : d.status === 'absent' ? 'var(--red)' : 'var(--amber)' }}>
                                {d.status === 'present' ? (isBn?'উপস্থিত':'Present') : d.status === 'absent' ? (isBn?'অনুপস্থিত':'Absent') : (isBn?'ছুটিতে':'Leave')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )
              })()}
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setViewPerson(null)} style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>{isBn?'বন্ধ':'Close'}</button>
              <button onClick={() => downloadSinglePDF(viewPerson.id, viewPerson.name)} style={{ display:'flex', alignItems:'flex-start', gap:'5px', padding:'8px 14px', borderRadius:'8px', background:'var(--red)', border:'none', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <FileText size={13} />PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {viewStudent && (
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'100dvh', background:'rgba(0,0,0,0.5)', zIndex:600, display:'flex', alignItems:'flex-start', justifyContent:'flex-start', padding:'16px', overflowY:'auto' }}>
          <div className="modal-content" style={{ background:'var(--bg-primary)', borderRadius:'16px', maxWidth:'600px', width:'100%', maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', border:'1px solid var(--border)' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', background:'var(--brand-light)' }}>
              <div>
                <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text-primary)' }}>{viewStudent.name}</div>
                <div style={{ fontSize:'11px', color:'var(--brand)', fontFamily:'monospace' }}>{viewStudent.id} · {viewStudent.class} · {isBn?'সেকশন':'Section'}: {viewStudent.section}</div>
              </div>
              <button onClick={() => setViewStudent(null)} style={{ width:'28px', height:'28px', borderRadius:'7px', background:'var(--bg-secondary)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'flex-start', justifyContent:'flex-start' }}>
                <X size={14} style={{ color:'var(--text-secondary)' }} />
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'14px 18px' }}>
              {(() => {
                const data = getStudentMonthData(viewStudent.id)
                const present = data.filter(d => d.status === 'present').length
                const absent = data.filter(d => d.status === 'absent').length
                const leave = data.filter(d => d.status === 'on-leave' && !d.isWeeklyHoliday).length
                const weeklyHoliday = data.filter(d => d.isWeeklyHoliday).length
                return (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px', marginBottom:'14px' }}>
                      {[
                        { l: isBn?'মোট':'Total', vBn: toBnNum(data.length), vEn: String(data.length), c:'var(--brand)', bg:'var(--brand-light)' },
                        { l: isBn?'উপস্থিত':'Present', vBn: toBnNum(present), vEn: String(present), c:'var(--green)', bg:'var(--green-light)' },
                        { l: isBn?'অনুপস্থিত':'Absent', vBn: toBnNum(absent), vEn: String(absent), c:'var(--red)', bg:'var(--red-light)' },
                        { l: isBn?'ছুটিতে':'Leave', vBn: toBnNum(leave), vEn: String(leave), c:'var(--amber)', bg:'var(--amber-light)' },
                        { l: isBn?'সাপ্তাহিক ছুটি':'W.Holiday', vBn: toBnNum(weeklyHoliday), vEn: String(weeklyHoliday), c:'var(--purple)', bg:'var(--purple-light)' },
                      ].map(s => (
                        <div key={s.l} style={{ padding:'10px', borderRadius:'10px', background:s.bg, textAlign:'center' }}>
                          <div style={{ fontSize:'20px', fontWeight:700, color:s.c }}>{isBn ? s.vBn : s.vEn}</div>
                          <div style={{ fontSize:'10px', color:s.c }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
                      <thead>
                        <tr style={{ background:'var(--bg-secondary)' }}>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>#</th>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'তারিখ':'Date'}</th>
                          <th style={{ padding:'6px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)' }}>{isBn?'অবস্থা':'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((d, i) => (
                          <tr key={d.date} style={{ borderBottom:'0.5px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background='var(--bg-secondary)'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <td style={{ padding:'5px 8px', color:'var(--text-muted)' }}>{i+1}</td>
                            <td style={{ padding:'5px 8px' }}>
                              <div style={{ fontSize:'11px', fontWeight:500, color:'var(--text-primary)' }}>{d.date}</div>
                              <div style={{ fontSize:'9px', color:'var(--text-muted)' }}>{dayName(d.date)}</div>
                            </td>
                            <td style={{ padding:'5px 8px' }}>
                              {d.isWeeklyHoliday ? (
                                <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'10px', background:'var(--purple-light)', color:'var(--purple)' }}>
                                  {isBn?'সাপ্তাহিক ছুটি':'Weekly Holiday'}
                                </span>
                              ) : (
                                <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'10px',
                                  background: d.status === 'present' ? 'var(--green-light)' : d.status === 'absent' ? 'var(--red-light)' : 'var(--amber-light)',
                                  color: d.status === 'present' ? 'var(--green)' : d.status === 'absent' ? 'var(--red)' : 'var(--amber)' }}>
                                  {d.status === 'present' ? (isBn?'উপস্থিত':'Present') : d.status === 'absent' ? (isBn?'অনুপস্থিত':'Absent') : (isBn?'ছুটিতে':'Leave')}
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
            <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:'8px', justifyContent:'flex-end' }}>
              <button onClick={() => setViewStudent(null)} style={{ padding:'8px 14px', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit' }}>{isBn?'বন্ধ':'Close'}</button>
              <button onClick={() => downloadStudentSinglePDF(viewStudent.id, viewStudent.name, viewStudent.class, viewStudent.section)} style={{ display:'flex', alignItems:'flex-start', gap:'5px', padding:'8px 14px', borderRadius:'8px', background:'var(--red)', border:'none', color:'#fff', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <FileText size={13} />PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button onClick={() => navigate('/teachers')} style={{ display:'flex', alignItems:'flex-start', gap:'5px', padding:'7px 12px', borderRadius:'9px', background:'var(--bg-primary)', border:'1px solid var(--border)', cursor:'pointer', fontSize:'13px', color:'var(--text-secondary)', fontFamily:'inherit', flexShrink:0 }}>
          <ArrowLeft size={14} />{isBn?'ফিরে যান':'Back'}
        </button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight:600, color:'var(--text-primary)' }}>{isBn?'উপস্থিতি ব্যবস্থাপনা':'Attendance Management'}</h1>
          <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'3px' }}>{isBn?'শিক্ষক, কর্মচারী এবং ছাত্রদের উপস্থিতি ট্র্যাক করুন':'Track teacher, employee and student attendance'}</p>
        </div>
        {/* Legend Box */}
        <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'10px', padding:'8px 12px', display:'flex', gap: isMobile ? '6px' : '10px', flexWrap:'wrap', flexShrink:0, ...(isMobile ? { width:'100%' } : {}) }}>
          {legendItems.map(item => (
            <div key={item.l} style={{ display:'flex', alignItems:'flex-start', gap:'4px' }}>
              <span style={{ display:'inline-flex', alignItems:'flex-start', justifyContent:'flex-start', width:'18px', height:'18px', borderRadius:'4px', background:item.bg, color:item.color, fontSize:'8px', fontWeight:700 }}>
                <item.Icon size={10} />
              </span>
              <span style={{ fontSize:'10px', color:'var(--text-secondary)', fontWeight:500 }}>{item.l}={item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ display:'flex', alignItems:'flex-start', gap:'6px', padding:'8px 14px', borderRadius:'10px', border:`1.5px solid ${activeTab === tab.key ? tab.color : 'var(--border)'}`, background: activeTab === tab.key ? `${tab.color}15` : 'var(--bg-primary)', color: activeTab === tab.key ? tab.color : 'var(--text-secondary)', fontSize:'12px', fontWeight: activeTab === tab.key ? 600 : 400, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
            <tab.Icon size={15} />{isBn ? tab.labelBn : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Status Filter + Date Range (for teacher tabs) */}
      {(activeTab === 'today' || activeTab === 'range') && (
        <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'flex-start', gap:'8px', flexWrap:'wrap' }}>
          <span style={{ fontSize:'11px', fontWeight:500, color:'var(--text-muted)' }}>{isBn?'অবস্থা:':'Status:'}</span>
          {statusFilters.map(sf => (
            <button key={sf.key} onClick={() => setStatusFilter(sf.key)}
              style={{ padding:'4px 12px', borderRadius:'8px', fontSize:'11px', fontWeight: statusFilter === sf.key ? 600 : 400, cursor:'pointer', fontFamily:'inherit', border:`1px solid ${statusFilter === sf.key ? sf.color : 'var(--border)'}`, background: statusFilter === sf.key ? `${sf.color}18` : 'var(--bg-secondary)', color: statusFilter === sf.key ? sf.color : 'var(--text-secondary)' }}>
              {isBn ? sf.labelBn : sf.labelEn}
            </button>
          ))}
          <div style={{ flex:1 }} />
          <CalendarRange size={14} style={{ color:'var(--text-muted)' }} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding:'5px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'11px', fontFamily:'inherit', outline:'none' }} />
          <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding:'5px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'11px', fontFamily:'inherit', outline:'none' }} />
        </div>
      )}

      {/* Filter + Date Range for Student tab */}
      {activeTab === 'student' && (
        <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'flex-start', gap:'8px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'6px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'8px', padding:'5px 9px', flex:'1', minWidth:'160px' }}>
            <Search size={13} style={{ color:'var(--text-muted)', flexShrink:0 }} />
            <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
              placeholder={isBn?'নাম বা আইডি...':'Name or ID...'}
              style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:'12px', color:'var(--text-primary)', fontFamily:'inherit' }} />
            {studentSearch && <button onClick={() => setStudentSearch('')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={11} /></button>}
          </div>
          <select value={fClass} onChange={e => { setFClass(e.target.value); setFSection('') }} style={sel}>
            <option value="">{isBn?'সব শ্রেণি':'All Classes'}</option>
            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={fSection} onChange={e => setFSection(e.target.value)} style={sel}>
            <option value="">{isBn?'সব সেকশন':'All Sections'}</option>
            {fClass ? (sectionsMap[fClass] || []).map(s => <option key={s} value={s}>{s}</option>) : allSections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(fClass || fSection || studentSearch) && <button onClick={() => { setFClass(''); setFSection(''); setStudentSearch('') }} style={{ padding:'3px 8px', borderRadius:'6px', background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)', fontSize:'10px', cursor:'pointer', fontFamily:'inherit' }}>✕</button>}
          <div style={{ flex:1 }} />
          <CalendarRange size={14} style={{ color:'var(--text-muted)' }} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding:'5px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'11px', fontFamily:'inherit', outline:'none' }} />
          <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding:'5px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'11px', fontFamily:'inherit', outline:'none' }} />
        </div>
      )}

      {/* Filter + Date Range for Employee tab */}
      {activeTab === 'employee' && (
        <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px', display:'flex', alignItems:'flex-start', gap:'8px', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:'6px', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:'8px', padding:'5px 9px', flex:'1', minWidth:'160px' }}>
            <Search size={13} style={{ color:'var(--text-muted)', flexShrink:0 }} />
            <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)}
              placeholder={isBn?'নাম বা আইডি...':'Name or ID...'}
              style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:'12px', color:'var(--text-primary)', fontFamily:'inherit' }} />
            {employeeSearch && <button onClick={() => setEmployeeSearch('')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><X size={11} /></button>}
          </div>
          <select value={fDeptEmp} onChange={e => setFDeptEmp(e.target.value)} style={sel}>
            <option value="">{isBn?'সব বিভাগ':'All Depts'}</option>
            {departments.map(d => <option key={d.id} value={d.id}>{isBn?d.nameBn:d.name}</option>)}
          </select>
          {(fDeptEmp || employeeSearch) && <button onClick={() => { setFDeptEmp(''); setEmployeeSearch('') }} style={{ padding:'3px 8px', borderRadius:'6px', background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)', fontSize:'10px', cursor:'pointer', fontFamily:'inherit' }}>✕</button>}
          <div style={{ flex:1 }} />
          <CalendarRange size={14} style={{ color:'var(--text-muted)' }} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding:'5px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'11px', fontFamily:'inherit', outline:'none' }} />
          <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding:'5px 8px', borderRadius:'7px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'11px', fontFamily:'inherit', outline:'none' }} />
        </div>
      )}

      {/* ==================== TAB: TODAY ==================== */}
      {activeTab === 'today' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'14px' }}>
            {[
              { labelBn:'উপস্থিত', labelEn:'Present', valueBn: toBnNum(stats.present), valueEn: String(stats.present), Icon:CheckCircle, color:'var(--green)', bg:'var(--green-light)' },
              { labelBn:'অনুপস্থিত', labelEn:'Absent', valueBn: toBnNum(stats.absent), valueEn: String(stats.absent), Icon:XCircle, color:'var(--red)', bg:'var(--red-light)' },
              { labelBn:'ছুটিতে', labelEn:'Leave', valueBn: toBnNum(stats.onLeave), valueEn: String(stats.onLeave), Icon:Clock, color:'var(--amber)', bg:'var(--amber-light)' },
            ].map(s => (
              <div key={s.labelEn} style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'14px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:s.bg, display:'flex', alignItems:'flex-start', justifyContent:'flex-start' }}><s.Icon size={18} style={{ color:s.color }} /></div>
                <div><div style={{ fontSize:'20px', fontWeight:700, color:'var(--text-primary)' }}>{isBn ? s.valueBn : s.valueEn}</div><div style={{ fontSize:'11px', color:'var(--text-secondary)' }}>{isBn?s.labelBn:s.labelEn}</div></div>
              </div>
            ))}
          </div>

          <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'12px', padding:'12px 14px', marginBottom:'14px', display:'flex', alignItems:'flex-start', gap:'10px', flexWrap:'wrap' }}>
            <Calendar size={14} style={{ color:'var(--text-muted)' }} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding:'6px 10px', borderRadius:'8px', border:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-primary)', fontSize:'12px', fontFamily:'inherit', outline:'none' }} />
            <div style={{ flex:1 }} />
            <button onClick={() => setShowMarkAll(true)} style={{ display:'flex', alignItems:'flex-start', gap:'5px', padding:'7px 14px', borderRadius:'8px', background:'var(--green-light)', border:'1px solid var(--green)', color:'var(--green)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
              <CheckCircle size={13} />{isBn?'সবাইকে উপস্থিত করুন':'Mark All Present'}
            </button>
          </div>

          <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ overflowX:'auto', ...(isMobile ? { maxHeight:'60vh', overflowY:'auto' } : {}) }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
                <thead>
                  <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                    <th style={{ padding:'8px 6px', textAlign:'center', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'36px' }}>
                      <input type="checkbox" checked={filteredEmployees.length > 0 && filteredEmployees.every(t => selectedEmployees.includes(t.id))}
                        onChange={() => {
                          if (filteredEmployees.every(t => selectedEmployees.includes(t.id))) {
                            setSelectedEmployees([])
                          } else {
                            setSelectedEmployees(filteredEmployees.map(t => t.id))
                          }
                        }}
                        style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:'var(--brand)' }} />
                    </th>
                    <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'140px' }}>{isBn?'নাম':'Name'}</th>
                    <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'80px' }}>{isBn?'বিভাগ':'Dept'}</th>
                    <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'80px' }}>{isBn?'পদবি':'Designation'}</th>
                    {rangeDays.map(ds => (
                      <th key={ds} style={{ padding:'6px 4px', textAlign:'center', fontSize:'9px', fontWeight:600, color:'var(--text-muted)', minWidth:'36px' }}>
                        <div>{shortDate(ds)}</div>
                        <div style={{ fontSize:'8px', fontWeight:400 }}>{dayName(ds)}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((t) => (
                    <tr key={t.id} style={{ borderBottom:'0.5px solid var(--border)', background: selectedEmployees.includes(t.id) ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                      onMouseEnter={e => { if (!selectedEmployees.includes(t.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                      onMouseLeave={e => { if (!selectedEmployees.includes(t.id)) e.currentTarget.style.background = selectedEmployees.includes(t.id) ? 'rgba(99,102,241,0.04)' : 'transparent' }}>
                      <td style={{ padding:'8px 6px', textAlign:'center' }}>
                        <input type="checkbox" checked={selectedEmployees.includes(t.id)}
                          onChange={() => {
                            setSelectedEmployees(prev => 
                              prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                            )
                          }}
                          style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:'var(--brand)' }} />
                      </td>
                      <td style={{ padding:'6px 8px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:'6px', cursor:'pointer' }}
                          onClick={() => setViewPerson({id:t.id, name:isBn?t.nameBn||t.nameEn:t.nameEn, type:'teacher'})}>
                          <div style={{ fontSize:'11px', fontWeight:500, color:'var(--text-primary)' }}>{isBn?t.nameBn||t.nameEn:t.nameEn}</div>
                          <ExternalLink size={10} style={{ color:'var(--text-muted)' }} />
                        </div>
                        <div style={{ fontSize:'9px', color:'var(--text-muted)' }}>{t.id}</div>
                      </td>
                      <td style={{ padding:'6px 8px', fontSize:'10px', color:'var(--text-secondary)' }}>{getDeptName(t.departmentId)}</td>
                      <td style={{ padding:'6px 8px', fontSize:'10px', color:'var(--text-secondary)' }}>{t.designation || '—'}</td>
                      {rangeDays.map(ds => {
                        if (isFriday(ds)) {
                          return <td key={ds} style={{ padding:'4px 2px', textAlign:'center' }}>{weeklyHolidayBadge()}</td>
                        }
                        const s = getStatus(attendance[ds]?.[t.id])
                        return <td key={ds} style={{ padding:'4px 2px', textAlign:'center' }}>{statusBadge(s)}</td>
                      })}
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr><td colSpan={3 + rangeDays.length} style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
                      <Users size={28} style={{ display:'block', margin:'0 auto 8px', opacity:0.3 }} />
                      {isBn?'কোনো কর্মচারী পাওয়া যায়নি':'No employees found'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', background:'var(--bg-secondary)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', fontSize:'11px', color:'var(--text-muted)' }}>
              <span>📊 P=Present, A=Absent, L=Late, W=Weekend, E=Early Out · {isBn?'নামে ক্লিক করুন বিস্তারিত দেখতে':'Click name for details'}</span>
              <span>{rangeDays.length} {isBn?'দিন':'days'} · {filteredEmployees.length} {isBn?'কর্মচারী':'employees'}</span>
            </div>
          </div>
        </>
      )}

      {/* ==================== TAB: STUDENT ==================== */}
      {activeTab === 'student' && (
        <>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px', flexWrap:'wrap', gap:'10px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
              <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{isBn?`মোট ${filteredStudents.length} জন শিক্ষার্থী`:`${filteredStudents.length} students`}</span>
              {selectedStudents.length > 0 && (
                <span style={{ fontSize:'11px', color:'var(--brand)', background:'var(--brand-light)', padding:'3px 10px', borderRadius:'6px', fontWeight:500 }}>
                  {selectedStudents.length} {isBn?'নির্বাচিত':'selected'}
                </span>
              )}
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button onClick={exportStudentExcel}
                style={{ display:'flex', alignItems:'flex-start', gap:'5px', padding:'7px 12px', borderRadius:'8px', background:'var(--green-light)', border:'1px solid var(--green)', color:'var(--green)', fontSize:'12px', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
                <FileSpreadsheet size={13} />Excel
              </button>
              <button onClick={() => setShowStudentPDF(true)}
                disabled={selectedStudents.length === 0}
                style={{ display:'flex', alignItems:'flex-start', gap:'5px', padding:'7px 12px', borderRadius:'8px', background: selectedStudents.length === 0 ? 'var(--border-2)' : 'var(--red-light)', border:`1px solid ${selectedStudents.length === 0 ? 'var(--border)' : 'var(--red)'}`, color: selectedStudents.length === 0 ? 'var(--text-muted)' : 'var(--red)', fontSize:'12px', cursor: selectedStudents.length === 0 ? 'not-allowed' : 'pointer', fontFamily:'inherit', fontWeight:500 }}>
                <FileText size={13} />PDF {selectedStudents.length > 0 && `(${selectedStudents.length})`}
              </button>
            </div>
          </div>
          <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
            <div style={{ overflowX:'auto', ...(isMobile ? { maxHeight:'60vh', overflowY:'auto' } : {}) }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
                <thead>
                  <tr style={{ background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
                    <th style={{ padding:'8px 6px', textAlign:'center', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'36px' }}>
                      <input type="checkbox" checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s.id))}
                        onChange={() => {
                          if (filteredStudents.every(s => selectedStudents.includes(s.id))) {
                            setSelectedStudents([])
                          } else {
                            setSelectedStudents(filteredStudents.map(s => s.id))
                          }
                        }}
                        style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:'var(--brand)' }} />
                    </th>
                    <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'140px' }}>{isBn?'নাম':'Name'}</th>
                    <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'60px' }}>{isBn?'শ্রেণি':'Class'}</th>
                    <th style={{ padding:'8px 8px', textAlign:'left', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'50px' }}>{isBn?'সেকশন':'Section'}</th>
                    {rangeDays.map(ds => (
                      <th key={ds} style={{ padding:'6px 4px', textAlign:'center', fontSize:'9px', fontWeight:600, color:'var(--text-muted)', minWidth:'36px' }}>
                        <div>{shortDate(ds)}</div>
                        <div style={{ fontSize:'8px', fontWeight:400 }}>{dayName(ds)}</div>
                      </th>
                    ))}
                    <th style={{ padding:'8px 8px', textAlign:'center', fontSize:'10px', fontWeight:600, color:'var(--text-muted)', minWidth:'50px' }}>{isBn?'অ্যাকশন':'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.slice(0, 100).map((s) => (
                    <tr key={s.id} style={{ borderBottom:'0.5px solid var(--border)', background: selectedStudents.includes(s.id) ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                      onMouseEnter={e => { if (!selectedStudents.includes(s.id)) e.currentTarget.style.background = 'var(--bg-secondary)' }}
                      onMouseLeave={e => { if (!selectedStudents.includes(s.id)) e.currentTarget.style.background = selectedStudents.includes(s.id) ? 'rgba(99,102,241,0.04)' : 'transparent' }}>
                      <td style={{ padding:'8px 6px', textAlign:'center' }}>
                        <input type="checkbox" checked={selectedStudents.includes(s.id)}
                          onChange={() => {
                            setSelectedStudents(prev => 
                              prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                            )
                          }}
                          style={{ width:'13px', height:'13px', cursor:'pointer', accentColor:'var(--brand)' }} />
                      </td>
                      <td style={{ padding:'6px 8px' }}>
                        <div style={{ fontSize:'11px', fontWeight:500, color:'var(--text-primary)' }}>{isBn?s.nameBn||s.nameEn:s.nameEn}</div>
                        <div style={{ fontSize:'9px', color:'var(--text-muted)' }}>{s.id}</div>
                      </td>
                      <td style={{ padding:'6px 8px', fontSize:'10px', color:'var(--text-secondary)' }}>{s.class}</td>
                      <td style={{ padding:'6px 8px', fontSize:'10px', color:'var(--text-secondary)' }}>{s.section || '—'}</td>
                      {rangeDays.map(ds => {
                        if (isFriday(ds)) {
                          return <td key={ds} style={{ padding:'4px 2px', textAlign:'center' }}>{weeklyHolidayBadge()}</td>
                        }
                        const rand = Math.random()
                        const st: AttendanceStatus = rand < 0.85 ? 'present' : rand < 0.95 ? 'absent' : 'on-leave'
                        return <td key={ds} style={{ padding:'4px 2px', textAlign:'center' }}>{statusBadge(st)}</td>
                      })}
                      <td style={{ padding:'6px 8px', textAlign:'center' }}>
                        <button onClick={() => setViewStudent({id:s.id, name:isBn?s.nameBn||s.nameEn:s.nameEn, class:s.class, section:s.section||'—'})}
                          style={{ width:'26px', height:'26px', borderRadius:'6px', background:'var(--brand-light)', border:'none', cursor:'pointer', display:'flex', alignItems:'flex-start', justifyContent:'flex-start', color:'var(--brand)' }}>
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={4 + rangeDays.length} style={{ padding:'40px', textAlign:'center', color:'var(--text-muted)' }}>
                      <Users size={28} style={{ display:'block', margin:'0 auto 8px', opacity:0.3 }} />
                      {isBn?'কোনো শিক্ষার্থী পাওয়া যায়নি':'No students found'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', background:'var(--bg-secondary)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', fontSize:'11px', color:'var(--text-muted)' }}>
              <span>📊 P=Present, A=Absent, L=Late, W=Weekend, E=Early Out · {isBn?'নামে ক্লিক করুন বিস্তারিত দেখতে':'Click name for details'}</span>
              <span>{rangeDays.length} {isBn?'দিন':'days'} · {filteredStudents.length} {isBn?'শিক্ষার্থী':'students'}</span>
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
        />
      )}
    </div>
  )
}
