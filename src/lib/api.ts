export const API_BASE = import.meta.env.VITE_API_URL || ''

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
      body: body ? JSON.stringify(body) : undefined,
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
  avatar: string | null
}

export interface AuthResponse {
  user: SessionUser
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
