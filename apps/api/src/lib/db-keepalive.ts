import type { PrismaClient } from '@prisma/client'
import type { Pool } from 'pg'
import type { Request, Response, NextFunction } from 'express'

export interface DbKeepAliveOptions {
  prisma?: PrismaClient
  pool?: Pool
  /**
   * Interval between heartbeat checks in milliseconds.
   * Default: 210,000 ms (3.5 minutes, safely below Neon's 5-minute auto-suspend window).
   */
  intervalMs?: number
  /**
   * Maximum idle time before triggering a keep-alive query.
   * Default: 180,000 ms (3 minutes). If real traffic was handled within this window,
   * the keepalive query is skipped.
   */
  idleThresholdMs?: number
  /**
   * Timeout for the keepalive query in milliseconds.
   * Default: 10,000 ms.
   */
  timeoutMs?: number
  /**
   * Whether keep-alive is active.
   * Default: enabled unless DB_KEEP_ALIVE === 'false' or NODE_ENV === 'test'.
   */
  enabled?: boolean
  /**
   * Whether to log every heartbeat ping (default: false, logs only state changes & errors).
   */
  logVerbose?: boolean
}

export interface PingResult {
  ok: boolean
  latencyMs: number
  error?: string
}

export class DbKeepAlive {
  private timer: NodeJS.Timeout | null = null
  private lastActivityTimestamp = Date.now()
  private isPinging = false
  private consecutiveFailures = 0
  private readonly intervalMs: number
  private readonly idleThresholdMs: number
  private readonly timeoutMs: number
  private readonly enabled: boolean
  private readonly logVerbose: boolean
  private readonly prisma?: PrismaClient
  private readonly pool?: Pool

  constructor(options: DbKeepAliveOptions = {}) {
    this.prisma = options.prisma
    this.pool = options.pool

    const envInterval = Number(process.env.DB_KEEP_ALIVE_INTERVAL_MS)
    this.intervalMs = options.intervalMs ?? (Number.isFinite(envInterval) && envInterval > 0 ? envInterval : 210_000)

    const envIdle = Number(process.env.DB_KEEP_ALIVE_IDLE_THRESHOLD_MS)
    this.idleThresholdMs = options.idleThresholdMs ?? (Number.isFinite(envIdle) && envIdle > 0 ? envIdle : 180_000)

    this.timeoutMs = options.timeoutMs ?? 10_000

    this.enabled =
      options.enabled ??
      (process.env.DB_KEEP_ALIVE !== 'false' && process.env.NODE_ENV !== 'test')

    this.logVerbose =
      options.logVerbose ?? (process.env.DB_KEEP_ALIVE_VERBOSE === 'true')
  }

  /**
   * Record database or API activity so keepalive skips when active traffic is present.
   */
  public recordActivity(): void {
    this.lastActivityTimestamp = Date.now()
  }

  public getLastActivity(): number {
    return this.lastActivityTimestamp
  }

  public isRunning(): boolean {
    return this.timer !== null
  }

  /**
   * Start the background heartbeat keepalive loop.
   */
  public start(): void {
    if (!this.enabled || this.timer) return

    console.log(
      `[db-keepalive] Started Neon database keepalive (interval: ${Math.round(this.intervalMs / 1000)}s, idleThreshold: ${Math.round(this.idleThresholdMs / 1000)}s)`
    )

    this.timer = setInterval(() => {
      void this.tick()
    }, this.intervalMs)

    this.timer.unref()
  }

  /**
   * Stop the background keepalive loop (for graceful shutdown or test teardown).
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * Periodic tick: if idle longer than threshold, executes heartbeat ping.
   */
  public async tick(): Promise<void> {
    const idleMs = Date.now() - this.lastActivityTimestamp
    if (idleMs < this.idleThresholdMs) {
      if (this.logVerbose) {
        console.log(`[db-keepalive] Skipping ping: active query handled ${Math.round(idleMs / 1000)}s ago.`)
      }
      return
    }

    await this.ping()
  }

  /**
   * Run a lightweight scalar query (SELECT 1) against Prisma and/or pg Pool.
   */
  public async ping(): Promise<PingResult> {
    if (this.isPinging) {
      return { ok: true, latencyMs: 0 }
    }

    this.isPinging = true
    const start = performance.now()

    try {
      const pingPromise = (async () => {
        if (this.prisma) {
          await this.prisma.$queryRawUnsafe('SELECT 1')
        } else if (this.pool) {
          await this.pool.query('SELECT 1')
        }
      })()

      const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id)
          reject(new Error(`Database keepalive timed out after ${this.timeoutMs}ms`))
        }, this.timeoutMs)
        id.unref?.()
      })

      await Promise.race([pingPromise, timeoutPromise])

      const latencyMs = Math.round((performance.now() - start) * 100) / 100
      this.lastActivityTimestamp = Date.now()

      if (this.consecutiveFailures > 0) {
        console.log(
          `[db-keepalive] Database connection restored after ${this.consecutiveFailures} failure(s) (latency: ${latencyMs}ms)`
        )
        this.consecutiveFailures = 0
      } else if (this.logVerbose) {
        console.log(`[db-keepalive] Heartbeat successful (latency: ${latencyMs}ms)`)
      }

      return { ok: true, latencyMs }
    } catch (err) {
      this.consecutiveFailures++
      const latencyMs = Math.round((performance.now() - start) * 100) / 100
      const message = err instanceof Error ? err.message : String(err)

      console.warn(
        `[db-keepalive] Heartbeat ping failed (attempt #${this.consecutiveFailures}): ${message}`
      )

      return { ok: false, latencyMs, error: message }
    } finally {
      this.isPinging = false
    }
  }

  /**
   * Express middleware to automatically track API traffic and debounce keep-alive pings.
   */
  public createActivityMiddleware() {
    return (_req: Request, _res: Response, next: NextFunction): void => {
      this.recordActivity()
      next()
    }
  }
}
