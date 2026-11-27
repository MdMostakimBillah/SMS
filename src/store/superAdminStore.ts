import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InstitutionStatus = 'active' | 'trial' | 'suspended' | 'inactive'

export type PackageHostingType = 'all' | 'cloud' | 'system_only' | 'local_pc' | 'personal_vps'

export interface InstitutionPackage {
  id?: string
  name: string
  nameBn: string
  description?: string
  descriptionBn?: string
  hostingType?: PackageHostingType
  maxStudents: number
  maxTeachers: number
  maxClasses: number
  pricePerStudent: number
  price: number
  duration: number
  features?: string[]
  featuresBn?: string[]
  isPopular?: boolean
  isActive?: boolean
  isDefaultSystemUse?: boolean
  isDefaultCloud?: boolean
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
  expiresAt?: string | null
  storageMode?: string
  serverUrl?: string
  folderName?: string
  storageBytes?: number
  mediaCount?: number
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
  currentSession?: string
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

export const DEFAULT_PACKAGES: InstitutionPackage[] = [
  // ─── Provider Cloud Packages ───
  {
    id: 'pkg-cloud-basic',
    name: 'Basic',
    nameBn: 'বেসিক',
    description: 'Get started with essential tools to manage your school efficiently. Ideal for small institutions with fundamental needs.',
    descriptionBn: 'ছোট প্রতিষ্ঠানের শিক্ষার্থী ও দৈনিক কার্যক্রম সহজে পরিচালনার জন্য প্রয়োজনীয় বেসিক সুবিধা।',
    hostingType: 'cloud',
    maxStudents: 200,
    maxTeachers: 25,
    maxClasses: 999,
    pricePerStudent: 10,
    price: 1500,
    duration: 30,
    features: ['Provider Cloud Hosting', 'Automated Cloud Backups', 'Basic Support', 'Multi-device Access'],
    featuresBn: ['প্রোভাইডার ক্লাউড হোস্টিং', 'অটোমেটিক ক্লাউড ব্যাকআপ', 'বেসিক সাপোর্ট', 'মাল্টি-ডিভাইস অ্যাক্সেস'],
    isActive: true,
    isDefaultCloud: true,
  },
  {
    id: 'pkg-cloud-standard',
    name: 'Standard',
    nameBn: 'স্ট্যান্ডার্ড',
    description: 'A comprehensive solution for growing institutions, offering automated SMS and enhanced management tools.',
    descriptionBn: 'জনপ্রিয় ক্লাউড প্যাকেজ — স্বয়ংক্রিয় এসএমএস ও আধুনিক ডিজিটাল ফিচার সহ সম্পূর্ণ সমাধান।',
    hostingType: 'cloud',
    maxStudents: 400,
    maxTeachers: 50,
    maxClasses: 999,
    pricePerStudent: 8,
    price: 2200,
    duration: 30,
    isPopular: true,
    features: ['Provider Cloud Hosting', 'SMS Integration', 'Daily Automated Backups', 'Priority Email Support'],
    featuresBn: ['প্রোভাইডার ক্লাউড হোস্টিং', 'এসএমএস ইন্টিগ্রেশন', 'দৈনিক অটোমেটিক ব্যাকআপ', 'অগ্রাধিকার সাপোর্ট'],
    isActive: true,
  },
  {
    id: 'pkg-cloud-premium',
    name: 'Premium',
    nameBn: 'প্রিমিয়াম',
    description: 'High-capacity performance with priority 24/7 support and custom domain, perfect for larger institutions.',
    descriptionBn: 'উচ্চ ধারণক্ষমতা, কাস্টম ডোমেইন ও অগ্রাধিকার ২৪/৭ সহায়তা সহ প্রতিষ্ঠিত স্কুলের জন্য সেরা প্যাকেজ।',
    hostingType: 'cloud',
    maxStudents: 800,
    maxTeachers: 100,
    maxClasses: 999,
    pricePerStudent: 6,
    price: 3000,
    duration: 30,
    features: ['High-speed Cloud Cluster', 'Custom Subdomain & Domain', 'Priority 24/7 Support', 'Unlimited Storage'],
    featuresBn: ['উচ্চগতির ক্লাউড ক্লাস্টার', 'কাস্টম সাবডোমেইন ও ডোমেইন', '২৪/৭ অগ্রাধিকার সহায়তা', 'আনলিমিটেড স্টোরেজ'],
    isActive: true,
  },
  {
    id: 'pkg-cloud-enterprise',
    name: 'Enterprise',
    nameBn: 'এন্টারপ্রাইজ',
    description: 'Maximize institution performance with unlimited students, dedicated server cluster and full customization.',
    descriptionBn: 'অসীম শিক্ষার্থী ও শিক্ষক কোটা, ডেডিকেটেড ক্লাউড সার্ভার এবং পূর্ণাঙ্গ কাস্টমাইজেশন সুবিধা।',
    hostingType: 'cloud',
    maxStudents: 9999,
    maxTeachers: 9999,
    maxClasses: 999,
    pricePerStudent: 4,
    price: 3500,
    duration: 30,
    features: ['Dedicated Cloud Server', 'Unlimited Students & Staff', 'Dedicated Account Manager', 'Custom API Access'],
    featuresBn: ['ডেডিকেটেড ক্লাউড সার্ভার', 'অসীম ছাত্র-শিক্ষক কোটা', 'ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার', 'কাস্টম API সুবিধা'],
    isActive: true,
  },

  // ─── System Use Only (Local PC & Personal VPS) Packages ───
  {
    id: 'pkg-system-local-pc',
    name: 'Local PC Basic',
    nameBn: 'লোকাল পিসি - সিস্টেম ব্যবহার',
    description: 'Offline local computer storage with Vault. Zero provider cloud cost and complete institutional privacy.',
    descriptionBn: 'লোকাল কম্পিউটার অফলাইন স্টোরেজ (ভল্ট)। কোনো ক্লাউড ফি নেই, শুধুমাত্র সফটওয়্যার ব্যবহার।',
    hostingType: 'local_pc',
    maxStudents: 300,
    maxTeachers: 30,
    maxClasses: 999,
    pricePerStudent: 3,
    price: 600,
    duration: 30,
    features: ['100% Offline Local PC Vault', 'Zero Cloud Server Fees', 'Telegram Direct Backup', 'Local Fast Performance'],
    featuresBn: ['১০০% অফলাইন লোকাল পিসি ভল্ট', 'শূন্য ক্লাউড সার্ভার খরচ', 'টেলিগ্রাম সরাসরি ব্যাকআপ', 'দ্রুত লোকাল পারফরম্যান্স'],
    isActive: true,
    isDefaultSystemUse: true,
  },
  {
    id: 'pkg-system-vps-pro',
    name: 'Personal VPS Pro',
    nameBn: 'নিজস্ব ভিপিএস - সিস্টেম ব্যবহার',
    description: 'Host on your personal VPS server. Software license only with full institutional database control.',
    descriptionBn: 'আপনার নিজস্ব ভিপিএস বা স্কুল সার্ভারে হোস্ট করার জন্য সফটওয়্যার লাইসেন্স ও পূর্ণ ডাটা নিয়ন্ত্রণ।',
    hostingType: 'personal_vps',
    maxStudents: 1000,
    maxTeachers: 100,
    maxClasses: 999,
    pricePerStudent: 2,
    price: 1000,
    duration: 30,
    features: ['Self-Hosted API Server', 'Campus LAN / WAN Multi-device', 'Full Independent Data Control', 'Direct Database Access'],
    featuresBn: ['সেলফ-হোস্টেড API সার্ভার', 'ক্যাম্পাস লোকাল নেটওয়ার্ক অ্যাক্সেস', 'সম্পূর্ণ স্বাধীন ডাটা নিয়ন্ত্রণ', 'সরাসরি ডাটাবেজ অ্যাক্সেস'],
    isActive: true,
  },
  {
    id: 'pkg-system-lifetime',
    name: 'System Lifetime License',
    nameBn: 'সিস্টেম লাইফটাইম লাইসেন্স',
    description: 'One-time system license for Local PC or Personal VPS with no recurring hosting costs.',
    descriptionBn: 'লোকাল পিসি বা নিজস্ব ভিপিএস-এর জন্য এককালীন আজীবন সিস্টেম লাইসেন্স। কোনো মাসিক চার্জ নেই।',
    hostingType: 'system_only',
    maxStudents: 9999,
    maxTeachers: 9999,
    maxClasses: 999,
    pricePerStudent: 0,
    price: 15000,
    duration: 0,
    features: ['Lifetime System License', 'Local PC or Personal VPS', 'Unlimited Students & Staff', 'Zero Monthly Cloud Fees', 'Free Core Software Updates'],
    featuresBn: ['আজীবন সিস্টেম লাইসেন্স', 'লোকাল পিসি বা নিজস্ব ভিপিএস', 'অসীম শিক্ষার্থী ও শিক্ষক', 'জিরো মাসিক ক্লাউড ফি', 'ফ্রি কোর সফটওয়্যার আপডেট'],
    isActive: true,
  },
]

export const PACKAGES: InstitutionPackage[] = DEFAULT_PACKAGES

interface SuperAdminState {
  institutions: Institution[]
  packages: InstitutionPackage[]
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
  setInstitutions: (institutions: Institution[]) => void
  deleteInstitution: (id: string) => void
  toggleStatus: (id: string) => void
  startViewing: (id: string) => void
  stopViewing: () => void
  addPackage: (pkg: InstitutionPackage) => void
  updatePackage: (idOrName: string, data: Partial<InstitutionPackage>) => void
  deletePackage: (idOrName: string) => void
  setDefaultPackage: (idOrName: string, type: 'cloud' | 'system_only') => void
  resetPackagesToDefault: () => void
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
      packages: DEFAULT_PACKAGES,
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
        set((state) => ({
          institutions: [
            ...state.institutions.filter(
              (i) => i.id !== inst.id && i.slug !== inst.slug && i.subdomain !== inst.subdomain
            ),
            inst,
          ],
        })),
      setInstitutions: (institutions) => set({ institutions }),
      deleteInstitution: (idOrSlug) =>
        set((state) => ({
          institutions: state.institutions.filter((i) => {
            const isProtected =
              i.slug === 'edutech' ||
              i.subdomain === 'edutech' ||
              i.id === 'edutech' ||
              i.name.toLowerCase().includes('edutech platform')
            if (isProtected && (i.id === idOrSlug || i.slug === idOrSlug || i.subdomain === idOrSlug)) {
              return true
            }
            return i.id !== idOrSlug && i.slug !== idOrSlug && i.subdomain !== idOrSlug
          }),
        })),
      toggleStatus: (id) =>
        set((state) => ({
          institutions: state.institutions.map((i) => {
            if (i.id === id) {
              const isProtected =
                i.slug === 'edutech' ||
                i.subdomain === 'edutech' ||
                i.id === 'edutech' ||
                i.name.toLowerCase().includes('edutech platform')
              if (isProtected) return i
              const nextStatus = i.status === 'active' ? 'suspended' : 'active'
              let nextExpiresAt = i.expiresAt
              if (nextStatus === 'active' && i.expiresAt && new Date(i.expiresAt).getTime() < Date.now()) {
                const renewed = new Date()
                renewed.setDate(renewed.getDate() + 30)
                nextExpiresAt = renewed.toISOString()
              }
              return { ...i, status: nextStatus, expiresAt: nextExpiresAt }
            }
            return i
          }),
        })),
      addPackage: (pkg) =>
        set((state) => {
          const newPkg: InstitutionPackage = {
            ...pkg,
            id: pkg.id || `pkg-${Date.now()}`,
            isActive: pkg.isActive ?? true,
          }
          return { packages: [...state.packages, newPkg] }
        }),
      updatePackage: (idOrName, data) =>
        set((state) => ({
          packages: state.packages.map((p) => {
            const match = (p.id && p.id === idOrName) || p.name.toLowerCase() === idOrName.toLowerCase()
            return match ? { ...p, ...data } : p
          }),
        })),
      deletePackage: (idOrName) =>
        set((state) => ({
          packages: state.packages.filter(
            (p) => (p.id !== idOrName && p.name.toLowerCase() !== idOrName.toLowerCase())
          ),
        })),
      setDefaultPackage: (idOrName, type) =>
        set((state) => ({
          packages: state.packages.map((p) => {
            const isMatch = (p.id && p.id === idOrName) || p.name.toLowerCase() === idOrName.toLowerCase()
            if (type === 'cloud') {
              return { ...p, isDefaultCloud: isMatch }
            } else {
              return { ...p, isDefaultSystemUse: isMatch }
            }
          }),
        })),
      resetPackagesToDefault: () =>
        set(() => ({
          packages: DEFAULT_PACKAGES,
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
          packages: (rest.packages && rest.packages.length > 0) ? rest.packages : DEFAULT_PACKAGES,
        }
      },
    }
  )
)
