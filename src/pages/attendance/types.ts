export type Person = {
  id: string
  name: string
  type: 'staff' | 'student'
  photo: string
  dept?: string
  section?: string
}

export type DeviceEntry = {
  id: string
  name: string
  model: string
  ip: string
  port?: number
  location?: string
  status: 'online' | 'offline' | 'error'
  type: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'multi'
  lastSync: string
  staffCount: number
}

export type RfidEntry = {
  staffId: string
  staffName: string
  rfidCard: string
  type: string
  assigned: boolean
}

export type FpEntry = {
  staffId: string
  staffName: string
  fpId: number
  templates: number
  status: 'enrolled' | 'pending' | 'failed'
}

export type FaceEntry = {
  staffId: string
  staffName: string
  faceId: number
  quality: number
  status: 'enrolled' | 'pending' | 'failed'
}

export type MobileDevice = {
  id: string
  staffId: string
  staffName: string
  deviceName: string
  credentialId: string
  registeredAt: string
  lastAuth: string
}

export type DeviceLog = {
  id: string
  deviceId: string
  personId: string
  time: string
  date?: string
  timestamp?: string
  type: 'in' | 'out'
  method: 'manual' | 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile'
  status?: 'success' | 'failed'
}

export type DeviceSubTab = 'devices' | 'rfid' | 'fingerprint' | 'face' | 'mobile'
