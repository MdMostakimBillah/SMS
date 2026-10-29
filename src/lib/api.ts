export const API_BASE = import.meta.env.VITE_API_URL || ''

/**
 * Resolves media URLs (e.g. from Cloudflare R2 storage /api/media/public/:id)
 * prepending API_BASE if configured and path is relative.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }
  if (url.startsWith('/api/') && API_BASE) {
    return `${API_BASE.replace(/\/+$/, '')}${url}`
  }
  return url
}

/** Reads the readable double-submit CSRF cookie set by the backend. */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)edutech_csrf=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  timeout?: number
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, timeout = 15000 } = options
  const isMutating = method !== 'GET'
  const csrfToken = isMutating ? getCsrfToken() : null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        ...headers,
      },
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    })

    if (!res.ok) {
      let errorMsg = `Request failed (${res.status})`
      try {
        const data = await res.json()
        if (data.error) errorMsg = data.error
      } catch { /* non-JSON response */ }
      throw new ApiError(errorMsg, res.status)
    }

    const text = await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  } finally {
    clearTimeout(timer)
  }
}

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: string
  schoolId: string | null
  schoolName: string | null
  schoolDomain?: string | null
  avatar: string | null
  school?: any
}

export interface AuthResponse {
  user: SessionUser
}

export interface RegisterInstitutionPayload {
  name: string
  nameBn?: string
  brandName?: string
  subdomain?: string
  slug?: string
  motto?: string
  mottoBn?: string
  email?: string
  phone?: string
  address?: string
  addressBn?: string
  eiin?: string
  website?: string
  logo?: string
  banner?: string
  bannerPosition?: string
  brandColor?: string
  package?: 'Basic' | 'Standard' | 'Premium' | 'Enterprise' | string
  plan?: string
  status?: string
  adminEmail: string
  adminPassword: string
  startTime?: string
  endTime?: string
  sessions?: string[]
  optionalSubjects?: string[]
}

export interface RegisterInstitutionResponse {
  success?: boolean
  id?: string
  name?: string
  slug?: string
  school?: Partial<PublicSchool> & {
    id: string
    name: string
    nameBn?: string | null
    domain: string
    email?: string | null
    phone?: string | null
    address?: string | null
    logo?: string | null
    banner?: string | null
    brandColor?: string | null
    brandName?: string | null
  }
  user?: SessionUser
  admin?: { id: string; email: string; role: string }
}

export interface PublicSchool {
  id: string
  name: string
  nameBn: string | null
  domain: string
  slug?: string
  brandName?: string | null
  brandColor?: string | null
  banner?: string | null
  bannerPosition?: string | null
  motto?: string | null
  mottoBn?: string | null
  eiin?: string | null
  website?: string | null
  addressBn?: string | null
  sessions?: string | null
  breaks?: string | null
  package?: string
  status?: string
  plan?: string
  expiresAt?: string | null
  maxStudents?: number
  maxTeachers?: number
  paymentStatus?: string
  billingCycle?: string
  storageMode?: string | null
  serverUrl?: string | null
  folderName?: string | null
  createdAt?: string
  email: string | null
  phone: string | null
  address: string | null
  logo: string | null
  startTime: string
  endTime: string
}

export interface AccountInfo {
  id: string
  email: string
  name: string | null
  role: string
  avatar: string | null
  isActive: boolean
  createdAt: string
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  /** Restore the current session from the HttpOnly cookie after a page reload. */
  me: () => apiRequest<AuthResponse>('/api/auth/me'),

