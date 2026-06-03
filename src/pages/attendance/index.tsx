import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarRange,
  CalendarX,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  CreditCard,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  GraduationCap,
  Layers,
  Loader,
  LogOut,
  Plus,
  RefreshCw,
  ScanFace,
  Search,
  Settings,
  Smartphone,
  Tag,
  User,
  Users,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from 'lucide-react'
import * as XLSX from 'xlsx'

import { useAppStore } from '@/store/appStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTeacherStore } from '@/store/teacherStore'
import { useSessionStudents } from '@/store/admissionStore'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { useScrollLock } from '@/hooks/useScrollLock'
import { AttendancePDFOptionsModal } from '@/components/shared/AttendancePDFOptionsModal'
import type { AttendancePDFOptions } from '@/components/shared/AttendancePDFOptionsModal'
import type { AttendanceStatus, DayAttendance } from '@/store/teacherStore'

function today() {
  return new Date().toISOString().split('T')[0]
}
function twentyDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 20)
  return d.toISOString().split('T')[0]
}
function toBnNum(n: number): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n).replace(/\d/g, (d) => bn[+d])
}
function getDaysBetween(from: string, to: string): string[] {
  const days: string[] = []
  const a = new Date(from),
    b = new Date(to)
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) days.push(d.toISOString().split('T')[0])
  return days
}
function shortDate(ds: string) {
  return ds.slice(5)
}
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

