import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAttendanceStore } from './attendanceStore'
import { useTeacherStore } from './teacherStore'

describe('useAttendanceStore', () => {
  beforeEach(() => {
    useAttendanceStore.persist?.clearStorage?.()
    useAttendanceStore.setState({
      attendance: {},
      devices: [
        {
          id: 'DEV-001',
          name: 'Main Gate RFID',
          model: 'ZKTeco SLK200',
          ip: '192.168.1.100',
          status: 'online',
          type: 'rfid',
          lastSync: '',
          staffCount: 1,
        },
      ],
      rfidEntries: [
        { staffId: 'TCH-001', staffName: 'Teacher One', rfidCard: 'CARD-1001', type: 'Staff', assigned: true },
      ],
      fpEntries: [
        { staffId: 'TCH-001', staffName: 'Teacher One', fpId: 1, templates: 2, status: 'enrolled' },
      ],
      faceEntries: [
        { staffId: 'TCH-001', staffName: 'Teacher One', faceId: 1, quality: 90, status: 'enrolled' },
      ],
      mobileDevices: [],
      deviceLogs: [],
    })
  })

  it('marks attendance for an individual person', () => {
    const store = useAttendanceStore.getState()
    store.markAttendance('2026-11-15', 'TCH-001', 'present', { time: '08:45', type: 'in', method: 'punch' })

    const updated = useAttendanceStore.getState().attendance['2026-11-15']?.['TCH-001']
    expect(updated).toBeDefined()
    expect(updated?.status).toBe('present')
    expect(updated?.punches).toHaveLength(1)
    expect(updated?.punches[0].time).toBe('08:45')
  })

  it('marks all specified people present in bulk', () => {
    const store = useAttendanceStore.getState()
    store.markAllPresent('2026-11-15', ['TCH-001', 'STU-001', 'STU-002'])

    const day = useAttendanceStore.getState().attendance['2026-11-15']
    expect(day['TCH-001']?.status).toBe('present')
    expect(day['STU-001']?.status).toBe('present')
    expect(day['STU-002']?.status).toBe('present')
  })

  it('records punches and generates device logs for punch devices', async () => {
    const store = useAttendanceStore.getState()
    const result = await store.recordPunch({
      personId: 'TCH-001',
      date: '2026-11-15',
      time: '08:30',
      type: 'in',
      method: 'punch',
      deviceId: 'DEV-005',
    })

    expect(result.success).toBe(true)
    expect(result.punch.type).toBe('in')
    expect(result.punch.time).toBe('08:30')
    expect(result.status).toBe('present')

    const logs = useAttendanceStore.getState().deviceLogs
    expect(logs.length).toBeGreaterThan(0)
    expect(logs[logs.length - 1].personId).toBe('TCH-001')
    expect(logs[logs.length - 1].method).toBe('punch')
  })

  it('supports RFID card punch simulation', async () => {
    const store = useAttendanceStore.getState()
    const res = await store.recordPunch({
      personId: 'TCH-001',
      date: '2026-11-15',
      method: 'rfid',
      deviceId: 'DEV-001',
    })

    expect(res.success).toBe(true)
    const personAtt = useAttendanceStore.getState().attendance['2026-11-15']?.['TCH-001']
    expect(personAtt?.status).toBe('present')
    expect(personAtt?.punches[0].method).toBe('rfid')
  })

  it('supports fingerprint and face scan punch records', async () => {
    const store = useAttendanceStore.getState()
    await store.recordPunch({
      personId: 'TCH-001',
      date: '2026-11-15',
      method: 'fingerprint',
      deviceId: 'FP-01',
    })
    const attFp = useAttendanceStore.getState().attendance['2026-11-15']?.['TCH-001']
    expect(attFp?.status).toBe('present')

    // Next punch alternates to out
    await store.recordPunch({
      personId: 'TCH-001',
      date: '2026-11-15',
      method: 'face',
      deviceId: 'FACE-01',
    })
    const attFace = useAttendanceStore.getState().attendance['2026-11-15']?.['TCH-001']
    expect(attFace?.punches).toHaveLength(2)
    expect(attFace?.punches[1].type).toBe('out')
  })

  it('manages devices with CRUD actions', () => {
    const store = useAttendanceStore.getState()
    store.addDevice({
      name: 'Library Punch Clock',
      model: 'ZKTeco K14 Pro',
      ip: '192.168.1.150',
      status: 'online',
      type: 'punch',
      lastSync: '',
      staffCount: 10,
    })

    let devices = useAttendanceStore.getState().devices
    expect(devices.some((d) => d.name === 'Library Punch Clock')).toBe(true)

    const dev = devices.find((d) => d.name === 'Library Punch Clock')!
    store.updateDevice(dev.id, { name: 'Main Library Clock' })
    devices = useAttendanceStore.getState().devices
    expect(devices.find((d) => d.id === dev.id)?.name).toBe('Main Library Clock')

    store.deleteDevice(dev.id)
    devices = useAttendanceStore.getState().devices
    expect(devices.some((d) => d.id === dev.id)).toBe(false)
  })

  it('mirrors attendance changes to teacherStore', () => {
    const store = useAttendanceStore.getState()
    store.markAttendance('2026-11-15', 'TCH-001', 'on-leave')

    const teacherStoreAtt = useTeacherStore.getState().attendance['2026-11-15']?.['TCH-001']
    expect(teacherStoreAtt?.status).toBe('on-leave')
  })

  it('records student attendance via face scan, RFID/QR card, and mobile device', async () => {
    const store = useAttendanceStore.getState()

    // 1. Student Face scan punch
    const faceRes = await store.recordPunch({
      personId: 'STU-2026-001',
      date: '2026-11-15',
      time: '08:15',
      type: 'in',
      method: 'face',
      deviceId: 'DEV-004',
    })
    expect(faceRes.success).toBe(true)
    expect(faceRes.status).toBe('present')
    expect(faceRes.punch.method).toBe('face')

    // Verify in attendance store
    const stuDay = useAttendanceStore.getState().attendance['2026-11-15']?.['STU-2026-001']
    expect(stuDay?.status).toBe('present')
    expect(stuDay?.punches).toHaveLength(1)
    expect(stuDay?.punches[0].time).toBe('08:15')

    // 2. Student RFID / QR card punch out
    const rfidRes = await store.recordPunch({
      personId: 'STU-2026-001',
      date: '2026-11-15',
      time: '14:30',
      type: 'out',
      method: 'rfid',
      deviceId: 'MOBILE-QR-CAM',
    })
    expect(rfidRes.success).toBe(true)
    expect(rfidRes.punch.type).toBe('out')
    expect(useAttendanceStore.getState().attendance['2026-11-15']?.['STU-2026-001']?.punches).toHaveLength(2)

    // 3. Another student punches via mobile device
    const mobRes = await store.recordPunch({
      personId: 'STU-2026-002',
      date: '2026-11-15',
      time: '08:20',
      method: 'mobile',
      deviceId: 'MOB-01',
    })
    expect(mobRes.success).toBe(true)
    expect(useAttendanceStore.getState().attendance['2026-11-15']?.['STU-2026-002']?.status).toBe('present')
  })

  it('populates student demo entries when loading sample devices', () => {
    const store = useAttendanceStore.getState()
    store.loadSampleDevices()

    const { rfidEntries, fpEntries, faceEntries } = useAttendanceStore.getState()
    expect(rfidEntries.some((r) => r.type === 'Student' || r.staffId.startsWith('STU'))).toBe(true)
    expect(fpEntries.some((f) => f.staffId.startsWith('STU'))).toBe(true)
    expect(faceEntries.some((f) => f.staffId.startsWith('STU'))).toBe(true)
  })
})
