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
    website: 'smsappbd.vercel.app/i/sunrise',
    subdomain: 'sunrise',
    status: 'active',
    package: PACKAGES[2],
    usedStorageMB: 4520,
    createdAt: '2024-08-15',
    lastLogin: '2026-07-30',
    logo: '',
    banner: '',
    brandColor: '#6366f1',
    brandName: 'Sunrise Academy',
    motto: 'Knowledge is Power',
    mottoBn: 'জ্ঞাই হলো শক্তি',
    startTime: '07:30',
    endTime: '14:30',
    optionalSubjects: [],
    sessions: ['2024-25', '2025-26'],
    password: 'Sunrise@2024',
    slug: 'sunrise',
    accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
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
    website: 'smsappbd.vercel.app/i/dis',
    subdomain: 'dis',
    status: 'active',
    package: PACKAGES[3],
    usedStorageMB: 18750,
    createdAt: '2024-06-20',
    lastLogin: '2026-07-31',
    logo: '',
    banner: '',
    brandColor: '#3b82f6',
    brandName: 'DIS',
    motto: '',
    mottoBn: '',
    startTime: '08:00',
    endTime: '15:00',
    optionalSubjects: [],
    sessions: ['2024-25', '2025-26'],
    password: 'Dis@2024',
    slug: 'dis',
    accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
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
    website: 'smsappbd.vercel.app/i/greenvalley',
    subdomain: 'greenvalley',
    status: 'trial',
    package: PACKAGES[1],
    usedStorageMB: 340,
    createdAt: '2026-07-01',
    lastLogin: '2026-07-28',
    logo: '',
    banner: '',
    brandColor: '#22c55e',
    brandName: 'Green Valley',
    motto: '',
    mottoBn: '',
    startTime: '07:30',
    endTime: '14:00',
    optionalSubjects: [],
    sessions: ['2024-25', '2025-26'],
    password: 'GreenValley@2024',
    slug: 'greenvalley',
    accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
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
    website: 'smsappbd.vercel.app/i/rajshahi-cs',
    subdomain: 'rajshahi-cs',
    status: 'suspended',
    package: PACKAGES[0],
    usedStorageMB: 120,
    createdAt: '2025-11-10',
    lastLogin: '2026-05-15',
    logo: '',
    banner: '',
    brandColor: '#f59e0b',
    brandName: 'Rajshahi CS',
    motto: '',
    mottoBn: '',
    startTime: '08:00',
    endTime: '14:30',
    optionalSubjects: [],
    sessions: ['2024-25', '2025-26'],
    password: 'Rajshahi@2024',
    slug: 'rajshahi-cs',
    accessModes: { pathBased: true, subdomainBased: true, customDomain: '' },
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
