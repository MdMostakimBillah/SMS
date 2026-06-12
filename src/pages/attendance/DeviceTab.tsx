import { useState, useMemo, useRef } from 'react'
import {
  CheckCircle,
  Clock,
  CreditCard,
  Fingerprint,
  Layers,
  Plus,
  RefreshCw,
  ScanFace,
  Search,
  Settings,
  Smartphone,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from 'lucide-react'
import { useTeacherStore } from '@/store/teacherStore'
import { useScrollLock } from '@/hooks/useScrollLock'
import type { AttendanceStatus } from '@/store/teacherStore'

export default function DeviceTab({ isBn, date }: { isBn: boolean; date: string }) {
  const { teachers, attendance } = useTeacherStore()
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])

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
  const [kioskAttendanceOpen, setKioskAttendanceOpen] = useState(false)
  const [kioskMsg, setKioskMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [kioskIdentified, setKioskIdentified] = useState<{
    staffId: string
    staffName: string
    photo: string
    punchType: 'in' | 'out'
    time: string
  } | null>(null)
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
  const [kioskSearch, setKioskSearch] = useState('')
  const [, setKioskDetecting] = useState(false)
  const [kioskFaceDetected, setKioskFaceDetected] = useState(false)
  const kioskDetectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const kioskStableCountRef = useRef(0)
  const kioskIdentifiedRef = useRef<boolean>(false)
  // WiFi verification state
  const [institutionWifi, setInstitutionWifi] = useState(() => localStorage.getItem('institutionWifi') || '')
  const [institutionGateway, setInstitutionGateway] = useState(() => localStorage.getItem('institutionGateway') || '')
  const [wifiChecking, setWifiChecking] = useState(false)
  const [wifiConnected, setWifiConnected] = useState<boolean | null>(null)
  const [showWifiSettings, setShowWifiSettings] = useState(false)
  const [authMode, setAuthMode] = useState<'kiosk' | 'personal'>('personal')

  useScrollLock(showAddDevice || showAddRFID || showAddFP || showAddFace || kioskCamActive || kioskAttendanceOpen)

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
    setKioskRegStaff('')
    setKioskCapturedPhoto(null)
    stopKioskCamera()
    setTimeout(() => setKioskMsg(null), 3000)
  }

  const playSuccessSound = () => {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  const kioskCooldownRef = useRef<Record<string, number>>({})

  const handleKioskPunch = (staffId: string, staffName: string, photo: string) => {
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
    setKioskIdentified({ staffId, staffName, photo, punchType, time: timeStr })
    kioskIdentifiedRef.current = true
    setKioskMsg({
      type: 'success',
      text: `${staffName} ${punchType === 'in' ? (isBn ? 'চেক-ইন' : 'CHECKED IN') : isBn ? 'চেক-আউট' : 'CHECKED OUT'} ${timeStr}`,
    })
    playSuccessSound()
    setKioskCapturedPhoto(null)
    kioskCooldownRef.current[staffId] = Date.now()
    setTimeout(() => {
      setKioskMsg(null)
      setKioskIdentified(null)
      kioskIdentifiedRef.current = false
      setKioskCapturedPhoto(null)
    }, 4000)
  }

  const matchFaceToStaff = (capturedPhoto: string): { staffId: string; staffName: string; photo: string } | null => {
    if (kioskRegisteredFaces.length === 0) return null
    const img = new Image()
    img.src = capturedPhoto
    const canvas = document.createElement('canvas')
    const SIZE = 50
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, SIZE, SIZE)
    const capturedData = ctx.getImageData(0, 0, SIZE, SIZE).data
    let bestMatch: { staffId: string; staffName: string; photo: string } | null = null
    let bestScore = Infinity
    for (const face of kioskRegisteredFaces) {
      const refImg = new Image()
      refImg.src = face.photo
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.drawImage(refImg, 0, 0, SIZE, SIZE)
      const refData = ctx.getImageData(0, 0, SIZE, SIZE).data
      let diff = 0
      for (let i = 0; i < capturedData.length; i += 4) {
        diff += Math.abs(capturedData[i] - refData[i])
        diff += Math.abs(capturedData[i + 1] - refData[i + 1])
        diff += Math.abs(capturedData[i + 2] - refData[i + 2])
      }
      if (diff < bestScore) {
        bestScore = diff
        bestMatch = { staffId: face.staffId, staffName: face.staffName, photo: face.photo }
      }
    }
    const threshold = SIZE * SIZE * 3 * 255 * 0.3
    if (bestScore < threshold) return bestMatch
    return null
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
      if (kioskIdentifiedRef.current) return
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
          if (photo) {
            setKioskCapturedPhoto(photo)
            if (kioskAttendanceOpen) {
              setTimeout(() => {
                const match = matchFaceToStaff(photo)
                if (match) {
                  const lastPunch = kioskCooldownRef.current[match.staffId] || 0
                  if (Date.now() - lastPunch < 10000) {
                    setKioskCapturedPhoto(null)
                    startKioskDetectLoop()
                    return
                  }
                  handleKioskPunch(match.staffId, match.staffName, match.photo)
                  setKioskCapturedPhoto(null)
                  startKioskDetectLoop()
                } else {
                  setKioskCapturedPhoto(null)
                  startKioskDetectLoop()
                }
              }, 500)
            }
          }
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
    kioskIdentifiedRef.current = false
    setKioskDetecting(false)
    setKioskFaceDetected(false)
  }

  return (
    <>
          {/* Device sub-tabs — status filter style */}
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center gap-2 flex-wrap">
            <span className="text-[0.6875rem] font-medium text-[var(--text-muted)]">{isBn ? 'সেকশন:' : 'Section:'}</span>
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
                className={`px-3 py-1 rounded-lg text-[0.6875rem] cursor-pointer border ${
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
            {deviceTab === 'mobile' && (
              <button
                onClick={() => setAuthMode('kiosk')}
                className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg bg-[var(--teal)] text-white text-[0.6875rem] cursor-pointer font-medium"
              >
                <Wifi size={12} />
                {isBn ? 'কিওস্ক মোড' : 'Kiosk Mode'}
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
                <table className="w-full border-collapse text-[0.75rem]">
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
                              className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--green-light)] hover:border-[var(--green)] hover:text-[var(--green)] transition-all"
                            >
                              <RefreshCw size={11} className={syncingDevice === d.id ? 'animate-spin' : ''} />
                            </button>
                            <button
                              onClick={() => setShowDeviceSettings(d.id)}
                              className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--brand-light)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
                            >
                              <Settings size={11} />
                            </button>
                            <button
                              onClick={() => setDevices((prev) => prev.map((dev) => dev.id === d.id ? { ...dev, status: dev.status === 'online' ? 'offline' : 'online' } : dev))}
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

              {/* Device Settings Modal */}
              {showDeviceSettings && (
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
              {/* WiFi Settings Bar */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi size={14} className="text-[var(--teal)]" />
                    <span className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                      {isBn ? 'নেটওয়ার্ক সেটিংস' : 'Network Settings'}
                    </span>
                    {institutionGateway && (
                      <span
                        className={`text-[0.5625rem] px-2 py-0.5 rounded-full font-semibold ${wifiConnected === true ? 'bg-[var(--green-light)] text-[var(--green)]' : wifiConnected === false ? 'bg-[var(--red-light)] text-[var(--red)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}
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
                    className="text-[0.6875rem] text-[var(--teal)] cursor-pointer bg-transparent border-none font-[inherit] font-medium"
                  >
                    {showWifiSettings ? (isBn ? 'বন্ধ করুন' : 'Close') : isBn ? 'সেটিংস' : 'Settings'}
                  </button>
                </div>
                {showWifiSettings && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                    <div>
                      <label className="text-[0.625rem] font-medium text-[var(--text-muted)] mb-1 block">
                        {isBn ? 'WiFi নেটওয়ার্কের নাম' : 'WiFi Network Name (SSID)'}
                      </label>
                      <input
                        value={institutionWifi}
                        onChange={(e) => setInstitutionWifi(e.target.value)}
                        placeholder="e.g. Institution-Guest"
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[0.625rem] font-medium text-[var(--text-muted)] mb-1 block">
                        {isBn ? 'গেটওয়ে IP (ঐচ্ছিক)' : 'Gateway IP (Optional)'}
                      </label>
                      <input
                        value={institutionGateway}
                        onChange={(e) => setInstitutionGateway(e.target.value)}
                        placeholder="e.g. 192.168.1.1"
                        className="w-full px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.6875rem] text-[var(--text-primary)] font-mono outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveWifiSettings}
                        className="px-3 py-1.5 rounded-lg bg-[var(--teal)] text-white text-[0.6875rem] font-medium cursor-pointer border-none"
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
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.6875rem] cursor-pointer"
                      >
                        {wifiChecking ? (isBn ? 'পরীক্ষা হচ্ছে...' : 'Checking...') : isBn ? 'পরীক্ষা করুন' : 'Test Connection'}
                      </button>
                    </div>
                    <div className="text-[0.5625rem] text-[var(--text-muted)]">
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
                      <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                        {isBn ? 'ব্যক্তিগত ফোন' : 'Personal Phone'}
                      </div>
                      <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'নিজের ফোনে চেক ইন' : 'Check in on own phone'}</div>
                    </div>
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-secondary)]">
                    {isBn
                      ? 'স্টাফ নিজের ফোনে ফিঙ্গারপ্রিন্ট দিয়ে চেক ইন করে। WiFi যাচাই সহ।'
                      : 'Staff authenticates on own device. WiFi verification included.'}
                  </div>
                </button>
                <button
                  onClick={() => setAuthMode('kiosk')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${authMode === 'kiosk' ? 'border-[var(--green)] bg-[var(--green-light)]' : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--green)]'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${authMode === 'kiosk' ? 'bg-[var(--green)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--green)]'}`}>
                      <Layers size={16} />
                    </div>
                    <div>
                      <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{isBn ? 'কিওস্ক মোড' : 'Kiosk Mode'}</div>
                      <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'শেয়ার্ড ডিভাইস' : 'Shared device at gate'}</div>
                    </div>
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-secondary)]">
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
                        <div className="text-[0.75rem] font-semibold text-[var(--teal)]">
                          {isBn ? 'ব্যক্তিগত ডিভাইস মোড' : 'Personal Device Mode'}
                        </div>
                        <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
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
                          <div className="text-[1rem] font-bold" style={{ color: s.color }}>
                            {s.value}
                          </div>
                          <div className="text-[0.625rem] text-[var(--text-muted)]">{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

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
                      <select
                        value={mobileRegStaff}
                        onChange={(e) => setMobileRegStaff(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none mb-2"
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
                        className={`w-full py-2 rounded-lg text-[0.75rem] font-semibold cursor-pointer border-none transition-all ${mobileRegPending ? 'bg-[var(--amber-light)] text-[var(--amber)] animate-pulse' : mobileRegStaff ? 'bg-[var(--teal)] text-white hover:shadow-md' : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'}`}
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
                      <select
                        value={mobileAuthStaff}
                        onChange={(e) => setMobileAuthStaff(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none mb-2"
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
                        className={`w-full py-2 rounded-lg text-[0.75rem] font-semibold cursor-pointer border-none transition-all ${mobileAuthPending || wifiChecking ? 'bg-[var(--amber-light)] text-[var(--amber)] animate-pulse' : mobileAuthStaff ? 'bg-[var(--green)] text-white hover:shadow-md' : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'}`}
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
                      <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                        {isBn ? 'নিবন্ধিত ডিভাইস' : 'Registered Devices'} ({mobileDevices.length})
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
                <>
                  {/* Info Banner */}
                  <div className="bg-[var(--green-light)] border border-[var(--green)] rounded-xl p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Layers size={16} className="text-[var(--green)] mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[0.75rem] font-semibold text-[var(--green)]">
                          {isBn ? 'কিওস্ক মোড' : 'Kiosk Mode'}
                        </div>
                        <div className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                          {isBn
                            ? 'শেয়ার্ড ডিভাইস হিসেবে ব্যবহার করুন। সবাই একটি ফোনে মুখ দেখিয়ে চেক ইন করবে।'
                            : 'Use as shared device. All staff check in by showing face on one phone.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HTTPS warning */}
                  {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                    <div className="mb-4 py-3 px-4 rounded-xl bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.75rem] font-medium text-center">
                      <span className="font-bold">🔒 {isBn ? 'HTTPS প্রয়োজন!' : 'HTTPS Required!'}</span>
                      <br />
                      {isBn
                        ? 'বায়োমেট্রিক কাজ করতে https:// দিয়ে খুলুন।'
                        : 'Open with https:// for biometric to work.'}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2.5 mb-4">
                    {[
                      {
                        label: isBn ? 'নিবন্ধিত' : 'Registered',
                        value: kioskRegisteredFaces.length,
                        icon: <Layers size={15} />,
                        color: 'var(--green)',
                      },
                      {
                        label: isBn ? 'আজ চেক-ইন' : 'Today',
                        value: kioskRegisteredFaces.filter((f) => {
                          const att = attendance[date]?.[f.staffId]
                          return att?.punches?.length
                        }).length,
                        icon: <CheckCircle size={15} />,
                        color: 'var(--teal)',
                      },
                      {
                        label: isBn ? 'সক্রিয়' : 'Active',
                        value: kioskRegisteredFaces.filter((f) => {
                          const att = attendance[date]?.[f.staffId]
                          return att?.status === 'present'
                        }).length,
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
                          <div className="text-[1rem] font-bold" style={{ color: s.color }}>
                            {s.value}
                          </div>
                          <div className="text-[0.625rem] text-[var(--text-muted)]">{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message */}
                  {kioskMsg && (
                    <div
                      className={`mb-3 py-2 px-3 rounded-lg text-[0.75rem] font-medium flex items-center gap-2 ${kioskMsg.type === 'success' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--red-light)] text-[var(--red)]'}`}
                    >
                      {kioskMsg.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {kioskMsg.text}
                      <button
                        onClick={() => setKioskMsg(null)}
                        className="ml-auto bg-transparent border-none cursor-pointer text-[inherit]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Identified person display */}
                  {kioskIdentified && (
                    <div className="mb-4 p-5 rounded-2xl bg-[var(--green-light)] border-2 border-[var(--green)] text-center">
                      <div className="relative w-20 h-20 mx-auto mb-3">
                        <img src={kioskIdentified.photo} alt="" className="w-full h-full rounded-2xl object-cover border-2 border-[var(--green)]" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--green)] flex items-center justify-center">
                          <CheckCircle size={14} className="text-white" />
                        </div>
                      </div>
                      <div className="text-[1.25rem] font-bold text-[var(--green)]">{kioskIdentified.staffName}</div>
                      <div className="text-[0.75rem] text-[var(--text-secondary)] font-mono mt-1">{kioskIdentified.staffId}</div>
                      <div className="mt-3 flex items-center justify-center gap-3">
                        <span className={`px-3 py-1.5 rounded-lg text-[0.8125rem] font-bold ${kioskIdentified.punchType === 'in' ? 'bg-[var(--green)] text-white' : 'bg-[var(--amber)] text-white'}`}>
                          {kioskIdentified.punchType === 'in' ? (isBn ? 'চেক-ইন' : 'CHECKED IN') : isBn ? 'চেক-আউট' : 'CHECKED OUT'}
                        </span>
                        <span className="text-[1.375rem] font-bold text-[var(--text-primary)] font-mono">{kioskIdentified.time}</span>
                      </div>
                    </div>
                  )}

                  {/* Register + Scan Side by Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {/* Register Face */}
                    <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-primary)]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--green-light)] flex items-center justify-center">
                          <ScanFace size={15} className="text-[var(--green)]" />
                        </div>
                        <div>
                          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                            {isBn ? 'মুখ নিবন্ধন' : 'Register Face'}
                          </div>
                          <div className="text-[0.625rem] text-[var(--text-muted)]">
                            {isBn ? 'ক্যামেরায় মুখ তুলুন' : 'Capture face with camera'}
                          </div>
                        </div>
                      </div>
                      <select
                        value={kioskRegStaff}
                        onChange={(e) => {
                          setKioskRegStaff(e.target.value)
                          setKioskMsg(null)
                          setKioskCapturedPhoto(null)
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-primary)] outline-none mb-2"
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
                      {kioskRegStaff && !kioskCamActive && (
                        <button
                          onClick={startKioskCamera}
                          className="w-full py-2 rounded-lg text-[0.75rem] font-semibold bg-[var(--green)] text-white border-none cursor-pointer flex items-center justify-center gap-2"
                        >
                          <ScanFace size={14} />
                          {isBn ? 'ক্যামেরা খুলুন' : 'Open Camera'}
                        </button>
                      )}
                      {kioskRegStaff && kioskCamActive && !kioskAttendanceOpen && (
                        <div className="space-y-2">
                          <div className="relative rounded-xl overflow-hidden bg-black w-full" style={{ aspectRatio: '4/3', maxHeight: '30vh' }}>
                            <video ref={kioskVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                            <canvas ref={kioskCanvasRef} className="hidden" />
                            <div className="absolute top-2 left-2 bg-black/60 rounded-lg px-2 py-1 text-white text-[0.5625rem] flex items-center gap-1 z-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
                              LIVE
                            </div>
                            {!kioskCapturedPhoto && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <div className="absolute inset-[15%] grid grid-cols-3 grid-rows-3">
                                  {[...Array(9)].map((_, i) => (
                                    <div key={i} className={`border ${kioskFaceDetected ? 'border-[var(--green)]/70' : 'border-white/30'} transition-colors duration-200`} />
                                  ))}
                                </div>
                                <div className={`w-24 h-32 border-2 rounded-[50%] transition-all duration-300 ${kioskFaceDetected ? 'border-[var(--green)] shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-white/50'}`} />
                              </div>
                            )}
                          </div>
                          {kioskCapturedPhoto ? (
                            <div className="space-y-2">
                              <img src={kioskCapturedPhoto} alt="" className="w-full max-w-[17.5rem] mx-auto rounded-xl border-2 border-[var(--green)]" />
                              <div className="flex gap-2">
                                <button onClick={() => { setKioskCapturedPhoto(null); startKioskDetectLoop() }} className="flex-1 py-2 rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-pointer">
                                  {isBn ? 'আবার' : 'Retake'}
                                </button>
                                <button onClick={kioskEditFace ? () => handleKioskUpdateFace(kioskEditFace) : handleKioskRegister} className="flex-1 py-2 rounded-lg text-[0.75rem] bg-[var(--green)] text-white border-none font-semibold cursor-pointer">
                                  {kioskEditFace ? (isBn ? 'আপডেট' : 'Update') : isBn ? 'নিবন্ধন করুন' : 'Register'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full py-2 rounded-lg text-[0.75rem] font-bold bg-[var(--green-light)] text-[var(--green)] text-center">
                              {kioskFaceDetected ? (isBn ? 'মুখ সনাক্ত হয়েছে — ধরুন...' : 'Face detected — Hold...') : (isBn ? 'মুখকে গ্রিডের মাঝখানে রাখুন' : 'Center your face in the grid')}
                            </div>
                          )}
                          <button onClick={() => { stopKioskCamera(); stopKioskDetectLoop(); setKioskCapturedPhoto(null) }} className="w-full py-2 text-[0.75rem] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none underline">
                            {isBn ? 'বন্ধ করুন' : 'Cancel'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Take Attendance */}
                    <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg-primary)]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--teal-light)] flex items-center justify-center">
                          <ScanFace size={15} className="text-[var(--teal)]" />
                        </div>
                        <div>
                          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                            {isBn ? 'উপস্থিতি নিন' : 'Take Attendance'}
                          </div>
                          <div className="text-[0.625rem] text-[var(--text-muted)]">
                            {isBn ? 'ক্যামেরায় মুখ দেখান' : 'Show face to camera'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          stopKioskCamera()
                          stopKioskDetectLoop()
                          setKioskAttendanceOpen(true)
                          setKioskCapturedPhoto(null)
                          setKioskIdentified(null)
                          setKioskMsg(null)
                          setTimeout(() => startKioskCamera(), 300)
                        }}
                        className="w-full py-3 rounded-lg text-[0.8125rem] font-bold cursor-pointer border-none bg-[var(--teal)] text-white hover:shadow-md transition-all"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <ScanFace size={16} />
                          {isBn ? 'উপস্থিতি শুরু করুন' : 'Start Attendance'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Registered Staff Table */}
                  <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                      <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                        {isBn ? `নিবন্ধিত স্টাফ (${kioskRegisteredFaces.length})` : `Registered Staff (${kioskRegisteredFaces.length})`}
                      </div>
                      <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-[0.3125rem]">
                        <Search size={12} className="text-[var(--text-muted)]" />
                        <input
                          value={kioskSearch}
                          onChange={(e) => setKioskSearch(e.target.value)}
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
                            <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.75rem]"></th>
                            <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                            <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'আইডি' : 'ID'}</th>
                            <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'পাঞ্চ' : 'Punches'}</th>
                            <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {kioskRegisteredFaces
                            .filter((f) => {
                              if (!kioskSearch) return true
                              const q = kioskSearch.toLowerCase()
                              return f.staffName.toLowerCase().includes(q) || f.staffId.toLowerCase().includes(q)
                            })
                            .map((f, i) => (
                              <tr key={f.staffId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                                <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                                <td className="p-2.5 text-center">
                                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[var(--border)] mx-auto bg-[var(--bg-secondary)]">
                                    <img src={f.photo} alt="" className="w-full h-full object-cover" />
                                  </div>
                                </td>
                                <td className="p-2.5 font-medium text-[var(--text-primary)]">{f.staffName}</td>
                                <td className="p-2.5 text-[var(--text-muted)] font-mono">{f.staffId}</td>
                                <td className="p-2.5 text-center">
                                  {(() => {
                                    const att = attendance[date]?.[f.staffId]
                                    const punches = att?.punches || []
                                    if (punches.length === 0) {
                                      return <span className="text-[var(--text-muted)]">—</span>
                                    }
                                    return (
                                      <div className="flex flex-wrap gap-1 justify-center">
                                        {punches.map((p, pi) => (
                                          <span key={pi} className={`px-1.5 py-0.5 rounded text-[0.5625rem] font-mono font-semibold ${p.type === 'in' ? 'bg-[var(--green-light)] text-[var(--green)]' : 'bg-[var(--amber-light)] text-[var(--amber)]'}`}>
                                            {p.type === 'in' ? 'IN' : 'OUT'} {p.time}
                                          </span>
                                        ))}
                                      </div>
                                    )
                                  })()}
                                </td>
                                <td className="p-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => { setKioskEditFace(f.staffId); setKioskCapturedPhoto(null); setKioskRegStaff(f.staffId); startKioskCamera() }}
                                      className="w-6 h-6 rounded-md bg-[var(--brand-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--brand)]"
                                    >
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => { if (confirm(isBn ? 'মুছে ফেলবেন?' : 'Delete?')) handleKioskDeleteFace(f.staffId) }}
                                      className="w-6 h-6 rounded-md bg-[var(--red-light)] border-0 cursor-pointer flex items-center justify-center text-[var(--red)]"
                                    >
                                      <X size={11} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {kioskRegisteredFaces.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-[var(--text-muted)] text-[0.75rem]">
                                {isBn ? 'কোনো স্টাফ নিবন্ধিত নেই' : 'No staff registered'}
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

          {/* Kiosk Attendance Popup */}
          {kioskAttendanceOpen && (
            <div className="fixed inset-0 z-[800] bg-black flex flex-col overflow-hidden">
              {/* Top: Camera feed - 2/3 */}
              <div className="relative flex-[2] min-h-0">
                <video ref={kioskVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                <canvas ref={kioskCanvasRef} className="hidden" />

                {/* Close button */}
                <button
                  onClick={() => {
                    stopKioskCamera()
                    stopKioskDetectLoop()
                    setKioskAttendanceOpen(false)
                    setKioskCapturedPhoto(null)
                    setKioskIdentified(null)
                    setKioskMsg(null)
                  }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center cursor-pointer text-white hover:bg-black/70 z-20"
                >
                  <X size={20} />
                </button>

                {/* LIVE indicator */}
                {kioskCamActive && !kioskIdentified && (
                  <div className="absolute top-4 left-4 bg-black/60 rounded-lg px-3 py-1.5 text-white text-[0.6875rem] font-medium flex items-center gap-2 z-10">
                    <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
                    {isBn ? 'লাইভ' : 'LIVE'}
                  </div>
                )}

                {/* Face guide overlay */}
                {kioskCamActive && !kioskCapturedPhoto && !kioskIdentified && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="absolute inset-[10%] grid grid-cols-3 grid-rows-3 gap-0.5">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className={`border ${kioskFaceDetected ? 'border-[var(--green)]/60' : 'border-white/15'} transition-colors duration-300`} />
                      ))}
                    </div>
                    <div className={`w-36 h-44 border-[3px] rounded-[50%] transition-all duration-300 ${kioskFaceDetected ? 'border-[var(--green)] shadow-[0_0_40px_rgba(34,197,94,0.4)]' : 'border-white/30'}`} />
                  </div>
                )}

                {/* Status text overlay */}
                {kioskCamActive && !kioskIdentified && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <div className={`px-4 py-2 rounded-full text-[0.8125rem] font-bold transition-colors duration-200 ${kioskFaceDetected ? 'bg-[var(--green)] text-white' : 'bg-black/50 text-white/80'}`}>
                      {kioskFaceDetected
                        ? isBn ? 'মুখ সনাক্ত হয়েছে — ধরুন...' : 'Face detected — Hold...'
                        : isBn ? 'মুখকে গ্রিডের মাঝখানে রাখুন' : 'Center your face in the grid'}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom: Success alert & staff info - 1/3 */}
              <div className="flex-[1] min-h-0 bg-gradient-to-t from-black via-gray-900 to-gray-900 border-t border-white/10 flex flex-col items-center justify-center px-6 relative">
                {/* Identified person card */}
                {kioskIdentified && (
                  <div className="w-full max-w-lg animate-[slideUp_0.3s_ease-out]">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 flex items-center gap-5 border border-white/10">
                      <div className="relative shrink-0">
                        <img src={kioskIdentified.photo} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-[var(--green)]" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[var(--green)] flex items-center justify-center border-2 border-gray-900">
                          <CheckCircle size={16} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[1.25rem] font-bold text-white truncate">{kioskIdentified.staffName}</div>
                        <div className="text-[0.875rem] text-white/50 font-mono mt-1">{kioskIdentified.staffId}</div>
                        <div className="mt-2">
                          <span className={`inline-block px-3 py-1 rounded-lg text-[0.75rem] font-bold ${kioskIdentified.punchType === 'in' ? 'bg-[var(--green)] text-white' : 'bg-[var(--amber)] text-white'}`}>
                            {kioskIdentified.punchType === 'in' ? (isBn ? 'চেক-ইন' : 'CHECKED IN') : isBn ? 'চেক-আউট' : 'CHECKED OUT'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[2rem] font-bold text-white font-mono leading-none">{kioskIdentified.time}</div>
                        <div className="text-[0.6875rem] text-white/40 mt-1">{isBn ? 'পাঞ্চ সময়' : 'Punch Time'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success/Error message */}
                {kioskMsg && (
                  <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-[0.8125rem] font-bold ${kioskMsg.type === 'success' ? 'bg-[var(--green)] text-white' : 'bg-[var(--red)] text-white'}`}>
                    {kioskMsg.text}
                  </div>
                )}

                {/* Waiting text when no one identified */}
                {!kioskIdentified && !kioskMsg && (
                  <div className="text-center">
                    <div className="text-white/30 text-[0.875rem] font-medium">
                      {isBn ? 'অপেক্ষা করুন...' : 'Waiting for face...'}
                    </div>
                    <div className="text-white/15 text-[0.6875rem] mt-1">
                      {isBn ? 'বন্ধ করতে X চাপুন' : 'Press X to close'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Device Modal */}
          {showAddDevice && (
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
            </div>
          )}

          {/* Add RFID Modal */}
          {showAddRFID && (
            <div className="modal-overlay">
              <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'RFID কার্ড যোগ করুন' : 'Add RFID Card'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'স্টাফ নির্বাচন করুন' : 'Select Staff'}
                    </label>
                    <select
                      value={newRFID.staffId}
                      onChange={(e) => setNewRFID((p) => ({ ...p, staffId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-secondary)] outline-none"
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
                    className="px-3.5 py-2 rounded-lg bg-[var(--brand)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
                  >
                    {isBn ? 'যোগ করুন' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Fingerprint Modal */}
          {showAddFP && (
            <div className="modal-overlay">
              <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'ফিঙ্গারপ্রিন্ট এনরোলমেন্ট' : 'Fingerprint Enrollment'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'স্টাফ নির্বাচন করুন' : 'Select Staff'}
                    </label>
                    <select
                      value={newFP.staffId}
                      onChange={(e) => setNewFP((p) => ({ ...p, staffId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-secondary)] outline-none"
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
                    className="px-3.5 py-2 rounded-lg bg-[var(--amber)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
                  >
                    {isBn ? 'এনরোল শুরু করুন' : 'Start Enrollment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Face Scan Modal */}
          {showAddFace && (
            <div className="modal-overlay">
              <div className="modal-content modal-box" style={{ maxWidth: '23.75rem' }}>
                <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-4">
                  {isBn ? 'ফেস স্ক্যান এনরোলমেন্ট' : 'Face Scan Enrollment'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-1 block">
                      {isBn ? 'স্টাফ নির্বাচন করুন' : 'Select Staff'}
                    </label>
                    <select
                      value={newFace.staffId}
                      onChange={(e) => setNewFace((p) => ({ ...p, staffId: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.75rem] text-[var(--text-secondary)] outline-none"
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
                    className="px-3.5 py-2 rounded-lg bg-[var(--green)] border-0 text-white text-[0.75rem] font-semibold cursor-pointer"
                  >
                    {isBn ? 'স্ক্যান শুরু করুন' : 'Start Scan'}
                  </button>
                </div>
              </div>
            </div>
          )}
    </>
  )
}