function genSinglePDF(
  name: string,
  id: string,
  photo: string,
  designation: string,
  deptName: string,
  inTime: string,
  outTime: string,
  rows: {
    date: string
    status: string
    punches: { time: string; type: string }[]
  }[],
  isBn: boolean
): string {
  const present = rows.filter((r) => r.status === 'present').length
  const absent = rows.filter((r) => r.status === 'absent').length
  const leave = rows.filter((r) => r.status === 'on-leave').length
  const lateCount = rows.filter((r) => {
    if (r.status !== 'present') return false
    const firstIn = r.punches.find((p) => p.type === 'in')
    return firstIn && inTime && firstIn.time > inTime
  }).length
  const avgIn = (() => {
    const ins = rows
      .filter((r) => r.status === 'present')
      .map((r) => {
        const f = r.punches.find((p) => p.type === 'in')
        return f ? f.time : null
      })
      .filter(Boolean)
    if (ins.length === 0) return '—'
    const mins = ins.map((t) => parseInt(t!.split(':')[0]) * 60 + parseInt(t!.split(':')[1]))
    const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length)
    return `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`
  })()
  const trs = rows
    .map((r, i) => {
      const c = r.status === 'present' ? '#10b981' : r.status === 'absent' ? '#ef4444' : '#f59e0b'
      const l =
        r.status === 'present'
          ? isBn
            ? 'উপস্থিত'
            : 'Present'
          : r.status === 'absent'
            ? isBn
              ? 'অনুপস্থিত'
              : 'Absent'
            : isBn
              ? 'ছুটিতে'
              : 'Leave'
      const firstIn = r.punches.find((p) => p.type === 'in')
      const lastOut = [...r.punches].reverse().find((p) => p.type === 'out')
      const isLate = firstIn && inTime && firstIn.time > inTime
      const lateBadge = isLate
        ? `<span style="background:#fef3c7;color:#d97706;padding:1px 4px;border-radius:3px;font-size:7px;font-weight:700;margin-left:3px">LATE</span>`
        : ''
      const dayName = new Date(r.date).toLocaleDateString('en', {
        weekday: 'short',
      })
      return `<tr class="${i % 2 === 1 ? 'alt' : ''}">
      <td style="text-align:center;font-size:8px;color:#888">${i + 1}</td>
      <td style="font-size:8px">${r.date} <span style="color:#888;font-size:7px">${dayName}</span></td>
      <td style="font-size:8px;font-family:monospace;text-align:center">${firstIn ? firstIn.time : '—'}</td>
      <td style="font-size:8px;font-family:monospace;text-align:center">${lastOut ? lastOut.time : '—'}</td>
      <td style="text-align:center"><b style="color:${c};font-size:8px">${l}</b>${lateBadge}</td>
    </tr>`
    })
    .join('')
  const photoTag = photo
    ? `<img src="${photo}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #6366f1" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background:#e0e7ff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#6366f1;border:2px solid #6366f1">${name.charAt(0)}</div>`
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name} — Attendance</title>
<style>
@page{size:A4 landscape;margin:8mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:9px;color:#1a1a1a;background:#fff}
.page{padding:0}
.hdr{display:flex;align-items:center;gap:14px;padding-bottom:8px;border-bottom:2.5px solid #6366f1;margin-bottom:10px}
.logo{width:36px;height:36px;background:#6366f1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-weight:700}
.profile{display:flex;align-items:center;gap:12px;flex:1}
.info h2{font-size:14px;font-weight:700;color:#1e1b4b;margin-bottom:1px}
.info p{font-size:9px;color:#6b7280}
.stats{display:flex;gap:6px;margin-bottom:10px}
.stat{flex:1;text-align:center;padding:6px 4px;border-radius:6px;border:0.5px solid #e5e7eb}
.stat .val{font-size:16px;font-weight:800;margin-bottom:1px}
.stat .lbl{font-size:7px;color:#6b7280;text-transform:uppercase;letter-spacing:0.3px}
.stat.green .val{color:#059669}.stat.green{background:#ecfdf5}
.stat.red .val{color:#dc2626}.stat.red{background:#fef2f2}
.stat.amber .val{color:#d97706}.stat.amber{background:#fffbeb}
.stat.blue .val{color:#6366f1}.stat.blue{background:#eef2ff}
table{width:100%;border-collapse:collapse}
th{background:#6366f1;color:#fff;padding:5px 4px;text-align:left;font-size:8px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4;letter-spacing:0.3px}
td{padding:4px 5px;border:0.5px solid #e5e7eb;font-size:8px}
tr.alt td{background:#f8fafc}
.ftr{margin-top:8px;padding-top:6px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:7px;color:#9ca3af}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="page">
<div class="hdr">
  <div class="logo">ET</div>
  <div class="profile">
    ${photoTag}
    <div class="info">
      <h2>${name}</h2>
      <p>${id} · ${deptName} · ${designation}</p>
    </div>
  </div>
</div>

<div class="stats">
  <div class="stat green"><div class="val">${present}</div><div class="lbl">${isBn ? 'উপস্থিত' : 'Present'}</div></div>
  <div class="stat red"><div class="val">${absent}</div><div class="lbl">${isBn ? 'অনুপস্থিত' : 'Absent'}</div></div>
  <div class="stat amber"><div class="val">${leave}</div><div class="lbl">${isBn ? 'ছুটিতে' : 'Leave'}</div></div>
  <div class="stat blue"><div class="val">${lateCount}</div><div class="lbl">${isBn ? 'বিলম্ব' : 'Late'}</div></div>
  <div class="stat"><div class="val" style="color:#6366f1">${avgIn}</div><div class="lbl">${isBn ? 'গড় ইন' : 'Avg In'}</div></div>
</div>

<table>
<thead><tr>
  <th style="width:22px;text-align:center">#</th>
  <th style="width:90px">${isBn ? 'তারিখ' : 'Date'}</th>
  <th style="width:55px;text-align:center">${isBn ? 'ইন' : 'In'}</th>
  <th style="width:55px;text-align:center">${isBn ? 'আউট' : 'Out'}</th>
  <th style="width:65px;text-align:center">${isBn ? 'অবস্থা' : 'Status'}</th>
</tr></thead>
<tbody>${trs}</tbody>
</table>

<div class="ftr">
  <span>EduTech — Sunrise Academy · ${isBn ? 'শিক্ষক উপস্থিতি রিপোর্ট' : 'Staff Attendance Report'}</span>
  <span>${isBn ? 'মুদ্রণ' : 'Printed'}: ${new Date().toLocaleDateString()} · ${rows.length} ${isBn ? 'দিন' : 'days'} · ${isBn ? 'ইন সময়' : 'In Time'}: ${inTime} · ${isBn ? 'আউট সময়' : 'Out Time'}: ${outTime}</span>
</div>
</div></body></html>`
}

export default function AttendancePage() {
  const navigate = useNavigate()
  const { language } = useAppStore()
  const { isMobile } = useWindowSize()
  const { teachers, departments, attendance, markAllPresent } = useTeacherStore()
  const students = useSessionStudents()
  const { classes } = useClassStore()
  const isBn = language === 'bn'
  isBnGlobal = isBn

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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [empPage, setEmpPage] = useState(1)
  const [empPerPage, setEmpPerPage] = useState(20)
  const [stuPage, setStuPage] = useState(1)
  const [stuPerPage, setStuPerPage] = useState(20)
  // Device tab states
  const [devices, setDevices] = useState<
    {
      id: string
      name: string
      model: string
      ip: string
      status: 'online' | 'offline' | 'error'
      type: 'rfid' | 'fingerprint' | 'face' | 'multi'
      lastSync: string
      staffCount: number
    }[]
  >(() => [
    {
      id: 'DEV-001',
      name: 'Main Gate RFID',
      model: 'ZKTeco SLK200',
      ip: '192.168.1.100',
      status: 'online',
      type: 'rfid',
      lastSync: new Date().toISOString(),
      staffCount: 18,
    },
    {
      id: 'DEV-002',
      name: 'Staff Room FP',
      model: 'ZKTeco K40',
      ip: '192.168.1.101',
      status: 'online',
      type: 'fingerprint',
      lastSync: new Date().toISOString(),
      staffCount: 15,
    },
    {
      id: 'DEV-003',
      name: 'Admin Block Face',
      model: 'Hikvision DS-K1T344',
      ip: '192.168.1.102',
      status: 'offline',
      type: 'face',
      lastSync: '',
      staffCount: 12,
    },
    {
      id: 'DEV-004',
      name: 'Back Gate Multi',
      model: 'ZKTeco MB10',
      ip: '192.168.1.103',
      status: 'online',
      type: 'multi',
      lastSync: new Date().toISOString(),
      staffCount: 20,
    },
  ])
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: '',
    model: '',
    ip: '',
    type: 'rfid' as 'rfid' | 'fingerprint' | 'face' | 'multi',
  })
  const [deviceTab, setDeviceTab] = useState<'devices' | 'rfid' | 'fingerprint' | 'face' | 'mobile'>('devices')
  const [rfidEntries, setRfidEntries] = useState<
    {
      staffId: string
      staffName: string
      rfidCard: string
      type: string
      assigned: boolean
    }[]
  >([
    {
      staffId: 'TCH-2026-001',
      staffName: 'Dr. Rafiqul Islam',
      rfidCard: 'CARD-1000',
      type: 'Admin',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-002',
      staffName: 'Prof. Salma Khatun',
      rfidCard: 'CARD-1001',
      type: 'Faculty',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-003',
      staffName: 'Md. Habibur Rahman',
      rfidCard: 'CARD-1002',
      type: 'Faculty',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-004',
      staffName: 'Farhana Rahman',
      rfidCard: 'CARD-1003',
      type: 'Staff',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-005',
      staffName: 'Abdul Karim',
      rfidCard: 'CARD-1004',
      type: 'Faculty',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-006',
      staffName: 'Nasreen Akhter',
      rfidCard: 'CARD-1005',
      type: 'Staff',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-008',
      staffName: 'Mohammad Ali',
      rfidCard: 'CARD-1006',
      type: 'Faculty',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-009',
      staffName: 'Roksana Begum',
      rfidCard: 'CARD-1007',
      type: 'Staff',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-010',
      staffName: 'Kamal Hossain',
      rfidCard: 'CARD-1008',
      type: 'Faculty',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-011',
      staffName: 'Shirin Sultana',
      rfidCard: 'CARD-1009',
      type: 'Staff',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-012',
      staffName: 'Tanvir Ahmed',
      rfidCard: 'CARD-1010',
      type: 'Faculty',
      assigned: true,
    },
    {
      staffId: 'TCH-2026-014',
      staffName: 'Sabrina Haque',
      rfidCard: 'CARD-1011',
      type: 'Admin',
      assigned: true,
    },
  ])
  const [fpEntries, setFpEntries] = useState<
    {
      staffId: string
      staffName: string
      fpId: number
      templates: number
      status: 'enrolled' | 'pending' | 'failed'
    }[]
  >([
    {
      staffId: 'TCH-2026-001',
      staffName: 'Dr. Rafiqul Islam',
      fpId: 1,
      templates: 2,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-002',
      staffName: 'Prof. Salma Khatun',
      fpId: 2,
      templates: 2,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-003',
      staffName: 'Md. Habibur Rahman',
      fpId: 3,
      templates: 1,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-004',
      staffName: 'Farhana Rahman',
      fpId: 4,
      templates: 2,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-005',
      staffName: 'Abdul Karim',
      fpId: 5,
      templates: 1,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-006',
      staffName: 'Nasreen Akhter',
      fpId: 6,
      templates: 2,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-008',
      staffName: 'Mohammad Ali',
      fpId: 7,
      templates: 1,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-009',
      staffName: 'Roksana Begum',
      fpId: 8,
      templates: 2,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-010',
      staffName: 'Kamal Hossain',
      fpId: 9,
      templates: 0,
      status: 'pending',
    },
    {
      staffId: 'TCH-2026-011',
      staffName: 'Shirin Sultana',
      fpId: 10,
      templates: 0,
      status: 'failed',
    },
  ])
  const [faceEntries, setFaceEntries] = useState<
    {
      staffId: string
      staffName: string
      faceId: number
      quality: number
      status: 'enrolled' | 'pending' | 'failed'
    }[]
  >([
    {
      staffId: 'TCH-2026-001',
      staffName: 'Dr. Rafiqul Islam',
      faceId: 1,
      quality: 92,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-002',
      staffName: 'Prof. Salma Khatun',
      faceId: 2,
      quality: 88,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-003',
      staffName: 'Md. Habibur Rahman',
      faceId: 3,
      quality: 85,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-004',
      staffName: 'Farhana Rahman',
      faceId: 4,
      quality: 90,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-005',
      staffName: 'Abdul Karim',
      faceId: 5,
      quality: 78,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-006',
      staffName: 'Nasreen Akhter',
      faceId: 6,
      quality: 82,
      status: 'enrolled',
    },
    {
      staffId: 'TCH-2026-008',
      staffName: 'Mohammad Ali',
      faceId: 7,
      quality: 0,
      status: 'pending',
    },
    {
      staffId: 'TCH-2026-009',
      staffName: 'Roksana Begum',
      faceId: 8,
      quality: 0,
      status: 'failed',
    },
  ])
  const [rfidSearch, setRfidSearch] = useState('')
  const [fpSearch, setFpSearch] = useState('')
  const [faceSearch, setFaceSearch] = useState('')
  const [showAddRFID, setShowAddRFID] = useState(false)
  const [showAddFP, setShowAddFP] = useState(false)
  const [showAddFace, setShowAddFace] = useState(false)
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null)
  const [showDeviceSettings, setShowDeviceSettings] = useState<string | null>(null)
  const [deviceSettings, setDeviceSettings] = useState({
    autoSync: true,
    syncInterval: 5,
    playSound: true,
  })
  const [newRFID, setNewRFID] = useState({ staffId: '', rfidCard: '' })
  const [newFP, setNewFP] = useState({ staffId: '' })
  const [newFace, setNewFace] = useState({ staffId: '' })
  // Mobile WebAuthn state
  const [mobileDevices, setMobileDevices] = useState<
    {
      id: string
      staffId: string
      staffName: string
      deviceName: string
      credentialId: string
      registeredAt: string
      lastAuth: string
    }[]
  >(() => {
    try {
      return JSON.parse(localStorage.getItem('mobileAuthDevices') || '[]')
    } catch {
      return []
    }
  })
  const [mobileRegStaff, setMobileRegStaff] = useState('')
  const [mobileRegPending, setMobileRegPending] = useState(false)
  const [mobileAuthStaff, setMobileAuthStaff] = useState('')
  const [mobileAuthPending, setMobileAuthPending] = useState(false)
  const [mobileAuthMsg, setMobileAuthMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [mobileSearch, setMobileSearch] = useState('')
  const [kioskMode, setKioskMode] = useState(false)
  const [kioskPending, setKioskPending] = useState(false)
  const [kioskMsg, setKioskMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [kioskIdentified, setKioskIdentified] = useState<{
    staffId: string
    staffName: string
    punchType: 'in' | 'out'
    time: string
  } | null>(null)
  const [kioskRegMode, setKioskRegMode] = useState(false)
  const [kioskRegStaff, setKioskRegStaff] = useState('')
  const [kioskCamActive, setKioskCamActive] = useState(false)
  const [kioskCapturedPhoto, setKioskCapturedPhoto] = useState<string | null>(null)
  const [kioskRegisteredFaces, setKioskRegisteredFaces] = useState<{ staffId: string; staffName: string; photo: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('kioskFaces') || '[]')
    } catch {
      return []
    }
  })
  const [kioskEditFace, setKioskEditFace] = useState<string | null>(null)
  const [, setKioskDetecting] = useState(false)
  const [kioskFaceDetected, setKioskFaceDetected] = useState(false)
  const kioskDetectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const kioskStableCountRef = useRef(0)
  // WiFi verification state
  const [institutionWifi, setInstitutionWifi] = useState(() => localStorage.getItem('institutionWifi') || '')
  const [institutionGateway, setInstitutionGateway] = useState(() => localStorage.getItem('institutionGateway') || '')
  const [wifiChecking, setWifiChecking] = useState(false)
  const [wifiConnected, setWifiConnected] = useState<boolean | null>(null)
  const [showWifiSettings, setShowWifiSettings] = useState(false)
  const [authMode, setAuthMode] = useState<'kiosk' | 'personal'>('personal')
  useScrollLock(
    showMarkAll ||
      viewPerson !== null ||
      viewStudent !== null ||
      showStudentPDF ||
      showEmployeePDF ||
      showAddDevice ||
      showAddRFID ||
      showAddFP ||
      showAddFace ||
      kioskCamActive
  )

  const kioskVideoRef = useRef<HTMLVideoElement | null>(null)
  const kioskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const kioskStreamRef = useRef<MediaStream | null>(null)

  const startKioskCamera = async () => {
    try {
      if (kioskStreamRef.current) {
        kioskStreamRef.current.getTracks().forEach((t) => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      kioskStreamRef.current = stream
      setKioskCamActive(true)
      setKioskCapturedPhoto(null)
      await new Promise((r) => setTimeout(r, 100))
      if (kioskVideoRef.current) {
        kioskVideoRef.current.srcObject = stream
        try {
          await kioskVideoRef.current.play()
        } catch {
          /* autoplay blocked */
        }
      }
      startKioskDetectLoop()
    } catch (err) {
      console.error('Camera error:', err)
      setKioskMsg({
        type: 'error',
        text: isBn ? 'ক্যামেরা খুলতে ব্যর্থ। অনুমতি দিন।' : 'Failed to open camera. Allow permission.',
      })
    }
  }

  const stopKioskCamera = () => {
    if (kioskStreamRef.current) {
      kioskStreamRef.current.getTracks().forEach((t) => t.stop())
      kioskStreamRef.current = null
    }
    setKioskCamActive(false)
  }

  const captureKioskPhoto = (): string | null => {
    if (!kioskVideoRef.current || !kioskCanvasRef.current) return null
    const canvas = kioskCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    canvas.width = 320
    canvas.height = 240
    ctx.drawImage(kioskVideoRef.current, 0, 0, 320, 240)
    return canvas.toDataURL('image/jpeg', 0.6)
  }

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
  useEffect(() => {
    if (!kioskMode) {
      stopKioskCamera()
      stopKioskDetectLoop()
      setKioskCapturedPhoto(null)
      setKioskRegMode(false)
    }
  }, [kioskMode])

  const dayAtt = attendance[date] || {}
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])

  // WebAuthn helpers
  const generateChallenge = () => {
    const arr = new Uint8Array(32)
    crypto.getRandomValues(arr)
    return arr
  }

  const bufferToBase64 = (buf: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
  }

  const base64ToBuffer = (b64: string) => {
    const bin = atob(b64)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    return buf.buffer
  }

  // WiFi/Network verification - checks if device is on institution network
  const checkInstitutionNetwork = async (): Promise<{
    onNetwork: boolean | null
    method: string
    info: string
  }> => {
    // Method 1: Check if gateway IP is reachable (most reliable for same network)
    if (institutionGateway) {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        await fetch(`http://${institutionGateway}/ping`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        })
        clearTimeout(timeout)
        // If we get here (even with opaque response), the gateway is reachable
        return {
          onNetwork: true,
          method: 'gateway',
          info: `Gateway ${institutionGateway} reachable`,
        }
      } catch {
        // Gateway not reachable - might be on different network
      }
    }

    // Method 2: Check if we can resolve internal DNS or reach local endpoints
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2000)
      // Try to reach the app's own origin (if hosted on institution network)
      await fetch(window.location.origin, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      // If reachable, we're likely on the same network
      return {
        onNetwork: true,
        method: 'origin',
        info: 'Connected to institution network',
      }
    } catch {
      // Not on same network
    }

    // Method 3: Use Network Information API if available
    const nav = navigator as any
    if (nav.connection) {
      const conn = nav.connection
      if (conn.type === 'wifi' || conn.type === 'ethernet') {
        // Connected via WiFi or Ethernet - likely on institution network
        // But we can't verify the SSID in browser
        return {
          onNetwork: null,
          method: 'network-info',
          info: `Connected via ${conn.type} (cannot verify SSID)`,
        }
      }
    }

    return {
      onNetwork: false,
      method: 'none',
      info: 'Cannot verify network connection',
    }
  }

  // Save WiFi settings
  const saveWifiSettings = () => {
    localStorage.setItem('institutionWifi', institutionWifi)
    localStorage.setItem('institutionGateway', institutionGateway)
    setShowWifiSettings(false)
  }

  const handleRegisterDevice = async () => {
    if (!mobileRegStaff) return
    const teacher = activeTeachers.find((t) => t.id === mobileRegStaff)
    if (!teacher) return
    setMobileRegPending(true)
    setMobileAuthMsg(null)
    try {
      const challenge = generateChallenge()
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'EduTech Attendance', id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(teacher.id),
            name: teacher.id,
            displayName: isBn ? teacher.nameBn || teacher.nameEn : teacher.nameEn,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: { userVerification: 'preferred' },
          timeout: 60000,
        },
      })) as PublicKeyCredential | null
      if (credential) {
        const rawId = bufferToBase64(credential.rawId)
        const newDevice = {
          id: `MOB-${Date.now()}`,
          staffId: teacher.id,
          staffName: isBn ? teacher.nameBn || teacher.nameEn : teacher.nameEn,
          deviceName: navigator.userAgent.includes('iPhone')
            ? 'iPhone'
            : navigator.userAgent.includes('Android')
              ? 'Android Device'
              : 'Web Browser',
          credentialId: rawId,
          registeredAt: new Date().toISOString(),
          lastAuth: '',
        }
        const updated = [...mobileDevices, newDevice]
        setMobileDevices(updated)
        localStorage.setItem('mobileAuthDevices', JSON.stringify(updated))
        setMobileRegStaff('')
        setMobileAuthMsg({
          type: 'success',
          text: isBn ? `${newDevice.staffName} সফলভাবে নিবন্ধিত হয়েছে!` : `${newDevice.staffName} registered successfully!`,
        })
      }
    } catch (err: any) {
      console.error('Device registration error:', err)
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      if (!isSecure) {
        setMobileAuthMsg({
          type: 'error',
          text: isBn ? '🔒 HTTPS প্রয়োজন! https:// দিয়ে খুলুন।' : '🔒 HTTPS required! Open with https://',
        })
      } else if (err.name === 'NotAllowedError') {
        setMobileAuthMsg({
          type: 'error',
          text: isBn ? 'ব্যবহারকারী বাতিল করেছেন' : 'User cancelled',
        })
      } else {
        setMobileAuthMsg({
          type: 'error',
          text: `${isBn ? 'নিবন্ধন ব্যর্থ' : 'Registration failed'}: ${err.message || err.name}`,
        })
      }
    }
    setMobileRegPending(false)
  }

  const handleMobileAuth = async () => {
    if (!mobileAuthStaff) return
    const device = mobileDevices.find((d) => d.staffId === mobileAuthStaff)
    if (!device) {
      setMobileAuthMsg({
        type: 'error',
        text: isBn ? 'এই স্টাফের জন্য কোনো ডিভাইস নিবন্ধিত নেই' : 'No device registered for this staff',
      })
      return
    }

    // WiFi verification for personal devices
    if (institutionGateway || institutionWifi) {
      setWifiChecking(true)
      const networkCheck = await checkInstitutionNetwork()
      setWifiChecking(false)
      setWifiConnected(networkCheck.onNetwork)

      if (networkCheck.onNetwork === false) {
        setMobileAuthMsg({
          type: 'error',
          text: isBn
            ? `সংযোগ করা হয়নি! অনুগ্রহ করে প্রতিষ্ঠানের WiFi নেটওয়ার্কে সংযোগ করুন। (${networkCheck.info})`
            : `Not connected! Please connect to institution WiFi network. (${networkCheck.info})`,
        })
        return
      }
    }

    setMobileAuthPending(true)
    setMobileAuthMsg(null)
    try {
      const challenge = generateChallenge()
      const credential = (await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: base64ToBuffer(device.credentialId), type: 'public-key' }],
          userVerification: 'required',
          timeout: 60000,
        },
      })) as PublicKeyCredential | null
      if (credential) {
        const now = new Date()
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const existing = attendance[date]?.[device.staffId]
        const punches = existing?.punches || []
        const lastPunch = punches[punches.length - 1]
        const punchType = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out'
        const punchesNew = [...punches, { time: timeStr, type: punchType as 'in' | 'out' }]
        const status = punchType === 'in' ? 'present' : existing?.status || 'present'
        const updatedAttendance = {
          ...attendance,
          [date]: {
            ...attendance[date],
            [device.staffId]: {
              status: status as AttendanceStatus,
              punches: punchesNew,
            },
          },
        }
        useTeacherStore.setState({ attendance: updatedAttendance })
        const updatedDevices = mobileDevices.map((d) => (d.id === device.id ? { ...d, lastAuth: now.toISOString() } : d))
        setMobileDevices(updatedDevices)
        localStorage.setItem('mobileAuthDevices', JSON.stringify(updatedDevices))
        const wifiInfo = wifiConnected ? ' [WiFi ✓]' : ''
        setMobileAuthMsg({
          type: 'success',
          text: isBn
            ? `${device.staffName} ${punchType === 'in' ? 'চেক-ইন' : 'চেক-আউট'} সফল হয়েছে! (${timeStr})${wifiInfo}`
            : `${device.staffName} ${punchType === 'in' ? 'checked in' : 'checked out'} at ${timeStr}${wifiInfo}`,
        })
      }
    } catch (err: any) {
      console.error('Mobile auth error:', err)
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
      if (!isSecure) {
        setMobileAuthMsg({
          type: 'error',
          text: isBn ? '🔒 HTTPS প্রয়োজন! https:// দিয়ে খুলুন।' : '🔒 HTTPS required! Open with https://',
        })
      } else if (err.name === 'NotAllowedError') {
        setMobileAuthMsg({
          type: 'error',
          text: isBn ? 'ব্যবহারকারী বাতিল করেছেন' : 'User cancelled',
        })
      } else {
        setMobileAuthMsg({
          type: 'error',
          text: `${isBn ? 'প্রমাণীকরণ ব্যর্থ' : 'Authentication failed'}: ${err.message || err.name}`,
        })
      }
    }
    setMobileAuthPending(false)
  }

  const removeMobileDevice = (id: string) => {
    const updated = mobileDevices.filter((d) => d.id !== id)
    setMobileDevices(updated)
    localStorage.setItem('mobileAuthDevices', JSON.stringify(updated))
  }

  // handleKioskAuth removed — replaced by camera-based handleKioskScan + handleKioskPunch

  const handleKioskRegister = async () => {
    if (!kioskRegStaff) return
    const teacher = activeTeachers.find((t) => t.id === kioskRegStaff)
    if (!teacher) return
    if (!kioskCapturedPhoto) {
      setKioskMsg({
        type: 'error',
        text: isBn ? 'প্রথমে ছবি তুলুন।' : 'Take a photo first.',
      })
      return
    }
    const faceEntry = {
      staffId: teacher.id,
      staffName: isBn ? teacher.nameBn || teacher.nameEn : teacher.nameEn,
      photo: kioskCapturedPhoto,
    }
    const updated = [...kioskRegisteredFaces.filter((f) => f.staffId !== teacher.id), faceEntry]
    setKioskRegisteredFaces(updated)
    localStorage.setItem('kioskFaces', JSON.stringify(updated))
    setKioskMsg({
      type: 'success',
      text: isBn ? `${faceEntry.staffName} নিবন্ধন সম্পন্ন!` : `${faceEntry.staffName} registered!`,
    })
    setKioskRegMode(false)
    setKioskRegStaff('')
    setKioskCapturedPhoto(null)
    stopKioskCamera()
    setTimeout(() => setKioskMsg(null), 3000)
  }

  const handleKioskScan = () => {
    setKioskPending(true)
    setKioskMsg(null)
    setKioskIdentified(null)
    startKioskCamera()
    setKioskPending(false)
  }

  const handleKioskPunch = (staffId: string, staffName: string) => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const existing = attendance[date]?.[staffId]
    const punches = existing?.punches || []
    const lastPunch = punches[punches.length - 1]
    const punchType: 'in' | 'out' = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out'
    const punchesNew = [...punches, { time: timeStr, type: punchType }]
    const status = punchType === 'in' ? 'present' : existing?.status || 'present'
    const updatedAttendance = {
      ...attendance,
      [date]: {
        ...attendance[date],
        [staffId]: { status: status as AttendanceStatus, punches: punchesNew },
      },
    }
    useTeacherStore.setState({ attendance: updatedAttendance })
    setKioskIdentified({ staffId, staffName, punchType, time: timeStr })
    setKioskMsg({
      type: 'success',
      text: `${staffName} ${punchType === 'in' ? (isBn ? 'চেক-ইন' : 'CHECKED IN') : isBn ? 'চেক-আউট' : 'CHECKED OUT'} ${timeStr}`,
    })
    stopKioskCamera()
    setKioskCapturedPhoto(null)
    setTimeout(() => {
      setKioskMsg(null)
      setKioskIdentified(null)
    }, 4000)
  }

  const handleKioskDeleteFace = (staffId: string) => {
    const updated = kioskRegisteredFaces.filter((f) => f.staffId !== staffId)
    setKioskRegisteredFaces(updated)
    localStorage.setItem('kioskFaces', JSON.stringify(updated))
    setKioskMsg({
      type: 'success',
      text: isBn ? 'নিবন্ধন মুছে ফেলা হয়েছে' : 'Registration deleted',
    })
    setTimeout(() => setKioskMsg(null), 2000)
  }

  const handleKioskUpdateFace = (staffId: string) => {
    if (!kioskCapturedPhoto) return
    const updated = kioskRegisteredFaces.map((f) => (f.staffId === staffId ? { ...f, photo: kioskCapturedPhoto } : f))
    setKioskRegisteredFaces(updated)
    localStorage.setItem('kioskFaces', JSON.stringify(updated))
    setKioskEditFace(null)
    setKioskCapturedPhoto(null)
    stopKioskCamera()
    setKioskMsg({
      type: 'success',
      text: isBn ? 'ছবি আপডেট হয়েছে' : 'Photo updated',
    })
    setTimeout(() => setKioskMsg(null), 2000)
  }

  const detectFaceInCenter = (): boolean => {
    const video = kioskVideoRef.current
    const canvas = kioskCanvasRef.current
    if (!video || !canvas || video.readyState < 2) return false
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    canvas.width = 160
    canvas.height = 120
    ctx.drawImage(video, 0, 0, 160, 120)
    const cx = 40,
      cy = 20,
      cw = 80,
      ch = 80
    const imageData = ctx.getImageData(cx, cy, cw, ch)
    const d = imageData.data
    let skinPixels = 0
    const total = cw * ch
    for (let i = 0; i < d.length; i += 16) {
      const r = d[i],
        g = d[i + 1],
        b = d[i + 2]
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && r - b > 15) skinPixels++
    }
    return skinPixels / (total / 4) > 0.25
  }

  const startKioskDetectLoop = () => {
    if (kioskDetectIntervalRef.current) clearInterval(kioskDetectIntervalRef.current)
    kioskStableCountRef.current = 0
    setKioskDetecting(true)
    setKioskFaceDetected(false)
    kioskDetectIntervalRef.current = setInterval(() => {
      const detected = detectFaceInCenter()
      setKioskFaceDetected(detected)
      if (detected) {
        kioskStableCountRef.current++
        if (kioskStableCountRef.current >= 5) {
          if (kioskDetectIntervalRef.current) clearInterval(kioskDetectIntervalRef.current)
          setKioskDetecting(false)
          setKioskFaceDetected(false)
          kioskStableCountRef.current = 0
          const photo = captureKioskPhoto()
          if (photo) setKioskCapturedPhoto(photo)
        }
      } else {
        kioskStableCountRef.current = 0
      }
    }, 200)
  }

  const stopKioskDetectLoop = () => {
    if (kioskDetectIntervalRef.current) clearInterval(kioskDetectIntervalRef.current)
    kioskDetectIntervalRef.current = null
    kioskStableCountRef.current = 0
    setKioskDetecting(false)
    setKioskFaceDetected(false)
  }

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
        genSinglePDF(
          personName,
          personId,
          teacher?.photo || '',
          teacher?.designation || '',
          teacher ? getDeptName(teacher.departmentId) : '',
          teacher?.inTime || '08:00',
          teacher?.outTime || '16:00',
          data,
          isBn
        )
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

  const genStudentSinglePDF = (
    name: string,
    id: string,
    className: string,
    section: string,
    rows: {
      date: string
      status: string
      punches: { time: string; type: string }[]
      isWeeklyHoliday?: boolean
    }[],
    isBn: boolean
  ): string => {
    const trs = rows
      .map((r, i) => {
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
        return `<tr class="${i % 2 === 1 ? 'alt' : ''}"><td>${i + 1}</td><td>${r.date}</td><td><b style="color:${c}">${l}</b></td></tr>`
      })
      .join('')
    const present = rows.filter((r) => r.status === 'present').length
    const absent = rows.filter((r) => r.status === 'absent').length
    const leave = rows.filter((r) => r.status === 'on-leave' && !r.isWeeklyHoliday).length
    const weeklyHoliday = rows.filter((r) => r.isWeeklyHoliday).length
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${name}</title>
<style>@page{size:A4 portrait;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;color:#1a1a1a}.hdr{display:flex;align-items:center;gap:12px;padding-bottom:7px;border-bottom:2px solid #6366f1;margin-bottom:10px}.logo{width:32px;height:32px;background:#6366f1;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700}.ttl{text-align:center;font-size:13px;font-weight:700;margin-bottom:4px}.sub{text-align:center;font-size:10px;color:#666;margin-bottom:10px}table{width:100%;border-collapse:collapse}th{background:#6366f1;color:#fff;padding:5px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;border:0.5px solid #5356d4}td{padding:4px 5px;border:0.5px solid #e5e7eb}tr.alt td{background:#f9fafb}.ftr{margin-top:12px;padding-top:7px;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:8px;color:#888}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body>
<div class="hdr"><div class="logo">ET</div><div><div style="font-size:13px;font-weight:700;color:#6366f1">EduTech — Sunrise Academy</div><div style="font-size:8px;color:#888">Individual Student Attendance Report</div></div></div>
<div class="ttl">${name} (${id})</div>
<div class="sub">${isBn ? 'শ্রেণি' : 'Class'}: ${className} · ${isBn ? 'সেকশন' : 'Section'}: ${section} · ${isBn ? 'মোট' : 'Total'}: ${rows.length} ${isBn ? 'দিন' : 'days'} · ✅ ${present} · ❌ ${absent} · ⏳ ${leave} · 📅 ${weeklyHoliday}</div>
<table><thead><tr><th>#</th><th>${isBn ? 'তারিখ' : 'Date'}</th><th>${isBn ? 'অবস্থা' : 'Status'}</th></tr></thead><tbody>${trs}</tbody></table>
<div class="ftr"><span>EduTech School Management System</span><div>${isBn ? 'মুদ্রণ:' : 'Printed:'} ${new Date().toLocaleDateString()}</div></div></body></html>`
  }

  const downloadStudentSinglePDF = useCallback(
    (studentId: string, studentName: string, className: string, section: string) => {
      const data = getStudentMonthData(studentId)
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(genStudentSinglePDF(studentName, studentId, className, section, data, isBn))
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
    'px-[9px] py-[7px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[12px] cursor-pointer outline-none'

  const statusBadge = (s: AttendanceStatus) => {
    const m = {
      present: { bg: 'var(--green-light)', c: 'var(--green)', l: 'P' },
      absent: { bg: 'var(--red-light)', c: 'var(--red)', l: 'A' },
      'on-leave': { bg: 'var(--amber-light)', c: 'var(--amber)', l: 'L' },
    }
    const x = m[s]
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-[4px] text-[9px] font-bold"
        style={{ background: x.bg, color: x.c }}
      >
        {x.l}
      </span>
    )
  }

  const weeklyHolidayBadge = () => {
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-[4px] text-[9px] font-bold"
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
      {showMarkAll && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[700] overflow-y-auto bg-black/50">
          <div className="modal-content bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-3">
              {isBn ? 'সবাইকে উপস্থিত করুন?' : 'Mark All Present?'}
            </h3>
            <p className="text-[13px] text-[var(--text-secondary)] mb-4">
              {isBn
                ? `${activeTeachers.length} জন শিক্ষককে উপস্থিত হিসেবে চিহ্নিত করা হবে।`
                : `${activeTeachers.length} teachers will be marked present.`}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMarkAll(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px] cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleMarkAll}
                className="px-3.5 py-2 rounded-lg bg-[var(--green)] border-0 text-white text-[13px] font-semibold cursor-pointer"
              >
                {isBn ? 'নিশ্চিত করুন' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Person Detail Modal */}
      {viewPerson && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] overflow-y-auto bg-black/50">
          <div className="modal-content bg-[var(--bg-primary)] rounded-2xl max-w-[650px] w-full max-h-[85vh] overflow-hidden flex flex-col border border-[var(--border)]">
            <div className="px-[18px] py-3.5 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--brand-light)]">
              {(() => {
                const t = teachers.find((te) => te.id === viewPerson.id)
                const photoUrl = t?.photo
                return photoUrl ? (
                  <img src={photoUrl} className="w-10 h-10 rounded-full object-cover border-2 border-[var(--brand)]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--brand-light)] border-2 border-[var(--brand)] flex items-center justify-center text-[var(--brand)] font-bold text-[14px]">
                    {viewPerson.name.charAt(0)}
                  </div>
                )
              })()}
              <div className="flex-1">
                <div className="text-[15px] font-semibold text-[var(--text-primary)]">{viewPerson.name}</div>
                <div className="text-[11px] text-[var(--brand)] font-mono">
                  {viewPerson.id} · {dateFrom} → {dateTo}
                </div>
              </div>
              <button
                onClick={() => setViewPerson(null)}
                className="w-7 h-7 rounded-[7px] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
              >
                <X size={14} className="text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-[18px] py-3.5">
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
                        <div key={s.l} className="p-2 rounded-[8px] text-center" style={{ background: s.bg }}>
                          <div className="text-lg font-bold" style={{ color: s.c }}>
                            {isBn ? s.vBn : s.vEn}
                          </div>
                          <div className="text-[9px]" style={{ color: s.c }}>
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[var(--bg-secondary)]">
                          <th className="p-[5px] text-center text-[9px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)] w-[24px]">
                            #
                          </th>
                          <th className="p-[5px] text-left text-[9px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'তারিখ' : 'Date'}
                          </th>
                          <th className="p-[5px] text-center text-[9px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'ইন' : 'In'}
                          </th>
                          <th className="p-[5px] text-center text-[9px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'আউট' : 'Out'}
                          </th>
                          <th className="p-[5px] text-center text-[9px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
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
                              <td className="p-[5px] text-center text-[9px] text-[var(--text-muted)]">{i + 1}</td>
                              <td className="p-[5px]">
                                <div className="text-[10px] font-medium text-[var(--text-primary)]">{d.date}</div>
                                <div className="text-[8px] text-[var(--text-muted)]">{dayName(d.date)}</div>
                              </td>
                              <td className="p-[5px] text-center">
                                <span
                                  className={`text-[9px] font-mono font-semibold px-[5px] py-[1px] rounded ${
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
                              <td className="p-[5px] text-center">
                                <span className="text-[9px] font-mono text-[var(--text-secondary)]">{lastOut?.time || '—'}</span>
                              </td>
                              <td className="p-[5px] text-center">
                                <span
                                  className={`text-[9px] font-semibold px-[6px] py-[1px] rounded-[8px] ${
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
                                {isLate && <span className="text-[7px] text-[var(--amber)] font-bold ml-1">LATE</span>}
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
            <div className="px-[18px] py-3 border-t border-[var(--border)] flex gap-2 justify-end">
              <button
                onClick={() => setViewPerson(null)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
              >
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
              <button
                onClick={() => downloadSinglePDF(viewPerson.id, viewPerson.name)}
                className="flex items-center gap-[5px] px-3.5 py-2 rounded-lg bg-[var(--red)] border-0 text-white text-[12px] font-semibold cursor-pointer"
              >
                <FileText size={13} />
                PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {viewStudent && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[600] overflow-y-auto bg-black/50">
          <div className="modal-content bg-[var(--bg-primary)] rounded-2xl max-w-[600px] w-full max-h-[85vh] overflow-hidden flex flex-col border border-[var(--border)]">
            <div className="px-[18px] py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--brand-light)]">
              <div>
                <div className="text-[15px] font-semibold text-[var(--text-primary)]">{viewStudent.name}</div>
                <div className="text-[11px] text-[var(--brand)] font-mono">
                  {viewStudent.id} · {viewStudent.class} · {isBn ? 'সেকশন' : 'Section'}: {viewStudent.section}
                </div>
              </div>
              <button
                onClick={() => setViewStudent(null)}
                className="w-7 h-7 rounded-[7px] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
              >
                <X size={14} className="text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-[18px] py-3.5">
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
                        <div key={s.l} className="p-2.5 rounded-[10px] text-center" style={{ background: s.bg }}>
                          <div className="text-xl font-bold" style={{ color: s.c }}>
                            {isBn ? s.vBn : s.vEn}
                          </div>
                          <div className="text-[10px]" style={{ color: s.c }}>
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                    <table className="w-full border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[var(--bg-secondary)]">
                          <th className="p-[6px] text-left text-[10px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            #
                          </th>
                          <th className="p-[6px] text-left text-[10px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'তারিখ' : 'Date'}
                          </th>
                          <th className="p-[6px] text-left text-[10px] font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
                            {isBn ? 'অবস্থা' : 'Status'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((d, i) => (
                          <tr key={d.date} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                            <td className="px-2 py-[5px] text-[var(--text-muted)]">{i + 1}</td>
                            <td className="px-2 py-[5px]">
                              <div className="text-[11px] font-medium text-[var(--text-primary)]">{d.date}</div>
                              <div className="text-[9px] text-[var(--text-muted)]">{dayName(d.date)}</div>
                            </td>
                            <td className="px-2 py-[5px]">
                              {d.isWeeklyHoliday ? (
                                <span className="text-[10px] font-semibold px-[7px] py-[2px] rounded-[10px] bg-[var(--purple-light)] text-[var(--purple)]">
                                  {isBn ? 'সাপ্তাহিক ছুটি' : 'Weekly Holiday'}
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] font-semibold px-[7px] py-[2px] rounded-[10px] ${
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
            <div className="px-[18px] py-3 border-t border-[var(--border)] flex gap-2 justify-end">
              <button
                onClick={() => setViewStudent(null)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
              >
                {isBn ? 'বন্ধ' : 'Close'}
              </button>
              <button
                onClick={() => downloadStudentSinglePDF(viewStudent.id, viewStudent.name, viewStudent.class, viewStudent.section)}
                className="flex items-center gap-[5px] px-3.5 py-2 rounded-lg bg-[var(--red)] border-0 text-white text-[12px] font-semibold cursor-pointer"
              >
                <FileText size={13} />
                PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`flex gap-2.5 mb-4 flex-wrap ${isMobile ? 'flex-col items-start' : 'items-center'}`}>
        <button
          onClick={() => navigate('/teachers')}
          className="flex items-center gap-[5px] px-3 py-[7px] rounded-[9px] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[13px] text-[var(--text-secondary)] shrink-0"
        >
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-[18px]' : 'text-[22px]'}`}>
            {isBn ? 'উপস্থিতি ব্যবস্থাপনা' : 'Attendance Management'}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-[3px]">
            {isBn ? 'শিক্ষক, কর্মচারী এবং ছাত্রদের উপস্থিতি ট্র্যাক করুন' : 'Track teacher, employee and student attendance'}
          </p>
        </div>
        {/* Legend Box */}
        <div
          className={`bg-[var(--bg-primary)] border border-[var(--border)] rounded-[10px] px-3 py-2 flex flex-wrap gap-[10px] shrink-0 ${isMobile ? 'w-full gap-1.5' : ''}`}
        >
          {legendItems.map((item) => (
            <div key={item.l} className="flex items-center gap-1">
              <span
                className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-[4px] text-[8px] font-bold"
                style={{ background: item.bg, color: item.color }}
              >
                <item.Icon size={10} />
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium">
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
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[12px] cursor-pointer transition-all ${
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
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[10px] mb-3.5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">{isBn ? 'অবস্থা:' : 'Status:'}</span>
          {statusFilters.map((sf) => (
            <button
              key={sf.key}
              onClick={() => setStatusFilter(sf.key)}
              className={`px-3 py-1 rounded-lg text-[11px] cursor-pointer border ${
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
            className="px-2 py-[5px] rounded-[7px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none"
          />
          <span className="text-[11px] text-[var(--text-muted)]">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-[5px] rounded-[7px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none"
          />
        </div>
      )}

      {/* Filter + Date Range for Student tab */}
      {activeTab === 'student' && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[10px] mb-3.5 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-[9px] py-[5px] flex-1 min-w-[160px]">
            <Search size={13} className="text-[var(--text-muted)] shrink-0" />
            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
              className="flex-1 border-none bg-transparent outline-none text-[12px] text-[var(--text-primary)]"
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
              className="px-2 py-[3px] rounded-[6px] bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[10px] cursor-pointer"
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
            className="px-2 py-[5px] rounded-[7px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none"
          />
          <span className="text-[11px] text-[var(--text-muted)]">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-[5px] rounded-[7px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none"
          />
        </div>
      )}

      {/* Filter + Date Range for Employee tab */}
      {activeTab === 'employee' && (
        <>
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[10px] mb-3.5 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-[9px] py-[5px] flex-1 min-w-[160px]">
              <Search size={13} className="text-[var(--text-muted)] shrink-0" />
              <input
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder={isBn ? 'নাম বা আইডি...' : 'Name or ID...'}
                className="flex-1 border-none bg-transparent outline-none text-[12px] text-[var(--text-primary)]"
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
                className="px-2 py-[3px] rounded-[6px] bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[10px] cursor-pointer"
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
              className="px-2 py-[5px] rounded-[7px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none"
            />
            <span className="text-[11px] text-[var(--text-muted)]">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-[5px] rounded-[7px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[11px] outline-none"
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
                <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <s.Icon size={18} style={{ color: s.c }} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">{s.v}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{isBn ? s.lBn : s.lEn}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Export buttons */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[var(--text-secondary)]">
                {isBn ? `মোট ${filteredEmployees.length} জন কর্মচারী` : `${filteredEmployees.length} employees`}
              </span>
              {selectedEmployees.length > 0 && (
                <span className="text-[11px] text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-[3px] rounded-[6px] font-medium">
                  {selectedEmployees.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={exportEmployeeExcel}
                className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[12px] cursor-pointer font-medium"
              >
                <FileSpreadsheet size={13} />
                Excel
              </button>
              <button
                onClick={() => setShowEmployeePDF(true)}
                disabled={selectedEmployees.length === 0}
                className={`flex items-center gap-[5px] px-3 py-[7px] rounded-lg text-[12px] font-medium ${
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

          {/* Employee Table */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] overflow-hidden">
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[36px]">
                      <input
                        type="checkbox"
                        checked={filteredEmployees.length > 0 && filteredEmployees.every((t) => selectedEmployees.includes(t.id))}
                        onChange={() => {
                          if (filteredEmployees.every((t) => selectedEmployees.includes(t.id))) setSelectedEmployees([])
                          else setSelectedEmployees(filteredEmployees.map((t) => t.id))
                        }}
                        className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                      />
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[36px]"></th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[140px]">
                      {isBn ? 'নাম' : 'Name'}
                    </th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[80px]">
                      {isBn ? 'বিভাগ' : 'Dept'}
                    </th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[80px]">
                      {isBn ? 'পদবি' : 'Designation'}
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[70px]">
                      {isBn ? 'ইন টাইম' : 'In-Time'}
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[70px]">
                      {isBn ? 'আউট টাইম' : 'Out-Time'}
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[60px]">
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
                            className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                          />
                        </td>
                        <td className="p-[6px] text-center">
                          <div className="w-[30px] h-[36px] rounded-[5px] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto">
                            {t.photo ? (
                              <img src={t.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User size={13} className="text-[var(--text-muted)]" />
                            )}
                          </div>
                        </td>
                        <td className="p-[6px]">
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
                            <div className="text-[11px] font-medium text-[var(--text-primary)]">
                              {isBn ? t.nameBn || t.nameEn : t.nameEn}
                            </div>
                            <ExternalLink size={10} className="text-[var(--text-muted)]" />
                          </div>
                          <div className="text-[9px] text-[var(--text-muted)] font-mono">{t.id}</div>
                        </td>
                        <td className="p-[6px] text-[10px] text-[var(--text-secondary)]">{getDeptName(t.departmentId)}</td>
                        <td className="p-[6px] text-[10px] text-[var(--text-secondary)]">{t.designation || '—'}</td>
                        <td className="p-[6px] text-center">
                          {st === 'present' && inPunch ? (
                            <span
                              className={`text-[10px] font-mono font-semibold px-2 py-[2px] rounded ${isLate ? 'bg-[var(--amber-light)] text-[var(--amber)]' : 'bg-[var(--green-light)] text-[var(--green)]'}`}
                            >
                              {inPunch.time}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="p-[6px] text-center">
                          {st === 'present' && outPunch ? (
                            <span className="text-[10px] font-mono font-medium text-[var(--text-secondary)]">{outPunch.time}</span>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="p-[6px] text-center">
                          {statusBadge(st)}
                          {isLate && st === 'present' && <span className="text-[8px] text-[var(--amber)] font-semibold ml-1">LATE</span>}
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
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[11px] text-[var(--text-muted)]">
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
                  className="px-1.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[11px] text-[var(--text-secondary)]"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-[3px]">
                {(
                  [
                    [<ChevronsLeft size={12} />, () => setEmpPage(1), empPage === 1] as const,
                    [<ChevronLeft size={12} />, () => setEmpPage((p) => Math.max(1, p - 1)), empPage === 1] as const,
                    ...(Array.from({ length: Math.min(empTotalPages, 5) }, (_, i) => {
                      const start = Math.max(1, Math.min(empPage - 2, empTotalPages - 4))
                      const pg = start + i
                      return pg <= empTotalPages
                        ? ([
                            <span key={pg} className="text-[11px]">
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
                <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <s.Icon size={18} style={{ color: s.c }} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">{s.v}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{isBn ? s.lBn : s.lEn}</div>
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
                className="px-2.5 py-[6px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs outline-none"
              />
              <div className="flex-1" />
              <button
                onClick={() => setShowMarkAll(true)}
                className="flex items-center gap-[5px] px-3.5 py-[7px] rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-xs cursor-pointer font-medium"
              >
                <CheckCircle size={13} />
                {isBn ? 'সবাইকে উপস্থিত করুন' : 'Mark All Present'}
              </button>
            </div>
            {/* Status filter buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">{isBn ? 'ফিল্টার:' : 'Filter:'}</span>
              {statusFilters.map((sf) => (
                <button
                  key={sf.key}
                  onClick={() => {
                    setStatusFilter(sf.key)
                    setEmpPage(1)
                  }}
                  className={`px-3 py-[5px] rounded-lg text-[11px] cursor-pointer border transition-all ${
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
              <span className="text-[11px] text-[var(--text-muted)] ml-1">
                ({todayFiltered.length} {isBn ? 'জন' : 'staff'})
              </span>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] overflow-hidden">
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[36px]">
                      <input
                        type="checkbox"
                        checked={todayFiltered.length > 0 && todayFiltered.every((t) => selectedEmployees.includes(t.id))}
                        onChange={() => {
                          if (todayFiltered.every((t) => selectedEmployees.includes(t.id))) setSelectedEmployees([])
                          else setSelectedEmployees(todayFiltered.map((t) => t.id))
                        }}
                        className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                      />
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[36px]"></th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[140px]">
                      {isBn ? 'নাম' : 'Name'}
                    </th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[80px]">
                      {isBn ? 'বিভাগ' : 'Dept'}
                    </th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[80px]">
                      {isBn ? 'পদবি' : 'Desig'}
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[70px]">
                      <div className="flex items-center justify-center gap-1">
                        <LogOut size={10} />
                        {isBn ? 'ইন টাইম' : 'In-Time'}
                      </div>
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[70px]">
                      <div className="flex items-center justify-center gap-1">
                        <LogOut size={10} />
                        {isBn ? 'আউট টাইম' : 'Out-Time'}
                      </div>
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[60px]">
                      {isBn ? 'অবস্থা' : 'Status'}
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] min-w-[50px]">
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
                            className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                          />
                        </td>
                        <td className="p-[6px] text-center">
                          <div className="w-[30px] h-[36px] rounded-[5px] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto">
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
                            <div className="text-[11px] font-medium text-[var(--text-primary)]">{t.name}</div>
                            <ExternalLink size={10} className="text-[var(--text-muted)]" />
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-[9px] text-[var(--text-muted)] font-mono">{t.id}</div>
                            <span
                              className={`text-[7px] px-[4px] py-[1px] rounded font-semibold ${
                                t.type === 'staff'
                                  ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                                  : 'bg-[var(--green-light)] text-[var(--green)]'
                              }`}
                            >
                              {t.type === 'staff' ? 'STAFF' : 'STU'}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-[10px] text-[var(--text-secondary)]">{t.dept}</td>
                        <td className="p-2 text-[10px] text-[var(--text-secondary)]">{t.designation || '—'}</td>
                        <td className="p-2 text-center">
                          {isPresent && t.inTime !== '—' ? (
                            <span
                              className={`text-[10px] font-mono font-semibold px-2 py-[2px] rounded ${
                                t.isLate ? 'bg-[var(--amber-light)] text-[var(--amber)]' : 'bg-[var(--green-light)] text-[var(--green)]'
                              }`}
                            >
                              {t.inTime}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {isPresent && t.outTime !== '—' ? (
                            <span className="text-[10px] font-mono font-medium text-[var(--text-secondary)]">{t.outTime}</span>
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {statusBadge(t.attStatus)}
                          {t.isLate && isPresent && <span className="text-[8px] text-[var(--amber)] font-semibold ml-1">LATE</span>}
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
                            className="w-[26px] h-[26px] rounded-[6px] bg-[var(--brand-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--brand)] mx-auto"
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
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[11px] text-[var(--text-muted)]">
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
                  className="px-1.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[11px] text-[var(--text-secondary)]"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-[3px]">
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
                <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <s.Icon size={18} style={{ color: s.c }} />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">{s.v}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{isBn ? s.lBn : s.lEn}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Export buttons */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[10px] mb-3.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[var(--text-secondary)]">
                {isBn
                  ? `${filteredEmployees.length} জন কর্মচারী · ${rangeDays.length} দিন`
                  : `${filteredEmployees.length} employees · ${rangeDays.length} days`}
              </span>
              {selectedEmployees.length > 0 && (
                <span className="text-[11px] text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-[3px] rounded-[6px] font-medium">
                  {selectedEmployees.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={exportEmployeeExcel}
                className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[12px] cursor-pointer font-medium"
              >
                <FileSpreadsheet size={13} />
                Excel
              </button>
              <button
                onClick={() => setShowEmployeePDF(true)}
                disabled={selectedEmployees.length === 0}
                className={`flex items-center gap-[5px] px-3 py-[7px] rounded-lg text-[12px] font-medium ${
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
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] overflow-hidden">
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[36px]">
                      <input
                        type="checkbox"
                        checked={filteredEmployees.length > 0 && filteredEmployees.every((t) => selectedEmployees.includes(t.id))}
                        onChange={() => {
                          if (filteredEmployees.every((t) => selectedEmployees.includes(t.id))) setSelectedEmployees([])
                          else setSelectedEmployees(filteredEmployees.map((t) => t.id))
                        }}
                        className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                      />
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[36px]"></th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[140px]">
                      {isBn ? 'নাম' : 'Name'}
                    </th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[80px]">
                      {isBn ? 'বিভাগ' : 'Dept'}
                    </th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[80px]">
                      {isBn ? 'পদবি' : 'Designation'}
                    </th>
                    {rangeDays.map((ds) => (
                      <th key={ds} className="p-[6px] text-center text-[9px] font-semibold text-[var(--text-muted)] min-w-[36px]">
                        <div>{shortDate(ds)}</div>
                        <div className="text-[8px] font-normal">{dayName(ds)}</div>
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
                          className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                        />
                      </td>
                      <td className="p-[6px] text-center">
                        <div className="w-[30px] h-[36px] rounded-[5px] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto">
                          {t.photo ? (
                            <img src={t.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={13} className="text-[var(--text-muted)]" />
                          )}
                        </div>
                      </td>
                      <td className="p-[6px]">
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
                          <div className="text-[11px] font-medium text-[var(--text-primary)]">{isBn ? t.nameBn || t.nameEn : t.nameEn}</div>
                          <ExternalLink size={10} className="text-[var(--text-muted)]" />
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] font-mono">{t.id}</div>
                      </td>
                      <td className="p-[6px] text-[10px] text-[var(--text-secondary)]">{getDeptName(t.departmentId)}</td>
                      <td className="p-[6px] text-[10px] text-[var(--text-secondary)]">{t.designation || '—'}</td>
                      {rangeDays.map((ds) => {
                        if (isFriday(ds))
                          return (
                            <td key={ds} className="p-[4px] text-center">
                              {weeklyHolidayBadge()}
                            </td>
                          )
                        const s = getStatus(attendance[ds]?.[t.id])
                        return (
                          <td key={ds} className="p-[4px] text-center">
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
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[11px] text-[var(--text-muted)]">
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
                  className="px-1.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[11px] text-[var(--text-secondary)]"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-[3px]">
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
      {activeTab === 'device' && (
        <>
          {/* Device sub-tabs — status filter style */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[10px] mb-3.5 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">{isBn ? 'সেকশন:' : 'Section:'}</span>
            {[
              {
                key: 'devices' as const,
                lBn: 'ডিভাইস',
                lEn: 'Devices',
                Icon: Fingerprint,
                color: '#7C3AED',
              },
              {
                key: 'rfid' as const,
                lBn: 'RFID কার্ড',
                lEn: 'RFID Cards',
                Icon: CreditCard,
                color: 'var(--brand)',
              },
              {
                key: 'fingerprint' as const,
                lBn: 'ফিঙ্গারপ্রিন্ট',
                lEn: 'Fingerprint',
                Icon: Fingerprint,
                color: 'var(--amber)',
              },
              {
                key: 'face' as const,
                lBn: 'ফেস স্ক্যান',
                lEn: 'Face Scan',
                Icon: ScanFace,
                color: 'var(--green)',
              },
              {
                key: 'mobile' as const,
                lBn: 'মোবাইল',
                lEn: 'Mobile',
                Icon: Wifi,
                color: 'var(--teal)',
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDeviceTab(tab.key)}
                className={`px-3 py-1 rounded-lg text-[11px] cursor-pointer border ${
                  deviceTab === tab.key
                    ? 'font-semibold'
                    : 'font-normal border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}
                style={
                  deviceTab === tab.key
                    ? {
                        border: `1px solid ${tab.color}`,
                        background: `${tab.color}18`,
                        color: tab.color,
                      }
                    : {}
                }
              >
                <span className="flex items-center gap-1">
                  <tab.Icon size={12} />
                  {isBn ? tab.lBn : tab.lEn}
                </span>
              </button>
            ))}
            <div className="flex-1" />
            {deviceTab === 'devices' && (
              <button
                onClick={() => setShowAddDevice(true)}
                className="flex items-center gap-[5px] px-3 py-[6px] rounded-lg bg-[#7C3AED] text-white text-[11px] cursor-pointer font-medium"
              >
                <Plus size={12} />
                {isBn ? 'ডিভাইস যোগ' : 'Add Device'}
              </button>
            )}
            {deviceTab === 'rfid' && (
              <button
                onClick={() => setShowAddRFID(true)}
                className="flex items-center gap-[5px] px-3 py-[6px] rounded-lg bg-[var(--brand)] text-white text-[11px] cursor-pointer font-medium"
              >
                <Plus size={12} />
                {isBn ? 'কার্ড যোগ' : 'Add Card'}
              </button>
            )}
            {deviceTab === 'fingerprint' && (
              <button
                onClick={() => setShowAddFP(true)}
                className="flex items-center gap-[5px] px-3 py-[6px] rounded-lg bg-[var(--amber)] text-white text-[11px] cursor-pointer font-medium"
              >
                <Fingerprint size={12} />
                {isBn ? 'এনরোল' : 'Enroll FP'}
              </button>
            )}
            {deviceTab === 'face' && (
              <button
                onClick={() => setShowAddFace(true)}
                className="flex items-center gap-[5px] px-3 py-[6px] rounded-lg bg-[var(--green)] text-white text-[11px] cursor-pointer font-medium"
              >
                <ScanFace size={12} />
                {isBn ? 'স্ক্যান' : 'Scan Face'}
              </button>
            )}
            {deviceTab === 'mobile' && (
              <button
                onClick={() => setKioskMode(true)}
                className="flex items-center gap-[5px] px-3 py-[6px] rounded-lg bg-[var(--teal)] text-white text-[11px] cursor-pointer font-medium"
              >
                <Wifi size={12} />
                {isBn ? 'কিওস্ক মোড' : 'Kiosk Mode'}
              </button>
            )}
          </div>

          {/* ===== Device Management ===== */}
          {deviceTab === 'devices' && (
            <>
              {/* Summary Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                {[
                  {
                    label: isBn ? 'মোট ডিভাইস' : 'Total Devices',
                    value: devices.length,
                    icon: <Layers size={16} />,
                    bg: 'bg-[#7C3AED12]',
                    color: '#7C3AED',
                    border: 'border-[#7C3AED30]',
                  },
                  {
                    label: isBn ? 'অনলাইন' : 'Online',
                    value: devices.filter((d) => d.status === 'online').length,
                    icon: <Wifi size={16} />,
                    bg: 'bg-[var(--green-light)]',
                    color: 'var(--green)',
                    border: 'border-[var(--green-light)]',
                  },
                  {
                    label: isBn ? 'অফলাইন' : 'Offline',
                    value: devices.filter((d) => d.status === 'offline').length,
                    icon: <WifiOff size={16} />,
                    bg: 'bg-[var(--red-light)]',
                    color: 'var(--red)',
                    border: 'border-[var(--red-light)]',
                  },
                  {
                    label: isBn ? 'মোট স্টাফ' : 'Total Staff',
                    value: devices.reduce((s, d) => s + d.staffCount, 0),
                    icon: <Users size={16} />,
                    bg: 'bg-[var(--brand-light)]',
                    color: 'var(--brand)',
                    border: 'border-[var(--brand-light)]',
                  },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${s.border} ${s.bg} backdrop-blur-sm`}>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${s.color}20`, color: s.color }}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-[18px] font-bold" style={{ color: s.color }}>
                        {s.value}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-medium">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Device Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {devices.map((d) => {
                  const typeColor = d.type === 'rfid' ? '#7C3AED' : d.type === 'fingerprint' ? 'var(--amber)' : 'var(--green)'
                  const typeLabel = d.type === 'rfid' ? 'RFID' : d.type === 'fingerprint' ? 'FP' : 'Face'
                  return (
                    <div
                      key={d.id}
                      className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {/* Card Header */}
                      <div
                        className="px-4 pt-3.5 pb-2.5"
                        style={{
                          background: `linear-gradient(135deg, ${typeColor}08 0%, transparent 60%)`,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                              style={{ background: typeColor }}
                            >
                              {d.type === 'rfid' ? (
                                <CreditCard size={18} className="text-white" />
                              ) : d.type === 'fingerprint' ? (
                                <Fingerprint size={18} className="text-white" />
                              ) : (
                                <ScanFace size={18} className="text-white" />
                              )}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-[var(--text-primary)]">{d.name}</div>
                              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                {d.model} · <span className="font-mono">{d.ip}</span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                              d.status === 'online'
                                ? 'bg-[var(--green-light)] text-[var(--green)]'
                                : d.status === 'offline'
                                  ? 'bg-[var(--red-light)] text-[var(--red)]'
                                  : 'bg-[var(--amber-light)] text-[var(--amber)]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${d.status === 'online' ? 'bg-[var(--green)] animate-pulse' : d.status === 'offline' ? 'bg-[var(--red)]' : 'bg-[var(--amber)]'}`}
                            ></span>
                            {d.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Tag size={10} /> {typeLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={10} /> {d.staffCount} {isBn ? 'স্টাফ' : 'staff'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />{' '}
                            {d.lastSync
                              ? new Date(d.lastSync).toLocaleString('en', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                  day: '2-digit',
                                  month: 'short',
                                })
                              : '—'}
                          </span>
                        </div>
                      </div>
                      {/* Card Actions */}
                      <div className="px-4 py-2.5 border-t border-[var(--border)] flex gap-1.5">
                        <button
                          onClick={() => {
                            setSyncingDevice(d.id)
                            setTimeout(() => {
                              setDevices((prev) =>
                                prev.map((dev) =>
                                  dev.id === d.id
                                    ? {
                                        ...dev,
                                        lastSync: new Date().toISOString(),
                                        status: 'online',
                                      }
                                    : dev
                                )
                              )
                              setSyncingDevice(null)
                            }, 2000)
                          }}
                          disabled={syncingDevice === d.id}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[10px] font-semibold cursor-pointer transition-all duration-200 ${
                            syncingDevice === d.id
                              ? 'bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] animate-pulse'
                              : 'bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white hover:shadow-md'
                          }`}
                        >
                          {syncingDevice === d.id ? (
                            <>
                              <Loader size={11} className="animate-spin" />
                              {isBn ? 'সিঙ্ক...' : 'Syncing...'}
                            </>
                          ) : (
                            <>
                              <RefreshCw size={11} />
                              {isBn ? 'সিঙ্ক' : 'Sync'}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowDeviceSettings(d.id)}
                          className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[10px] font-medium cursor-pointer hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all duration-200"
                        >
                          <Settings size={11} />
                          {isBn ? 'সেটিং' : 'Settings'}
                        </button>
                        <button
                          onClick={() =>
                            setDevices((prev) =>
                              prev.map((dev) =>
                                dev.id === d.id
                                  ? {
                                      ...dev,
                                      status: dev.status === 'online' ? 'offline' : 'online',
                                    }
                                  : dev
                              )
                            )
                          }
                          className={`flex items-center justify-center px-2.5 py-2 rounded-lg border text-[10px] cursor-pointer transition-all duration-200 ${
                            d.status === 'online'
                              ? 'bg-[var(--red-light)] border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white hover:shadow-md'
                              : 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white hover:shadow-md'
                          }`}
                        >
                          {d.status === 'online' ? <WifiOff size={11} /> : <Wifi size={11} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Device Settings Modal */}
              {showDeviceSettings && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-[700] overflow-y-auto bg-black/50">
                  <div className="modal-content bg-[var(--bg-primary)] rounded-[14px] max-w-[440px] w-full p-5 border border-[var(--border)]">
                    {(() => {
                      const d = devices.find((dev) => dev.id === showDeviceSettings)
                      if (!d) return null
                      return (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                              {isBn ? 'ডিভাইস সেটিং' : 'Device Settings'}
                            </h3>
                            <button
                              onClick={() => setShowDeviceSettings(null)}
                              className="w-7 h-7 rounded-[7px] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
                            >
                              <X size={14} className="text-[var(--text-secondary)]" />
                            </button>
                          </div>
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'ডিভাইস নাম' : 'Device Name'}</span>
                              <span className="text-[11px] font-semibold text-[var(--text-primary)]">{d.name}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'মডেল' : 'Model'}</span>
                              <span className="text-[11px] font-semibold text-[var(--text-primary)]">{d.model}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[11px] text-[var(--text-secondary)]">IP {isBn ? 'ঠিকানা' : 'Address'}</span>
                              <span className="text-[11px] font-mono font-semibold text-[var(--text-primary)]">{d.ip}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'টাইপ' : 'Type'}</span>
                              <span className="text-[11px] font-semibold text-[var(--text-primary)] capitalize">{d.type}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'স্টাফ সংখ্যা' : 'Staff Count'}</span>
                              <span className="text-[11px] font-semibold text-[var(--text-primary)]">{d.staffCount}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-semibold text-[var(--text-secondary)]">
                              {isBn ? 'সিঙ্ক সেটিং' : 'Sync Settings'}
                            </h4>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'অটো সিঙ্ক' : 'Auto Sync'}</span>
                              <button
                                onClick={() =>
                                  setDeviceSettings((s) => ({
                                    ...s,
                                    autoSync: !s.autoSync,
                                  }))
                                }
                                className={`w-9 h-5 rounded-full cursor-pointer relative transition-all duration-200 border-0 outline-none ${deviceSettings.autoSync ? 'bg-[var(--green)]' : 'bg-[var(--border)]'}`}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${deviceSettings.autoSync ? 'right-0.5' : 'left-0.5'}`}
                                ></span>
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'সিঙ্ক ইন্টারভাল' : 'Sync Interval'}</span>
                              <select
                                value={deviceSettings.syncInterval}
                                onChange={(e) =>
                                  setDeviceSettings((s) => ({
                                    ...s,
                                    syncInterval: +e.target.value,
                                  }))
                                }
                                className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[10px] text-[var(--text-secondary)]"
                              >
                                <option value={5}>5 {isBn ? 'মিনিট' : 'min'}</option>
                                <option value={15}>15 {isBn ? 'মিনিট' : 'min'}</option>
                                <option value={30}>30 {isBn ? 'মিনিট' : 'min'}</option>
                                <option value={60}>1 {isBn ? 'ঘণ্টা' : 'hr'}</option>
                              </select>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'সাউন্ড' : 'Sound'}</span>
                              <button
                                onClick={() =>
                                  setDeviceSettings((s) => ({
                                    ...s,
                                    playSound: !s.playSound,
                                  }))
                                }
                                className={`w-9 h-5 rounded-full cursor-pointer relative transition-all duration-200 border-0 outline-none ${deviceSettings.playSound ? 'bg-[var(--green)]' : 'bg-[var(--border)]'}`}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${deviceSettings.playSound ? 'right-0.5' : 'left-0.5'}`}
                                ></span>
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'ভার্সন' : 'Version'}</span>
                              <span className="text-[10px] font-mono text-[var(--text-muted)]">v4.2.1</span>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end mt-5">
                            <button
                              onClick={() => setShowDeviceSettings(null)}
                              className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] font-medium cursor-pointer hover:bg-[var(--border)] transition-all"
                            >
                              {isBn ? 'বন্ধ' : 'Close'}
                            </button>
                            <button
                              onClick={() => {
                                setDevices((prev) => prev.map((dev) => (dev.id === showDeviceSettings ? { ...dev, name: d.name } : dev)))
                                setShowDeviceSettings(null)
                              }}
                              className="px-4 py-2 rounded-lg bg-[var(--green)] text-white text-[12px] font-semibold cursor-pointer hover:opacity-90 hover:shadow-md transition-all"
                            >
                              {isBn ? 'সংরক্ষণ' : 'Save'}
                            </button>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== RFID Cards ===== */}
          {deviceTab === 'rfid' && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {[
                  {
                    label: isBn ? 'মোট কার্ড' : 'Total Cards',
                    value: rfidEntries.length,
                    icon: <CreditCard size={15} />,
                    color: 'var(--brand)',
                  },
                  {
                    label: isBn ? 'বরাদ্ধ' : 'Assigned',
                    value: rfidEntries.filter((e) => e.assigned).length,
                    icon: <CheckCircle size={15} />,
                    color: 'var(--green)',
                  },
                  {
                    label: isBn ? 'অবরাদ্ধ' : 'Unassigned',
                    value: rfidEntries.filter((e) => !e.assigned).length,
                    icon: <XCircle size={15} />,
                    color: 'var(--red)',
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] hover:shadow-md transition-all"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${s.color}15`, color: s.color }}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-[16px] font-bold" style={{ color: s.color }}>
                        {s.value}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[6px] flex-1 max-w-[300px]">
                  <Search size={13} className="text-[var(--text-muted)]" />
                  <input
                    value={rfidSearch}
                    onChange={(e) => setRfidSearch(e.target.value)}
                    placeholder={isBn ? 'নাম বা কার্ড নম্বর দিয়ে খুঁজুন...' : 'Search by name or card number...'}
                    className="flex-1 border-none bg-transparent outline-none text-[12px] text-[var(--text-primary)]"
                  />
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {
                    rfidEntries.filter(
                      (e) => !rfidSearch || e.staffName.toLowerCase().includes(rfidSearch.toLowerCase()) || e.rfidCard.includes(rfidSearch)
                    ).length
                  }{' '}
                  {isBn ? 'টি ফলাফল' : 'results'}
                </span>
              </div>
              {/* Table */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-auto max-h-[55vh]">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[35px]">#</th>
                        <th className="p-2.5 text-left text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'স্টাফ আইডি' : 'Staff ID'}
                        </th>
                        <th className="p-2.5 text-left text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                        <th className="p-2.5 text-left text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'কার্ড নম্বর' : 'Card Number'}
                        </th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'টাইপ' : 'Type'}</th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অবস্থা' : 'Status'}
                        </th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অ্যাকশন' : 'Action'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfidEntries
                        .filter(
                          (e) =>
                            !rfidSearch || e.staffName.toLowerCase().includes(rfidSearch.toLowerCase()) || e.rfidCard.includes(rfidSearch)
                        )
                        .map((e, i) => (
                          <tr
                            key={e.rfidCard}
                            className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                            <td className="p-2.5 font-mono font-semibold text-[var(--brand)]">{e.staffId}</td>
                            <td className="p-2.5 text-[var(--text-primary)] font-medium">{e.staffName}</td>
                            <td className="p-2.5 font-mono text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded mx-1">
                              {e.rfidCard}
                            </td>
                            <td className="p-2.5 text-center">
                              <select
                                value={e.type}
                                onChange={(ev) =>
                                  setRfidEntries((prev) =>
                                    prev.map((x) => (x.rfidCard === e.rfidCard ? { ...x, type: ev.target.value } : x))
                                  )
                                }
                                className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[10px] text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--brand)]"
                              >
                                <option>Admin</option>
                                <option>Faculty</option>
                                <option>Staff</option>
                              </select>
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() =>
                                  setRfidEntries((prev) =>
                                    prev.map((x) => (x.rfidCard === e.rfidCard ? { ...x, assigned: !x.assigned } : x))
                                  )
                                }
                                className={`text-[9px] px-2.5 py-1 rounded-full font-semibold cursor-pointer border transition-all duration-200 ${
                                  e.assigned
                                    ? 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white'
                                    : 'bg-[var(--red-light)] border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white'
                                }`}
                              >
                                {e.assigned ? (isBn ? 'বরাদ্ধ' : 'Assigned') : isBn ? 'অবরাদ্ধ' : 'Unassigned'}
                              </button>
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() =>
                                    setRfidEntries((prev) =>
                                      prev.map((x) =>
                                        x.rfidCard === e.rfidCard
                                          ? {
                                              ...x,
                                              rfidCard: `CARD-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                                            }
                                          : x
                                      )
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-md bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-[9px] font-semibold cursor-pointer hover:bg-[var(--brand)] hover:text-white transition-all"
                                >
                                  {isBn ? 'রি-অ্যাসাইন' : 'Re-assign'}
                                </button>
                                <button
                                  onClick={() => setRfidEntries((prev) => prev.filter((x) => x.rfidCard !== e.rfidCard))}
                                  className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[9px] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                                >
                                  {isBn ? 'মুছুন' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {rfidEntries.filter(
                        (e) =>
                          !rfidSearch || e.staffName.toLowerCase().includes(rfidSearch.toLowerCase()) || e.rfidCard.includes(rfidSearch)
                      ).length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] text-[12px]">
                            {isBn ? 'কোনো কার্ড পাওয়া যায়নি' : 'No cards found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ===== Fingerprint ===== */}
          {deviceTab === 'fingerprint' && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {[
                  {
                    label: isBn ? 'মোট' : 'Total',
                    value: fpEntries.length,
                    icon: <Fingerprint size={15} />,
                    color: 'var(--amber)',
                  },
                  {
                    label: isBn ? 'এনরোলড' : 'Enrolled',
                    value: fpEntries.filter((e) => e.status === 'enrolled').length,
                    icon: <CheckCircle size={15} />,
                    color: 'var(--green)',
                  },
                  {
                    label: isBn ? 'বকেয়' : 'Pending',
                    value: fpEntries.filter((e) => e.status === 'pending').length,
                    icon: <Clock size={15} />,
                    color: 'var(--amber)',
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] hover:shadow-md transition-all"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${s.color}15`, color: s.color }}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-[16px] font-bold" style={{ color: s.color }}>
                        {s.value}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[6px] flex-1 max-w-[300px]">
                  <Search size={13} className="text-[var(--text-muted)]" />
                  <input
                    value={fpSearch}
                    onChange={(e) => setFpSearch(e.target.value)}
                    placeholder={isBn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
                    className="flex-1 border-none bg-transparent outline-none text-[12px] text-[var(--text-primary)]"
                  />
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {fpEntries.filter((e) => !fpSearch || e.staffName.toLowerCase().includes(fpSearch.toLowerCase())).length}{' '}
                  {isBn ? 'টি ফলাফল' : 'results'}
                </span>
              </div>
              {/* Table */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-auto max-h-[55vh]">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[35px]">#</th>
                        <th className="p-2.5 text-left text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'স্টাফ আইডি' : 'Staff ID'}
                        </th>
                        <th className="p-2.5 text-left text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'FP আইডি' : 'FP ID'}
                        </th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'টেমপ্লেট' : 'Templates'}
                        </th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অবস্থা' : 'Status'}
                        </th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অ্যাকশন' : 'Action'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fpEntries
                        .filter((e) => !fpSearch || e.staffName.toLowerCase().includes(fpSearch.toLowerCase()))
                        .map((e, i) => (
                          <tr
                            key={e.staffId}
                            className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                            <td className="p-2.5 font-mono font-semibold text-[var(--brand)]">{e.staffId}</td>
                            <td className="p-2.5 text-[var(--text-primary)] font-medium">{e.staffName}</td>
                            <td className="p-2.5 text-center font-mono text-[var(--text-primary)]">{e.fpId}</td>
                            <td className="p-2.5 text-center">
                              <div className="flex gap-1 justify-center">
                                {Array.from({ length: 2 }).map((_, si) => (
                                  <span
                                    key={si}
                                    className={`w-3.5 h-3.5 rounded-md ${si < e.templates ? 'bg-[var(--green)] shadow-sm' : 'bg-[var(--border)]'}`}
                                  ></span>
                                ))}
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`text-[9px] px-2.5 py-1 rounded-full font-semibold ${
                                  e.status === 'enrolled'
                                    ? 'bg-[var(--green-light)] text-[var(--green)]'
                                    : e.status === 'pending'
                                      ? 'bg-[var(--amber-light)] text-[var(--amber)]'
                                      : 'bg-[var(--red-light)] text-[var(--red)]'
                                }`}
                              >
                                {e.status === 'enrolled'
                                  ? isBn
                                    ? 'এনরোলড'
                                    : 'Enrolled'
                                  : e.status === 'pending'
                                    ? isBn
                                      ? 'বকেয়'
                                      : 'Pending'
                                    : isBn
                                      ? 'ব্যর্থ'
                                      : 'Failed'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => {
                                    setFpEntries((prev) =>
                                      prev.map((x) =>
                                        x.staffId === e.staffId
                                          ? {
                                              ...x,
                                              status: 'pending' as const,
                                              templates: 0,
                                            }
                                          : x
                                      )
                                    )
                                    setTimeout(
                                      () =>
                                        setFpEntries((prev) =>
                                          prev.map((x) =>
                                            x.staffId === e.staffId
                                              ? {
                                                  ...x,
                                                  status: 'enrolled' as const,
                                                  templates: Math.floor(Math.random() * 2) + 1,
                                                }
                                              : x
                                          )
                                        ),
                                      2000
                                    )
                                  }}
                                  disabled={e.status === 'pending'}
                                  className={`px-2.5 py-1 rounded-md text-[9px] font-semibold cursor-pointer border transition-all duration-200 ${
                                    e.status === 'pending'
                                      ? 'bg-[var(--amber-light)] border-[var(--amber)] text-[var(--amber)] animate-pulse cursor-wait'
                                      : 'bg-[var(--amber-light)] border-[var(--amber)] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-white hover:shadow-md'
                                  }`}
                                >
                                  {e.status === 'pending' ? (isBn ? 'এনরোল হচ্ছে...' : 'Enrolling...') : isBn ? 'রি-এনরোল' : 'Re-enroll'}
                                </button>
                                <button
                                  onClick={() => setFpEntries((prev) => prev.filter((x) => x.staffId !== e.staffId))}
                                  className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[9px] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                                >
                                  {isBn ? 'মুছুন' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {fpEntries.filter((e) => !fpSearch || e.staffName.toLowerCase().includes(fpSearch.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] text-[12px]">
                            {isBn ? 'কোনো এনরোলমেন্ট পাওয়া যায়নি' : 'No enrollments found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ===== Face Scan ===== */}
          {deviceTab === 'face' && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {[
                  {
                    label: isBn ? 'মোট' : 'Total',
                    value: faceEntries.length,
                    icon: <ScanFace size={15} />,
                    color: 'var(--green)',
                  },
                  {
                    label: isBn ? 'এনরোলড' : 'Enrolled',
                    value: faceEntries.filter((e) => e.status === 'enrolled').length,
                    icon: <CheckCircle size={15} />,
                    color: 'var(--green)',
                  },
                  {
                    label: isBn ? 'গড কোয়ালিটি' : 'Good Quality',
                    value: faceEntries.filter((e) => e.quality >= 80).length,
                    icon: <Fingerprint size={15} />,
                    color: 'var(--brand)',
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] hover:shadow-md transition-all"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${s.color}15`, color: s.color }}
                    >
                      {s.icon}
                    </div>
                    <div>
                      <div className="text-[16px] font-bold" style={{ color: s.color }}>
                        {s.value}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[6px] flex-1 max-w-[300px]">
                  <Search size={13} className="text-[var(--text-muted)]" />
                  <input
                    value={faceSearch}
                    onChange={(e) => setFaceSearch(e.target.value)}
                    placeholder={isBn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
                    className="flex-1 border-none bg-transparent outline-none text-[12px] text-[var(--text-primary)]"
                  />
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {faceEntries.filter((e) => !faceSearch || e.staffName.toLowerCase().includes(faceSearch.toLowerCase())).length}{' '}
                  {isBn ? 'টি ফলাফল' : 'results'}
                </span>
              </div>
              {/* Table */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-auto max-h-[55vh]">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[35px]">#</th>
                        <th className="p-2.5 text-left text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'স্টাফ আইডি' : 'Staff ID'}
                        </th>
                        <th className="p-2.5 text-left text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'ফেস আইডি' : 'Face ID'}
                        </th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'কোয়ালিটি' : 'Quality'}
                        </th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অবস্থা' : 'Status'}
                        </th>
                        <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অ্যাকশন' : 'Action'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {faceEntries
                        .filter((e) => !faceSearch || e.staffName.toLowerCase().includes(faceSearch.toLowerCase()))
                        .map((e, i) => (
                          <tr
                            key={e.staffId}
                            className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                            <td className="p-2.5 font-mono font-semibold text-[var(--brand)]">{e.staffId}</td>
                            <td className="p-2.5 text-[var(--text-primary)] font-medium">{e.staffName}</td>
                            <td className="p-2.5 text-center font-mono text-[var(--text-primary)]">{e.faceId}</td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center gap-1.5 justify-center">
                                <div className="w-20 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                      width: `${e.quality}%`,
                                      background: e.quality >= 80 ? 'var(--green)' : e.quality >= 60 ? 'var(--amber)' : 'var(--red)',
                                    }}
                                  ></div>
                                </div>
                                <span
                                  className="text-[9px] font-bold tabular-nums"
                                  style={{
                                    color: e.quality >= 80 ? 'var(--green)' : e.quality >= 60 ? 'var(--amber)' : 'var(--red)',
                                  }}
                                >
                                  {e.quality}%
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`text-[9px] px-2.5 py-1 rounded-full font-semibold ${
                                  e.status === 'enrolled'
                                    ? 'bg-[var(--green-light)] text-[var(--green)]'
                                    : e.status === 'pending'
                                      ? 'bg-[var(--amber-light)] text-[var(--amber)]'
                                      : 'bg-[var(--red-light)] text-[var(--red)]'
                                }`}
                              >
                                {e.status === 'enrolled'
                                  ? isBn
                                    ? 'এনরোলড'
                                    : 'Enrolled'
                                  : e.status === 'pending'
                                    ? isBn
                                      ? 'বকেয়'
                                      : 'Pending'
                                    : isBn
                                      ? 'ব্যর্থ'
                                      : 'Failed'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => {
                                    setFaceEntries((prev) =>
                                      prev.map((x) =>
                                        x.staffId === e.staffId
                                          ? {
                                              ...x,
                                              status: 'pending' as const,
                                              quality: 0,
                                            }
                                          : x
                                      )
                                    )
                                    setTimeout(
                                      () =>
                                        setFaceEntries((prev) =>
                                          prev.map((x) =>
                                            x.staffId === e.staffId
                                              ? {
                                                  ...x,
                                                  status: 'enrolled' as const,
                                                  quality: Math.floor(Math.random() * 30) + 70,
                                                }
                                              : x
                                          )
                                        ),
                                      2000
                                    )
                                  }}
                                  disabled={e.status === 'pending'}
                                  className={`px-2.5 py-1 rounded-md text-[9px] font-semibold cursor-pointer border transition-all duration-200 ${
                                    e.status === 'pending'
                                      ? 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] animate-pulse cursor-wait'
                                      : 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white hover:shadow-md'
                                  }`}
                                >
                                  {e.status === 'pending' ? (isBn ? 'স্ক্যান হচ্ছে...' : 'Scanning...') : isBn ? 'রি-স্ক্যান' : 'Re-scan'}
                                </button>
                                <button
                                  onClick={() => setFaceEntries((prev) => prev.filter((x) => x.staffId !== e.staffId))}
                                  className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[9px] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                                >
                                  {isBn ? 'মুছুন' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {faceEntries.filter((e) => !faceSearch || e.staffName.toLowerCase().includes(faceSearch.toLowerCase())).length ===
                        0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] text-[12px]">
                            {isBn ? 'কোনো ফেস ডেটা পাওয়া যায়নি' : 'No face data found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ===== Mobile WebAuthn ===== */}
          {deviceTab === 'mobile' && (
            <>
              {/* WiFi Settings Bar */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi size={14} className="text-[var(--teal)]" />
                    <span className="text-[12px] font-medium text-[var(--text-primary)]">
                      {isBn ? 'নেটওয়ার্ক সেটিংস' : 'Network Settings'}
                    </span>
                    {institutionGateway && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${wifiConnected === true ? 'bg-[var(--green-light)] text-[var(--green)]' : wifiConnected === false ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}
                      >
                        {wifiConnected === true
                          ? isBn
                            ? 'সংযুক্ত'
                            : 'Connected'
                          : wifiConnected === false
                            ? isBn
                              ? 'সংযুক্ত নয়'
                              : 'Disconnected'
                            : isBn
                              ? 'পরীক্ষাধীন'
                              : 'Checking...'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowWifiSettings(!showWifiSettings)}
                    className="text-[11px] text-[var(--teal)] cursor-pointer bg-transparent border-none font-[inherit] font-medium"
                  >
                    {showWifiSettings ? (isBn ? 'বন্ধ করুন' : 'Close') : isBn ? 'সেটিংস' : 'Settings'}
                  </button>
                </div>
                {showWifiSettings && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                    <div>
                      <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1 block">
                        {isBn ? 'WiFi নেটওয়ার্কের নাম' : 'WiFi Network Name (SSID)'}
                      </label>
                      <input
                        value={institutionWifi}
                        onChange={(e) => setInstitutionWifi(e.target.value)}
                        placeholder="e.g. Institution-Guest"
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[var(--text-muted)] mb-1 block">
                        {isBn ? 'গেটওয়ে IP (ঐচ্ছিক)' : 'Gateway IP (Optional)'}
                      </label>
                      <input
                        value={institutionGateway}
                        onChange={(e) => setInstitutionGateway(e.target.value)}
                        placeholder="e.g. 192.168.1.1"
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-primary)] font-mono outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveWifiSettings}
                        className="px-3 py-1.5 rounded-lg bg-[var(--teal)] text-white text-[11px] font-medium cursor-pointer border-none"
                      >
                        {isBn ? 'সংরক্ষণ' : 'Save'}
                      </button>
                      <button
                        onClick={async () => {
                          setWifiChecking(true)
                          const r = await checkInstitutionNetwork()
                          setWifiConnected(r.onNetwork)
                          setWifiChecking(false)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[11px] cursor-pointer"
                      >
                        {wifiChecking ? (isBn ? 'পরীক্ষা হচ্ছে...' : 'Checking...') : isBn ? 'পরীক্ষা করুন' : 'Test Connection'}
                      </button>
                    </div>
                    <div className="text-[9px] text-[var(--text-muted)]">
                      {isBn
                        ? 'গেটওয়ে IP সেট করলে স্টাফদের প্রতিষ্ঠানের WiFi নেটওয়ার্কে থাকতে হবে।'
                        : 'With gateway IP set, staff must be on institution WiFi network to check in.'}
                    </div>
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setAuthMode('personal')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${authMode === 'personal' ? 'border-[var(--teal)] bg-[var(--teal-light)]' : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--teal)]'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${authMode === 'personal' ? 'bg-[var(--teal)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--teal)]'}`}
                    >
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                        {isBn ? 'ব্যক্তিগত ফোন' : 'Personal Phone'}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">{isBn ? 'নিজের ফোনে চেক ইন' : 'Check in on own phone'}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {isBn
                      ? 'স্টাফ নিজের ফোনে ফিঙ্গারপ্রিন্ট দিয়ে চেক ইন করে। WiFi যাচাই সহ।'
                      : 'Staff authenticates on own device. WiFi verification included.'}
                  </div>
                </button>
                <button
                  onClick={() => {
                    setAuthMode('kiosk')
                    setKioskMode(true)
                  }}
                  className="p-4 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] text-left transition-all hover:border-[var(--green)]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--green)]">
                      <Layers size={16} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--text-primary)]">{isBn ? 'কিওস্ক মোড' : 'Kiosk Mode'}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{isBn ? 'শেয়ার্ড ডিভাইস' : 'Shared device at gate'}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {isBn
                      ? 'একটি ফোন গেটে রাখুন। সবাই সেখানে আঙুল দিয়ে চেক ইন করবে।'
                      : 'Place one phone at gate. All staff authenticate there.'}
                  </div>
                </button>
              </div>

              {/* Personal Mode Content */}
              {authMode === 'personal' && (
                <>
                  {/* Info Banner */}
                  <div className="bg-[var(--teal-light)] border border-[var(--teal)] rounded-xl p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Wifi size={16} className="text-[var(--teal)] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[12px] font-semibold text-[var(--teal)]">
                          {isBn ? 'ব্যক্তিগত ডিভাইস মোড' : 'Personal Device Mode'}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          {isBn
                            ? 'স্টাফরা তাদের নিজের ফোনে ফিঙ্গারপ্রিন্ট/ফেস আইডি দিয়ে চেক-ইন/আউট করবে। WiFi সংযোগ যাচাই করা হয়।'
                            : 'Staff check in/out using their own phone biometric. WiFi connection is verified.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {[
                      {
                        label: isBn ? 'নিবন্ধিত' : 'Registered',
                        value: mobileDevices.length,
                        icon: <Wifi size={15} />,
                        color: 'var(--teal)',
                      },
                      {
                        label: isBn ? 'আজ চেক-ইন' : 'Today',
                        value: mobileDevices.filter((d) => d.lastAuth?.startsWith(date)).length,
                        icon: <CheckCircle size={15} />,
                        color: 'var(--green)',
                      },
                      {
                        label: isBn ? 'সক্রিয়' : 'Active',
                        value: mobileDevices.filter((d) => d.lastAuth).length,
                        icon: <Clock size={15} />,
                        color: 'var(--brand)',
                      },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)]"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: `${s.color}15`, color: s.color }}
                        >
                          {s.icon}
                        </div>
                        <div>
                          <div className="text-[16px] font-bold" style={{ color: s.color }}>
                            {s.value}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message */}
                  {mobileAuthMsg && (
                    <div
                      className={`mb-3 py-2 px-3 rounded-lg text-[12px] font-medium flex items-center gap-2 ${mobileAuthMsg.type === 'success' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}
                    >
                      {mobileAuthMsg.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {mobileAuthMsg.text}
                      <button
                        onClick={() => setMobileAuthMsg(null)}
                        className="ml-auto bg-transparent border-none cursor-pointer text-[inherit]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Register + Auth Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {/* Register Device */}
                    <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-primary)]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
                          <Wifi size={15} className="text-[var(--teal)]" />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                            {isBn ? 'ডিভাইস নিবন্ধন' : 'Register Device'}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {isBn ? 'ফিঙ্গারপ্রিন্ট/ফেস দিয়ে নিবন্ধন' : 'Register with biometric'}
                          </div>
                        </div>
                      </div>
                      <select
                        value={mobileRegStaff}
                        onChange={(e) => setMobileRegStaff(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--text-primary)] outline-none mb-2"
                      >
                        <option value="">{isBn ? 'স্টাফ নির্বাচন করুন...' : 'Select staff...'}</option>
                        {activeTeachers
                          .filter((t) => !mobileDevices.find((d) => d.staffId === t.id))
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {isBn ? t.nameBn || t.nameEn : t.nameEn} ({t.id})
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={handleRegisterDevice}
                        disabled={!mobileRegStaff || mobileRegPending}
                        className={`w-full py-2 rounded-lg text-[12px] font-semibold cursor-pointer border-none transition-all ${mobileRegPending ? 'bg-[var(--amber-light)] text-[var(--amber)] animate-pulse' : mobileRegStaff ? 'bg-[var(--teal)] text-white hover:shadow-md' : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'}`}
                      >
                        {mobileRegPending ? (isBn ? 'নিবন্ধন হচ্ছে...' : 'Registering...') : isBn ? 'নিবন্ধন করুন' : 'Register Now'}
                      </button>
                    </div>

                    {/* Check In */}
                    <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-primary)]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--green-light)] flex items-center justify-center">
                          <CheckCircle size={15} className="text-[var(--green)]" />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                            {isBn ? 'চেক-ইন / আউট' : 'Check In / Out'}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {isBn ? 'বায়োমেট্রিক + WiFi' : 'Biometric + WiFi verified'}
                          </div>
                        </div>
                      </div>
                      <select
                        value={mobileAuthStaff}
                        onChange={(e) => setMobileAuthStaff(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--text-primary)] outline-none mb-2"
                      >
                        <option value="">{isBn ? 'নিবন্ধিত স্টাফ...' : 'Registered staff...'}</option>
                        {mobileDevices.map((d) => (
                          <option key={d.staffId} value={d.staffId}>
                            {d.staffName} ({d.staffId})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleMobileAuth}
                        disabled={!mobileAuthStaff || mobileAuthPending || wifiChecking}
                        className={`w-full py-2 rounded-lg text-[12px] font-semibold cursor-pointer border-none transition-all ${mobileAuthPending || wifiChecking ? 'bg-[var(--amber-light)] text-[var(--amber)] animate-pulse' : mobileAuthStaff ? 'bg-[var(--green)] text-white hover:shadow-md' : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'}`}
                      >
                        {wifiChecking
                          ? isBn
                            ? 'ওয়াইফাই যাচাই...'
                            : 'Checking WiFi...'
                          : mobileAuthPending
                            ? isBn
                              ? 'প্রমাণীকরণ...'
                              : 'Authenticating...'
                            : isBn
                              ? 'বায়োমেট্রিক চেক'
                              : 'Biometric Check'}
                      </button>
                    </div>
                  </div>

                  {/* Devices List */}
                  <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                      <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                        {isBn ? 'নিবন্ধিত ডিভাইস' : 'Registered Devices'} ({mobileDevices.length})
                      </div>
                      <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-[5px]">
                        <Search size={12} className="text-[var(--text-muted)]" />
                        <input
                          value={mobileSearch}
                          onChange={(e) => setMobileSearch(e.target.value)}
                          placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
                          className="flex-1 border-none bg-transparent outline-none text-[11px] text-[var(--text-primary)] w-[100px]"
                        />
                      </div>
                    </div>
                    <div className="overflow-auto max-h-[35vh]">
                      <table className="w-full border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                            <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[35px]">#</th>
                            <th className="p-2.5 text-left text-[10px] font-semibold text-[var(--text-muted)]">
                              {isBn ? 'স্টাফ' : 'Staff'}
                            </th>
                            <th className="p-2.5 text-left text-[10px] font-semibold text-[var(--text-muted)]">
                              {isBn ? 'ডিভাইস' : 'Device'}
                            </th>
                            <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                              {isBn ? 'শেষ ব্যবহার' : 'Last Used'}
                            </th>
                            <th className="p-2.5 text-center text-[10px] font-semibold text-[var(--text-muted)]">
                              {isBn ? 'অ্যাকশন' : 'Action'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {mobileDevices
                            .filter(
                              (d) =>
                                !mobileSearch ||
                                d.staffName.toLowerCase().includes(mobileSearch.toLowerCase()) ||
                                d.staffId.toLowerCase().includes(mobileSearch.toLowerCase())
                            )
                            .map((d, i) => (
                              <tr
                                key={d.id}
                                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                              >
                                <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                                <td className="p-2.5">
                                  <div className="font-medium text-[var(--text-primary)]">{d.staffName}</div>
                                  <div className="text-[10px] text-[var(--text-muted)]">{d.staffId}</div>
                                </td>
                                <td className="p-2.5">
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--teal-light)] text-[var(--teal)] font-medium">
                                    {d.deviceName}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center text-[10px] text-[var(--text-muted)]">
                                  {d.lastAuth ? (
                                    new Date(d.lastAuth).toLocaleString()
                                  ) : (
                                    <span className="text-[var(--amber)]">{isBn ? 'নতুন' : 'New'}</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    onClick={() => removeMobileDevice(d.id)}
                                    className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[9px] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                                  >
                                    {isBn ? 'মুছুন' : 'Remove'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {mobileDevices.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-[var(--text-muted)] text-[12px]">
                                {isBn ? 'কোনো ডিভাইস নিবন্ধিত নেই' : 'No devices registered'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Add Device Modal */}
          {showAddDevice && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[700] overflow-y-auto bg-black/50">
              <div className="modal-content bg-[var(--bg-primary)] rounded-[14px] max-w-[420px] w-full p-5 border border-[var(--border)]">
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'নতুন ডিভাইস যোগ করুন' : 'Add New Device'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'ডিভাইসের নাম' : 'Device Name'}
                    </label>
                    <input
                      value={newDevice.name}
                      onChange={(e) => setNewDevice((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Main Gate RFID"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'মডেল' : 'Model'}</label>
                    <input
                      value={newDevice.model}
                      onChange={(e) => setNewDevice((p) => ({ ...p, model: e.target.value }))}
                      placeholder="e.g. ZKTeco SLK200"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                      IP {isBn ? 'ঠিকানা' : 'Address'}
                    </label>
                    <input
                      value={newDevice.ip}
                      onChange={(e) => setNewDevice((p) => ({ ...p, ip: e.target.value }))}
                      placeholder="192.168.1.100"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--text-primary)] font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'ডিভাইস টাইপ' : 'Device Type'}
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { k: 'rfid' as const, l: 'RFID', I: CreditCard },
                        { k: 'fingerprint' as const, l: 'FP', I: Fingerprint },
                        { k: 'face' as const, l: 'Face', I: ScanFace },
                        { k: 'multi' as const, l: 'Multi', I: Layers },
                      ].map((o) => (
                        <button
                          key={o.k}
                          onClick={() => setNewDevice((p) => ({ ...p, type: o.k }))}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] cursor-pointer transition-all ${newDevice.type === o.k ? 'border-[#7C3AED] bg-[#7C3AED15] text-[#7C3AED] font-semibold' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
                        >
                          <o.I size={16} />
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => setShowAddDevice(false)}
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      if (newDevice.name && newDevice.ip) {
                        setDevices((p) => [
                          ...p,
                          {
                            id: `DEV-${String(p.length + 1).padStart(3, '0')}`,
                            name: newDevice.name,
                            model: newDevice.model,
                            ip: newDevice.ip,
                            status: 'offline',
                            type: newDevice.type,
                            lastSync: '',
                            staffCount: 0,
                          },
                        ])
                        setShowAddDevice(false)
                        setNewDevice({
                          name: '',
                          model: '',
                          ip: '',
                          type: 'rfid',
                        })
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#7C3AED] border-0 text-white text-[12px] font-semibold cursor-pointer"
                  >
                    {isBn ? 'যোগ করুন' : 'Add Device'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add RFID Modal */}
          {showAddRFID && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[700] overflow-y-auto bg-black/50">
              <div className="modal-content bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'RFID কার্ড যোগ করুন' : 'Add RFID Card'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'স্টাফ নির্বাচন করুন' : 'Select Staff'}
                    </label>
                    <select
                      value={newRFID.staffId}
                      onChange={(e) => setNewRFID((p) => ({ ...p, staffId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--text-secondary)] outline-none"
                    >
                      <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select...'}</option>
                      {activeTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} - {isBn ? t.nameBn || t.nameEn : t.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'কার্ড নম্বর (বা ট্যাপ করুন)' : 'Card Number (or tap)'}
                    </label>
                    <input
                      value={newRFID.rfidCard}
                      onChange={(e) => setNewRFID((p) => ({ ...p, rfidCard: e.target.value }))}
                      placeholder="CARD-XXXX"
                      className="w-full px-3 py-2 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--text-primary)] font-mono text-center outline-none focus:border-[var(--brand)]"
                    />
                    <p className="text-[9px] text-[var(--text-muted)] mt-1 text-center">
                      {isBn ? 'ডিভাইসে কার্ড ট্যাপ করুন অথবা ম্যানুয়ালি লিখুন' : 'Tap card on device or enter manually'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => setShowAddRFID(false)}
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      if (newRFID.staffId && newRFID.rfidCard) {
                        const t = activeTeachers.find((te) => te.id === newRFID.staffId)
                        if (t)
                          setRfidEntries((p) => [
                            ...p,
                            {
                              staffId: t.id,
                              staffName: isBn ? t.nameBn || t.nameEn : t.nameEn,
                              rfidCard: newRFID.rfidCard,
                              type: 'Staff',
                              assigned: true,
                            },
                          ])
                        setShowAddRFID(false)
                        setNewRFID({ staffId: '', rfidCard: '' })
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[var(--brand)] border-0 text-white text-[12px] font-semibold cursor-pointer"
                  >
                    {isBn ? 'যোগ করুন' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Fingerprint Modal */}
          {showAddFP && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[700] overflow-y-auto bg-black/50">
              <div className="modal-content bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'ফিঙ্গারপ্রিন্ট এনরোলমেন্ট' : 'Fingerprint Enrollment'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'স্টাফ নির্বাচন করুন' : 'Select Staff'}
                    </label>
                    <select
                      value={newFP.staffId}
                      onChange={(e) => setNewFP((p) => ({ ...p, staffId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--text-secondary)] outline-none"
                    >
                      <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select...'}</option>
                      {activeTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} - {isBn ? t.nameBn || t.nameEn : t.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
                    <Fingerprint size={40} className="mx-auto mb-2 text-[var(--amber)]" />
                    <p className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'ডিভাইসে আঙুল রাখুন' : 'Place finger on device'}</p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-1">{isBn ? '২ বার আঙুল রাখুন' : 'Tap finger twice'}</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => setShowAddFP(false)}
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      if (newFP.staffId) {
                        const t = activeTeachers.find((te) => te.id === newFP.staffId)
                        if (t)
                          setFpEntries((p) => [
                            ...p,
                            {
                              staffId: t.id,
                              staffName: isBn ? t.nameBn || t.nameEn : t.nameEn,
                              fpId: p.length + 1,
                              templates: 0,
                              status: 'pending',
                            },
                          ])
                        setShowAddFP(false)
                        setNewFP({ staffId: '' })
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[var(--amber)] border-0 text-white text-[12px] font-semibold cursor-pointer"
                  >
                    {isBn ? 'এনরোল শুরু করুন' : 'Start Enrollment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Face Scan Modal */}
          {showAddFace && (
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[700] overflow-y-auto bg-black/50">
              <div className="modal-content bg-[var(--bg-primary)] rounded-[14px] max-w-[380px] w-full p-5 border border-[var(--border)]">
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'ফেস স্ক্যান এনরোলমেন্ট' : 'Face Scan Enrollment'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'স্টাফ নির্বাচন করুন' : 'Select Staff'}
                    </label>
                    <select
                      value={newFace.staffId}
                      onChange={(e) => setNewFace((p) => ({ ...p, staffId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[12px] text-[var(--text-secondary)] outline-none"
                    >
                      <option value="">{isBn ? 'নির্বাচন করুন...' : 'Select...'}</option>
                      {activeTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id} - {isBn ? t.nameBn || t.nameEn : t.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
                    <ScanFace size={40} className="mx-auto mb-2 text-[var(--green)]" />
                    <p className="text-[11px] text-[var(--text-secondary)]">{isBn ? 'ক্যামেরায় মুখ দেখান' : 'Show face to camera'}</p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-1">{isBn ? '৩৬০° ঘুরে মুখ দেখান' : 'Rotate face 360°'}</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => setShowAddFace(false)}
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[12px] cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      if (newFace.staffId) {
                        const t = activeTeachers.find((te) => te.id === newFace.staffId)
                        if (t)
                          setFaceEntries((p) => [
                            ...p,
                            {
                              staffId: t.id,
                              staffName: isBn ? t.nameBn || t.nameEn : t.nameEn,
                              faceId: p.length + 1,
                              quality: 0,
                              status: 'pending',
                            },
                          ])
                        setShowAddFace(false)
                        setNewFace({ staffId: '' })
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[var(--green)] border-0 text-white text-[12px] font-semibold cursor-pointer"
                  >
                    {isBn ? 'স্ক্যান শুরু করুন' : 'Start Scan'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Kiosk Mode Modal */}
          {kioskMode && (
            <div
              className="fixed inset-0 flex items-center justify-center z-[800] bg-[var(--bg-primary)] sm:bg-black/80 sm:p-4 overflow-y-auto"
              style={{ height: '100dvh' }}
            >
              <div className="bg-[var(--bg-primary)] rounded-none sm:rounded-2xl w-full sm:max-w-[420px] min-h-[100dvh] sm:min-h-0 sm:h-auto sm:my-auto p-5 sm:p-6 border-0 sm:border border-[var(--border)] shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--teal-light)] flex items-center justify-center">
                      <Wifi size={20} className="text-[var(--teal)]" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-[var(--text-primary)]">{isBn ? 'কিওস্ক মোড' : 'Kiosk Mode'}</h3>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {isBn ? 'শেয়ার্ড ডিভাইস হিসেবে ব্যবহার করুন' : 'Use as shared device'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setKioskMode(false)
                      setKioskMsg(null)
                      setKioskIdentified(null)
                    }}
                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* HTTPS warning */}
                {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                  <div className="mb-4 py-3 px-4 rounded-xl bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[12px] font-medium text-center">
                    <span className="font-bold">🔒 {isBn ? 'HTTPS প্রয়োজন!' : 'HTTPS Required!'}</span>
                    <br />
                    {isBn
                      ? 'বায়োমেট্রিক কাজ করতে https:// দিয়ে খুলুন। যেমন: https://192.168.0.188:5173'
                      : 'Open with https:// for biometric to work. E.g.: https://192.168.0.188:5173'}
                  </div>
                )}

                {kioskMsg && (
                  <div
                    className={`mb-4 py-3 px-4 rounded-xl text-center text-[14px] font-bold ${kioskMsg.type === 'success' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}
                  >
                    {kioskMsg.text}
                  </div>
                )}

                {/* Identified person display */}
                {kioskIdentified && (
                  <div className="mb-4 p-5 rounded-2xl bg-[var(--green-light)] border-2 border-[var(--green)] text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--green)] flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={32} className="text-white" />
                    </div>
                    <div className="text-[20px] font-bold text-[var(--green)]">{kioskIdentified.staffName}</div>
                    <div className="text-[12px] text-[var(--text-secondary)] font-mono mt-1">{kioskIdentified.staffId}</div>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-[13px] font-bold ${kioskIdentified.punchType === 'in' ? 'bg-[var(--green)] text-white' : 'bg-[var(--amber)] text-white'}`}
                      >
                        {kioskIdentified.punchType === 'in' ? (isBn ? 'চেক-ইন' : 'CHECKED IN') : isBn ? 'চেক-আউট' : 'CHECKED OUT'}
                      </span>
                      <span className="text-[22px] font-bold text-[var(--text-primary)] font-mono">{kioskIdentified.time}</span>
                    </div>
                  </div>
                )}

                {/* Camera view */}
                {kioskCamActive && !kioskIdentified && (
                  <div className="mb-4">
                    <div
                      className="relative rounded-2xl overflow-hidden bg-black w-full mb-3"
                      style={{ aspectRatio: '4/3', maxHeight: '50vh' }}
                    >
                      <video ref={kioskVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                      <canvas ref={kioskCanvasRef} className="hidden" />
                      <div className="absolute top-2 left-2 bg-black/60 rounded-lg px-2 py-1 text-white text-[10px] font-medium flex items-center gap-1.5 z-10">
                        <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
                        {isBn ? 'লাইভ' : 'LIVE'}
                      </div>
                      {/* Face guide grid overlay */}
                      {!kioskCapturedPhoto && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          {/* Grid lines */}
                          <div className="absolute inset-[15%] grid grid-cols-3 grid-rows-3">
                            {[...Array(9)].map((_, i) => (
                              <div
                                key={i}
                                className={`border ${kioskFaceDetected ? 'border-[var(--green)]/70' : 'border-white/30'} transition-colors duration-200`}
                              />
                            ))}
                          </div>
                          {/* Center oval guide */}
                          <div
                            className={`w-28 h-36 border-2 rounded-[50%] transition-all duration-300 ${
                              kioskFaceDetected ? 'border-[var(--green)] shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-white/50'
                            }`}
                          />
                          {/* Status label */}
                          <div
                            className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold ${
                              kioskFaceDetected ? 'bg-[var(--green)] text-white' : 'bg-black/60 text-white/70'
                            } transition-colors duration-200`}
                          >
                            {kioskFaceDetected
                              ? isBn
                                ? 'মুখ সনাক্ত হয়েছে — ধরুন...'
                                : 'Face detected — Hold...'
                              : isBn
                                ? 'মুখ গ্রিডে রাখুন'
                                : 'Position face in grid'}
                          </div>
                        </div>
                      )}
                    </div>
                    {kioskCapturedPhoto ? (
                      <div className="space-y-2">
                        <img
                          src={kioskCapturedPhoto}
                          alt=""
                          className="w-full max-w-[300px] mx-auto rounded-xl border-2 border-[var(--green)]"
                        />
                        <p className="text-[12px] text-center text-[var(--green)] font-medium">
                          {isBn ? 'ছবি তোলা হয়েছে — নাম নির্বাচন করুন' : 'Photo captured — Select your name below'}
                        </p>
                        <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto">
                          {kioskRegisteredFaces.map((f) => (
                            <div
                              key={f.staffId}
                              className="flex items-center gap-2 p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
                            >
                              <img
                                src={f.photo}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover border border-[var(--border)] shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-[12px] font-medium text-[var(--text-primary)] truncate">{f.staffName}</div>
                                <div className="text-[10px] text-[var(--text-muted)]">{f.staffId}</div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setKioskEditFace(f.staffId)
                                    setKioskCapturedPhoto(null)
                                    startKioskCamera()
                                  }}
                                  className="w-7 h-7 rounded-lg bg-[var(--brand-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--brand)]"
                                  title={isBn ? 'সম্পাদনা' : 'Edit'}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) handleKioskDeleteFace(f.staffId)
                                  }}
                                  className="w-7 h-7 rounded-lg bg-[var(--red-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--red)]"
                                  title={isBn ? 'মুছুন' : 'Delete'}
                                >
                                  <X size={12} />
                                </button>
                                <button
                                  onClick={() => handleKioskPunch(f.staffId, f.staffName)}
                                  className="px-2 py-1 rounded-lg bg-[var(--green)] border-0 text-white text-[10px] font-semibold cursor-pointer"
                                  title={isBn ? 'উপস্থিতি' : 'Punch'}
                                >
                                  {isBn ? 'পাঞ্চ' : 'Punch'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {kioskRegisteredFaces.length === 0 && (
                          <p className="text-[11px] text-center text-[var(--text-muted)]">
                            {isBn ? 'কোনো নিবন্ধিত স্টাফ নেই। প্রথমে নিবন্ধন করুন।' : 'No registered staff. Register first.'}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            setKioskCapturedPhoto(null)
                          }}
                          className="w-full py-2 rounded-lg text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border border-[var(--border)]"
                        >
                          {isBn ? 'আবার তুলুন' : 'Retake Photo'}
                        </button>
                      </div>
                    ) : (
                      <div className="w-full py-3 rounded-xl text-[14px] font-bold bg-[var(--teal-light)] text-[var(--teal)] text-center">
                        {kioskFaceDetected
                          ? isBn
                            ? 'মুখ সনাক্ত হয়েছে — ধরুন...'
                            : 'Face detected — Hold still...'
                          : isBn
                            ? 'মুখকে গ্রিডের মাঝখানে রাখুন'
                            : 'Center your face in the grid'}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        stopKioskCamera()
                        stopKioskDetectLoop()
                        setKioskCapturedPhoto(null)
                      }}
                      className="w-full mt-2 py-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none underline"
                    >
                      {isBn ? 'বন্ধ করুন' : 'Cancel'}
                    </button>
                  </div>
                )}

                {/* Scan prompt - main CTA */}
                {!kioskIdentified && !kioskCamActive && (
                  <div className="text-center mb-5">
                    <div className="w-24 h-24 rounded-full bg-[var(--teal-light)] border-2 border-[var(--teal)] flex items-center justify-center mx-auto mb-4">
                      <ScanFace size={44} className="text-[var(--teal)]" />
                    </div>
                    <p className="text-[16px] font-bold text-[var(--text-primary)]">{isBn ? 'ক্যামেরায় মুখ দেখান' : 'Show your face'}</p>
                    <p className="text-[12px] text-[var(--text-muted)] mt-1">
                      {isBn ? 'একবার ক্লিক করুন — গ্রিডে মুখ রাখলে অটো ছবি তোলবে' : 'One click — face in grid, photo auto-captured'}
                    </p>
                  </div>
                )}

                {/* Scan / Retry button */}
                {!kioskCamActive && !kioskIdentified && (
                  <button
                    onClick={handleKioskScan}
                    disabled={kioskPending}
                    className={`w-full py-4 rounded-xl text-[15px] font-bold cursor-pointer border-none transition-all ${kioskPending ? 'bg-[var(--amber-light)] text-[var(--amber)] animate-pulse' : 'bg-[var(--teal)] text-white hover:shadow-lg hover:scale-[1.02]'}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ScanFace size={18} />
                      {isBn ? 'ক্যামেরা খুলুন' : 'Open Camera'}
                    </span>
                  </button>
                )}

                {kioskIdentified && (
                  <button
                    onClick={() => {
                      setKioskIdentified(null)
                      setKioskMsg(null)
                    }}
                    className="w-full py-4 rounded-xl text-[15px] font-bold cursor-pointer border-none bg-[var(--teal)] text-white hover:shadow-lg hover:scale-[1.02] transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ScanFace size={18} />
                      {isBn ? 'আবার স্ক্যান করুন' : 'Scan Again'}
                    </span>
                  </button>
                )}

                {/* Registration section */}
                <div className="mt-4">
                  {!kioskRegMode ? (
                    <button
                      onClick={() => {
                        setKioskRegMode(true)
                        setKioskRegStaff('')
                        setKioskMsg(null)
                        setKioskCapturedPhoto(null)
                      }}
                      className="w-full py-3 rounded-xl text-[13px] font-semibold cursor-pointer border-2 border-dashed border-[var(--teal)] bg-transparent text-[var(--teal)] hover:bg-[var(--teal-light)] transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      {isBn ? 'নতুন স্টাফ নিবন্ধন করুন' : 'Register New Staff'}
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl border-2 border-[var(--teal)] bg-[var(--teal-light)]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[13px] font-bold text-[var(--teal)]">{isBn ? 'নিবন্ধন' : 'Registration'}</span>
                        <button
                          onClick={() => {
                            setKioskRegMode(false)
                            setKioskRegStaff('')
                            setKioskCapturedPhoto(null)
                            stopKioskCamera()
                          }}
                          className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none underline"
                        >
                          {isBn ? 'বাতিল' : 'Cancel'}
                        </button>
                      </div>
                      <select
                        value={kioskRegStaff}
                        onChange={(e) => {
                          setKioskRegStaff(e.target.value)
                          setKioskMsg(null)
                          setKioskCapturedPhoto(null)
                        }}
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[13px] text-[var(--text-primary)] outline-none mb-3"
                      >
                        <option value="">{isBn ? 'স্টাফ নির্বাচন করুন...' : 'Select staff...'}</option>
                        {activeTeachers.map((t) => {
                          const registered = kioskRegisteredFaces.find((f) => f.staffId === t.id)
                          return (
                            <option key={t.id} value={t.id}>
                              {isBn ? t.nameBn || t.nameEn : t.nameEn} ({t.id}){registered ? ' ✓' : ''}
                            </option>
                          )
                        })}
                      </select>
                      {kioskRegStaff && (
                        <>
                          {kioskCamActive ? (
                            <div className="space-y-3">
                              <div
                                className="relative rounded-2xl overflow-hidden bg-black w-full"
                                style={{
                                  aspectRatio: '4/3',
                                  maxHeight: '40vh',
                                }}
                              >
                                <video
                                  ref={kioskVideoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <canvas ref={kioskCanvasRef} className="hidden" />
                                <div className="absolute top-2 left-2 bg-black/60 rounded-lg px-2 py-1 text-white text-[9px] flex items-center gap-1 z-10">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                                  LIVE
                                </div>
                                {!kioskCapturedPhoto && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                    <div className="absolute inset-[15%] grid grid-cols-3 grid-rows-3">
                                      {[...Array(9)].map((_, i) => (
                                        <div
                                          key={i}
                                          className={`border ${kioskFaceDetected ? 'border-[var(--green)]/70' : 'border-white/30'} transition-colors duration-200`}
                                        />
                                      ))}
                                    </div>
                                    <div
                                      className={`w-24 h-32 border-2 rounded-[50%] transition-all duration-300 ${
                                        kioskFaceDetected
                                          ? 'border-[var(--green)] shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                                          : 'border-white/50'
                                      }`}
                                    />
                                    <div
                                      className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold ${
                                        kioskFaceDetected ? 'bg-[var(--green)] text-white' : 'bg-black/60 text-white/70'
                                      } transition-colors duration-200`}
                                    >
                                      {kioskFaceDetected
                                        ? isBn
                                          ? 'মুখ সনাক্ত হয়েছে — ধরুন...'
                                          : 'Face detected — Hold...'
                                        : isBn
                                          ? 'মুখ গ্রিডে রাখুন'
                                          : 'Position face in grid'}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {kioskCapturedPhoto ? (
                                <div className="space-y-2">
                                  <img
                                    src={kioskCapturedPhoto}
                                    alt=""
                                    className="w-full max-w-[280px] mx-auto rounded-xl border-2 border-[var(--green)]"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setKioskCapturedPhoto(null)
                                        startKioskDetectLoop()
                                      }}
                                      className="flex-1 py-2 rounded-lg text-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer"
                                    >
                                      {isBn ? 'আবার' : 'Retake'}
                                    </button>
                                    <button
                                      onClick={kioskEditFace ? () => handleKioskUpdateFace(kioskEditFace) : handleKioskRegister}
                                      className="flex-1 py-2 rounded-lg text-[12px] bg-[var(--green)] text-white border-none font-semibold cursor-pointer"
                                    >
                                      {kioskEditFace ? (isBn ? 'আপডেট' : 'Update') : isBn ? 'নিবন্ধন করুন' : 'Register'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full py-2.5 rounded-xl text-[13px] font-bold bg-[var(--teal-light)] text-[var(--teal)] text-center">
                                  {kioskFaceDetected
                                    ? isBn
                                      ? 'মুখ সনাক্ত হয়েছে — ধরুন...'
                                      : 'Face detected — Hold still...'
                                    : isBn
                                      ? 'মুখকে গ্রিডের মাঝখানে রাখুন'
                                      : 'Center your face in the grid'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={startKioskCamera}
                              className="w-full py-3 rounded-xl text-[13px] font-bold bg-[var(--teal)] text-white border-none cursor-pointer flex items-center justify-center gap-2"
                            >
                              <ScanFace size={16} />
                              {isBn ? 'ক্যামেরা খুলুন' : 'Open Camera'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* WiFi check */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  {wifiConnected === true ? (
                    <span className="text-[10px] text-[var(--green)] flex items-center gap-1">
                      <Wifi size={12} />
                      {isBn ? 'নেটওয়ার্ক সংযুক্ত' : 'Network connected'}
                    </span>
                  ) : wifiConnected === false ? (
                    <span className="text-[10px] text-[var(--red)] flex items-center gap-1">
                      <WifiOff size={12} />
                      {isBn ? 'নেটওয়ার্ক সংযোগ নেই' : 'No network'}
                    </span>
                  ) : null}
                </div>

                {/* Registered Staff Table */}
                {kioskRegisteredFaces.length > 0 && (
                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] font-bold text-[var(--text-primary)]">
                        {isBn ? `নিবন্ধিত স্টাফ (${kioskRegisteredFaces.length})` : `Registered Staff (${kioskRegisteredFaces.length})`}
                      </span>
                    </div>
                    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                            <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[40px]">#</th>
                            <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[44px]"></th>
                            <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                            <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)]">{isBn ? 'আইডি' : 'ID'}</th>
                            <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[100px]">
                              {isBn ? 'অ্যাকশন' : 'Actions'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {kioskRegisteredFaces.map((f, i) => (
                            <tr
                              key={f.staffId}
                              className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                              <td className="p-2 text-center text-[var(--text-muted)]">{i + 1}</td>
                              <td className="p-2 text-center">
                                <img
                                  src={f.photo}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-[var(--border)] mx-auto"
                                />
                              </td>
                              <td className="p-2 font-medium text-[var(--text-primary)]">{f.staffName}</td>
                              <td className="p-2 text-[var(--text-muted)] font-mono">{f.staffId}</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleKioskPunch(f.staffId, f.staffName)}
                                    className="px-2 py-1 rounded-md bg-[var(--green)] text-white text-[10px] font-semibold cursor-pointer border-none"
                                    title={isBn ? 'পাঞ্চ' : 'Punch'}
                                  >
                                    {isBn ? 'পাঞ্চ' : 'Punch'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setKioskEditFace(f.staffId)
                                      setKioskCapturedPhoto(null)
                                      startKioskCamera()
                                    }}
                                    className="w-6 h-6 rounded-md bg-[var(--brand-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--brand)]"
                                    title={isBn ? 'সম্পাদনা' : 'Edit'}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) handleKioskDeleteFace(f.staffId)
                                    }}
                                    className="w-6 h-6 rounded-md bg-[var(--red-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--red)]"
                                    title={isBn ? 'মুছুন' : 'Delete'}
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Stats footer */}
                <div className="mt-3 text-center text-[10px] text-[var(--text-muted)]">
                  {isBn
                    ? `মোট স্টাফ: ${activeTeachers.length} · নিবন্ধিত: ${kioskRegisteredFaces.length}`
                    : `Total staff: ${activeTeachers.length} · Registered: ${kioskRegisteredFaces.length}`}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== TAB: STUDENT ==================== */}
      {activeTab === 'student' && (
        <>
          <div className="flex items-center justify-between mb-[10px] flex-wrap gap-[10px]">
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] text-[var(--text-secondary)]">
                {isBn ? `মোট ${filteredStudents.length} জন শিক্ষার্থী` : `${filteredStudents.length} students`}
              </span>
              {selectedStudents.length > 0 && (
                <span className="text-[11px] text-[var(--brand)] bg-[var(--brand-light)] px-2.5 py-[3px] rounded-[6px] font-medium">
                  {selectedStudents.length} {isBn ? 'নির্বাচিত' : 'selected'}
                </span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={exportStudentExcel}
                className="flex items-center gap-[5px] px-3 py-[7px] rounded-lg bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[12px] cursor-pointer font-medium"
              >
                <FileSpreadsheet size={13} />
                Excel
              </button>
              <button
                onClick={() => setShowStudentPDF(true)}
                disabled={selectedStudents.length === 0}
                className={`flex items-center gap-[5px] px-3 py-[7px] rounded-lg text-[12px] font-medium ${
                  selectedStudents.length === 0
                    ? 'bg-[var(--border-2)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                    : 'bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] cursor-pointer'
                }`}
              >
                <FileText size={13} />
                PDF {selectedStudents.length > 0 && `(${selectedStudents.length})`}
              </button>
            </div>
          </div>
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[14px] overflow-hidden">
            <div className="overflow-auto max-h-[65vh]">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[36px]">
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudents.includes(s.id))}
                        onChange={() => {
                          if (filteredStudents.every((s) => selectedStudents.includes(s.id))) setSelectedStudents([])
                          else setSelectedStudents(filteredStudents.map((s) => s.id))
                        }}
                        className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                      />
                    </th>
                    <th className="p-2 text-center text-[10px] font-semibold text-[var(--text-muted)] w-[36px]"></th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[140px]">
                      {isBn ? 'নাম' : 'Name'}
                    </th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[60px]">
                      {isBn ? 'শ্রেণি' : 'Class'}
                    </th>
                    <th className="p-2 text-left text-[10px] font-semibold text-[var(--text-muted)] min-w-[50px]">
                      {isBn ? 'সেকশন' : 'Section'}
                    </th>
                    {rangeDays.map((ds) => (
                      <th key={ds} className="p-[6px] text-center text-[9px] font-semibold text-[var(--text-muted)] min-w-[36px]">
                        <div>{shortDate(ds)}</div>
                        <div className="text-[8px] font-normal">{dayName(ds)}</div>
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
                          className="w-[13px] h-[13px] cursor-pointer accent-[var(--brand)]"
                        />
                      </td>
                      <td className="p-[6px] text-center">
                        <div className="w-[30px] h-[36px] rounded-[5px] overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto">
                          {s.photo ? (
                            <img src={s.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={13} className="text-[var(--text-muted)]" />
                          )}
                        </div>
                      </td>
                      <td className="p-[6px]">
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
                          <div className="text-[11px] font-medium text-[var(--text-primary)]">{isBn ? s.nameBn || s.nameEn : s.nameEn}</div>
                          <ExternalLink size={10} className="text-[var(--text-muted)]" />
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] font-mono">{s.id}</div>
                      </td>
                      <td className="p-[6px] text-[10px] text-[var(--text-secondary)]">{s.class}</td>
                      <td className="p-[6px] text-[10px] text-[var(--text-secondary)]">{s.section || '—'}</td>
                      {rangeDays.map((ds) => {
                        if (isFriday(ds))
                          return (
                            <td key={ds} className="p-[4px] text-center">
                              {weeklyHolidayBadge()}
                            </td>
                          )
                        const st = getStatus(attendance[ds]?.[s.id])
                        return (
                          <td key={ds} className="p-[4px] text-center">
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
            <div className="px-3.5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-between items-center text-[11px] text-[var(--text-muted)]">
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
                  className="px-1.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[11px] text-[var(--text-secondary)]"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-[3px]">
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
