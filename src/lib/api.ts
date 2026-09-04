export const API_BASE = import.meta.env.VITE_API_URL || ''

let authToken: string | null = null
let requestCount = 0

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
}

export function incrementRequestCount(): void {
  requestCount++
}

export function decrementRequestCount(): void {
  requestCount = Math.max(0, requestCount - 1)
}

export function getRequestCount(): number {
  return requestCount
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 2,
  baseDelay: 1000,
}

interface RequestInterceptor {
  (options: ApiOptions): ApiOptions
}

let beforeRequestInterceptors: RequestInterceptor[] = []
let afterResponseInterceptors: ((data: any) => any)[] = []

export function setApiRequestInterceptor(interceptor: RequestInterceptor): void {
  beforeRequestInterceptors = [interceptor]
}

export function clearApiRequestQueue(): void {
  requestCount = 0
}

export function useApiLoading(): boolean {
  return getRequestCount() > 0
}

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  timeout?: number
  retry?: number
  onStart?: () => void
  onError?: (err: ApiError) => void
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, timeout = 15000, retry = defaultRetryConfig.maxRetries, onStart, onError } = options

  incrementRequestCount()
  onStart && onStart()

  let lastError: ApiError | null = null

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)

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

      clearTimeout(timer)

      if (!res.ok) {
        let errorMsg = `Request failed (${res.status})`
        try {
          const data = await res.json()
          if (data.error) errorMsg = data.error
        } catch { /* non-JSON response */ }
        const apiError = new ApiError(errorMsg, res.status)
        lastError = apiError
        if (attempt < retry) {
          const delay = defaultRetryConfig.baseDelay * 2 ** attempt
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        onError && onError(apiError)
        throw apiError
      }

      const data = await res.json()

      afterResponseInterceptors.forEach((interceptor) => {
        // interceptor can transform data
      })

      return data as T
    } catch (err) {
      if (err instanceof ApiError) {
        lastError = err
        if (attempt < retry) {
          const delay = defaultRetryConfig.baseDelay * 2 ** attempt
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        onError && onError(err)
        throw err
      }
      if (err instanceof DOMException && err.name === 'AbortError') {
        onError && onError(new ApiError('Request timed out', 0))
        throw new ApiError('Request timed out', 0)
      }
      onError && onError(new ApiError(String(err), 0))
      throw new ApiError(String(err), 0)
    }
  }

  decrementRequestCount()
  throw lastError || new ApiError('Unexpected error', 0)
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
  festivalBonus: string | null
  status: string
  category: string | null
  joiningDate: string | null
  inTime: string | null
  outTime: string | null
  fatherNameEn: string | null
  fatherNameBn: string | null
  fatherPhone: string | null
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