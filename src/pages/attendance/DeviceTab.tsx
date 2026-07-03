import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle,
  Clock,
  CreditCard,
  Fingerprint,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  ScanFace,
  Search,
  Settings,
  Smartphone,
  User,
  Wifi,
  WifiOff,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { logger } from '@/lib/logger'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { AttendanceStatus } from '@/store/teacherStore'
import KioskMode from './KioskMode'

type Person = { id: string; name: string; type: 'staff' | 'student'; photo: string; dept?: string; section?: string }

function PersonSearchInput({ value, onChange, placeholder, isBn: lang, people }: { value: string; onChange: (id: string, name: string) => void; placeholder?: string; isBn: boolean; people: Person[] }) {
  const [query, setQuery] = useState(value ? people.find((p) => p.id === value)?.name || '' : '')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Person | null>(value ? people.find((p) => p.id === value) || null : null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return people.filter((p) => {
      if (p.name.toLowerCase().includes(q)) return true
      if (p.id.toLowerCase().includes(q)) return true
      if (p.dept) {
        const classSec = `${p.dept}-${p.section ?? ''}`
        if (classSec.toLowerCase().includes(q)) return true
      }
      return false
    })
  }, [query, people])

  const select = useCallback((p: Person) => {
    setSelected(p)
    setQuery(p.name)
    setOpen(false)
    onChange(p.id, p.name)
  }, [onChange])

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-2">
        <Search size={13} className="text-[var(--text-muted)] shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); setOpen(true); onChange('', '') }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || (lang ? 'নাম, আইডি বা সেকশন লিখুন...' : 'Type name, ID, or section...')}
          className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
        />
        {query && (
          <button onClick={() => { setQuery(''); setSelected(null); onChange('', '') }} className="border-none bg-transparent cursor-pointer text-[var(--text-muted)]">
            <X size={12} />
          </button>
        )}
      </div>
      {open && query.trim() && !selected && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 max-h-[12rem] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl">
          {filtered.slice(0, 15).map((p) => (
            <button
              key={p.id}
              onClick={() => select(p)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-none bg-transparent"
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] shrink-0 flex items-center justify-center">
                {p.photo ? (
                  <img src={p.photo} alt="" className="w-full h-full object-cover" />
                ) : p.type === 'staff' ? (
                  <User size={11} className="text-[var(--text-muted)]" />
                ) : (
                  <GraduationCap size={11} className="text-[var(--text-muted)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.6875rem] font-medium text-[var(--text-primary)] truncate">{p.name}</div>
                <div className="text-[0.5625rem] text-[var(--text-muted)] font-mono truncate">
                  {p.id}{p.type === 'student' && p.dept ? ` · ${p.dept}-${p.section ?? ''}` : ''}
                </div>
              </div>
              <span className={`text-[0.4375rem] px-1.5 py-0.5 rounded font-semibold shrink-0 ${p.type === 'student' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--brand-light)] text-[var(--brand)]'}`}>
                {p.type === 'student' ? 'STU' : 'STAFF'}
              </span>
            </button>
          ))}
          {filtered.length > 15 && (
            <div className="px-3 py-1.5 text-center text-[0.5625rem] text-[var(--text-muted)] border-t border-[var(--border)]">
              +{filtered.length - 15} {lang ? 'আরও...' : 'more...'}
            </div>
          )}
        </div>
      )}
      {open && query.trim() && !selected && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl p-3 text-center">
          <div className="text-[0.6875rem] text-[var(--text-muted)]">{lang ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}</div>
        </div>
      )}
    </div>
  )
}

