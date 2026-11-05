import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad, flushPendingWrites } from '@/lib/storage'
import { isLocalComputerMode } from '@/lib/storageMode'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { transportApi } from '@/lib/api'
import { useAdmissionStore } from './admissionStore'
import { useFeeStore, type FeeStructure } from './feeStore'
import { useClassStore } from './classStore'

export interface TransportVehicle {
  id: string
  name: string
  nameBn: string
  registrationNo: string
  capacity: number
  driverId: string
  driverName: string
  driverNameBn: string
  driverPhone: string
  driverDetails: string
  vehicleDetails: string
  routeIds: string[]
  isActive: boolean
  createdAt: string
}

export interface TransportRoute {
  id: string
  name: string
  nameBn: string
  stops: string
  stopsBn: string
  distance: string
  fare: number
  isActive: boolean
  createdAt: string
}

export interface TransportAssignment {
  id: string
  studentId: string
  vehicleId: string
  routeId: string
  pickupStop: string
  monthlyFare: number
  academicYear: string
  months: number[]
  assignedDate: string
  isActive: boolean
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
]

export const TRANSPORT_FEE_NAME = 'Transport Fee'
export const TRANSPORT_FEE_NAME_BN = 'পরিবহন ফি'

export function transportFeeStructureId(assignmentId: string): string {
  return `FEE-TRANS-${assignmentId}`
}

function buildTransportFeeStructure(a: TransportAssignment, student?: { class: string; section: string }): FeeStructure {
  return {
    id: transportFeeStructureId(a.id),
    name: TRANSPORT_FEE_NAME,
    nameBn: TRANSPORT_FEE_NAME_BN,
    class: student?.class || '',
    section: student?.section || undefined,
    academicYear: a.academicYear,
    amount: a.monthlyFare,
    description: '',
    descriptionBn: '',
    isActive: a.isActive,
    type: 'monthly',
    studentId: a.studentId,
    applicableMonths: [...(a.months || [])],
    createdAt: a.assignedDate || new Date().toISOString().split('T')[0],
  }
}

function syncTransportFeeStructure(a: TransportAssignment) {
  const students = useAdmissionStore.getState().students
  const student = students.find((s) => s.id === a.studentId)
  const structureId = transportFeeStructureId(a.id)
  const existing = useFeeStore.getState().structures.find((s) => s.id === structureId)

  if (a.monthlyFare <= 0 || !a.months || a.months.length === 0) {
    if (existing) useFeeStore.getState().deleteStructure(structureId)
    return
  }

  const next = buildTransportFeeStructure(a, student)
  if (existing) {
    useFeeStore.getState().updateStructure(structureId, {
      amount: next.amount,
      isActive: next.isActive,
      class: next.class,
      section: next.section,
      academicYear: next.academicYear,
      applicableMonths: next.applicableMonths,
    })
  } else {
    useFeeStore.getState().addStructure(next)
  }
}

function removeTransportFeeStructure(assignmentId: string) {
  const structureId = transportFeeStructureId(assignmentId)
  const structures = useFeeStore.getState().structures
  if (structures.some((s) => s.id === structureId)) {
    useFeeStore.getState().deleteStructure(structureId)
  }
}

interface TransportState {
  vehicles: TransportVehicle[]
  routes: TransportRoute[]
  assignments: TransportAssignment[]
  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>

  addVehicle: (v: TransportVehicle) => void
  updateVehicle: (id: string, data: Partial<TransportVehicle>) => void
  deleteVehicle: (id: string) => void
  toggleVehicleActive: (id: string) => void

  addRoute: (r: TransportRoute) => void
  updateRoute: (id: string, data: Partial<TransportRoute>) => void
  deleteRoute: (id: string) => void
  toggleRouteActive: (id: string) => void

  addAssignment: (a: TransportAssignment) => void
  updateAssignment: (id: string, data: Partial<TransportAssignment>) => void
  deleteAssignment: (id: string) => void
  toggleAssignmentActive: (id: string) => void
}

