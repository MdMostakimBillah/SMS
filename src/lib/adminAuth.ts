const SUPER_ADMIN_ROLE = 'super_admin'

interface AdminCredentials {
  email: string
  password: string
}

interface SuperAdminUser {
  id: string
  email: string
  name: string
  role: string
  schoolId: null
  schoolName: null
  avatar: null
}

function getEnvCredentials(): AdminCredentials {
  return {
    email: import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@edutech.com',
    password: import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'Admin@123456',
  }
}

export function getAdminCredentials(): AdminCredentials {
  try {
    const stored = localStorage.getItem('edutech_admin_credentials')
    if (stored) return JSON.parse(stored)
  } catch {}
  return getEnvCredentials()
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials()
  return email === creds.email && password === creds.password
}

export function getAdminEmail(): string {
  return getAdminCredentials().email
}

export function isDefaultCredentials(): boolean {
  const stored = localStorage.getItem('edutech_admin_credentials')
  if (stored) return false
  const env = getEnvCredentials()
  return env.email === 'admin@edutech.com' && env.password === 'Admin@123456'
}

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return base64UrlEncode(signature)
}

export async function createSuperAdminToken(password: string): Promise<string> {
  const creds = getAdminCredentials()
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    userId: 'super-admin-001',
    email: creds.email,
    role: SUPER_ADMIN_ROLE,
    schoolId: null,
    iat: now,
    exp: now + 86400,
  })))
  const signature = await hmacSign(`${header}.${payload}`, password)
  return `${header}.${payload}.${signature}`
}

export async function verifySuperAdminToken(token: string, password: string): Promise<boolean> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const [header, payload, signature] = parts
    const expected = await hmacSign(`${header}.${payload}`, password)
    if (signature !== expected) return false
    const data = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)))
    return data.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function createSuperAdminUser(): SuperAdminUser {
  const creds = getAdminCredentials()
  return {
    id: 'super-admin-001',
    email: creds.email,
    name: 'Super Admin',
    role: SUPER_ADMIN_ROLE,
    schoolId: null,
    schoolName: null,
    avatar: null,
  }
}

export type { AdminCredentials, SuperAdminUser }
export { SUPER_ADMIN_ROLE }