export default function DeviceTab({ isBn, date }: { isBn: boolean; date: string }) {
  const { teachers, attendance } = useTeacherStore(
    useShallow((s) => ({
      teachers: s.teachers,
      attendance: s.attendance,
    }))
  )
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])
  const students = useAdmissionStore((s) => s.students)
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])

  const allPeople = useMemo<Person[]>(() => {
    const staff: Person[] = activeTeachers.map((t) => ({ id: t.id, name: isBn ? t.nameBn || t.nameEn : t.nameEn, type: 'staff' as const, photo: t.photo || '' }))
    const stu: Person[] = activeStudents.map((s) => ({ id: s.id, name: isBn ? s.nameBn || s.nameEn : s.nameEn, type: 'student' as const, photo: s.photo || '', dept: s.class, section: s.section }))
    return [...staff, ...stu]
  }, [activeTeachers, activeStudents, isBn])

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
  const sectionTabsRef = useRef<HTMLDivElement>(null)
  const sectionTabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const tabColors: Record<string, string> = { devices: '#7C3AED', rfid: 'var(--brand)', fingerprint: 'var(--amber)', face: 'var(--green)', mobile: 'var(--teal)' }
  const [sectionSliderStyle, setSectionSliderStyle] = useState({ left: '0px', width: '0px', background: '#7C3AED' })
  useEffect(() => {
    const el = sectionTabRefs.current[deviceTab]
    const container = sectionTabsRef.current
    if (el && container) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const scrollLeft = container.scrollLeft || 0
      setSectionSliderStyle({
        left: `${elRect.left - containerRect.left + scrollLeft}px`,
        width: `${elRect.width}px`,
        background: tabColors[deviceTab] || '#7C3AED',
      })
    }
  }, [deviceTab])
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
  // WiFi verification state
  const [institutionWifi, setInstitutionWifi] = useState(() => localStorage.getItem('institutionWifi') || '')
  const [institutionGateway, setInstitutionGateway] = useState(() => localStorage.getItem('institutionGateway') || '')
  const [wifiChecking, setWifiChecking] = useState(false)
  const [wifiConnected, setWifiConnected] = useState<boolean | null>(null)
  const [showWifiSettings, setShowWifiSettings] = useState(false)
  const [authMode, setAuthMode] = useState<'kiosk' | 'personal'>('personal')

  useScrollLock(showAddDevice || showAddRFID || showAddFP || showAddFace)



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
      for (const proto of ['https', 'http'] as const) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 3000)
          await fetch(`${proto}://${institutionGateway}/ping`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
          })
          clearTimeout(timeout)
          return {
            onNetwork: true,
            method: 'gateway',
            info: `Gateway ${institutionGateway} reachable (${proto.toUpperCase()})`,
          }
        } catch {
          // try next protocol
        }
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
      logger.error('Device registration error', { error: err.message, name: err.name })
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
      logger.error('Mobile auth error', { error: err.message, name: err.name })
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

  return (
    <>
          {/* Device sub-tabs */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-[0.6875rem] font-medium text-[var(--text-muted)] shrink-0">{isBn ? 'সেকশন:' : 'Section:'}</span>
            <div ref={sectionTabsRef} className="relative flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1 shrink-0">
              {[
                { key: 'devices' as const, lBn: 'ডিভাইস', lEn: 'Devices', Icon: Fingerprint, color: '#7C3AED' },
                { key: 'rfid' as const, lBn: 'RFID কার্ড', lEn: 'RFID Cards', Icon: CreditCard, color: 'var(--brand)' },
                { key: 'fingerprint' as const, lBn: 'ফিঙ্গারপ্রিন্ট', lEn: 'Fingerprint', Icon: Fingerprint, color: 'var(--amber)' },
                { key: 'face' as const, lBn: 'ফেস স্ক্যান', lEn: 'Face Scan', Icon: ScanFace, color: 'var(--green)' },
                { key: 'mobile' as const, lBn: 'মোবাইল', lEn: 'Mobile', Icon: Wifi, color: 'var(--teal)' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  ref={(el) => { sectionTabRefs.current[tab.key] = el }}
                  onClick={() => {
                    setDeviceTab(tab.key)
                    const btn = sectionTabRefs.current[tab.key]
                    const container = sectionTabsRef.current
                    if (btn && container) {
                      const cRect = container.getBoundingClientRect()
                      const bRect = btn.getBoundingClientRect()
                      if (bRect.left < cRect.left || bRect.right > cRect.right) {
                        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
                      }
                    }
                  }}
                  className="relative z-10 px-3 py-1 rounded-md text-[0.625rem] font-medium cursor-pointer transition-colors duration-200 flex items-center gap-1"
                  style={{ color: deviceTab === tab.key ? '#fff' : 'var(--text-muted)' }}
                >
                  <tab.Icon size={11} />
                  {isBn ? tab.lBn : tab.lEn}
                </button>
              ))}
               <div
                className="absolute top-1 bottom-1 rounded-md [transition:left_300ms_ease-out,width_300ms_ease-out,background-color_300ms_ease-out]"
                style={{
                  left: sectionSliderStyle.left,
                  width: sectionSliderStyle.width,
                  background: sectionSliderStyle.background,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
            <div className="flex-1" />
            {deviceTab === 'devices' && (
              <button
                onClick={() => setShowAddDevice(true)}
                className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg bg-[#7C3AED] text-white text-[0.6875rem] cursor-pointer font-medium"
              >
                <Plus size={12} />
                {isBn ? 'ডিভাইস যোগ' : 'Add Device'}
              </button>
            )}
            {deviceTab === 'rfid' && (
              <button
                onClick={() => setShowAddRFID(true)}
                className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] cursor-pointer font-medium"
              >
                <Plus size={12} />
                {isBn ? 'কার্ড যোগ' : 'Add Card'}
              </button>
            )}
            {deviceTab === 'fingerprint' && (
              <button
                onClick={() => setShowAddFP(true)}
                className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg bg-[var(--amber)] text-white text-[0.6875rem] cursor-pointer font-medium"
              >
                <Fingerprint size={12} />
                {isBn ? 'এনরোল' : 'Enroll FP'}
              </button>
            )}
            {deviceTab === 'face' && (
              <button
                onClick={() => setShowAddFace(true)}
                className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg bg-[var(--green)] text-white text-[0.6875rem] cursor-pointer font-medium"
              >
                <ScanFace size={12} />
                {isBn ? 'স্ক্যান' : 'Scan Face'}
              </button>
            )}
          </div>

          {/* ===== Device Management ===== */}
          {deviceTab === 'devices' && (
            <>
              {/* Summary Stats */}
              <div className="flex items-center gap-4 mb-4 text-[0.75rem]">
                <span className="text-[var(--text-muted)]">
                  {devices.length} {isBn ? 'ডিভাইস' : 'devices'}
                </span>
                <span className="flex items-center gap-1 text-[var(--green)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
                  {devices.filter((d) => d.status === 'online').length} {isBn ? 'অনলাইন' : 'online'}
                </span>
                <span className="flex items-center gap-1 text-[var(--red)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
                  {devices.filter((d) => d.status === 'offline').length} {isBn ? 'অফলাইন' : 'offline'}
                </span>
                <span className="text-[var(--text-muted)]">
                  {devices.reduce((s, d) => s + d.staffCount, 0)} {isBn ? 'স্টাফ' : 'staff'}
                </span>
              </div>

              {/* Device Table */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[0.75rem] table-fixed">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                      <th className="p-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'ডিভাইস' : 'Device'}</th>
                      <th className="p-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)]">IP</th>
                      <th className="p-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'টাইপ' : 'Type'}</th>
                      <th className="p-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'স্টাফ' : 'Staff'}</th>
                      <th className="p-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'সিঙ্ক' : 'Sync'}</th>
                      <th className="p-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((d) => (
                      <tr key={d.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'online' ? 'bg-[var(--green)]' : 'bg-[var(--red)]'}`} />
                            <div>
                              <div className="font-medium text-[var(--text-primary)]">{d.name}</div>
                              <div className="text-[0.625rem] text-[var(--text-muted)]">{d.model}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[var(--text-secondary)]">{d.ip}</td>
                        <td className="p-3">
                          <span className={`text-[0.625rem] px-2 py-0.5 rounded-full font-medium ${d.type === 'rfid' ? 'bg-purple-100 text-purple-700' : d.type === 'fingerprint' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {d.type === 'rfid' ? 'RFID' : d.type === 'fingerprint' ? 'FP' : 'Face'}
                          </span>
                        </td>
                        <td className="p-3 text-center text-[var(--text-secondary)]">{d.staffCount}</td>
                        <td className="p-3 text-center text-[0.625rem] text-[var(--text-muted)]">
                          {d.lastSync ? new Date(d.lastSync).toLocaleString('en', { hour: '2-digit', minute: '2-digit', hour12: true, day: '2-digit', month: 'short' }) : '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSyncingDevice(d.id)
                                setTimeout(() => {
                                  setDevices((prev) => prev.map((dev) => dev.id === d.id ? { ...dev, lastSync: new Date().toISOString(), status: 'online' } : dev))
                                  setSyncingDevice(null)
                                }, 2000)
                              }}
                              disabled={syncingDevice === d.id}
                              title={isBn ? 'সিঙ্ক' : 'Sync'}
                              className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--green-light)] hover:border-[var(--green)] hover:text-[var(--green)] transition-all"
                            >
                              <RefreshCw size={11} className={syncingDevice === d.id ? 'animate-spin' : ''} />
                            </button>
                            <button
                              onClick={() => setShowDeviceSettings(d.id)}
                              title={isBn ? 'এডিট' : 'Edit'}
                              className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
                            >
                              <Settings size={11} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(isBn ? `"${d.name}" মুছে ফেলতে চান?` : `Delete "${d.name}"?`)) {
                                  setDevices((prev) => prev.filter((dev) => dev.id !== d.id))
                                }
                              }}
                              title={isBn ? 'মুছুন' : 'Delete'}
                              className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--red-light)] hover:border-[var(--red)] hover:text-[var(--red)] transition-all"
                            >
                              <Trash2 size={11} />
                            </button>
                            <button
                              onClick={() => setDevices((prev) => prev.map((dev) => dev.id === d.id ? { ...dev, status: dev.status === 'online' ? 'offline' : 'online' } : dev))}
                              title={d.status === 'online' ? (isBn ? 'অফলাইন করুন' : 'Go Offline') : (isBn ? 'অনলাইন করুন' : 'Go Online')}
                              className={`w-7 h-7 rounded-md border flex items-center justify-center cursor-pointer transition-all ${d.status === 'online' ? 'bg-[var(--red-light)] border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white' : 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white'}`}
                            >
                              {d.status === 'online' ? <WifiOff size={11} /> : <Wifi size={11} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Device Settings Modal */}
              {showDeviceSettings && createPortal(
                <div className="modal-overlay">
                  <div className="modal-content modal-box" style={{ maxWidth: '25rem' }}>
                    {(() => {
                      const d = devices.find((dev) => dev.id === showDeviceSettings)
                      if (!d) return null
                      return (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">
                              {isBn ? 'ডিভাইস সেটিং' : 'Device Settings'}
                            </h3>
                            <button
                              onClick={() => setShowDeviceSettings(null)}
                              className="w-7 h-7 rounded-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] cursor-pointer flex items-center justify-center"
                            >
                              <X size={14} className="text-[var(--text-secondary)]" />
                            </button>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'ডিভাইস' : 'Device'}</span>
                              <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">{d.name}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'মডেল' : 'Model'}</span>
                              <span className="text-[0.6875rem] font-semibold text-[var(--text-primary)]">{d.model}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[0.6875rem] text-[var(--text-secondary)]">IP</span>
                              <span className="text-[0.6875rem] font-mono font-semibold text-[var(--text-primary)]">{d.ip}</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                              <span className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'সিঙ্ক ইন্টারভাল' : 'Sync Interval'}</span>
                              <select
                                value={deviceSettings.syncInterval}
                                onChange={(e) => setDeviceSettings((s) => ({ ...s, syncInterval: +e.target.value }))}
                                className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.625rem] text-[var(--text-secondary)]"
                              >
                                <option value={5}>5 {isBn ? 'মিনিট' : 'min'}</option>
                                <option value={15}>15 {isBn ? 'মিনিট' : 'min'}</option>
                                <option value={30}>30 {isBn ? 'মিনিট' : 'min'}</option>
                                <option value={60}>1 {isBn ? 'ঘণ্টা' : 'hr'}</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setShowDeviceSettings(null)}
                              className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] font-medium cursor-pointer hover:bg-[var(--border)] transition-all"
                            >
                              {isBn ? 'বন্ধ' : 'Close'}
                            </button>
                            <button
                              onClick={() => setShowDeviceSettings(null)}
                              className="px-4 py-2 rounded-lg bg-[var(--green)] text-white text-[0.75rem] font-semibold cursor-pointer hover:opacity-90 transition-all"
                            >
                              {isBn ? 'সংরক্ষণ' : 'Save'}
                            </button>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>,
                document.body
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
                      <div className="text-[1rem] font-bold" style={{ color: s.color }}>
                        {s.value}
                      </div>
                      <div className="text-[0.625rem] text-[var(--text-muted)]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[0.375rem] flex-1 max-w-[18.75rem]">
                  <Search size={13} className="text-[var(--text-muted)]" />
                  <input
                    value={rfidSearch}
                    onChange={(e) => setRfidSearch(e.target.value)}
                    placeholder={isBn ? 'নাম বা কার্ড নম্বর দিয়ে খুঁজুন...' : 'Search by name or card number...'}
                    className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
                  />
                </div>
                <span className="text-[0.6875rem] text-[var(--text-muted)]">
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
                  <table className="w-full border-collapse text-[0.6875rem]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.1875rem]">#</th>
                        <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'স্টাফ আইডি' : 'Staff ID'}
                        </th>
                        <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                        <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'কার্ড নম্বর' : 'Card Number'}
                        </th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'টাইপ' : 'Type'}</th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অবস্থা' : 'Status'}
                        </th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
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
                                className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.625rem] text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--brand)]"
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
                                className={`text-[0.5625rem] px-2.5 py-1 rounded-full font-semibold cursor-pointer border transition-all duration-200 ${
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
                                  className="px-2.5 py-1 rounded-md bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--brand)] hover:text-white transition-all"
                                >
                                  {isBn ? 'রি-অ্যাসাইন' : 'Re-assign'}
                                </button>
                                <button
                                  onClick={() => setRfidEntries((prev) => prev.filter((x) => x.rfidCard !== e.rfidCard))}
                                  className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
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
                          <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] text-[0.75rem]">
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
                      <div className="text-[1rem] font-bold" style={{ color: s.color }}>
                        {s.value}
                      </div>
                      <div className="text-[0.625rem] text-[var(--text-muted)]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[0.375rem] flex-1 max-w-[18.75rem]">
                  <Search size={13} className="text-[var(--text-muted)]" />
                  <input
                    value={fpSearch}
                    onChange={(e) => setFpSearch(e.target.value)}
                    placeholder={isBn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
                    className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
                  />
                </div>
                <span className="text-[0.6875rem] text-[var(--text-muted)]">
                  {fpEntries.filter((e) => !fpSearch || e.staffName.toLowerCase().includes(fpSearch.toLowerCase())).length}{' '}
                  {isBn ? 'টি ফলাফল' : 'results'}
                </span>
              </div>
              {/* Table */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-auto max-h-[55vh]">
                  <table className="w-full border-collapse text-[0.6875rem]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.1875rem]">#</th>
                        <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'স্টাফ আইডি' : 'Staff ID'}
                        </th>
                        <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'FP আইডি' : 'FP ID'}
                        </th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'টেমপ্লেট' : 'Templates'}
                        </th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অবস্থা' : 'Status'}
                        </th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
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
                                className={`text-[0.5625rem] px-2.5 py-1 rounded-full font-semibold ${
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
                                  className={`px-2.5 py-1 rounded-md text-[0.5625rem] font-semibold cursor-pointer border transition-all duration-200 ${
                                    e.status === 'pending'
                                      ? 'bg-[var(--amber-light)] border-[var(--amber)] text-[var(--amber)] animate-pulse cursor-wait'
                                      : 'bg-[var(--amber-light)] border-[var(--amber)] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-white hover:shadow-md'
                                  }`}
                                >
                                  {e.status === 'pending' ? (isBn ? 'এনরোল হচ্ছে...' : 'Enrolling...') : isBn ? 'রি-এনরোল' : 'Re-enroll'}
                                </button>
                                <button
                                  onClick={() => setFpEntries((prev) => prev.filter((x) => x.staffId !== e.staffId))}
                                  className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                                >
                                  {isBn ? 'মুছুন' : 'Delete'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {fpEntries.filter((e) => !fpSearch || e.staffName.toLowerCase().includes(fpSearch.toLowerCase())).length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] text-[0.75rem]">
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
                      <div className="text-[1rem] font-bold" style={{ color: s.color }}>
                        {s.value}
                      </div>
                      <div className="text-[0.625rem] text-[var(--text-muted)]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[0.375rem] flex-1 max-w-[18.75rem]">
                  <Search size={13} className="text-[var(--text-muted)]" />
                  <input
                    value={faceSearch}
                    onChange={(e) => setFaceSearch(e.target.value)}
                    placeholder={isBn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
                    className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
                  />
                </div>
                <span className="text-[0.6875rem] text-[var(--text-muted)]">
                  {faceEntries.filter((e) => !faceSearch || e.staffName.toLowerCase().includes(faceSearch.toLowerCase())).length}{' '}
                  {isBn ? 'টি ফলাফল' : 'results'}
                </span>
              </div>
              {/* Table */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
                <div className="overflow-auto max-h-[55vh]">
                  <table className="w-full border-collapse text-[0.6875rem]">
                    <thead>
                      <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.1875rem]">#</th>
                        <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'স্টাফ আইডি' : 'Staff ID'}
                        </th>
                        <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'ফেস আইডি' : 'Face ID'}
                        </th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'কোয়ালিটি' : 'Quality'}
                        </th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                          {isBn ? 'অবস্থা' : 'Status'}
                        </th>
                        <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
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
                                  className="text-[0.5625rem] font-bold tabular-nums"
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
                                className={`text-[0.5625rem] px-2.5 py-1 rounded-full font-semibold ${
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
                                  className={`px-2.5 py-1 rounded-md text-[0.5625rem] font-semibold cursor-pointer border transition-all duration-200 ${
                                    e.status === 'pending'
                                      ? 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] animate-pulse cursor-wait'
                                      : 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white hover:shadow-md'
                                  }`}
                                >
                                  {e.status === 'pending' ? (isBn ? 'স্ক্যান হচ্ছে...' : 'Scanning...') : isBn ? 'রি-স্ক্যান' : 'Re-scan'}
                                </button>
                                <button
                                  onClick={() => setFaceEntries((prev) => prev.filter((x) => x.staffId !== e.staffId))}
                                  className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
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
                          <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] text-[0.75rem]">
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
              {/* Network + Mode combined bar */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-4 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Wifi size={13} className="text-[var(--teal)]" />
                  <span className="text-[0.6875rem] font-medium text-[var(--text-primary)]">
                    {isBn ? 'নেটওয়ার্ক' : 'Network'}
                  </span>
                  {institutionGateway && (
                    <span className={`text-[0.5rem] px-1.5 py-0.5 rounded-full font-semibold ${wifiConnected === true ? 'bg-[var(--green-light)] text-[var(--green)]' : wifiConnected === false ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}>
                      {wifiConnected === true ? 'OK' : wifiConnected === false ? (isBn ? 'বিচ্ছিন্ন' : 'Off') : '...'}
                    </span>
                  )}
                </div>
                <div className="w-px h-4 bg-[var(--border)]" />
                <span className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'মোড:' : 'Mode:'}</span>
                <div className="relative flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1">
                  <div