let serverSyncTimer: any = null
function queueServerSync(get: () => TransportState) {
  try {
    if (isLocalComputerMode()) return
    const state = get()
    // Guard: Never push empty transport data to the database during startup or unhydrated state
    if (!state.serverSynced && state.vehicles.length === 0 && state.routes.length === 0 && state.assignments.length === 0) {
      return
    }
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        if (s.vehicles.length === 0 && s.routes.length === 0 && s.assignments.length === 0 && !isRecentExplicitDelete()) {
          return
        }
        await transportApi.update({
          vehicles: s.vehicles,
          routes: s.routes,
          assignments: s.assignments,
        })
      } catch {
        // Warning only
      }
    }, 400)
  } catch {
    /* ignore */
  }
}

function onStateMutated(get: () => TransportState) {
  flushPendingWrites()
  queueServerSync(get)
}

export const useTransportStore = create<TransportState>()(
  persist(
    (set, get) => ({
      vehicles: [
        {
          id: 'TV-001',
          name: 'Bus-01',
          nameBn: 'বাস-০১',
          registrationNo: 'ঢাকা মেট্রো গ-১২-৩৪৫৬',
          capacity: 40,
          driverId: '',
          driverName: 'Kamal Hossain',
          driverNameBn: 'কামাল হোসেন',
          driverPhone: '01712345678',
          driverDetails: 'License: DL-2020-1234, Experience: 8 years',
          vehicleDetails: 'Toyota Coaster 2020, Color: White, seats: 40',
          routeIds: ['TR-001', 'TR-002'],
          isActive: true,
          createdAt: '2025-01-15',
        },
        {
          id: 'TV-002',
          name: 'Bus-02',
          nameBn: 'বাস-০২',
          registrationNo: 'ঢাকা মেট্রো খ-৭৮-১২৩৪',
          capacity: 35,
          driverId: '',
          driverName: 'Rafiq Uddin',
          driverNameBn: 'রফিক উদ্দিন',
          driverPhone: '01812345678',
          driverDetails: 'License: DL-2019-5678, Experience: 10 years',
          vehicleDetails: 'Hyundai County 2019, Color: Blue, seats: 35',
          routeIds: ['TR-003'],
          isActive: true,
          createdAt: '2025-02-10',
        },
        {
          id: 'TV-003',
          name: 'Van-01',
          nameBn: 'ভ্যান-০১',
          registrationNo: 'ঢাকা মেট্রো ঙ-৪৫-৬৭৮৯',
          capacity: 15,
          driverId: '',
          driverName: 'Sohel Rana',
          driverNameBn: 'সোহেল রানা',
          driverPhone: '01912345678',
          driverDetails: 'License: DL-2021-9012, Experience: 5 years',
          vehicleDetails: 'Minibus 2021, Color: Yellow, seats: 15',
          routeIds: ['TR-001'],
          isActive: true,
          createdAt: '2025-03-05',
        },
      ],

      routes: [
        {
          id: 'TR-001',
          name: 'Mirpur-10 to School',
          nameBn: 'মিরপুর-১০ থেকে স্কুল',
          stops: 'Mirpur-10, Mirpur-11, Pallabi, School',
          stopsBn: 'মিরপুর-১০, মিরপুর-১১, পল্লবী, স্কুল',
          distance: '5 km',
          fare: 2000,
          isActive: true,
          createdAt: '2025-01-10',
        },
        {
          id: 'TR-002',
          name: 'Uttara to School',
          nameBn: 'উত্তরা থেকে স্কুল',
          stops: 'Uttara Sector-3, Azampur, Tongi, School',
          stopsBn: 'উত্তরা সেক্টর-৩, আজমপুর, টঙ্গী, স্কুল',
          distance: '12 km',
          fare: 3000,
          isActive: true,
          createdAt: '2025-01-10',
        },
        {
          id: 'TR-003',
          name: 'Banani to School',
          nameBn: 'বনানী থেকে স্কুল',
          stops: 'Banani-11, Khilgaon, Motijheel, School',
          stopsBn: 'বনানী-১১, খিলগাঁও, মতিঝিল, স্কুল',
          distance: '8 km',
          fare: 2500,
          isActive: true,
          createdAt: '2025-02-01',
        },
      ],

      assignments: [
        { id: 'TA-001', studentId: 'ET-2025-10001', vehicleId: 'TV-001', routeId: 'TR-001', pickupStop: 'Mirpur-10', monthlyFare: 2000, academicYear: '2025-26', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], assignedDate: '2025-01-20', isActive: true },
        { id: 'TA-002', studentId: 'ET-2025-10002', vehicleId: 'TV-001', routeId: 'TR-001', pickupStop: 'Mirpur-11', monthlyFare: 2000, academicYear: '2025-26', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], assignedDate: '2025-01-20', isActive: true },
        { id: 'TA-003', studentId: 'ET-2025-10003', vehicleId: 'TV-001', routeId: 'TR-002', pickupStop: 'Uttara Sector-3', monthlyFare: 3000, academicYear: '2025-26', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], assignedDate: '2025-02-01', isActive: true },
        { id: 'TA-004', studentId: 'ET-2025-10004', vehicleId: 'TV-002', routeId: 'TR-003', pickupStop: 'Banani-11', monthlyFare: 2500, academicYear: '2025-26', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], assignedDate: '2025-02-15', isActive: true },
        { id: 'TA-005', studentId: 'ET-2025-10005', vehicleId: 'TV-003', routeId: 'TR-001', pickupStop: 'Pallabi', monthlyFare: 2000, academicYear: '2025-26', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], assignedDate: '2025-03-10', isActive: true },
      ],
      serverSynced: false,
      syncing: false,
      syncError: null,

      syncFromServer: async (slugOrId?: string) => {
        if (isLocalComputerMode()) {
          set({ serverSynced: true, syncing: false })
          return
        }
        set({ syncing: true, syncError: null })
        try {
          const res = await transportApi.get(slugOrId)
          if (res) {
            const hasVehicles = Array.isArray(res.vehicles) && res.vehicles.length > 0
            const hasRoutes = Array.isArray(res.routes) && res.routes.length > 0
            const hasAssignments = Array.isArray(res.assignments) && res.assignments.length > 0
            const state = get()

            if (hasVehicles || hasRoutes || hasAssignments) {
              set({
                vehicles: res.vehicles || [],
                routes: res.routes || [],
                assignments: res.assignments || [],
                serverSynced: true,
                syncing: false,
                syncError: null,
              })
            } else if (state.vehicles.length > 0 || state.routes.length > 0 || state.assignments.length > 0) {
              await transportApi.update({
                vehicles: state.vehicles,
                routes: state.routes,
                assignments: state.assignments,
                schoolId: slugOrId,
              })
              set({ serverSynced: true, syncing: false, syncError: null })
            } else {
              set({ serverSynced: true, syncing: false, syncError: null })
            }
          } else {
            set({ serverSynced: true, syncing: false, syncError: null })
          }
        } catch (err: any) {
          console.warn('[transportStore] syncFromServer failed:', err)
          set({ syncing: false, syncError: err?.message || 'Failed to sync transport' })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        set({ syncing: true })
        try {
          const state = get()
          await transportApi.update({
            vehicles: state.vehicles,
            routes: state.routes,
            assignments: state.assignments,
          })
          set({ serverSynced: true, syncing: false, syncError: null })
        } catch (err: any) {
          console.warn('[transportStore] syncToServer failed:', err)
          set({ syncing: false, syncError: err?.message || 'Failed to push transport' })
        }
      },

      addVehicle: (v) => {
        set((state) => ({ vehicles: [...state.vehicles, v] }))
        onStateMutated(get)
      },
      updateVehicle: (id, data) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...data } : v)),
        }))
        onStateMutated(get)
      },
      deleteVehicle: (id) => {
        markExplicitUserDelete()
        set((state) => {
          for (const a of state.assignments.filter((a) => a.vehicleId === id)) {
            removeTransportFeeStructure(a.id)
          }
          return {
            vehicles: state.vehicles.filter((v) => v.id !== id),
            assignments: state.assignments.filter((a) => a.vehicleId !== id),
          }
        })
        onStateMutated(get)
      },
      toggleVehicleActive: (id) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v)),
        }))
        onStateMutated(get)
      },

      addRoute: (r) => {
        set((state) => ({ routes: [...state.routes, r] }))
        onStateMutated(get)
      },
      updateRoute: (id, data) => {
        set((state) => ({
          routes: state.routes.map((r) => (r.id === id ? { ...r, ...data } : r)),
        }))
        onStateMutated(get)
      },
      deleteRoute: (id) => {
        markExplicitUserDelete()
        set((state) => {
          for (const a of state.assignments.filter((a) => a.routeId === id)) {
            removeTransportFeeStructure(a.id)
          }
          return {
            routes: state.routes.filter((r) => r.id !== id),
            vehicles: state.vehicles.map((v) => ({
              ...v,
              routeIds: v.routeIds.filter((rid) => rid !== id),
            })),
            assignments: state.assignments.filter((a) => a.routeId !== id),
          }
        })
        onStateMutated(get)
      },
      toggleRouteActive: (id) => {
        set((state) => ({
          routes: state.routes.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
        }))
        onStateMutated(get)
      },

      addAssignment: (a) => {
        set((state) => ({ assignments: [...state.assignments, a] }))
        syncTransportFeeStructure(a)
        onStateMutated(get)
      },
      updateAssignment: (id, data) => {
        let updated: TransportAssignment | undefined
        set((state) => {
          const existing = state.assignments.find((a) => a.id === id)
          if (!existing) return state
          updated = { ...existing, ...data }
          return { assignments: state.assignments.map((a) => (a.id === id ? updated! : a)) }
        })
        if (updated) syncTransportFeeStructure(updated)
        onStateMutated(get)
      },
      deleteAssignment: (id) => {
        markExplicitUserDelete()
        set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) }))
        removeTransportFeeStructure(id)
        onStateMutated(get)
      },
      toggleAssignmentActive: (id) => {
        let updated: TransportAssignment | undefined
        set((state) => ({
          assignments: state.assignments.map((a) => {
            if (a.id !== id) return a
            updated = { ...a, isActive: !a.isActive }
            return updated
          }),
        }))
        if (updated) syncTransportFeeStructure(updated)
        onStateMutated(get)
      },
    }),
    { name: 'edutech-transport', storage: createNamespacedStorage('edutech-transport'), version: 1 }
  )
)

function normalizeAssignment(a: TransportAssignment): TransportAssignment {
  if (Array.isArray(a.months) && a.months.length > 0) return a
  return {
    ...a,
    academicYear: a.academicYear || useClassStore.getState().institution.currentSession || '2025-26',
    months: Array.isArray(a.months) ? a.months : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  }
}

export function pruneExpiredAssignments() {
  const { assignments, updateAssignment } = useTransportStore.getState()
  const currentSession = useClassStore.getState().institution.currentSession || '2025-26'
  for (const a of assignments) {
    const normalized = normalizeAssignment(a)
    if (!normalized.isActive) continue
    const sessionExpired = normalized.academicYear !== currentSession
    if (sessionExpired) {
      updateAssignment(normalized.id, { isActive: false })
    }
  }
}

registerStoreReset(() => {
  useTransportStore.setState({ vehicles: [], routes: [], assignments: [], serverSynced: false, syncing: false, syncError: null })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-transport_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) {
        const state = parsed.state
        if (Array.isArray(state.assignments)) {
          state.assignments = state.assignments.map(normalizeAssignment)
        }
        useTransportStore.setState(state)
      }
    }
  } catch { /* ignore */ }
  pruneExpiredAssignments()
})
