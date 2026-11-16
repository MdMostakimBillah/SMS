import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useAttendanceStore } from '@/store/attendanceStore'
import { DeviceConnectionGuideModal } from './modals/DeviceConnectionGuideModal'
import { DeviceEnrollmentModal } from './modals/DeviceEnrollmentModal'
import { AddFingerprintModal } from './modals/AddFingerprintModal'
import { RfidSwipeTester } from './tabs/RfidSwipeTester'
import type { DeviceEntry, Person, RfidEntry } from './types'

describe('Attendance Device Integration & Member Enrollment', () => {
  beforeEach(() => {
    useAttendanceStore.getState().loadSampleDevices()
  })

  it('stores and manages enrolled members in attendanceStore', async () => {
    const store = useAttendanceStore.getState()
    const testDev = store.devices[0]
    expect(testDev).toBeDefined()

    // Test enrolling new members
    store.enrollMembersToDevice(testDev.id, [
      {
        personId: 'STU-TEST-999',
        personType: 'student',
        personName: 'Test Student',
        devicePin: '9999',
        cardNo: 'CARD-9999',
        fpEnrolled: true,
        faceEnrolled: false,
        enrolledAt: '2026-11-16',
        syncStatus: 'synced',
      },
    ])

    const updatedDev = useAttendanceStore.getState().devices.find((d) => d.id === testDev.id)
    expect(updatedDev?.enrolledUsers).toBeDefined()
    const member = updatedDev?.enrolledUsers?.find((m) => m.personId === 'STU-TEST-999')
    expect(member).toBeDefined()
    expect(member?.devicePin).toBe('9999')

    // Test unenrolling
    useAttendanceStore.getState().unenrollMemberFromDevice(testDev.id, 'STU-TEST-999')
    const postUnenrollDev = useAttendanceStore.getState().devices.find((d) => d.id === testDev.id)
    expect(postUnenrollDev?.enrolledUsers?.find((m) => m.personId === 'STU-TEST-999')).toBeUndefined()
  })

  it('imports USB punch logs and records attendance', async () => {
    const store = useAttendanceStore.getState()
    const testDev = store.devices[0]

    // Enroll a test member
    store.enrollMembersToDevice(testDev.id, [
      {
        personId: 'TCH-2026-001',
        personType: 'staff',
        personName: 'Dr. Rafiqul Islam',
        devicePin: '8888',
        cardNo: 'CARD-8888',
        enrolledAt: '2026-11-16',
        syncStatus: 'synced',
      },
    ])

    const res = await store.importUsbPunchLogs(testDev.id, [
      { pin: '8888', date: '2026-11-16', time: '08:30', type: 'in' },
      { pin: 'UNKNOWN_PIN', date: '2026-11-16', time: '08:35', type: 'in' },
    ])

    expect(res.processed).toBe(2)
    expect(res.matched).toBe(1)
    expect(res.failed).toBe(1)

    // Verify punch record in attendance
    const dayAtt = useAttendanceStore.getState().attendance['2026-11-16']
    expect(dayAtt).toBeDefined()
    expect(dayAtt['TCH-2026-001']).toBeDefined()
    expect(dayAtt['TCH-2026-001'].status).toBe('present')
  })

  it('renders DeviceConnectionGuideModal with all 4 guides', () => {
    render(<DeviceConnectionGuideModal isBn={false} onClose={() => {}} />)

    expect(screen.getByText(/Biometric & Punch Device Connection Guide/i)).toBeInTheDocument()
    expect(screen.getByText(/1. Local LAN \/ Wi-Fi/i)).toBeInTheDocument()
    expect(screen.getByText(/2. Cloud Push \(ADMS\)/i)).toBeInTheDocument()
    expect(screen.getByText(/3. Member Registration/i)).toBeInTheDocument()
    expect(screen.getByText(/4. USB Offline Sync/i)).toBeInTheDocument()

    // Switch to Cloud Push tab
    fireEvent.click(screen.getByText(/2. Cloud Push \(ADMS\)/i))
    expect(screen.getByText(/Server Push Webhook URL/i)).toBeInTheDocument()
    expect(screen.getByText(/api\/attendance\/push/i)).toBeInTheDocument()
  })

  it('renders DeviceEnrollmentModal and allows member operations', async () => {
    const samplePeople: Person[] = [
      { id: 'STU-100', name: 'John Doe', type: 'student', photo: '', dept: 'Class 10', section: 'A' },
      { id: 'TCH-100', name: 'Jane Smith', type: 'staff', photo: '', dept: 'Science' },
    ]

    const sampleDevice: DeviceEntry = {
      id: 'DEV-TEST',
      name: 'Test Gate Terminal',
      model: 'ZKTeco K40',
      ip: '192.168.1.200',
      status: 'online',
      type: 'punch',
      lastSync: new Date().toISOString(),
      staffCount: 0,
      enrolledUsers: [],
    }

    useAttendanceStore.getState().addDevice(sampleDevice)

    render(
      <DeviceEnrollmentModal
        isBn={false}
        device={sampleDevice}
        allPeople={samplePeople}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Test Gate Terminal')).toBeInTheDocument()
    expect(screen.getByText(/Enrolled Members/i)).toBeInTheDocument()
    expect(screen.getByText(/Enroll New/i)).toBeInTheDocument()

    // Switch to Enroll New tab
    fireEvent.click(screen.getByText(/Enroll New/i))
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()

    // Select John Doe
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // First person row checkbox

    // Click Enroll Selected
    const enrollBtn = screen.getByText(/Enroll Selected/i)
    fireEvent.click(enrollBtn)

    // Should switch back to enrolled tab and show John Doe
    await waitFor(() => {
      expect(screen.getByText(/Successfully registered/i)).toBeInTheDocument()
    })
  })

  it('allows demo data to be completely removed and does not resurrect on sync', async () => {
    const store = useAttendanceStore.getState()
    expect(store.devices.length).toBeGreaterThan(0)

    // Clear demo data
    store.clearDemoData()
    expect(useAttendanceStore.getState().devices.length).toBe(0)
    expect(useAttendanceStore.getState().demoDataCleared).toBe(true)

    // Run syncFromServer and ensure devices remain empty
    await useAttendanceStore.getState().syncFromServer()
    expect(useAttendanceStore.getState().devices.length).toBe(0)
  })

  it('enforces internet connectivity requirement in Local PC storage mode', async () => {
    const store = useAttendanceStore.getState()
    localStorage.setItem('edutech_storage_mode', 'local_computer')
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')

    const testDev: DeviceEntry = {
      id: 'DEV-LOCAL-PC',
      name: 'Local Gate Clock',
      model: 'ZKTeco K40',
      ip: '192.168.1.205',
      status: 'offline',
      type: 'punch',
      lastSync: new Date().toISOString(),
      staffCount: 0,
      enrolledUsers: [],
    }
    store.addDevice(testDev)

    // Simulate Offline
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })

    const offlineResult = await useAttendanceStore.getState().testDeviceConnection('DEV-LOCAL-PC')
    expect(offlineResult.success).toBe(false)
    expect(offlineResult.status).toBe('offline')
    expect(offlineResult.message).toContain('No internet connection')

    const offlinePunch = await useAttendanceStore.getState().recordPunch({
      personId: 'TCH-2026-001',
      method: 'punch',
      deviceId: 'DEV-LOCAL-PC',
    })
    expect(offlinePunch.success).toBe(false)

    // Simulate Online
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })

    const onlineResult = await useAttendanceStore.getState().testDeviceConnection('DEV-LOCAL-PC')
    expect(onlineResult.success).toBe(true)
    expect(onlineResult.status).toBe('online')

    const onlinePunch = await useAttendanceStore.getState().recordPunch({
      personId: 'TCH-2026-001',
      method: 'punch',
      deviceId: 'DEV-LOCAL-PC',
    })
    expect(onlinePunch.success).toBe(true)

    // Cleanup
    localStorage.removeItem('edutech_storage_mode')
    sessionStorage.removeItem('edutech_storage_mode')
  })

  it('renders AddFingerprintModal with hardware biometric and test simulator options', () => {
    const samplePeople: Person[] = [
      { id: 'TCH-01', name: 'Al-Amin Hossain', type: 'staff', photo: '' },
    ]
    const onAddMock = vi.fn()

    render(
      <AddFingerprintModal
        isBn={false}
        allPeople={samplePeople}
        newFP={{ staffId: 'TCH-01' }}
        setNewFP={() => {}}
        onAdd={onAddMock}
        onClose={() => {}}
      />
    )

    expect(screen.getByText(/Biometric Fingerprint Enrollment/i)).toBeInTheDocument()
    expect(screen.getByText(/Hardware Biometric/i)).toBeInTheDocument()
    expect(screen.getByText(/Test Simulator/i)).toBeInTheDocument()

    // Switch to simulator mode
    fireEvent.click(screen.getByText(/Test Simulator/i))
    expect(screen.getByText(/Simulate & Enroll/i)).toBeInTheDocument()
  })

  it('tests RFID card swipe with RfidSwipeTester without physical punch device', async () => {
    const sampleCards: RfidEntry[] = [
      {
        staffId: 'STU-100',
        staffName: 'Sadia Jahan',
        rfidCard: 'CARD-1045',
        type: 'Student',
        assigned: true,
      },
      {
        staffId: 'TCH-200',
        staffName: 'Kamal Ahmed',
        rfidCard: 'CARD-9999',
        type: 'Staff',
        assigned: false,
      },
    ]

    const onPunchMock = vi.fn().mockResolvedValue({ success: true })

    render(
      <RfidSwipeTester
        isBn={false}
        rfidEntries={sampleCards}
        onSimulatePunch={onPunchMock}
      />
    )

    expect(screen.getByText(/RFID Card Swipe & Scanner Test/i)).toBeInTheDocument()

    // Test with assigned card
    const input = screen.getByPlaceholderText(/Swipe card or type card ID/i)
    fireEvent.change(input, { target: { value: 'CARD-1045' } })
    fireEvent.click(screen.getByText(/Test Swipe/i))

    await waitFor(() => {
      expect(onPunchMock).toHaveBeenCalledWith('STU-100', 'rfid', 'RFID-SWIPE-TEST')
      expect(screen.getByText(/Sadia Jahan \(CARD-1045\) — RFID swipe punch recorded!/i)).toBeInTheDocument()
    })

    // Test with unassigned card
    fireEvent.change(input, { target: { value: 'CARD-9999' } })
    fireEvent.click(screen.getByText(/Test Swipe/i))

    await waitFor(() => {
      expect(screen.getByText(/is not assigned to any student or staff!/i)).toBeInTheDocument()
    })
  })
})
