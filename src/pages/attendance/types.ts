export type Person = {
  id: string
  name: string
  type: 'staff' | 'student'
  photo: string
  dept?: string
  section?: string
}

export type DeviceConnectionType = 'lan' | 'cloud_adms' | 'usb_offline'

export type DeviceEnrolledUser = {
  personId: string
  personType: 'student' | 'staff'
  personName: string
  devicePin: string
  cardNo?: string
  fpEnrolled?: boolean
  faceEnrolled?: boolean
  enrolledAt: string
  syncStatus: 'synced' | 'pending' | 'failed'
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
  connectionType?: DeviceConnectionType
  cloudToken?: string
  pushUrl?: string
  enrolledUsers?: DeviceEnrolledUser[]
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
  biometricCredentialId?: string
  biometricType?: 'hardware_webauthn' | 'simulated'
  enrolledAt?: string
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
