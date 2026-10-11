import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InstitutionStatus = 'active' | 'trial' | 'suspended' | 'inactive'

export interface InstitutionPackage {
  name: string
  nameBn: string
  maxStudents: number
  maxTeachers: number
  maxClasses: number
  pricePerStudent: number
  price: number
  duration: number
}

export interface InstitutionAccessModes {
  pathBased: boolean
  subdomainBased: boolean
  customDomain: string
}

export interface Institution {
  id: string
  name: string
  nameBn: string
  email: string
  phone: string
  address: string
  addressBn: string
  eiin: string
  website: string
  subdomain: string
  slug: string
  status: InstitutionStatus
  package: InstitutionPackage
  createdAt: string
  lastLogin: string
  logo: string
  banner: string
  brandColor: string
  brandName: string
  motto: string
  mottoBn: string
  startTime: string
  endTime: string
  optionalSubjects: string[]
  sessions: string[]
  /**
   * Institution admin password — session-only convenience value so admins can
   * view/copy it right after creation. NEVER persisted: `partialize` strips it
   * on every write and `purgeLegacyInstitutionPasswords` removes it from state
   * persisted by earlier releases. Not a valid login credential: local
   * password comparison was removed in Phase 6 (fail-closed sign-in).
   */
  password?: string
  accessModes: InstitutionAccessModes
  language: 'en' | 'bn'
  theme: 'light' | 'dark'
}

export const PACKAGES: InstitutionPackage[] = [
  {
    name: 'Basic',
    nameBn: 'বেসিক',
    maxStudents: 200,
    maxTeachers: 25,
    maxClasses: 999,
    pricePerStudent: 10,
    price: 1500,
    duration: 30,
  },
  {
    name: 'Standard',
    nameBn: 'স্ট্যান্ডার্ড',
    maxStudents: 400,
    maxTeachers: 50,
    maxClasses: 999,
    pricePerStudent: 8,
    price: 2200,
    duration: 30,
  },
  {
    name: 'Premium',
    nameBn: 'প্রিমিয়াম',
    maxStudents: 800,
    maxTeachers: 100,
    maxClasses: 999,
    pricePerStudent: 6,
    price: 3000,
    duration: 30,
  },
  {
    name: 'Enterprise',
    nameBn: 'এন্টারপ্রাইজ',
    maxStudents: 9999,
    maxTeachers: 9999,
    maxClasses: 999,
    pricePerStudent: 4,
    price: 3500,
    duration: 30,
  },
]

interface SuperAdminState {
  institutions: Institution[]
  selectedId: string | null
  searchQuery: string
  statusFilter: InstitutionStatus | 'all'
  packageFilter: string
  viewingInstitutionId: string | null
  setSelectedId: (id: string | null) => void
  setSearchQuery: (q: string) => void
  setStatusFilter: (s: InstitutionStatus | 'all') => void
  setPackageFilter: (p: string) => void
  updateInstitution: (id: string, data: Partial<Institution>) => void
  addInstitution: (inst: Institution) => void
  deleteInstitution: (id: string) => void
  toggleStatus: (id: string) => void
  startViewing: (id: string) => void
  stopViewing: () => void
}

/**
 * Phase 6 — remove plaintext institution passwords persisted by earlier
 * releases. Runs once at module load, BEFORE zustand rehydrates, and rewrites
 * only the confirmed sensitive field: every other persisted institution field
 * (name, status, branding, package, …) is preserved untouched. The removed
 * value is never logged or included in any output.
 */
function purgeLegacyInstitutionPasswords() {
  try {
    const base = 'edutech_super_admin'
    const keys = Object.keys(localStorage).filter((k) => k === base || k.startsWith(`${base}_`))
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      const institutions = parsed?.state?.institutions
      if (!Array.isArray(institutions)) continue
      let changed = false
      for (const inst of institutions) {
        if (inst && typeof inst === 'object' && 'password' in inst) {
          delete inst.password
          changed = true
        }
      }
      if (changed) localStorage.setItem(key, JSON.stringify(parsed))
    }
  } catch {
    // Malformed persisted state — leave it for zustand to handle.
  }
}

purgeLegacyInstitutionPasswords()

export const useSuperAdminStore = create<SuperAdminState>()(
  persist(
    (set) => ({
      institutions: [],
      selectedId: null,
      searchQuery: '',
      statusFilter: 'all',
      packageFilter: 'all',
      viewingInstitutionId: sessionStorage.getItem('edutech_viewing_id') || null,
      setSelectedId: (id) => set({ selectedId: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setStatusFilter: (s) => set({ statusFilter: s }),
      setPackageFilter: (p) => set({ packageFilter: p }),
      startViewing: (id) => {
        sessionStorage.setItem('edutech_viewing_id', id)
        set({ viewingInstitutionId: id })
      },
      stopViewing: () => {
        sessionStorage.removeItem('edutech_viewing_id')
        set({ viewingInstitutionId: null })
      },
      updateInstitution: (id, data) =>
        set((state) => ({
          institutions: state.institutions.map((i) =>
            i.id === id ? { ...i, ...data } : i
          ),
        })),
      addInstitution: (inst) =>
        set((state) => ({ institutions: [...state.institutions, inst] })),
      deleteInstitution: (id) =>
        set((state) => ({
          institutions: state.institutions.filter((i) => i.id !== id),
        })),
      toggleStatus: (id) =>
        set((state) => ({
          institutions: state.institutions.map((i) =>
            i.id === id
              ? { ...i, status: i.status === 'active' ? 'suspended' : 'active' }
              : i
          ),
        })),
    }),
    {
      name: 'edutech_super_admin',
      partialize: (state) => {
        // `viewingInstitutionId` is session-only UI state and must not
        // persist. Phase 6 — institution credentials must never persist
        // either: `undefined` fields are dropped by JSON serialization, so
        // the key is absent entirely.
        const rest: Partial<SuperAdminState> = { ...state }
        delete rest.viewingInstitutionId
        return {
          ...rest,
          institutions: (rest.institutions ?? []).map((i) => ({ ...i, password: undefined })),
        }
      },
    }
  )
)
