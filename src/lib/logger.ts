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

/**
 * Structured JSON logger with level filtering.
 * In development all levels log; in production only info and above.
 */
export const logger = {
  /** Logs a debug-level message. */
  debug: (message: string, context?: Record<string, unknown>) => {
    if (LOG_LEVELS.debug >= currentLevel) {
      console.debug(formatMessage('debug', message, context))
    }
  },

  /** Logs an info-level message. */
  info: (message: string, context?: Record<string, unknown>) => {
    if (LOG_LEVELS.info >= currentLevel) {
      console.info(formatMessage('info', message, context))
    }
  },

  /** Logs a warning-level message. */
  warn: (message: string, context?: Record<string, unknown>) => {
    if (LOG_LEVELS.warn >= currentLevel) {
      console.warn(formatMessage('warn', message, context))
    }
  },

  /** Logs an error-level message. */
  error: (message: string, context?: Record<string, unknown>) => {
    if (LOG_LEVELS.error >= currentLevel) {
      console.error(formatMessage('error', message, context))
    }
  },

  /** Logs a kiosk-mode event (dev only). */
  kiosk: (message: string, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.log(`[Kiosk] ${message}`, context ?? '')
    }
  },

  /** Logs an outgoing SMS event (dev only). */
  sms: (phone: string, message: string) => {
    if (isDevelopment) {
      console.log(`📱 SMS → ${phone}: ${message}`)
    }
  },
}

export type { LogLevel, LogEntry }