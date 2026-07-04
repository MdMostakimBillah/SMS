export type AuditEventType = 'enrolled' | 'recognized' | 'rejected' | 'deleted' | 'exported' | 'imported'

export interface AuditEvent {
  type: AuditEventType
  personId?: string
  personName?: string
  confidence?: number
  livenessPassed?: boolean
  qualityScore?: number
  reason?: string
  faceCount?: number
  timestamp: string
}

const STORAGE_KEY = 'faceAuditLog'
const MAX_ENTRIES = 1000

function getStoredLog(): AuditEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function storeLog(log: AuditEvent[]): void {
  const trimmed = log.slice(-MAX_ENTRIES)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function logAuditEvent(event: Omit<AuditEvent, 'timestamp'>): void {
  const log = getStoredLog()
  log.push({ ...event, timestamp: new Date().toISOString() })
  storeLog(log)
}

export function getAuditLog(limit?: number): AuditEvent[] {
  const log = getStoredLog()
  if (limit) return log.slice(-limit)
  return log
}

export function clearAuditLog(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportAuditLog(): string {
  const log = getStoredLog()
  return JSON.stringify(log, null, 2)
}

export function getAuditStats(): {
  total: number
  enrolled: number
  recognized: number
  rejected: number
  lastEvent: AuditEvent | null
} {
  const log = getStoredLog()
  return {
    total: log.length,
    enrolled: log.filter((e) => e.type === 'enrolled').length,
    recognized: log.filter((e) => e.type === 'recognized').length,
    rejected: log.filter((e) => e.type === 'rejected').length,
    lastEvent: log.length > 0 ? log[log.length - 1] : null,
  }
}
