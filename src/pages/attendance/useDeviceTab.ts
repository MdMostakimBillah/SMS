import { useState, useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { logger } from '@/lib/logger'
import { registerWebAuthnDevice, authenticateWebAuthnDevice, getWebAuthnErrorMessage, getAuthErrorMessage, getDeviceName, loadMobileDevices, saveMobileDevices } from '@/hooks/useWebAuthn'
import { useInstitutionWifi } from '@/hooks/useInstitutionWifi'
import type { AttendanceStatus } from '@/store/teacherStore'
import type { Person, DeviceEntry, RfidEntry, FpEntry, FaceEntry, MobileDevice, DeviceSubTab } from './types'
import { initialDevices, initialRfidEntries, initialFpEntries } from './deviceData'

export function useDeviceTab({ isBn, date }: { isBn: boolean; date: string }) {
  const { teachers, attendance } = useTeacherStore(
    useShallow((s) => ({ teachers: s.teachers, attendance: s.attendance }))
  )
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])
  const students = useAdmissionStore((s) => s.students)
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])

  const allPeople = useMemo<Person[]>(() => {
    const staff: Person[] = activeTeachers.map((t) => ({ id: t.id, name: isBn ? t.nameBn || t.nameEn : t.nameEn, type: 'staff' as const, photo: t.photo || '' }))
    const stu: Person[] = activeStudents.map((s) => ({ id: s.id, name: isBn ? s.nameBn || s.nameEn : s.nameEn, type: 'student' as const, photo: s.photo || '', dept: s.class, section: s.section }))
    return [...staff, ...stu]
  }, [activeTeachers, activeStudents, isBn])

  const [devices, setDevices] = useState<DeviceEntry[]>(initialDevices)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDevice, setNewDevice] = useState({ name: '', model: '', ip: '', type: 'rfid' as 'rfid' | 'fingerprint' | 'face' | 'multi' })
  const [deviceTab, setDeviceTab] = useState<DeviceSubTab>('devices')

  const [rfidEntries, setRfidEntries] = useState<RfidEntry[]>(initialRfidEntries)
  const [fpEntries, setFpEntries] = useState<FpEntry[]>(initialFpEntries)
  const [faceEntries, setFaceEntries] = useState<FaceEntry[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('kioskFaces') || '[]') as Array<{
        staffId: string; staffName: string; embedding?: string; embeddings?: string[]; qualityScore?: number
      }>
      return stored.map((f, i) => ({
        staffId: f.staffId, staffName: f.staffName, faceId: i + 1,
        quality: f.qualityScore || 0,
        status: (f.embedding ? 'enrolled' : 'failed') as 'enrolled' | 'failed',
      }))
    } catch { return [] }
  })

  const [showAddRFID, setShowAddRFID] = useState(false)
  const [showAddFP, setShowAddFP] = useState(false)
  const [showAddFace, setShowAddFace] = useState(false)
  const [newRFID, setNewRFID] = useState({ staffId: '', rfidCard: '' })
  const [newFP, setNewFP] = useState({ staffId: '' })
  const [newFace, setNewFace] = useState({ staffId: '' })

  const [mobileDevices, setMobileDevices] = useState<MobileDevice[]>(loadMobileDevices)
  const [mobileRegStaff, setMobileRegStaff] = useState('')
  const [mobileRegPending, setMobileRegPending] = useState(false)
  const [mobileAuthStaff, setMobileAuthStaff] = useState('')
  const [mobileAuthPending, setMobileAuthPending] = useState(false)
  const [mobileAuthMsg, setMobileAuthMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mobileSearch, setMobileSearch] = useState('')
  const [authMode, setAuthMode] = useState<'kiosk' | 'personal'>('personal')

  const wifi = useInstitutionWifi()

  const handleRegisterDevice = async () => {
    if (!mobileRegStaff) return
    const teacher = activeTeachers.find((t) => t.id === mobileRegStaff)
    if (!teacher) return
    setMobileRegPending(true)
    setMobileAuthMsg(null)
    try {
      const result = await registerWebAuthnDevice({
        teacherId: teacher.id,
        displayName: isBn ? teacher.nameBn || teacher.nameEn : teacher.nameEn,
      })
      if (result) {
        const newDev: MobileDevice = {
          id: `MOB-${Date.now()}`, staffId: teacher.id,
          staffName: isBn ? teacher.nameBn || teacher.nameEn : teacher.nameEn,
          deviceName: getDeviceName(), credentialId: result.credentialId,
          registeredAt: new Date().toISOString(), lastAuth: '',
        }
        const updated = [...mobileDevices, newDev]
        setMobileDevices(updated)
        saveMobileDevices(updated)
        setMobileRegStaff('')
        setMobileAuthMsg({ type: 'success', text: isBn ? `${newDev.staffName} সফলভাবে নিবন্ধিত হয়েছে!` : `${newDev.staffName} registered successfully!` })
      }
    } catch (err) {
      logger.error('Device registration error', { error: (err as Error).message, name: (err as Error).name })
      setMobileAuthMsg({ type: 'error', text: getWebAuthnErrorMessage(err, isBn) })
    }
    setMobileRegPending(false)
  }

  const handleMobileAuth = async () => {
    if (!mobileAuthStaff) return
    const device = mobileDevices.find((d) => d.staffId === mobileAuthStaff)
    if (!device) {
      setMobileAuthMsg({ type: 'error', text: isBn ? 'এই স্টাফের জন্য কোনো ডিভাইস নিবন্ধিত নেই' : 'No device registered for this staff' })
      return
    }
    if (wifi.institutionGateway || wifi.institutionWifi) {
      const networkCheck = await wifi.runNetworkCheck()
      if (networkCheck.onNetwork === false) {
        setMobileAuthMsg({ type: 'error', text: isBn ? `সংযোগ করা হয়নি! অনুগ্রহ করে প্রতিষ্ঠানের WiFi নেটওয়ার্কে সংযোগ করুন। (${networkCheck.info})` : `Not connected! Please connect to institution WiFi network. (${networkCheck.info})` })
        return
      }
    }
    setMobileAuthPending(true)
    setMobileAuthMsg(null)
    try {
      const success = await authenticateWebAuthnDevice({ credentialId: device.credentialId })
      if (success) {
        const now = new Date()
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const existing = attendance[date]?.[device.staffId]
        const punches = existing?.punches || []
        const lastPunch = punches[punches.length - 1]
        const punchType = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out'
        const punchesNew = [...punches, { time: timeStr, type: punchType as 'in' | 'out' }]
        const status = punchType === 'in' ? 'present' : existing?.status || 'present'
        useTeacherStore.setState({ attendance: { ...attendance, [date]: { ...attendance[date], [device.staffId]: { status: status as AttendanceStatus, punches: punchesNew } } } })
        const updatedDevices = mobileDevices.map((d) => (d.id === device.id ? { ...d, lastAuth: now.toISOString() } : d))
        setMobileDevices(updatedDevices)
        saveMobileDevices(updatedDevices)
        const wifiInfo = wifi.wifiConnected ? ' [WiFi ✓]' : ''
        setMobileAuthMsg({ type: 'success', text: isBn ? `${device.staffName} ${punchType === 'in' ? 'চেক-ইন' : 'চেক-আউট'} সফল হয়েছে! (${timeStr})${wifiInfo}` : `${device.staffName} ${punchType === 'in' ? 'checked in' : 'checked out'} at ${timeStr}${wifiInfo}` })
      }
    } catch (err) {
      logger.error('Mobile auth error', { error: (err as Error).message, name: (err as Error).name })
      setMobileAuthMsg({ type: 'error', text: getAuthErrorMessage(err, isBn) })
    }
    setMobileAuthPending(false)
  }

  const removeMobileDevice = (id: string) => {
    const updated = mobileDevices.filter((d) => d.id !== id)
    setMobileDevices(updated)
    saveMobileDevices(updated)
  }

  const handleAddDevice = () => {
    if (newDevice.name && newDevice.ip) {
      setDevices((p) => [...p, { id: `DEV-${String(p.length + 1).padStart(3, '0')}`, name: newDevice.name, model: newDevice.model, ip: newDevice.ip, status: 'offline', type: newDevice.type, lastSync: '', staffCount: 0 }])
      setShowAddDevice(false)
      setNewDevice({ name: '', model: '', ip: '', type: 'rfid' })
    }
  }

  const handleAddRfid = () => {
    if (newRFID.staffId && newRFID.rfidCard) {
      const p = allPeople.find((pe) => pe.id === newRFID.staffId)
      if (p) setRfidEntries((prev) => [...prev, { staffId: p.id, staffName: p.name, rfidCard: newRFID.rfidCard, type: p.type === 'student' ? 'Student' : 'Staff', assigned: true }])
      setShowAddRFID(false)
      setNewRFID({ staffId: '', rfidCard: '' })
    }
  }

  const handleAddFp = () => {
    if (newFP.staffId) {
      const p = allPeople.find((pe) => pe.id === newFP.staffId)
      if (p) setFpEntries((prev) => [...prev, { staffId: p.id, staffName: p.name, fpId: prev.length + 1, templates: 0, status: 'pending' }])
      setShowAddFP(false)
      setNewFP({ staffId: '' })
    }
  }

  const handleAddFace = () => {
    if (newFace.staffId) {
      const p = allPeople.find((pe) => pe.id === newFace.staffId)
      if (p) setFaceEntries((prev) => [...prev, { staffId: p.id, staffName: p.name, faceId: prev.length + 1, quality: 0, status: 'pending' }])
      setShowAddFace(false)
      setNewFace({ staffId: '' })
    }
  }

  return {
    isBn, date, allPeople,
    devices, setDevices, showAddDevice, setShowAddDevice, newDevice, setNewDevice,
    deviceTab, setDeviceTab,
    rfidEntries, setRfidEntries, fpEntries, setFpEntries, faceEntries, setFaceEntries,
    showAddRFID, setShowAddRFID, showAddFP, setShowAddFP, showAddFace, setShowAddFace,
    newRFID, setNewRFID, newFP, setNewFP, newFace, setNewFace,
    mobileDevices, mobileRegStaff, setMobileRegStaff, mobileRegPending,
    mobileAuthStaff, setMobileAuthStaff, mobileAuthPending,
    mobileAuthMsg, setMobileAuthMsg, mobileSearch, setMobileSearch, authMode, setAuthMode,
    handleRegisterDevice, handleMobileAuth, removeMobileDevice,
    handleAddDevice, handleAddRfid, handleAddFp, handleAddFace,
    wifi,
  }
}
