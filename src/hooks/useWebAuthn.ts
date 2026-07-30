export function generateChallenge(): Uint8Array {
  const arr = new Uint8Array(32)
  crypto.getRandomValues(arr)
  return arr
}

export function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

export function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

export function getDeviceName(): string {
  if (navigator.userAgent.includes('iPhone')) return 'iPhone'
  if (navigator.userAgent.includes('Android')) return 'Android Device'
  return 'Web Browser'
}

export function isSecureContext(): boolean {
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost'
}

export async function registerWebAuthnDevice(options: {
  teacherId: string
  displayName: string
}): Promise<{ credentialId: string } | null> {
  const challenge = generateChallenge()
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: challenge.buffer as unknown as ArrayBuffer,
      rp: { name: 'EduTech Attendance', id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(options.teacherId),
        name: options.teacherId,
        displayName: options.displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: { userVerification: 'preferred' },
      timeout: 60000,
    },
  })) as PublicKeyCredential | null

  if (!credential) return null
  return { credentialId: bufferToBase64(credential.rawId) }
}

export async function authenticateWebAuthnDevice(options: {
  credentialId: string
}): Promise<boolean> {
  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: generateChallenge(),
      allowCredentials: [{ id: base64ToBuffer(options.credentialId), type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    },
  })) as PublicKeyCredential | null

  return !!credential
}

export function getWebAuthnErrorMessage(err: unknown, isBn: boolean): string {
  const error = err as { message?: string; name?: string }
  if (!isSecureContext()) {
    return isBn ? '🔒 HTTPS প্রয়োজন! https:// দিয়ে খুলুন।' : '🔒 HTTPS required! Open with https://'
  }
  if (error.name === 'NotAllowedError') {
    return isBn ? 'ব্যবহারকারী বাতিল করেছেন' : 'User cancelled'
  }
  return `${isBn ? 'নিবন্ধন ব্যর্থ' : 'Registration failed'}: ${error.message || error.name || 'Unknown'}`
}

export function getAuthErrorMessage(err: unknown, isBn: boolean): string {
  const error = err as { message?: string; name?: string }
  if (!isSecureContext()) {
    return isBn ? '🔒 HTTPS প্রয়োজন! https:// দিয়ে খুলুন।' : '🔒 HTTPS required! Open with https://'
  }
  if (error.name === 'NotAllowedError') {
    return isBn ? 'ব্যবহারকারী বাতিল করেছেন' : 'User cancelled'
  }
  return `${isBn ? 'প্রমাণীকরণ ব্যর্থ' : 'Authentication failed'}: ${error.message || error.name || 'Unknown'}`
}

export function loadMobileDevices(): Array<{
  id: string
  staffId: string
  staffName: string
  deviceName: string
  credentialId: string
  registeredAt: string
  lastAuth: string
}> {
  try {
    return JSON.parse(localStorage.getItem('mobileAuthDevices') || '[]')
  } catch {
    return []
  }
}

export function saveMobileDevices(
  devices: Array<{
    id: string
    staffId: string
    staffName: string
    deviceName: string
    credentialId: string
    registeredAt: string
    lastAuth: string
  }>
): void {
  localStorage.setItem('mobileAuthDevices', JSON.stringify(devices))
}
