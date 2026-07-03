const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

let authToken: string | null = localStorage.getItem('edutech_token')

export function setAuthToken(token: string | null) {
  authToken = token
  if (token) {
    localStorage.setItem('edutech_token', token)
  } else {
    localStorage.removeItem('edutech_token')
  }
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

    const data = await res.json()

    if (!res.ok) {
      throw new ApiError(data.error || `Request failed (${res.status})`, res.status)
    }

    return data as T
  } finally {
    clearTimeout(timer)
  }
}

export interface AuthResponse {
  token: string
  user: { id: string; email: string; role: string; schoolId: string }
}

export interface RecognizeResponse {
  personId: string | null
  personType: string | null
  confidence: number
  distance: number
  liveness_score: number
  liveness_methods: string[]
  message: string
}

export interface EnrollResponse {
  success: boolean
  embedding_id: string
  det_score: number
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
  gpu: boolean
}

export const authApi = {
  login: (email: string, password: string, schoolId: string) =>
    apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password, schoolId },
    }),

  register: (email: string, password: string, schoolId: string, role?: string) =>
    apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password, schoolId, role },
    }),
}

export interface DetectResponse {
  face_detected: boolean
  bbox: number[] | null
  score: number
  message: string
}

export const faceApi = {
  detect: (image: string) =>
    apiRequest<DetectResponse>('/api/face/detect', {
      method: 'POST',
      body: { image },
      timeout: 5000,
    }),

  enroll: (personId: string, personType: 'teacher' | 'student', image: string) =>
    apiRequest<EnrollResponse>('/api/face/enroll', {
      method: 'POST',
      body: { personId, personType, image },
      timeout: 20000,
    }),

  recognize: (image: string) =>
    apiRequest<RecognizeResponse>('/api/face/recognize', {
      method: 'POST',
      body: { image },
      timeout: 15000,
    }),

  health: () =>
    apiRequest<HealthResponse>('/api/face/health', { timeout: 5000 }),
}
