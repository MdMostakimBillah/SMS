type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

const isDevelopment = import.meta.env.DEV
const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
const currentLevel = isDevelopment ? LOG_LEVELS.debug : LOG_LEVELS.info

function formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const entry: LogEntry = { level, message, timestamp: new Date().toISOString(), context }
  return JSON.stringify(entry)
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (LOG_LEVELS.debug >= currentLevel) {
      console.debug(formatMessage('debug', message, context))
    }
  },

  info: (message: string, context?: Record<string, unknown>) => {
    if (LOG_LEVELS.info >= currentLevel) {
      console.info(formatMessage('info', message, context))
    }
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    if (LOG_LEVELS.warn >= currentLevel) {
      console.warn(formatMessage('warn', message, context))
    }
  },

  error: (message: string, context?: Record<string, unknown>) => {
    if (LOG_LEVELS.error >= currentLevel) {
      console.error(formatMessage('error', message, context))
    }
  },

  kiosk: (message: string, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.log(`[Kiosk] ${message}`, context ?? '')
    }
  },

  sms: (phone: string, message: string) => {
    if (isDevelopment) {
      console.log(`📱 SMS → ${phone}: ${message}`)
    }
  },
}

export type { LogLevel, LogEntry }