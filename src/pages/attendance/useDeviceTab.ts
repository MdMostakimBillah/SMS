import { useState, useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import { useAdmissionStore, useSessionStudents } from '@/store/admissionStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { logger } from '@/lib/logger'
import { registerWebAuthnDevice, authenticateWebAuthnDevice, getWebAuthnErrorMessage, getAuthErrorMessage, getDeviceName, saveMobileDevices } from '@/hooks/useWebAuthn'
import { useInstitutionWifi } from '@/hooks/useInstitutionWifi'
import type { Person, MobileDevice, DeviceSubTab } from './types'

export function useDeviceTab({ isBn, date }: { isBn: boolean; date: string }) {
  const { teachers } = useTeacherStore(
    useShallow((s) => ({ teachers: s.teachers }))
  )
  const activeTeachers = useMemo(() => teachers.filter((t) => t.status === 'active'), [teachers])
  const allInstitutionStudents = useAdmissionStore((s) => s.students)
  const students = useSessionStudents()
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'approved' && s.active !== false), [students])

  const defaultDemoStudents = useMemo<Person[]>(
    () => [
      { id: 'STU-2026-001', name: isBn ? 'আরাফাত রহমান' : 'Arafat Rahman', type: 'student', photo: '', dept: 'Class 10', section: 'A' },
      { id: 'STU-2026-002', name: isBn ? 'সুমাইয়া আক্তার' : 'Sumaiya Akter', type: 'student', photo: '', dept: 'Class 10', section: 'A' },
      { id: 'STU-2026-003', name: isBn ? 'তানভীর হাসান' : 'Tanvir Hasan', type: 'student', photo: '', dept: 'Class 9', section: 'B' },
      { id: 'STU-2026-004', name: isBn ? 'নুসরাত জাহান' : 'Nusrat Jahan', type: 'student', photo: '', dept: 'Class 8', section: 'A' },
      { id: 'STU-2026-005', name: isBn ? 'মাহমুদুল হাসান' : 'Mahmudul Hasan', type: 'student', photo: '', dept: 'Class 7', section: 'A' },
    ],
    [isBn]
  )

  const allPeople = useMemo<Person[]>(() => {
    const staff: Person[] = activeTeachers.map((t) => ({
      id: t.id,
      name: isBn ? t.nameBn || t.nameEn : t.nameEn,
      type: 'staff' as const,
      photo: t.photo || '',
      dept: t.departmentId,
    }))
    const stu: Person[] =
      activeStudents.length > 0
        ? activeStudents.map((s) => ({
            id: s.id,
            name: isBn ? s.nameBn || s.nameEn : s.nameEn,
            type: 'student' as const,
            photo: s.photo || '',
            dept: s.class,
            section: s.section,
          }))
        : allInstitutionStudents.length > 0
          ? []
          : defaultDemoStudents
    return [...staff, ...stu]
  }, [activeTeachers, activeStudents, allInstitutionStudents.length, defaultDemoStudents, isBn])

  // Attendance store state
  const devices = useAttendanceStore((s) => s.devices)
  const setDevices = useAttendanceStore((s) => s.setDevices)
  const rfidEntries = useAttendanceStore((s) => s.rfidEntries)
  const setRfidEntries = useAttendanceStore((s) => s.setRfidEntries)
  const fpEntries = useAttendanceStore((s) => s.fpEntries)
  const setFpEntries = useAttendanceStore((s) => s.setFpEntries)
  const faceEntries = useAttendanceStore((s) => s.faceEntries)
  const setFaceEntries = useAttendanceStore((s) => s.setFaceEntries)
  const mobileDevices = useAttendanceStore((s) => s.mobileDevices)
  const setMobileDevices = useAttendanceStore((s) => s.setMobileDevices)
  const deviceLogs = useAttendanceStore((s) => s.deviceLogs)

  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: '',
    model: '',
    ip: '',
    type: 'punch' as 'punch' | 'rfid' | 'fingerprint' | 'face' | 'multi',
  })
  const [deviceTab, setDeviceTab] = useState<DeviceSubTab>('devices')

  const [showAddRFID, setShowAddRFID] = useState(false)
  const [showAddFP, setShowAddFP] = useState(false)
  const [showAddFace, setShowAddFace] = useState(false)
  const [newRFID, setNewRFID] = useState({ staffId: '', rfidCard: '' })
  const [newFP, setNewFP] = useState({ staffId: '' })
  const [newFace, setNewFace] = useState({ staffId: '' })

  const [mobileRegStaff, setMobileRegStaff] = useState('')
  const [mobileRegPending, setMobileRegPending] = useState(false)
  const [mobileAuthStaff, setMobileAuthStaff] = useState('')
  const [mobileAuthPending, setMobileAuthPending] = useState(false)
  const [mobileAuthMsg, setMobileAuthMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mobileSearch, setMobileSearch] = useState('')
  const [authMode, setAuthMode] = useState<'personal' | 'qr-scan' | 'kiosk'>('personal')

  const wifi = useInstitutionWifi()

  const handleRegisterDevice = async () => {
    if (!mobileRegStaff) return
    const person = allPeople.find((p) => p.id === mobileRegStaff)
    if (!person) return
    setMobileRegPending(true)
    setMobileAuthMsg(null)
    try {
      const result = await registerWebAuthnDevice({
        teacherId: person.id,
        displayName: person.name,
      })
      if (result) {
        const newDev: MobileDevice = {
          id: `MOB-${Date.now()}`,
          staffId: person.id,
          staffName: person.name,
          deviceName: getDeviceName(),
          credentialId: result.credentialId,
          registeredAt: new Date().toISOString(),
          lastAuth: '',
        }
        useAttendanceStore.getState().addMobileDevice(newDev)
        saveMobileDevices([...mobileDevices, newDev])
        setMobileRegStaff('')
        setMobileAuthMsg({
          type: 'success',
          text: isBn
            ? `${newDev.staffName} সফলভাবে নিবন্ধিত হয়েছে!`
            : `${newDev.staffName} registered successfully!`,
        })
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
      setMobileAuthMsg({
        type: 'error',
        text: isBn ? 'এই ব্যক্তির জন্য কোনো ডিভাইস নিবন্ধিত নেই' : 'No device registered for this person',
      })
      return
    }
    if (wifi.institutionGateway || wifi.institutionWifi) {
      const networkCheck = await wifi.runNetworkCheck()
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
      const success = await authenticateWebAuthnDevice({ credentialId: device.credentialId })
      if (success) {
        const now = new Date()
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        const punchRes = await useAttendanceStore.getState().recordPunch({
          personId: device.staffId,
          date,
          time: timeStr,
          method: 'mobile',
          deviceId: device.id,
        })
        useAttendanceStore.getState().updateMobileLastAuth(device.id, now.toISOString())
        saveMobileDevices(useAttendanceStore.getState().mobileDevices)
        const wifiInfo = wifi.wifiConnected ? ' [WiFi ✓]' : ''
        const punchType = punchRes.punch.type
        setMobileAuthMsg({
          type: 'success',
          text: isBn
            ? `${device.staffName} ${punchType === 'in' ? 'চেক-ইন' : 'চেক-আউট'} সফল হয়েছে! (${timeStr})${wifiInfo}`
            : `${device.staffName} ${punchType === 'in' ? 'checked in' : 'checked out'} at ${timeStr}${wifiInfo}`,
        })
      }
    } catch (err) {
      logger.error('Mobile auth error', { error: (err as Error).message, name: (err as Error).name })
      setMobileAuthMsg({ type: 'error', text: getAuthErrorMessage(err, isBn) })
    }
    setMobileAuthPending(false)
  }

  const removeMobileDevice = (id: string) => {
    useAttendanceStore.getState().removeMobileDevice(id)
    saveMobileDevices(useAttendanceStore.getState().mobileDevices.filter((d) => d.id !== id))
  }

  const handleAddDevice = () => {
    if (newDevice.name && newDevice.ip) {
      useAttendanceStore.getState().addDevice({
        name: newDevice.name,
        model: newDevice.model,
        ip: newDevice.ip,
        status: 'online',
        type: newDevice.type,
        lastSync: new Date().toISOString(),
        staffCount: 0,
      })
      setShowAddDevice(false)
      setNewDevice({ name: '', model: '', ip: '', type: 'punch' })
    }
  }

  const handleAddRfid = () => {
    if (newRFID.staffId && newRFID.rfidCard) {
      const p = allPeople.find((pe) => pe.id === newRFID.staffId)
      const isStu = p ? p.type === 'student' : newRFID.staffId.startsWith('STU')
      useAttendanceStore.getState().addRfidEntry({
        staffId: newRFID.staffId,
        staffName: p ? p.name : newRFID.staffId,
        rfidCard: newRFID.rfidCard,
        type: isStu ? 'Student' : 'Staff',
        assigned: true,
      })
      setShowAddRFID(false)
      setNewRFID({ staffId: '', rfidCard: '' })
    }
  }

  const handleAddFp = () => {
    if (newFP.staffId) {
      const p = allPeople.find((pe) => pe.id === newFP.staffId)
      useAttendanceStore.getState().addFpEntry({
        staffId: newFP.staffId,
        staffName: p ? p.name : newFP.staffId,
        fpId: fpEntries.length + 1,
        templates: 2,
        status: 'enrolled',
      })
      setShowAddFP(false)
      setNewFP({ staffId: '' })
    }
  }

  const handleAddFace = () => {
    if (newFace.staffId) {
      const p = allPeople.find((pe) => pe.id === newFace.staffId)
      useAttendanceStore.getState().addFaceEntry({
        staffId: newFace.staffId,
        staffName: p ? p.name : newFace.staffId,
        faceId: faceEntries.length + 1,
        quality: 95,
        status: 'enrolled',
      })
      setShowAddFace(false)
      setNewFace({ staffId: '' })
    }
  }

  const handleSimulatePunch = async (
    personId: string,
    method: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile' = 'punch',
    deviceId?: string
  ) => {
    const p = allPeople.find((pe) => pe.id === personId)
    const name = p ? p.name : personId
    try {
      const res = await useAttendanceStore.getState().recordPunch({
        personId,
        date,
        method,
        deviceId: deviceId || 'DEV-TEST',
      })
      const pType = res.punch.type
      const msg = isBn
        ? `${name} — ${pType === 'in' ? 'পাঞ্চ ইন' : 'পাঞ্চ আউট'} রেকর্ড হয়েছে! (${res.punch.time}) [${method.toUpperCase()}]`
        : `${name} — ${pType === 'in' ? 'punch IN' : 'punch OUT'} recorded! (${res.punch.time}) [${method.toUpperCase()}]`
      setMobileAuthMsg({ type: 'success', text: msg })
      return res
    } catch {
      setMobileAuthMsg({
        type: 'error',
        text: isBn ? 'পাঞ্চ রেকর্ড করতে সমস্যা হয়েছে' : 'Failed to record punch',
      })
    }
  }

  return {
    isBn,
    date,
    allPeople,
    devices,
    setDevices,
    showAddDevice,
    setShowAddDevice,
    newDevice,
    setNewDevice,
    deviceTab,
    setDeviceTab,
    rfidEntries,
    setRfidEntries,
    fpEntries,
    setFpEntries,
    faceEntries,
    setFaceEntries,
    deviceLogs,
    showAddRFID,
    setShowAddRFID,
    showAddFP,
    setShowAddFP,
    showAddFace,
    setShowAddFace,
    newRFID,
    setNewRFID,
    newFP,
    setNewFP,
    newFace,
    setNewFace,
    mobileDevices,
    setMobileDevices,
    mobileRegStaff,
    setMobileRegStaff,
    mobileRegPending,
    mobileAuthStaff,
    setMobileAuthStaff,
    mobileAuthPending,
    mobileAuthMsg,
    setMobileAuthMsg,
    mobileSearch,
    setMobileSearch,
    authMode,
    setAuthMode,
    handleRegisterDevice,
    handleMobileAuth,
    removeMobileDevice,
    handleAddDevice,
    handleAddRfid,
    handleAddFp,
    handleAddFace,
    handleSimulatePunch,
    wifi,
  }
}
