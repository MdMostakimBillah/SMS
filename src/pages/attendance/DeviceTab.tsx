import { useState, useMemo, useRef, useEffect } from 'react'
import { Fingerprint, CreditCard, ScanFace, Wifi, Plus } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { logger } from '@/lib/logger'
import { useScrollLock } from '@/hooks/useScrollLock'
import { registerWebAuthnDevice, authenticateWebAuthnDevice, getWebAuthnErrorMessage, getAuthErrorMessage, getDeviceName, loadMobileDevices, saveMobileDevices } from '@/hooks/useWebAuthn'
import { useInstitutionWifi } from '@/hooks/useInstitutionWifi'
import type { AttendanceStatus } from '@/store/teacherStore'
import type { Person, DeviceEntry, RfidEntry, FpEntry, FaceEntry, MobileDevice, DeviceSubTab } from './types'
import { initialDevices, initialRfidEntries, initialFpEntries } from './deviceData'
import { DeviceManagementTab } from './tabs/DeviceManagementTab'
import { RfidCardsTab } from './tabs/RfidCardsTab'
import { FingerprintTab } from './tabs/FingerprintTab'
import { FaceScanTab } from './tabs/FaceScanTab'
import { MobileTab } from './tabs/MobileTab'
import { AddDeviceModal } from './modals/AddDeviceModal'
import { AddRfidModal } from './modals/AddRfidModal'
import { AddFingerprintModal } from './modals/AddFingerprintModal'
import { AddFaceScanModal } from './modals/AddFaceScanModal'

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

  // Device state
  const [devices, setDevices] = useState<DeviceEntry[]>(initialDevices)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDevice, setNewDevice] = useState({ name: '', model: '', ip: '', type: 'rfid' as 'rfid' | 'fingerprint' | 'face' | 'multi' })
  const [deviceTab, setDeviceTab] = useState<DeviceSubTab>('devices')

  // Tab slider
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

  // Data entries
  const [rfidEntries, setRfidEntries] = useState<RfidEntry[]>(initialRfidEntries)
  const [fpEntries, setFpEntries] = useState<FpEntry[]>(initialFpEntries)
  const [faceEntries, setFaceEntries] = useState<FaceEntry[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('kioskFaces') || '[]') as Array<{
        staffId: string; staffName: string; embedding?: string; embeddings?: string[]; qualityScore?: number
      }>
      return stored.map((f, i) => ({
        staffId: f.staffId,
        staffName: f.staffName,
        faceId: i + 1,
        quality: f.qualityScore || 0,
        status: (f.embedding ? 'enrolled' : 'failed') as 'enrolled' | 'failed',
      }))
    } catch {
      return []
    }
  })

  // Modal states
  const [showAddRFID, setShowAddRFID] = useState(false)
  const [showAddFP, setShowAddFP] = useState(false)
  const [showAddFace, setShowAddFace] = useState(false)
  const [newRFID, setNewRFID] = useState({ staffId: '', rfidCard: '' })
  const [newFP, setNewFP] = useState({ staffId: '' })
  const [newFace, setNewFace] = useState({ staffId: '' })

  // Mobile WebAuthn state
  const [mobileDevices, setMobileDevices] = useState<MobileDevice[]>(loadMobileDevices)
  const [mobileRegStaff, setMobileRegStaff] = useState('')
  const [mobileRegPending, setMobileRegPending] = useState(false)
  const [mobileAuthStaff, setMobileAuthStaff] = useState('')
  const [mobileAuthPending, setMobileAuthPending] = useState(false)
  const [mobileAuthMsg, setMobileAuthMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [mobileSearch, setMobileSearch] = useState('')
  const [authMode, setAuthMode] = useState<'kiosk' | 'personal'>('personal')

  // WiFi
  const wifi = useInstitutionWifi()

  useScrollLock(showAddDevice || showAddRFID || showAddFP || showAddFace)

  // Mobile handlers
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
          id: `MOB-${Date.now()}`,
          staffId: teacher.id,
          staffName: isBn ? teacher.nameBn || teacher.nameEn : teacher.nameEn,
          deviceName: getDeviceName(),
          credentialId: result.credentialId,
          registeredAt: new Date().toISOString(),
          lastAuth: '',
        }
        const updated = [...mobileDevices, newDev]
        setMobileDevices(updated)
        saveMobileDevices(updated)
        setMobileRegStaff('')
        setMobileAuthMsg({
          type: 'success',
          text: isBn ? `${newDev.staffName} সফলভাবে নিবন্ধিত হয়েছে!` : `${newDev.staffName} registered successfully!`,
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
        text: isBn ? 'এই স্টাফের জন্য কোনো ডিভাইস নিবন্ধিত নেই' : 'No device registered for this staff',
      })
      return
    }

    if (wifi.institutionGateway || wifi.institutionWifi) {
      wifi.setWifiChecking(true)
      const networkCheck = await wifi.checkInstitutionNetwork()
      wifi.setWifiChecking(false)
      wifi.setWifiConnected(networkCheck.onNetwork)

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
        saveMobileDevices(updatedDevices)
        const wifiInfo = wifi.wifiConnected ? ' [WiFi ✓]' : ''
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
    const updated = mobileDevices.filter((d) => d.id !== id)
    setMobileDevices(updated)
    saveMobileDevices(updated)
  }

  // Add device modal handler
  const handleAddDevice = () => {
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
      setNewDevice({ name: '', model: '', ip: '', type: 'rfid' })
    }
  }

  // Add RFID modal handler
  const handleAddRfid = () => {
    if (newRFID.staffId && newRFID.rfidCard) {
      const p = allPeople.find((pe) => pe.id === newRFID.staffId)
      if (p) setRfidEntries((prev) => [...prev, { staffId: p.id, staffName: p.name, rfidCard: newRFID.rfidCard, type: p.type === 'student' ? 'Student' : 'Staff', assigned: true }])
      setShowAddRFID(false)
      setNewRFID({ staffId: '', rfidCard: '' })
    }
  }

  // Add FP modal handler
  const handleAddFp = () => {
    if (newFP.staffId) {
      const p = allPeople.find((pe) => pe.id === newFP.staffId)
      if (p) setFpEntries((prev) => [...prev, { staffId: p.id, staffName: p.name, fpId: prev.length + 1, templates: 0, status: 'pending' }])
      setShowAddFP(false)
      setNewFP({ staffId: '' })
    }
  }

  // Add Face modal handler
  const handleAddFace = () => {
    if (newFace.staffId) {
      const p = allPeople.find((pe) => pe.id === newFace.staffId)
      if (p) setFaceEntries((prev) => [...prev, { staffId: p.id, staffName: p.name, faceId: prev.length + 1, quality: 0, status: 'pending' }])
      setShowAddFace(false)
      setNewFace({ staffId: '' })
    }
  }

  const sectionTabs = [
    { key: 'devices' as const, lBn: 'ডিভাইস', lEn: 'Devices', Icon: Fingerprint, color: '#7C3AED' },
    { key: 'rfid' as const, lBn: 'RFID কার্ড', lEn: 'RFID Cards', Icon: CreditCard, color: 'var(--brand)' },
    { key: 'fingerprint' as const, lBn: 'ফিঙ্গারপ্রিন্ট', lEn: 'Fingerprint', Icon: Fingerprint, color: 'var(--amber)' },
    { key: 'face' as const, lBn: 'ফেস স্ক্যান', lEn: 'Face Scan', Icon: ScanFace, color: 'var(--green)' },
    { key: 'mobile' as const, lBn: 'মোবাইল', lEn: 'Mobile', Icon: Wifi, color: 'var(--teal)' },
  ]

  return (
    <>
      {/* Device sub-tabs */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3.5 py-[0.625rem] mb-3.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-[0.6875rem] font-medium text-[var(--text-muted)] shrink-0">{isBn ? 'সেকশন:' : 'Section:'}</span>
        <div ref={sectionTabsRef} className="relative flex gap-1 bg-[var(--bg-secondary)] rounded-lg p-1 shrink-0">
          {sectionTabs.map((tab) => (
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
          <button onClick={() => setShowAddDevice(true)} className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg bg-[#7C3AED] text-white text-[0.6875rem] cursor-pointer font-medium">
            <Plus size={12} />
            {isBn ? 'ডিভাইস যোগ' : 'Add Device'}
          </button>
        )}
        {deviceTab === 'rfid' && (
          <button onClick={() => setShowAddRFID(true)} className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] cursor-pointer font-medium">
            <Plus size={12} />
            {isBn ? 'কার্ড যোগ' : 'Add Card'}
          </button>
        )}
        {deviceTab === 'fingerprint' && (
          <button onClick={() => setShowAddFP(true)} className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg bg-[var(--amber)] text-white text-[0.6875rem] cursor-pointer font-medium">
            <Fingerprint size={12} />
            {isBn ? 'এনরোল' : 'Enroll FP'}
          </button>
        )}
        {deviceTab === 'face' && (
          <button onClick={() => setShowAddFace(true)} className="flex items-center gap-[0.3125rem] px-3 py-[0.375rem] rounded-lg bg-[var(--green)] text-white text-[0.6875rem] cursor-pointer font-medium">
            <ScanFace size={12} />
            {isBn ? 'স্ক্যান' : 'Scan Face'}
          </button>
        )}
      </div>

      {deviceTab === 'devices' && <DeviceManagementTab isBn={isBn} devices={devices} setDevices={setDevices} />}
      {deviceTab === 'rfid' && <RfidCardsTab isBn={isBn} rfidEntries={rfidEntries} setRfidEntries={setRfidEntries} />}
      {deviceTab === 'fingerprint' && <FingerprintTab isBn={isBn} fpEntries={fpEntries} setFpEntries={setFpEntries} />}
      {deviceTab === 'face' && <FaceScanTab isBn={isBn} faceEntries={faceEntries} setFaceEntries={setFaceEntries} />}
      {deviceTab === 'mobile' && (
        <MobileTab
          isBn={isBn}
          date={date}
          allPeople={allPeople}
          mobileDevices={mobileDevices}
          setMobileDevices={setMobileDevices}
          mobileRegStaff={mobileRegStaff}
          setMobileRegStaff={setMobileRegStaff}
          mobileRegPending={mobileRegPending}
          handleRegisterDevice={handleRegisterDevice}
          mobileAuthStaff={mobileAuthStaff}
          setMobileAuthStaff={setMobileAuthStaff}
          mobileAuthPending={mobileAuthPending}
          handleMobileAuth={handleMobileAuth}
          removeMobileDevice={removeMobileDevice}
          mobileSearch={mobileSearch}
          setMobileSearch={setMobileSearch}
          mobileAuthMsg={mobileAuthMsg}
          setMobileAuthMsg={() => setMobileAuthMsg(null)}
          institutionGateway={wifi.institutionGateway}
          wifiConnected={wifi.wifiConnected}
          authMode={authMode}
          setAuthMode={setAuthMode}
          showWifiSettings={wifi.showWifiSettings}
          setShowWifiSettings={wifi.setShowWifiSettings}
          institutionWifi={wifi.institutionWifi}
          setInstitutionWifi={wifi.setInstitutionWifi}
          institutionGatewayValue={wifi.institutionGateway}
          setInstitutionGateway={wifi.setInstitutionGateway}
          saveWifiSettings={wifi.saveWifiSettings}
          wifiChecking={wifi.wifiChecking}
          runNetworkCheck={wifi.runNetworkCheck}
        />
      )}

      {showAddDevice && (
        <AddDeviceModal isBn={isBn} newDevice={newDevice} setNewDevice={setNewDevice} onAdd={handleAddDevice} onClose={() => setShowAddDevice(false)} />
      )}
      {showAddRFID && (
        <AddRfidModal isBn={isBn} allPeople={allPeople} newRFID={newRFID} setNewRFID={setNewRFID} onAdd={handleAddRfid} onClose={() => setShowAddRFID(false)} />
      )}
      {showAddFP && (
        <AddFingerprintModal isBn={isBn} allPeople={allPeople} newFP={newFP} setNewFP={setNewFP} onAdd={handleAddFp} onClose={() => setShowAddFP(false)} />
      )}
      {showAddFace && (
        <AddFaceScanModal isBn={isBn} allPeople={allPeople} newFace={newFace} setNewFace={setNewFace} onAdd={handleAddFace} onClose={() => setShowAddFace(false)} />
      )}
    </>
  )
}
