import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, getSlug } from '@/lib/storage'
import { isLocalComputerMode } from '@/lib/storageMode'
import { attendanceApi } from '@/lib/api'
import { initialDevices, initialRfidEntries, initialFpEntries } from '@/pages/attendance/deviceData'
import type { DeviceEntry, RfidEntry, FpEntry, FaceEntry, MobileDevice, DeviceLog } from '@/pages/attendance/types'
import { useTeacherStore } from './teacherStore'

export type AttendanceStatus = 'present' | 'absent' | 'on-leave'

export interface PunchRecord {
  time: string
  type: 'in' | 'out'
  method?: 'manual' | 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile'
  deviceId?: string
}

export interface DayAttendance {
  status: AttendanceStatus
  punches: PunchRecord[]
  note?: string
}

const ATTENDANCE_RETENTION_MS = 365 * 24 * 60 * 60 * 1000

function pruneAttendance(attendance: Record<string, Record<string, DayAttendance>>): Record<string, Record<string, DayAttendance>> {
  const cutoff = Date.now() - ATTENDANCE_RETENTION_MS
  const pruned: Record<string, Record<string, DayAttendance>> = {}
  for (const [dateStr, dayAtt] of Object.entries(attendance)) {
    const t = new Date(dateStr).getTime()
    if (isNaN(t) || t >= cutoff) pruned[dateStr] = dayAtt
  }
  return pruned
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null

function queueServerSync(get: () => AttendanceState) {
  // Immediately mirror attendance to teacherStore for backwards-compatibility and instant UI reactivity
  useTeacherStore.setState({ attendance: get().attendance })

  if (isLocalComputerMode()) {
    return
  }

  if (syncTimeout) clearTimeout(syncTimeout)
  syncTimeout = setTimeout(async () => {
    try {
      const state = get()
      // Update both attendance and devices
      await Promise.allSettled([
        attendanceApi.updateAttendance({ attendance: state.attendance }),
        attendanceApi.updateDevices({
          devices: state.devices,
          rfidEntries: state.rfidEntries,
          fpEntries: state.fpEntries,
          faceEntries: state.faceEntries,
          mobileDevices: state.mobileDevices,
          deviceLogs: state.deviceLogs,
        }),
      ])
    } catch (err) {
      console.warn('[attendanceStore] Server sync failed (will retry):', err)
    }
  }, 400)
}

export interface AttendanceState {
  attendance: Record<string, Record<string, DayAttendance>>
  devices: DeviceEntry[]
  rfidEntries: RfidEntry[]
  fpEntries: FpEntry[]
  faceEntries: FaceEntry[]
  mobileDevices: MobileDevice[]
  deviceLogs: DeviceLog[]

  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: (slugOrId?: string) => Promise<void>

  // Attendance actions
  markAttendance: (
    date: string,
    personId: string,
    status: AttendanceStatus,
    punch?: PunchRecord,
    note?: string
  ) => void
  markBulkAttendance: (
    date: string,
    records: Array<{ personId: string; status: AttendanceStatus; punch?: PunchRecord; note?: string }>
  ) => void
  markAllPresent: (date: string, personIds: string[], type?: 'in' | 'out') => void
  recordPunch: (payload: {
    personId: string
    date?: string
    time?: string
    type?: 'in' | 'out'
    method?: 'manual' | 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile'
    deviceId?: string
  }) => Promise<{ success: boolean; punch: PunchRecord; status: AttendanceStatus }>

  // Device actions
  setDevices: (devices: DeviceEntry[] | ((prev: DeviceEntry[]) => DeviceEntry[])) => void
  addDevice: (device: Omit<DeviceEntry, 'id'> & { id?: string }) => void
  updateDevice: (id: string, data: Partial<DeviceEntry>) => void
  deleteDevice: (id: string) => void
  testDeviceConnection: (id: string) => Promise<{ success: boolean; status: 'online' | 'offline' | 'error'; message: string }>

  // RFID actions
  setRfidEntries: (entries: RfidEntry[] | ((prev: RfidEntry[]) => RfidEntry[])) => void
  addRfidEntry: (entry: RfidEntry) => void
  updateRfidEntry: (staffId: string, data: Partial<RfidEntry>) => void
  deleteRfidEntry: (staffId: string) => void

  // Fingerprint actions
  setFpEntries: (entries: FpEntry[] | ((prev: FpEntry[]) => FpEntry[])) => void
  addFpEntry: (entry: FpEntry) => void
  updateFpEntry: (staffId: string, data: Partial<FpEntry>) => void
  deleteFpEntry: (staffId: string) => void

  // Face Scan actions
  setFaceEntries: (entries: FaceEntry[] | ((prev: FaceEntry[]) => FaceEntry[])) => void
  addFaceEntry: (entry: FaceEntry) => void
  updateFaceEntry: (staffId: string, data: Partial<FaceEntry>) => void
  deleteFaceEntry: (staffId: string) => void

  // Mobile Device actions
  setMobileDevices: (devices: MobileDevice[] | ((prev: MobileDevice[]) => MobileDevice[])) => void
  addMobileDevice: (device: MobileDevice) => void
  removeMobileDevice: (id: string) => void
  updateMobileLastAuth: (id: string, time: string) => void
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get): AttendanceState => ({
      attendance: {},
      devices: initialDevices,
      rfidEntries: initialRfidEntries,
      fpEntries: initialFpEntries,
      faceEntries: [],
      mobileDevices: [],
      deviceLogs: [],

      serverSynced: false,
      syncing: false,
      syncError: null,

      syncFromServer: async (slugOrId?: string) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false, syncError: null })
          return
        }

        const effectiveSlug = slugOrId || getSlug() || undefined
        set({ syncing: true, syncError: null })

        try {
          const res = await attendanceApi.get(effectiveSlug)
          if (res) {
            const current = get()
            const serverAtt = res.attendance && typeof res.attendance === 'object' ? res.attendance : {}
            const hasServerAtt = Object.keys(serverAtt).length > 0
            const finalAttendance = hasServerAtt ? pruneAttendance(serverAtt) : current.attendance

            const finalDevices = Array.isArray(res.devices) && res.devices.length > 0 ? res.devices : current.devices
            const finalRfid = Array.isArray(res.rfidEntries) && res.rfidEntries.length > 0 ? res.rfidEntries : current.rfidEntries
            const finalFp = Array.isArray(res.fpEntries) && res.fpEntries.length > 0 ? res.fpEntries : current.fpEntries
            const finalFace = Array.isArray(res.faceEntries) && res.faceEntries.length > 0 ? res.faceEntries : current.faceEntries
            const finalMobile = Array.isArray(res.mobileDevices) && res.mobileDevices.length > 0 ? res.mobileDevices : current.mobileDevices
            const finalLogs = Array.isArray(res.deviceLogs) && res.deviceLogs.length > 0 ? res.deviceLogs : current.deviceLogs

            set({
              attendance: finalAttendance,
              devices: finalDevices,
              rfidEntries: finalRfid,
              fpEntries: finalFp,
              faceEntries: finalFace,
              mobileDevices: finalMobile,
              deviceLogs: finalLogs,
              serverSynced: true,
              syncing: false,
              syncError: null,
            })

            useTeacherStore.setState({ attendance: finalAttendance })
          } else {
            set({ syncing: false })
          }
        } catch (err) {
          set({ syncing: false, syncError: err instanceof Error ? err.message : 'Sync failed' })
        }
      },

      markAttendance: (date, personId, status, punch, note) => {
        set((state) => {
          const dayAtt = state.attendance[date] || {}
          const existing = dayAtt[personId]
          const punches = existing?.punches || []
          const now = new Date()
          const time = punch?.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          const newPunches = punch ? [...punches, punch] : (status === 'present' && punches.length === 0 ? [{ time, type: 'in' as const, method: 'manual' as const }] : punches)

          const updatedAttendance = pruneAttendance({
            ...state.attendance,
            [date]: {
              ...dayAtt,
              [personId]: {
                status,
                punches: newPunches,
                note: note ?? existing?.note,
              },
            },
          })
          return { attendance: updatedAttendance }
        })
        queueServerSync(get)
      },

      markBulkAttendance: (date, records) => {
        set((state) => {
          const dayAtt = { ...(state.attendance[date] || {}) }
          const now = new Date()
          const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

          for (const r of records) {
            const existing = dayAtt[r.personId]
            const punches = existing?.punches || []
            const newPunches = r.punch ? [...punches, r.punch] : (r.status === 'present' && punches.length === 0 ? [{ time: defaultTime, type: 'in' as const, method: 'manual' as const }] : punches)

            dayAtt[r.personId] = {
              status: r.status,
              punches: newPunches,
              note: r.note ?? existing?.note,
            }
          }

          const updatedAttendance = pruneAttendance({
            ...state.attendance,
            [date]: dayAtt,
          })
          return { attendance: updatedAttendance }
        })
        queueServerSync(get)
      },

      markAllPresent: (date, personIds, type = 'in') => {
        set((state) => {
          const dayAtt = { ...(state.attendance[date] || {}) }
          const now = new Date()
          const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

          for (const id of personIds) {
            const existing = dayAtt[id]
            const punches = existing?.punches || []
            dayAtt[id] = {
              status: 'present',
              punches: [...punches, { time, type, method: 'manual' }],
              note: existing?.note,
            }
          }

          const updatedAttendance = pruneAttendance({
            ...state.attendance,
            [date]: dayAtt,
          })
          return { attendance: updatedAttendance }
        })
        queueServerSync(get)
      },

      recordPunch: async ({ personId, date, time, type, method = 'punch', deviceId = 'LOCAL' }) => {
        const now = new Date()
        const targetDate = date || now.toISOString().split('T')[0]
        const targetTime = time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

        let punchType = type
        const currentAtt = get().attendance[targetDate]?.[personId]
        const punches = currentAtt?.punches || []

        if (!punchType) {
          const lastPunch = punches[punches.length - 1]
          punchType = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out'
        }

        const newPunch: PunchRecord = {
          time: targetTime,
          type: punchType,
          method,
          deviceId,
        }

        const newLog: DeviceLog = {
          id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now.toISOString(),
          date: targetDate,
          time: targetTime,
          personId,
          type: punchType,
          method,
          deviceId,
        }

        set((state) => {
          const dayAtt = state.attendance[targetDate] || {}
          const existing = dayAtt[personId]
          const existingPunches = existing?.punches || []
          const updatedAttendance = pruneAttendance({
            ...state.attendance,
            [targetDate]: {
              ...dayAtt,
              [personId]: {
                status: 'present',
                punches: [...existingPunches, newPunch],
                note: existing?.note,
              },
            },
          })

          return {
            attendance: updatedAttendance,
            deviceLogs: [newLog, ...state.deviceLogs].slice(0, 500),
          }
        })

        queueServerSync(get)

        // If not in local mode, notify backend punch endpoint
        if (!isLocalComputerMode()) {
          try {
            await attendanceApi.recordPunch({
              personId,
              date: targetDate,
              time: targetTime,
              type: punchType,
              method,
              deviceId,
            })
          } catch {
            /* ignore background network errors; state was already updated locally */
          }
        }

        return { success: true, punch: newPunch, status: 'present' }
      },

      setDevices: (devices) => {
        set((state) => ({
          devices: typeof devices === 'function' ? devices(state.devices) : devices,
        }))
        queueServerSync(get)
      },

      addDevice: (dev) => {
        set((state) => {
          const id = dev.id || `DEV-${String(state.devices.length + 1).padStart(3, '0')}`
          const newDevice: DeviceEntry = {
            id,
            name: dev.name,
            model: dev.model || 'Universal Biometric',
            ip: dev.ip || '192.168.1.100',
            port: dev.port || 4370,
            status: dev.status || 'online',
            type: dev.type || 'punch',
            lastSync: new Date().toISOString(),
            staffCount: dev.staffCount || 0,
            location: dev.location || 'Main Gate',
          }
          return { devices: [...state.devices, newDevice] }
        })
        queueServerSync(get)
      },

      updateDevice: (id, data) => {
        set((state) => ({
          devices: state.devices.map((d) => (d.id === id ? { ...d, ...data } : d)),
        }))
        queueServerSync(get)
      },

      deleteDevice: (id) => {
        set((state) => ({
          devices: state.devices.filter((d) => d.id !== id),
        }))
        queueServerSync(get)
      },

      testDeviceConnection: async (id) => {
        const dev = get().devices.find((d) => d.id === id)
        if (!dev) return { success: false, status: 'error', message: 'Device not found' }

        // Simulation/verification of device ping
        const isLikelyOnline = dev.ip.startsWith('192.168.') || dev.ip.startsWith('10.') || dev.ip.startsWith('127.0.0.1') || dev.ip.includes('.')
        const newStatus = isLikelyOnline ? 'online' : 'offline'
        get().updateDevice(id, { status: newStatus, lastSync: new Date().toISOString() })
        return {
          success: isLikelyOnline,
          status: newStatus,
          message: isLikelyOnline ? `Connected to ${dev.name} (${dev.ip}) successfully.` : `Could not reach ${dev.ip}. Check LAN cable or power.`,
        }
      },

      setRfidEntries: (entries) => {
        set((state) => ({
          rfidEntries: typeof entries === 'function' ? entries(state.rfidEntries) : entries,
        }))
        queueServerSync(get)
      },

      addRfidEntry: (entry) => {
        set((state) => {
          const filtered = state.rfidEntries.filter((r) => r.staffId !== entry.staffId && r.rfidCard !== entry.rfidCard)
          return { rfidEntries: [...filtered, entry] }
        })
        queueServerSync(get)
      },

      updateRfidEntry: (staffId, data) => {
        set((state) => ({
          rfidEntries: state.rfidEntries.map((r) => (r.staffId === staffId ? { ...r, ...data } : r)),
        }))
        queueServerSync(get)
      },

      deleteRfidEntry: (staffId) => {
        set((state) => ({
          rfidEntries: state.rfidEntries.filter((r) => r.staffId !== staffId),
        }))
        queueServerSync(get)
      },

      setFpEntries: (entries) => {
        set((state) => ({
          fpEntries: typeof entries === 'function' ? entries(state.fpEntries) : entries,
        }))
        queueServerSync(get)
      },

      addFpEntry: (entry) => {
        set((state) => {
          const filtered = state.fpEntries.filter((f) => f.staffId !== entry.staffId)
          return { fpEntries: [...filtered, entry] }
        })
        queueServerSync(get)
      },

      updateFpEntry: (staffId, data) => {
        set((state) => ({
          fpEntries: state.fpEntries.map((f) => (f.staffId === staffId ? { ...f, ...data } : f)),
        }))
        queueServerSync(get)
      },

      deleteFpEntry: (staffId) => {
        set((state) => ({
          fpEntries: state.fpEntries.filter((f) => f.staffId !== staffId),
        }))
        queueServerSync(get)
      },

      setFaceEntries: (entries) => {
        set((state) => ({
          faceEntries: typeof entries === 'function' ? entries(state.faceEntries) : entries,
        }))
        queueServerSync(get)
      },

      addFaceEntry: (entry) => {
        set((state) => {
          const filtered = state.faceEntries.filter((f) => f.staffId !== entry.staffId)
          return { faceEntries: [...filtered, entry] }
        })
        queueServerSync(get)
      },

      updateFaceEntry: (staffId, data) => {
        set((state) => ({
          faceEntries: state.faceEntries.map((f) => (f.staffId === staffId ? { ...f, ...data } : f)),
        }))
        queueServerSync(get)
      },

      deleteFaceEntry: (staffId) => {
        set((state) => ({
          faceEntries: state.faceEntries.filter((f) => f.staffId !== staffId),
        }))
        queueServerSync(get)
      },

      setMobileDevices: (devices) => {
        set((state) => ({
          mobileDevices: typeof devices === 'function' ? devices(state.mobileDevices) : devices,
        }))
        queueServerSync(get)
      },

      addMobileDevice: (device) => {
        set((state) => {
          const filtered = state.mobileDevices.filter((d) => d.id !== device.id && d.credentialId !== device.credentialId)
          return { mobileDevices: [...filtered, device] }
        })
        queueServerSync(get)
      },

      removeMobileDevice: (id) => {
        set((state) => ({
          mobileDevices: state.mobileDevices.filter((d) => d.id !== id),
        }))
        queueServerSync(get)
      },

      updateMobileLastAuth: (id, time) => {
        set((state) => ({
          mobileDevices: state.mobileDevices.map((d) => (d.id === id ? { ...d, lastAuth: time } : d)),
        }))
        queueServerSync(get)
      },
    }),
    {
      name: 'edutech-attendance',
      storage: createNamespacedStorage('edutech-attendance', undefined, { debounce: true }),
      version: 1,
      partialize: (state) => ({
        attendance: state.attendance,
        devices: state.devices,
        rfidEntries: state.rfidEntries,
        fpEntries: state.fpEntries,
        faceEntries: state.faceEntries,
        mobileDevices: state.mobileDevices,
        deviceLogs: state.deviceLogs,
        serverSynced: state.serverSynced,
      }),
    }
  )
)

registerStoreReset(() => {
  useAttendanceStore.setState({
    attendance: {},
    devices: initialDevices,
    rfidEntries: initialRfidEntries,
    fpEntries: initialFpEntries,
    faceEntries: [],
    mobileDevices: [],
    deviceLogs: [],
    serverSynced: false,
    syncing: false,
    syncError: null,
  })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-attendance_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) {
        useAttendanceStore.setState(parsed.state)
        useTeacherStore.setState({ attendance: parsed.state.attendance || {} })
      }
    }
  } catch {
    /* ignore parse errors */
  }
})
