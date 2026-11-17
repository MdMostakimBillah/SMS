import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DbKeepAlive } from './db-keepalive.js'
import express from 'express'
import request from 'supertest'
import { createApp } from '../app.js'

describe('DbKeepAlive', () => {
  let mockPrisma: any
  let mockPool: any

  beforeEach(() => {
    vi.useFakeTimers()
    mockPrisma = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    }
    mockPool = {
      query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('initializes with default options and starts/stops cleanly', () => {
    const keepAlive = new DbKeepAlive({
      prisma: mockPrisma,
      enabled: true,
      intervalMs: 10_000,
      idleThresholdMs: 5_000,
    })

    expect(keepAlive.isRunning()).toBe(false)
    keepAlive.start()
    expect(keepAlive.isRunning()).toBe(true)

    keepAlive.stop()
    expect(keepAlive.isRunning()).toBe(false)
  })

  it('skips ping during tick if activity occurred recently', async () => {
    const keepAlive = new DbKeepAlive({
      prisma: mockPrisma,
      enabled: true,
      intervalMs: 10_000,
      idleThresholdMs: 5_000,
    })

    keepAlive.recordActivity()
    // Advance time by 2 seconds (less than idleThreshold of 5s)
    vi.advanceTimersByTime(2000)

    await keepAlive.tick()
    expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled()
  })

  it('triggers ping during tick if idle beyond threshold', async () => {
    const keepAlive = new DbKeepAlive({
      prisma: mockPrisma,
      enabled: true,
      intervalMs: 10_000,
      idleThresholdMs: 5_000,
    })

    // Advance time past the 5s idle threshold
    vi.advanceTimersByTime(6000)

    await keepAlive.tick()
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1')
  })

  it('measures latency and returns ok result on successful ping', async () => {
    const keepAlive = new DbKeepAlive({
      prisma: mockPrisma,
      enabled: true,
    })

    const result = await keepAlive.ping()
    expect(result.ok).toBe(true)
    expect(typeof result.latencyMs).toBe('number')
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1')
  })

  it('falls back to pool.query if prisma is not provided', async () => {
    const keepAlive = new DbKeepAlive({
      pool: mockPool,
      enabled: true,
    })

    const result = await keepAlive.ping()
    expect(result.ok).toBe(true)
    expect(mockPool.query).toHaveBeenCalledWith('SELECT 1')
  })

  it('catches and reports database query failures without throwing', async () => {
    const failingPrisma = {
      $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('Connection reset by peer')),
    }
    const keepAlive = new DbKeepAlive({
      prisma: failingPrisma as any,
      enabled: true,
    })

    const result = await keepAlive.ping()
    expect(result.ok).toBe(false)
    expect(result.error).toContain('Connection reset by peer')
  })

  it('middleware records activity on incoming request', () => {
    const keepAlive = new DbKeepAlive({ enabled: true })
    const initialTime = keepAlive.getLastActivity()

    vi.advanceTimersByTime(1000)
    const middleware = keepAlive.createActivityMiddleware()
    const next = vi.fn()

    middleware({} as any, {} as any, next)
    expect(next).toHaveBeenCalledTimes(1)
    expect(keepAlive.getLastActivity()).toBeGreaterThan(initialTime)
  })
})

describe('Health and DB Watchdog Endpoints', () => {
  let mockPrisma: any
  let keepAlive: DbKeepAlive
  let app: express.Express

  beforeEach(() => {
    mockPrisma = {
      $queryRawUnsafe: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    }
    keepAlive = new DbKeepAlive({
      prisma: mockPrisma,
      enabled: false,
    })
    app = createApp({
      prisma: mockPrisma,
      jwtSecret: '01234567890123456789012345678901',
      corsOrigin: 'http://localhost:5173',
      dbKeepAlive: keepAlive,
    })
  })

  it('GET /health returns basic ok without touching database', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.timestamp).toBeDefined()
    expect(mockPrisma.$queryRawUnsafe).not.toHaveBeenCalled()
  })

  it('GET /health?check=db queries database and returns latency', async () => {
    const res = await request(app).get('/health?check=db')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.database).toBe('connected')
    expect(typeof res.body.latencyMs).toBe('number')
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1')
  })

  it('GET /health/db queries database and returns 200 connected', async () => {
    const res = await request(app).get('/health/db')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.database).toBe('connected')
    expect(typeof res.body.latencyMs).toBe('number')
    expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1')
  })

  it('GET /health/db returns 503 degraded when database fails', async () => {
    mockPrisma.$queryRawUnsafe.mockRejectedValueOnce(new Error('Neon database unreachable'))

    const res = await request(app).get('/health/db')
    expect(res.status).toBe(503)
    expect(res.body.status).toBe('degraded')
    expect(res.body.database).toBe('disconnected')
    expect(res.body.error).toBe('Database ping failed')
  })
})
