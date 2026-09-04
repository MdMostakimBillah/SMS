export const API_BASE = import.meta.env.VITE_API_URL || ''

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
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

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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

    const data = await res.json()
    return data as T
  } finally {
    clearTimeout(timer)
  }
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name: string | null
    role: string
    schoolId: string | null
    schoolName: string | null
    avatar: string | null
  }
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

  register: (email: string, password: string, name: string, role?: string, schoolId?: string) =>
    apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name, role, schoolId },
    }),

  accounts: () => apiRequest<AccountInfo[]>('/api/auth/accounts'),

  getSuperAdmin: () =>
    apiRequest<{ email: string; hasCustomPassword: boolean }>('/api/auth/super-admin'),

  updateSuperAdmin: (data: { email?: string; password?: string }) =>
    apiRequest<{ success: boolean }>('/api/auth/super-admin', {
      method: 'PUT',
      body: data,
    }),

  verifySuperAdmin: (email: string, password: string) =>
    apiRequest<{ valid: boolean }>('/api/auth/verify-super-admin', {
      method: 'POST',
      body: { email, password },
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
