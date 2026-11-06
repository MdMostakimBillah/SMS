import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'
import { isLocalComputerMode } from '@/lib/storageMode'
import { markExplicitUserDelete, isRecentExplicitDelete } from '@/lib/vault/bridge'
import { hostelApi } from '@/lib/api'
import { useAdmissionStore } from './admissionStore'
import { useFeeStore, type FeeStructure } from './feeStore'
import { useClassStore } from './classStore'

export interface HostelRoom {
  id: string
  name: string
  nameBn: string
  roomNumber: string
  floor: string
  capacity: number
  monthlyRent: number
  amenities: string
  amenitiesBn: string
  isActive: boolean
  createdAt: string
}

export interface HostelAssignment {
  id: string
  studentId: string
  roomId: string
  bedNumber: string
  monthlyRent: number
  academicYear: string
  months: number[]
  assignedDate: string
  isActive: boolean
}

export const HOSTEL_FEE_NAME = 'Hostel Fee'
export const HOSTEL_FEE_NAME_BN = 'হোস্টেল ফি'

export function hostelFeeStructureId(assignmentId: string): string {
  return `FEE-HOSTEL-${assignmentId}`
}

function buildHostelFeeStructure(a: HostelAssignment, student?: { class: string; section: string }): FeeStructure {
  return {
    id: hostelFeeStructureId(a.id),
    name: HOSTEL_FEE_NAME,
    nameBn: HOSTEL_FEE_NAME_BN,
    class: student?.class || '',
    section: student?.section || undefined,
    academicYear: a.academicYear,
    amount: a.monthlyRent,
    description: '',
    descriptionBn: '',
    isActive: a.isActive,
    type: 'monthly',
    studentId: a.studentId,
    applicableMonths: [...(a.months || [])],
    createdAt: a.assignedDate || new Date().toISOString().split('T')[0],
  }
}

