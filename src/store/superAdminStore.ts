import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InstitutionStatus = 'active' | 'trial' | 'suspended' | 'inactive'

export interface InstitutionPackage {
  name: string
  nameBn: string
  maxStudents: number
  maxTeachers: number
  maxClasses: number
  storageMB: number
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
  usedStorageMB: number
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
  password: string
  accessModes: InstitutionAccessModes
}

export const PACKAGES: InstitutionPackage[] = [
  {
    name: 'Basic',
    nameBn: 'বেসিক',
    maxStudents: 150,
    maxTeachers: 20,
    maxClasses: 999,
    storageMB: 2048,
    price: 1500,
    duration: 30,
  },
  {
    name: 'Standard',
    nameBn: 'স্ট্যান্ডার্ড',
    maxStudents: 250,
    maxTeachers: 30,
    maxClasses: 999,
    storageMB: 5120,
    price: 2200,
    duration: 30,
  },
  {
    name: 'Premium',
    nameBn: 'প্রিমিয়াম',
    maxStudents: 400,
    maxTeachers: 40,
    maxClasses: 999,
    storageMB: 10240,
    price: 3000,
    duration: 30,
  },
  {
    name: 'Enterprise',
    nameBn: 'এন্টারপ্রাইজ',
    maxStudents: 500,
    maxTeachers: 50,
    maxClasses: 999,
    storageMB: 20480,
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

export const useSuperAdminStore = create<SuperAdminState>()(
  persist(
    (set) => ({
      institutions: [],
      selectedId: null,
      searchQuery: '',
      statusFilter: 'all',
      packageFilter: 'all',
      viewingInstitutionId: null,
      setSelectedId: (id) => set({ selectedId: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setStatusFilter: (s) => set({ statusFilter: s }),
      setPackageFilter: (p) => set({ packageFilter: p }),
      startViewing: (id) => set({ viewingInstitutionId: id }),
      stopViewing: () => set({ viewingInstitutionId: null }),
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
    { name: 'edutech_super_admin' }
  )
)