className="absolute top-1 bottom-1 rounded-md [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
                    style={{
                      width: 'calc(50% - 0.25rem)',
                      transform: authMode === 'kiosk' ? 'translateX(calc(100% + 0.25rem))' : 'translateX(0)',
                      background: authMode === 'kiosk' ? 'var(--amber)' : 'var(--teal)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                  <button
                    onClick={() => setAuthMode('personal')}
                    className="relative z-10 px-3 py-1 rounded-md text-[0.625rem] font-medium cursor-pointer transition-colors duration-200 flex items-center gap-1"
                    style={{ color: authMode === 'personal' ? '#fff' : 'var(--text-muted)' }}
                  >
                    <Smartphone size={10} />
                    {isBn ? 'ব্যক্তিগত' : 'Personal'}
                  </button>
                  <button
                    onClick={() => setAuthMode('kiosk')}
                    className="relative z-10 px-3 py-1 rounded-md text-[0.625rem] font-medium cursor-pointer transition-colors duration-200 flex items-center gap-1"
                    style={{ color: authMode === 'kiosk' ? '#fff' : 'var(--text-muted)' }}
                  >
                    <ScanFace size={10} />
                    {isBn ? 'কিয়োস্ক' : 'Kiosk'}
                  </button>
                </div>
                <div className="flex-1" />
                <button
                  onClick={() => setShowWifiSettings(!showWifiSettings)}
                  className="text-[0.625rem] text-[var(--teal)] cursor-pointer bg-transparent border-none font-medium"
                >
                  {showWifiSettings ? (isBn ? 'বন্ধ' : 'Close') : isBn ? 'সেটিংস' : 'Settings'}
                </button>
              </div>

              {/* WiFi Settings Panel */}
              {showWifiSettings && (
                <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[0.5625rem] font-medium text-[var(--text-muted)] mb-1 block">
                        {isBn ? 'WiFi নাম' : 'WiFi SSID'}
                      </label>
                      <input
                        value={institutionWifi}
                        onChange={(e) => setInstitutionWifi(e.target.value)}
                        placeholder="Institution-Guest"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[0.5625rem] font-medium text-[var(--text-muted)] mb-1 block">
                        {isBn ? 'গেটওয়ে IP' : 'Gateway IP'}
                      </label>
                      <input
                        value={institutionGateway}
                        onChange={(e) => setInstitutionGateway(e.target.value)}
                        placeholder="192.168.1.1"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-primary)] font-mono outline-none"
                      />
                    </div>
                    <div className="flex items-end gap-1.5">
                      <button
                        onClick={saveWifiSettings}
                        className="px-3 py-1.5 rounded-lg bg-[var(--teal)] text-white text-[0.625rem] font-medium cursor-pointer border-none"
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
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.625rem] cursor-pointer"
                      >
                        {wifiChecking ? '...' : isBn ? 'পরীক্ষা' : 'Test'}
                      </button>
                    </div>
                  </div>
                  <div className="text-[0.5rem] text-[var(--text-muted)] mt-1.5">
                    {isBn ? 'গেটওয়ে IP সেট করলে স্টাফদের WiFi নেটওয়ার্কে থাকতে হবে।' : 'With gateway IP, staff must be on institution WiFi to check in.'}
                  </div>
                </div>
              )}

              {/* Personal Mode Content */}
              {authMode === 'personal' && (
                <>
                  {/* Message */}
                  {mobileAuthMsg && (
                    <div
                      className={`mb-3 py-2 px-3 rounded-lg text-[0.75rem] font-medium flex items-center gap-2 ${mobileAuthMsg.type === 'success' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}
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
                          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                            {isBn ? 'ডিভাইস নিবন্ধন' : 'Register Device'}
                          </div>
                          <div className="text-[0.625rem] text-[var(--text-muted)]">
                            {isBn ? 'ফিঙ্গারপ্রিন্ট/ফেস দিয়ে নিবন্ধন' : 'Register with biometric'}
                          </div>
                        </div>
                      </div>
                      <PersonSearchInput
                        value={mobileRegStaff}
                        onChange={(id) => setMobileRegStaff(id)}
                        isBn={isBn}
                        people={allPeople.filter((p) => p.type === 'staff' && !mobileDevices.find((d) => d.staffId === p.id))}
                      />
                      <button
                        onClick={handleRegisterDevice}
                        disabled={!mobileRegStaff || mobileRegPending}
                        className={`w-full py-2 mt-2 rounded-lg text-[0.75rem] font-semibold cursor-pointer border-none transition-all ${mobileRegPending ? 'bg-[var(--amber-light)] text-[var(--amber)] animate-pulse' : mobileRegStaff ? 'bg-[var(--teal)] text-white hover:shadow-md' : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'}`}
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
                          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                            {isBn ? 'চেক-ইন / আউট' : 'Check In / Out'}
                          </div>
                          <div className="text-[0.625rem] text-[var(--text-muted)]">
                            {isBn ? 'বায়োমেট্রিক + WiFi' : 'Biometric + WiFi verified'}
                          </div>
                        </div>
                      </div>
                      <PersonSearchInput
                        value={mobileAuthStaff}
                        onChange={(id) => setMobileAuthStaff(id)}
                        isBn={isBn}
                        people={mobileDevices.map((d) => ({ id: d.staffId, name: d.staffName, type: 'staff' as const, photo: '' }))}
                      />
                      <button
                        onClick={handleMobileAuth}
                        disabled={!mobileAuthStaff || mobileAuthPending || wifiChecking}
                        className={`w-full py-2 mt-2 rounded-lg text-[0.75rem] font-semibold cursor-pointer border-none transition-all ${mobileAuthPending || wifiChecking ? 'bg-[var(--amber-light)] text-[var(--amber)] animate-pulse' : mobileAuthStaff ? 'bg-[var(--green)] text-white hover:shadow-md' : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'}`}
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
                      <div className="flex items-center gap-4">
                        <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                          {isBn ? 'নিবন্ধিত ডিভাইস' : 'Registered Devices'} ({mobileDevices.length})
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle size={11} className="text-[var(--green)]" />
                          <span className="text-[0.625rem] text-[var(--text-muted)]">{mobileDevices.filter((d) => d.lastAuth?.startsWith(date)).length} {isBn ? 'আজ' : 'Today'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-[var(--brand)]" />
                          <span className="text-[0.625rem] text-[var(--text-muted)]">{mobileDevices.filter((d) => d.lastAuth).length} {isBn ? 'সক্রিয়' : 'Active'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-[0.3125rem]">
                        <Search size={12} className="text-[var(--text-muted)]" />
                        <input
                          value={mobileSearch}
                          onChange={(e) => setMobileSearch(e.target.value)}
                          placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
                          className="flex-1 border-none bg-transparent outline-none text-[0.6875rem] text-[var(--text-primary)] w-[6.25rem]"
                        />
                      </div>
                    </div>
                    <div className="overflow-auto max-h-[35vh]">
                      <table className="w-full border-collapse text-[0.6875rem]">
                        <thead>
                          <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                            <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.1875rem]">#</th>
                            <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">
                              {isBn ? 'স্টাফ' : 'Staff'}
                            </th>
                            <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">
                              {isBn ? 'ডিভাইস' : 'Device'}
                            </th>
                            <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
                              {isBn ? 'শেষ ব্যবহার' : 'Last Used'}
                            </th>
                            <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">
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
                                  <div className="text-[0.625rem] text-[var(--text-muted)]">{d.staffId}</div>
                                </td>
                                <td className="p-2.5">
                                  <span className="text-[0.625rem] px-2 py-0.5 rounded-full bg-[var(--teal-light)] text-[var(--teal)] font-medium">
                                    {d.deviceName}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center text-[0.625rem] text-[var(--text-muted)]">
                                  {d.lastAuth ? (
                                    new Date(d.lastAuth).toLocaleString()
                                  ) : (
                                    <span className="text-[var(--amber)]">{isBn ? 'নতুন' : 'New'}</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    onClick={() => removeMobileDevice(d.id)}
                                    className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                                  >
                                    {isBn ? 'মুছুন' : 'Remove'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {mobileDevices.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-[var(--text-muted)] text-[0.75rem]">
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

              {/* Kiosk Mode Content */}
              {authMode === 'kiosk' && (
                <KioskMode isBn={isBn} date={date} />
              )}
            </>
          )}

          {/* Add Device Modal */}
          {showAddDevice && createPortal(
            <div className="modal-overlay">
              <div className="modal-content modal-box" style={{ maxWidth: '26.25rem' }}>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'নতুন ডিভাইস যোগ করুন' : 'Add New Device'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'ডিভাইসের নাম' : 'Device Name'}
                    </label>
                    <input
                      value={newDevice.name}
                      onChange={(e) => setNewDevice((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Main Gate RFID"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">{isBn ? 'মডেল' : 'Model'}</label>
                    <input
                      value={newDevice.model}
                      onChange={(e) => setNewDevice((p) => ({ ...p, model: e.target.value }))}
                      placeholder="e.g. ZKTeco SLK200"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                      IP {isBn ? 'ঠিকানা' : 'Address'}
                    </label>
                    <input
                      value={newDevice.ip}
                      onChange={(e) => setNewDevice((p) => ({ ...p, ip: e.target.value }))}
                      placeholder="192.168.1.100"
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
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
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[0.625rem] cursor-pointer transition-all ${newDevice.type === o.k ? 'border-[#7C3AED] bg-[#7C3AED15] text-[#7C3AED] font-semibold' : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
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
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
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
                    className="px-3.5 py-2 rounded-lg bg-[#7C3AED] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
                  >
                    {isBn ? 'যোগ করুন' : 'Add Device'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Add RFID Modal */}
          {showAddRFID && createPortal(
            <div className="modal-overlay">
              <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'RFID কার্ড যোগ করুন' : 'Add RFID Card'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'ব্যক্তি নির্বাচন করুন' : 'Select Person'}
                    </label>
                    <PersonSearchInput
                      value={newRFID.staffId}
                      onChange={(id) => setNewRFID((p) => ({ ...p, staffId: id }))}
                      isBn={isBn}
                      people={allPeople}
                    />
                  </div>
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'কার্ড নম্বর (বা ট্যাপ করুন)' : 'Card Number (or tap)'}
                    </label>
                    <input
                      value={newRFID.rfidCard}
                      onChange={(e) => setNewRFID((p) => ({ ...p, rfidCard: e.target.value }))}
                      placeholder="CARD-XXXX"
                      className="w-full px-3 py-2 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] font-mono text-center outline-none focus:border-[var(--brand)]"
                    />
                    <p className="text-[0.5625rem] text-[var(--text-muted)] mt-1 text-center">
                      {isBn ? 'ডিভাইসে কার্ড ট্যাপ করুন অথবা ম্যানুয়ালি লিখুন' : 'Tap card on device or enter manually'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => setShowAddRFID(false)}
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      if (newRFID.staffId && newRFID.rfidCard) {
                        const p = allPeople.find((pe) => pe.id === newRFID.staffId)
                        if (p)
                          setRfidEntries((prev) => [
                            ...prev,
                            {
                              staffId: p.id,
                              staffName: p.name,
                              rfidCard: newRFID.rfidCard,
                              type: p.type === 'student' ? 'Student' : 'Staff',
                              assigned: true,
                            },
                          ])
                        setShowAddRFID(false)
                        setNewRFID({ staffId: '', rfidCard: '' })
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[var(--brand)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
                  >
                    {isBn ? 'যোগ করুন' : 'Add'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Add Fingerprint Modal */}
          {showAddFP && createPortal(
            <div className="modal-overlay">
              <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'ফিঙ্গারপ্রিন্ট এনরোলমেন্ট' : 'Fingerprint Enrollment'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'ব্যক্তি নির্বাচন করুন' : 'Select Person'}
                    </label>
                    <PersonSearchInput
                      value={newFP.staffId}
                      onChange={(id) => setNewFP((p) => ({ ...p, staffId: id }))}
                      isBn={isBn}
                      people={allPeople}
                    />
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
                    <Fingerprint size={40} className="mx-auto mb-2 text-[var(--amber)]" />
                    <p className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'ডিভাইসে আঙুল রাখুন' : 'Place finger on device'}</p>
                    <p className="text-[0.5625rem] text-[var(--text-muted)] mt-1">{isBn ? '২ বার আঙুল রাখুন' : 'Tap finger twice'}</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => setShowAddFP(false)}
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      if (newFP.staffId) {
                        const p = allPeople.find((pe) => pe.id === newFP.staffId)
                        if (p)
                          setFpEntries((prev) => [
                            ...prev,
                            {
                              staffId: p.id,
                              staffName: p.name,
                              fpId: prev.length + 1,
                              templates: 0,
                              status: 'pending',
                            },
                          ])
                        setShowAddFP(false)
                        setNewFP({ staffId: '' })
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[var(--amber)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
                  >
                    {isBn ? 'এনরোল শুরু করুন' : 'Start Enrollment'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Add Face Scan Modal */}
          {showAddFace && createPortal(
            <div className="modal-overlay">
              <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'ফেস স্ক্যান এনরোলমেন্ট' : 'Face Scan Enrollment'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'ব্যক্তি নির্বাচন করুন' : 'Select Person'}
                    </label>
                    <PersonSearchInput
                      value={newFace.staffId}
                      onChange={(id) => setNewFace((p) => ({ ...p, staffId: id }))}
                      isBn={isBn}
                      people={allPeople}
                    />
                  </div>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
                    <ScanFace size={40} className="mx-auto mb-2 text-[var(--green)]" />
                    <p className="text-[0.6875rem] text-[var(--text-secondary)]">{isBn ? 'ক্যামেরায় মুখ দেখান' : 'Show face to camera'}</p>
                    <p className="text-[0.5625rem] text-[var(--text-muted)] mt-1">{isBn ? '৩৬০° ঘুরে মুখ দেখান' : 'Rotate face 360°'}</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => setShowAddFace(false)}
                    className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.75rem] cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      if (newFace.staffId) {
                        const p = allPeople.find((pe) => pe.id === newFace.staffId)
                        if (p)
                          setFaceEntries((prev) => [
                            ...prev,
                            {
                              staffId: p.id,
                              staffName: p.name,
                              faceId: prev.length + 1,
                              quality: 0,
                              status: 'pending',
                            },
                          ])
                        setShowAddFace(false)
                        setNewFace({ staffId: '' })
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[var(--green)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
                  >
                    {isBn ? 'স্ক্যান শুরু করুন' : 'Start Scan'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
    </>
  )
}