  /** Revokes the server-side session and clears cookies. */
  logout: () => apiRequest<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  /** Disabled server-side; kept so callers receive a clear 403 error. */
  register: (email: string, password: string, name: string, role?: string) =>
    apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name, role },
    }),

  accounts: () => apiRequest<AccountInfo[]>('/api/auth/accounts'),

  getSuperAdmin: () =>
    apiRequest<{ email: string; hasCustomPassword: boolean }>('/api/auth/super-admin'),

  updateSuperAdmin: (data: { email?: string; password?: string; currentPassword?: string }) =>
    apiRequest<{ success: boolean }>('/api/auth/super-admin', {
      method: 'PUT',
      body: data,
    }),

  registerInstitution: (data: RegisterInstitutionPayload) => {
    const s = (data.slug || data.subdomain || '').trim().toLowerCase()
    const payload = {
      ...data,
      slug: s,
      subdomain: s,
      package: data.package || 'Basic',
    }
    return apiRequest<RegisterInstitutionResponse>('/api/auth/register-institution', {
      method: 'POST',
      body: payload,
    })
  },

  getPublicSchool: async (slug: string) => {
    try {
      const res = await apiRequest<any>(`/api/schools/public/${encodeURIComponent(slug)}`)
      const raw = res?.school || (res?.name ? res : null)
      if (raw) {
        return {
          school: {
            id: raw.id || `INST-${slug}`,
            name: raw.name,
            nameBn: raw.nameBn || null,
            brandName: raw.brandName || null,
            brandColor: raw.brandColor || null,
            banner: raw.banner || null,
            bannerPosition: raw.bannerPosition || null,
            motto: raw.motto || null,
            mottoBn: raw.mottoBn || null,
            eiin: raw.eiin || null,
            website: raw.website || null,
            addressBn: raw.addressBn || null,
            sessions: raw.sessions || null,
            breaks: raw.breaks || null,
            package: raw.package || raw.plan || 'Basic',
            plan: raw.plan || raw.package || 'basic',
            status: raw.status || 'active',
            expiresAt: raw.expiresAt || null,
            maxStudents: raw.maxStudents,
            maxTeachers: raw.maxTeachers,
            paymentStatus: raw.paymentStatus || 'paid',
            billingCycle: raw.billingCycle || 'monthly',
            storageMode: raw.storageMode || 'cloud',
            serverUrl: raw.serverUrl || '',
            folderName: raw.folderName || '',
            domain: raw.domain || raw.slug || slug,
            slug: raw.slug || raw.domain || slug,
            email: raw.email || null,
            phone: raw.phone || null,
            address: raw.address || null,
            logo: raw.logo || null,
            startTime: raw.startTime || '07:30',
            endTime: raw.endTime || '14:30',
          } as PublicSchool,
        }
      }
    } catch {
      try {
        const res2 = await apiRequest<any>(`/api/institutions/${encodeURIComponent(slug)}`)
        const raw2 = res2?.school || (res2?.name ? res2 : null)
        if (raw2) {
          return {
            school: {
              id: raw2.id || `INST-${slug}`,
              name: raw2.name,
              nameBn: raw2.nameBn || null,
              brandName: raw2.brandName || null,
              brandColor: raw2.brandColor || null,
              banner: raw2.banner || null,
              bannerPosition: raw2.bannerPosition || null,
              motto: raw2.motto || null,
              mottoBn: raw2.mottoBn || null,
              eiin: raw2.eiin || null,
              website: raw2.website || null,
              addressBn: raw2.addressBn || null,
              sessions: raw2.sessions || null,
              breaks: raw2.breaks || null,
              package: raw2.package || raw2.plan || 'Basic',
              plan: raw2.plan || raw2.package || 'basic',
              status: raw2.status || 'active',
              expiresAt: raw2.expiresAt || null,
              maxStudents: raw2.maxStudents,
              maxTeachers: raw2.maxTeachers,
              paymentStatus: raw2.paymentStatus || 'paid',
              billingCycle: raw2.billingCycle || 'monthly',
              storageMode: raw2.storageMode || 'cloud',
              serverUrl: raw2.serverUrl || '',
              folderName: raw2.folderName || '',
              domain: raw2.domain || raw2.slug || slug,
              slug: raw2.slug || raw2.domain || slug,
              email: raw2.email || null,
              phone: raw2.phone || null,
              address: raw2.address || null,
              logo: raw2.logo || null,
              startTime: raw2.startTime || '07:30',
              endTime: raw2.endTime || '14:30',
            } as PublicSchool,
          }
        }
      } catch {
        /* not found */
      }
    }
    return { school: null }
  },

  checkSubdomain: async (slug: string): Promise<boolean> => {
    const clean = slug.trim().toLowerCase()
    if (!clean || clean.length < 2) return false
    try {
      const res = await apiRequest<{ available: boolean }>(`/api/schools/check-subdomain/${encodeURIComponent(clean)}`)
      return !!res?.available
    } catch {
      try {
        const res = await authApi.getPublicSchool(clean)
        return !res?.school
      } catch {
        return true
      }
    }
  },

  checkEmail: async (email: string): Promise<{ available: boolean; error?: string }> => {
    const clean = email.trim().toLowerCase()
    if (!clean || !clean.includes('@')) return { available: false, error: 'Invalid email' }
    try {
      const res = await apiRequest<{ available: boolean; error?: string }>(`/api/auth/check-email?email=${encodeURIComponent(clean)}`)
      return { available: !!res?.available, error: res?.error }
    } catch (err: any) {
      return { available: false, error: err?.message || 'Email check failed' }
    }
  },

  getSchools: async () => {
    try {
      const res = await apiRequest<any>('/api/schools')
      const list = Array.isArray(res) ? res : res?.items || []
      return list.map((item: any) => ({
        id: item.id,
        name: item.name,
        nameBn: item.nameBn || null,
        domain: item.domain || item.slug || '',
        slug: item.slug || item.domain || '',
        email: item.email || null,
        phone: item.phone || null,
        address: item.address || null,
        addressBn: item.addressBn || null,
        logo: item.logo || null,
        banner: item.banner || null,
        bannerPosition: item.bannerPosition || null,
        brandName: item.brandName || null,
        brandColor: item.brandColor || null,
        motto: item.motto || null,
        mottoBn: item.mottoBn || null,
        eiin: item.eiin || null,
        website: item.website || null,
        sessions: item.sessions || null,
        breaks: item.breaks || null,
        package: item.package || item.plan || 'Basic',
        plan: item.plan || item.package || 'basic',
        status: item.status || 'active',
        expiresAt: item.expiresAt || null,
        maxStudents: item.maxStudents,
        maxTeachers: item.maxTeachers,
        paymentStatus: item.paymentStatus || 'paid',
        billingCycle: item.billingCycle || 'monthly',
        storageMode: item.storageMode || 'cloud',
        serverUrl: item.serverUrl || '',
        folderName: item.folderName || '',
        createdAt: item.createdAt || new Date().toISOString(),
        startTime: item.startTime || '07:30',
        endTime: item.endTime || '14:30',
        _count: item._count,
      })) as Array<PublicSchool & { _count?: { users: number; teachers: number; students: number } }>
    } catch {
      return []
    }
  },

  updateSchool: async (id: string, data: Partial<PublicSchool> & Record<string, any>) => {
    return apiRequest<{ success: boolean; school?: any }>(`/api/schools/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: data,
    })
  },

  deleteSchool: async (id: string) => {
    return apiRequest<{ success: boolean; id?: string; name?: string }>(`/api/schools/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}

export interface TeacherData {
  id: string
  schoolId: string
  nameEn: string
  nameBn: string | null
  gender: string | null
  dob: string | null
  bloodGroup: string | null
  religion: string | null
  phone: string | null
  email: string | null
  address: string | null
  nid: string | null
  emergencyPhone: string | null
  photo: string | null
  departmentId: string | null
  subjectIds: string[]
  designation: string | null
  qualification: string | null
  experience: string | null
  salary: string | null
  salaryStartDate: string | null
  bonus: string | null
  overtime: string | null
  festivalBonus: string | null
  status: string
  category: string | null
  joiningDate: string | null
  inTime: string | null
  outTime: string | null
  fatherNameEn: string | null
  fatherNameBn: string | null
  fatherPhone: string | null
  fatherNid: string | null
  motherNameEn: string | null
  motherNameBn: string | null
  motherPhone: string | null
  guardianName: string | null
  guardianPhone: string | null
  guardianRelation: string | null
  parentAddress: string | null
  signature: string | null
  expertSubjects: string | null
  applySalaryRule: boolean | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedTeachers {
  data: TeacherData[]
  total: number
  page: number
  pageSize: number
}

export const teachersApi = {
  list: (page = 1, pageSize = 100) =>
    apiRequest<PaginatedTeachers>(`/api/teachers?page=${page}&pageSize=${pageSize}`),

  get: (id: string) => apiRequest<TeacherData>(`/api/teachers/${id}`),

  create: (data: Partial<TeacherData>) =>
    apiRequest<TeacherData>('/api/teachers', { method: 'POST', body: data }),

  update: (id: string, data: Partial<TeacherData>) =>
    apiRequest<TeacherData>(`/api/teachers/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/teachers/${id}`, { method: 'DELETE' }),
}

export interface DepartmentData {
  id: string
  schoolId: string
  name: string
  nameBn: string | null
  head: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedDepartments {
  data: DepartmentData[]
  total: number
}

/**
 * Department CRUD against the secured API (Phase 7).
 *
 * The server derives `schoolId` from the authenticated session — it is never
 * sent from the client, so no client-supplied tenant value can influence scope.
 */
export const departmentsApi = {
  list: () => apiRequest<PaginatedDepartments>('/api/departments'),

  create: (data: { name: string; nameBn?: string | null; head?: string | null }) =>
    apiRequest<DepartmentData>('/api/departments', { method: 'POST', body: data }),

  update: (id: string, data: { name?: string; nameBn?: string | null; head?: string | null }) =>
    apiRequest<DepartmentData>(`/api/departments/${id}`, { method: 'PUT', body: data }),

  delete: (id: string) =>
    apiRequest<{ success: boolean }>(`/api/departments/${id}`, { method: 'DELETE' }),
}

export interface NoticeData {
  id: string
  schoolId: string
  title: string
  titleBn: string | null
  content: string
  contentBn: string | null
  author: string | null
  authorBn: string | null
  target: string
  priority: string
  category: string
  pinned: boolean
  isActive: boolean
  publishedAt: string
  expiresAt: string | null
  storage: string | null
  localId: string | null
  createdAt: string
  updatedAt: string
}

export interface NoticeInput {
  title: string
  titleBn?: string | null
  content: string
  contentBn?: string | null
  author?: string | null
  authorBn?: string | null
  target: string
  priority: string
  category: string
  pinned: boolean
  isActive: boolean
  publishedAt: string
  expiresAt?: string | null
  storage?: string | null
}

export interface NoticeImportResult {
  imported: number
  skipped: number
  conflicts: Array<{ localId: string; title: string; reason: string }>
}

/**
 * Notices API (first localStorage→API domain migration).
 *
 * Tenant scope is always derived server-side from the authenticated session;
 * no institution id is ever sent by the client. `importLocal` is the one-time
 * migration path: each legacy record carries its old local id as `localId`,
 * which the server uses as a per-tenant idempotency key (re-imports skip,
 * conflicts are reported — nothing is overwritten or duplicated).
 */
export const noticesApi = {
  list: () => apiRequest<{ data: NoticeData[]; total: number }>('/api/notices'),

  create: (data: NoticeInput) => apiRequest<NoticeData>('/api/notices', { method: 'POST', body: data }),

  update: (id: string, data: Partial<NoticeInput>) =>
    apiRequest<NoticeData>(`/api/notices/${id}`, { method: 'PUT', body: data }),

  remove: (id: string) => apiRequest<{ success: boolean }>(`/api/notices/${id}`, { method: 'DELETE' }),

  importLocal: (items: Array<NoticeInput & { localId: string }>) =>
    apiRequest<NoticeImportResult>('/api/notices/import', { method: 'POST', body: { items } }),

  categories: () => apiRequest<{ data: string[] }>('/api/notices/categories'),

  addCategory: (name: string) =>
    apiRequest<{ name: string }>('/api/notices/categories', { method: 'POST', body: { name } }),

  removeCategory: (name: string) =>
    apiRequest<{ success: boolean; reassigned: number }>(
      `/api/notices/categories/${encodeURIComponent(name)}`,
      { method: 'DELETE' }
    ),
}

export interface StudentRecord {
  id: string
  schoolId: string
  nameEn: string
  nameBn: string | null
  phone: string | null
  email: string | null
  photo: string | null
  class: string | null
  section: string | null
  admissionDate: string | null
  status: string
  fatherNameEn: string | null
  fatherPhone: string | null
  motherNameEn: string | null
  motherPhone: string | null
  district: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export const studentsApi = {
  list: (params?: { page?: number; pageSize?: number; class?: string; section?: string; status?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params?.class) qs.set('class', params.class)
    if (params?.section) qs.set('section', params.section)
    if (params?.status) qs.set('status', params.status)
    if (params?.search) qs.set('search', params.search)
    const qStr = qs.toString()
    return apiRequest<{ students: StudentRecord[]; total: number; page: number; pageSize: number; totalPages: number }>(
      `/api/students${qStr ? `?${qStr}` : ''}`
    )
  },
  get: (id: string) => apiRequest<{ student: StudentRecord }>(`/api/students/${encodeURIComponent(id)}`),
  create: (data: Partial<StudentRecord>) => apiRequest<{ student: StudentRecord }>('/api/students', { method: 'POST', body: data }),
  update: (id: string, data: Partial<StudentRecord>) => apiRequest<{ student: StudentRecord }>(`/api/students/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiRequest<{ success: boolean }>(`/api/students/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export interface BackupStatusResponse {
  database: string
  timestamp: string
  telegramConfigured: boolean
  counts: {
    schools: number
    teachers: number
    students: number
    departments: number
    notices: number
  }
}

export interface TelegramTestResponse {
  success: boolean
  message: string
  bot?: {
    username: string
    name: string
  }
  error?: string
}

export interface TelegramBackupResponse {
  success: boolean
  message: string
  filename?: string
  size?: string
  sha256?: string
  timestamp?: string
  error?: string
}

export const backupApi = {
  getStatus: () => apiRequest<BackupStatusResponse>('/api/backup/status'),
  testTelegram: (data: { botToken?: string; chatId?: string }) =>
    apiRequest<TelegramTestResponse>('/api/backup/telegram/test', {
      method: 'POST',
      body: data,
    }),
  sendTelegramBackup: (data: {
    botToken?: string
    chatId?: string
    schoolId?: string
    schoolSlug?: string
    schoolName?: string
    clientData?: Record<string, any>
  }) =>
    apiRequest<TelegramBackupResponse>('/api/backup/telegram/send', {
      method: 'POST',
      body: data,
    }),
  getExportUrl: (schoolId?: string) =>
    `/api/backup/export${schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : ''}`,
}

