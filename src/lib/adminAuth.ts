const SUPER_ADMIN_ROLE = 'super_admin'

interface SuperAdminUser {
  id: string
  email: string
  name: string
  role: string
  schoolId: null
  schoolName: null
  avatar: null
  subdomain: null
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
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const now = Math.floor(Date.now() / 1000)
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    userId: 'super-admin-001',
    email: 'admin',
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
  return {
    id: 'super-admin-001',
    email: 'admin',
    name: 'Super Admin',
    role: SUPER_ADMIN_ROLE,
    schoolId: null,
    schoolName: null,
    avatar: null,
    subdomain: null,
  }
}

export type { SuperAdminUser }
export { SUPER_ADMIN_ROLE }
