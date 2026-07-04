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
  // Check localStorage for overridden credentials
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

export function createSuperAdminToken(): string {
  const creds = getAdminCredentials()
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = btoa(JSON.stringify({
    userId: 'super-admin-001',
    email: creds.email,
    role: SUPER_ADMIN_ROLE,
    schoolId: null,
    iat: now,
    exp: now + 86400,
  }))
  const signature = btoa('super-admin-signature')
  return `${header}.${payload}.${signature}`
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