function syncHostelFeeStructure(a: HostelAssignment) {
  const students = useAdmissionStore.getState().students
  const student = students.find((s) => s.id === a.studentId)
  const structureId = hostelFeeStructureId(a.id)
  const existing = useFeeStore.getState().structures.find((s) => s.id === structureId)

  if (a.monthlyRent <= 0 || !a.months || a.months.length === 0) {
    if (existing) useFeeStore.getState().deleteStructure(structureId)
    return
  }

  const next = buildHostelFeeStructure(a, student)
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

function removeHostelFeeStructure(assignmentId: string) {
  const structureId = hostelFeeStructureId(assignmentId)
  const structures = useFeeStore.getState().structures
  if (structures.some((s) => s.id === structureId)) {
    useFeeStore.getState().deleteStructure(structureId)
  }
}

function normalizeAssignment(a: HostelAssignment): HostelAssignment {
  if (Array.isArray(a.months) && a.months.length > 0) return a
  return {
    ...a,
    academicYear: a.academicYear || useClassStore.getState().institution.currentSession || '2025-26',
    months: Array.isArray(a.months) ? a.months : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  }
}

export function pruneExpiredHostelAssignments() {
  const { assignments, updateAssignment } = useHostelStore.getState()
  const currentSession = useClassStore.getState().institution.currentSession || '2025-26'
  for (const a of assignments) {
    const normalized = normalizeAssignment(a)
    if (!normalized.isActive) continue
    if (normalized.academicYear !== currentSession) {
      updateAssignment(normalized.id, { isActive: false })
    }
  }
}

interface HostelState {
  rooms: HostelRoom[]
  assignments: HostelAssignment[]
  serverSynced: boolean
  syncing: boolean
  syncError: string | null

  syncFromServer: (slugOrId?: string) => Promise<void>
  syncToServer: () => Promise<void>

  addRoom: (r: HostelRoom) => void
  updateRoom: (id: string, data: Partial<HostelRoom>) => void
  deleteRoom: (id: string) => void
  toggleRoomActive: (id: string) => void

  addAssignment: (a: HostelAssignment) => void
  updateAssignment: (id: string, data: Partial<HostelAssignment>) => void
  deleteAssignment: (id: string) => void
  toggleAssignmentActive: (id: string) => void
}

let serverSyncTimer: any = null
function queueServerSync(get: () => HostelState) {
  try {
    if (isLocalComputerMode()) return
    const state = get()
    // Guard: Never push empty hostel data to the database during startup or unhydrated state
    if (!state.serverSynced && state.rooms.length === 0 && state.assignments.length === 0) {
      return
    }
    if (serverSyncTimer) clearTimeout(serverSyncTimer)
    serverSyncTimer = setTimeout(async () => {
      try {
        const s = get()
        if (s.rooms.length === 0 && s.assignments.length === 0 && !isRecentExplicitDelete()) {
          return
        }
        await hostelApi.update({
          rooms: s.rooms,
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

function onStateMutated(get: () => HostelState) {
  queueServerSync(get)
}

export const useHostelStore = create<HostelState>()(
  persist(
    (set, get) => ({
      rooms: [
        { id: 'HR-001', name: 'Room A-101', nameBn: 'রুম A-১০১', roomNumber: 'A-101', floor: '1st Floor', capacity: 4, monthlyRent: 5000, amenities: 'Fan, Wardrobe, Study Table', amenitiesBn: 'পাখা, আলমারি, পড়ার টেবিল', isActive: true, createdAt: '2025-01-10' },
        { id: 'HR-002', name: 'Room A-102', nameBn: 'রুম A-১০২', roomNumber: 'A-102', floor: '1st Floor', capacity: 4, monthlyRent: 5000, amenities: 'Fan, Wardrobe, Study Table', amenitiesBn: 'পাখা, আলমারি, পড়ার টেবিল', isActive: true, createdAt: '2025-01-10' },
        { id: 'HR-003', name: 'Room B-201', nameBn: 'রুম B-২০১', roomNumber: 'B-201', floor: '2nd Floor', capacity: 6, monthlyRent: 4500, amenities: 'Fan, Wardrobe', amenitiesBn: 'পাখা, আলমারি', isActive: true, createdAt: '2025-01-15' },
        { id: 'HR-004', name: 'Room C-301', nameBn: 'রুম C-৩০১', roomNumber: 'C-301', floor: '3rd Floor', capacity: 2, monthlyRent: 7000, amenities: 'AC, Attached Bathroom, Wardrobe, Study Table', amenitiesBn: 'এসি, সংযুক্ত বাথরুম, আলমারি, পড়ার টেবিল', isActive: true, createdAt: '2025-02-01' },
      ],

      assignments: [
        { id: 'HA-001', studentId: 'ET-2025-10001', roomId: 'HR-001', bedNumber: '1', monthlyRent: 5000, academicYear: '2025-26', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], assignedDate: '2025-01-20', isActive: true },
        { id: 'HA-002', studentId: 'ET-2025-10002', roomId: 'HR-001', bedNumber: '2', monthlyRent: 5000, academicYear: '2025-26', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], assignedDate: '2025-01-20', isActive: true },
        { id: 'HA-003', studentId: 'ET-2025-10003', roomId: 'HR-002', bedNumber: '1', monthlyRent: 5000, academicYear: '2025-26', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], assignedDate: '2025-02-01', isActive: true },
        { id: 'HA-004', studentId: 'ET-2025-10004', roomId: 'HR-003', bedNumber: '1', monthlyRent: 4500, academicYear: '2025-26', months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], assignedDate: '2025-02-15', isActive: true },
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
          const res = await hostelApi.get(slugOrId)
          if (res) {
            const hasRooms = Array.isArray(res.rooms) && res.rooms.length > 0
            const hasAssignments = Array.isArray(res.assignments) && res.assignments.length > 0
            const state = get()

            if (hasRooms || hasAssignments) {
              set({
                rooms: res.rooms || [],
                assignments: res.assignments || [],
                serverSynced: true,
                syncing: false,
                syncError: null,
              })
            } else if (state.rooms.length > 0 || state.assignments.length > 0) {
              await hostelApi.update({
                rooms: state.rooms,
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
          console.warn('[hostelStore] syncFromServer failed:', err)
          set({ syncing: false, syncError: err?.message || 'Failed to sync hostel' })
        }
      },

      syncToServer: async () => {
        if (isLocalComputerMode()) return
        set({ syncing: true })
        try {
          const state = get()
          await hostelApi.update({
            rooms: state.rooms,
            assignments: state.assignments,
          })
          set({ serverSynced: true, syncing: false, syncError: null })
        } catch (err: any) {
          console.warn('[hostelStore] syncToServer failed:', err)
          set({ syncing: false, syncError: err?.message || 'Failed to push hostel' })
        }
      },

      addRoom: (r) => {
        set((state) => ({ rooms: [...state.rooms, r] }))
        onStateMutated(get)
      },
      updateRoom: (id, data) => {
        set((state) => ({ rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...data } : r)) }))
        onStateMutated(get)
      },
      deleteRoom: (id) => {
        markExplicitUserDelete()
        set((state) => {
          for (const a of state.assignments.filter((a) => a.roomId === id)) {
            removeHostelFeeStructure(a.id)
          }
          return {
            rooms: state.rooms.filter((r) => r.id !== id),
            assignments: state.assignments.filter((a) => a.roomId !== id),
          }
        })
        onStateMutated(get)
      },
      toggleRoomActive: (id) => {
        set((state) => ({ rooms: state.rooms.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)) }))
        onStateMutated(get)
      },

      addAssignment: (a) => {
        set((state) => ({ assignments: [...state.assignments, a] }))
        syncHostelFeeStructure(a)
        onStateMutated(get)
      },
      updateAssignment: (id, data) => {
        let updated: HostelAssignment | undefined
        set((state) => {
          const existing = state.assignments.find((a) => a.id === id)
          if (!existing) return state
          updated = { ...existing, ...data }
          return { assignments: state.assignments.map((a) => (a.id === id ? updated! : a)) }
        })
        if (updated) syncHostelFeeStructure(updated)
        onStateMutated(get)
      },
      deleteAssignment: (id) => {
        markExplicitUserDelete()
        set((state) => ({ assignments: state.assignments.filter((a) => a.id !== id) }))
        removeHostelFeeStructure(id)
        onStateMutated(get)
      },
      toggleAssignmentActive: (id) => {
        let updated: HostelAssignment | undefined
        set((state) => ({
          assignments: state.assignments.map((a) => {
            if (a.id !== id) return a
            updated = { ...a, isActive: !a.isActive }
            return updated
          }),
        }))
        if (updated) syncHostelFeeStructure(updated)
        onStateMutated(get)
      },
    }),
    { name: 'edutech-hostel', storage: createNamespacedStorage('edutech-hostel'), version: 1 }
  )
)

registerStoreReset(() => {
  useHostelStore.setState({ rooms: [], assignments: [], serverSynced: false, syncing: false, syncError: null })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-hostel_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) {
        const state = parsed.state
        if (Array.isArray(state.assignments)) {
          state.assignments = state.assignments.map(normalizeAssignment)
        }
        useHostelStore.setState(state)
      }
    }
  } catch { /* ignore */ }
  pruneExpiredHostelAssignments()
})
