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
  status: InstitutionStatus
  package: InstitutionPackage
  usedStorageMB: number
  createdAt: string
  lastLogin: string
  logo: string
  brandColor: string
}

export const PACKAGES: InstitutionPackage[] = [
  {
    name: 'Free',
    nameBn: 'ফ্রি',
    maxStudents: 100,
    maxTeachers: 10,
    maxClasses: 5,
    storageMB: 500,
    price: 0,
    duration: 30,
  },
  {
    name: 'Basic',
    nameBn: 'বেসিক',
    maxStudents: 500,
    maxTeachers: 30,
    maxClasses: 20,
    storageMB: 2048,
    price: 500,
    duration: 30,
  },
  {
    name: 'Standard',
    nameBn: 'স্ট্যান্ডার্ড',
    maxStudents: 2000,
    maxTeachers: 100,
    maxClasses: 50,
    storageMB: 10240,
    price: 1500,
    duration: 30,
  },
  {
    name: 'Premium',
    nameBn: 'প্রিমিয়াম',
    maxStudents: 5000,
    maxTeachers: 200,
    maxClasses: 100,
    storageMB: 51200,
    price: 3000,
    duration: 30,
  },
]

const demoInstitutions: Institution[] = [
  {
    id: 'INST-001',
    name: 'Sunrise Academy',
    nameBn: 'সানরাইজ একাডেমি',
    email: 'admin@sunrise.edu.bd',
    phone: '+880-1712-345678',
    address: 'Banani, Dhaka 1213',
    addressBn: 'বনানী, ঢাকা-১২১৩',
    eiin: '123456',
    website: 'www.sunrise.edu.bd',
    status: 'active',
    package: PACKAGES[2],
    usedStorageMB: 4520,
    createdAt: '2024-08-15',
    lastLogin: '2026-07-30',
    logo: '',
    brandColor: '#6366f1',
  },
  {
    id: 'INST-002',
    name: 'Dhaka International School',
    nameBn: 'ঢাকা ইন্টারন্যাশনাল স্কুল',
    email: 'info@dis.edu.bd',
    phone: '+880-1812-456789',
    address: 'Gulshan, Dhaka 1212',
    addressBn: 'গুলশান, ঢাকা-১২১২',
    eiin: '234567',
    website: 'www.dis.edu.bd',
    status: 'active',
    package: PACKAGES[3],
    usedStorageMB: 18750,
    createdAt: '2024-06-20',
    lastLogin: '2026-07-31',
    logo: '',
    brandColor: '#3b82f6',
  },
  {
    id: 'INST-003',
    name: 'Green Valley School',
    nameBn: 'গ্রিন ভ্যালি স্কুল',
    email: 'contact@greenvalley.edu.bd',
    phone: '+880-1912-567890',
    address: 'Uttara, Dhaka 1230',
    addressBn: 'উত্তরা, ঢাকা-১২৩০',
    eiin: '345678',
    website: 'www.greenvalley.edu.bd',
    status: 'trial',
    package: PACKAGES[1],
    usedStorageMB: 340,
    createdAt: '2026-07-01',
    lastLogin: '2026-07-28',
    logo: '',
    brandColor: '#22c55e',
  },
  {
    id: 'INST-004',
    name: 'Rajshahi Collegiate School',
    nameBn: 'রাজশাহী কলেজিয়েট স্কুল',
    email: 'admin@rajshahi-cs.edu.bd',
    phone: '+880-1712-678901',
    address: 'Boalia, Rajshahi 6205',
    addressBn: 'বোয়ালিয়া, রাজশাহী-৬২০৫',
    eiin: '456789',
    website: 'www.rajshahi-cs.edu.bd',
    status: 'suspended',
    package: PACKAGES[0],
    usedStorageMB: 120,
    createdAt: '2025-11-10',
    lastLogin: '2026-05-15',
    logo: '',
    brandColor: '#f59e0b',
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
      institutions: demoInstitutions,
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
