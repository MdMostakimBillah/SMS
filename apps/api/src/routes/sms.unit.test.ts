import { describe, it, expect, beforeEach } from 'vitest'
import express from 'express'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import type { PrismaClient } from '@prisma/client'
import { smsRouter, SMS_GATEWAY_CONFIG_KEY } from './sms.js'
import { SESSION_COOKIE, CSRF_COOKIE, CSRF_HEADER } from '../middleware/auth.js'
import { csrfProtection } from '../middleware/csrf.js'

const JWT_SECRET = 'test-sms-jwt-secret-at-least-32-chars-0001'

interface MemSchool {
  id: string
  name: string
  nameBn: string | null
  domain: string | null
  phone: string | null
  email: string | null
  eiin: string | null
  status: string
  smsAllocated: number
  smsUsed: number
  smsBalance: number
  createdAt: Date
}

function createInMemorySmsPrisma() {
  const sessions = new Map<string, any>()
  const systemConfig = new Map<string, { key: string; value: string }>()
  const schools = new Map<string, MemSchool>()
  const purchases: any[] = []
  const allocations: any[] = []
  const dispatchLogs: any[] = []

  // Seed default sessions/users + 2 tenant schools + 1 platform school
  sessions.set('sess-super', {
    id: 'sess-super',
    userId: 'user-super',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 3600_000),
    user: { id: 'user-super', role: 'super_admin', schoolId: null, isActive: true },
  })
  sessions.set('sess-school-1', {
    id: 'sess-school-1',
    userId: 'user-school-1',
    revokedAt: null,
    expiresAt: new Date(Date.now() + 3600_000),
    user: { id: 'user-school-1', role: 'school_admin', schoolId: 'school-1', isActive: true },
  })

  schools.set('edutech', {
    id: 'platform-1',
    name: 'EduTech Platform',
    nameBn: null,
    domain: 'edutech',
    phone: null,
    email: null,
    eiin: null,
    status: 'active',
    smsAllocated: 0,
    smsUsed: 0,
    smsBalance: 0,
    createdAt: new Date(),
  })
  schools.set('school-1', {
    id: 'school-1',
    name: 'Sunrise Academy',
    nameBn: 'সানরাইজ একাডেমি',
    domain: 'sunrise',
    phone: '01711111111',
    email: 'sunrise@edu.bd',
    eiin: '100101',
    status: 'active',
    smsAllocated: 0,
    smsUsed: 0,
    smsBalance: 0,
    createdAt: new Date(),
  })
  schools.set('school-2', {
    id: 'school-2',
    name: 'Delta High School',
    nameBn: 'ডেল্টা হাই স্কুল',
    domain: 'delta',
    phone: '01822222222',
    email: 'delta@edu.bd',
    eiin: '100202',
    status: 'active',
    smsAllocated: 0,
    smsUsed: 0,
    smsBalance: 0,
    createdAt: new Date(),
  })

  function filterTenantSchools(extraIds?: string[]) {
    return Array.from(schools.values()).filter((s) => {
      if (s.status === 'deleted') return false
      if (s.domain === 'edutech' || s.domain === 'main') return false
      if (extraIds && extraIds.length > 0 && !extraIds.includes(s.id)) return false
      return true
    })
  }

  const prismaMock: any = {
    session: {
      findUnique: async ({ where }: any) => sessions.get(where.id) ?? null,
    },
    systemConfig: {
      findUnique: async ({ where }: any) => systemConfig.get(where.key) ?? null,
      upsert: async ({ where, update, create }: any) => {
        const prev = systemConfig.get(where.key)
        const next = prev ? { ...prev, ...update } : { ...create }
        systemConfig.set(where.key, next)
        return next
      },
    },
    smsPurchase: {
      aggregate: async () => ({
        _sum: { quantity: purchases.reduce((acc, p) => acc + p.quantity, 0) },
      }),
      findMany: async () => [...purchases],
      create: async ({ data }: any) => {
        const rec = { id: `buy-${purchases.length + 1}`, purchasedAt: new Date(), ...data }
        purchases.unshift(rec)
        return rec
      },
    },
    school: {
      aggregate: async () => {
        const list = filterTenantSchools()
        return {
          _sum: {
            smsAllocated: list.reduce((a, s) => a + s.smsAllocated, 0),
            smsUsed: list.reduce((a, s) => a + s.smsUsed, 0),
            smsBalance: list.reduce((a, s) => a + s.smsBalance, 0),
          },
        }
      },
      findMany: async ({ where }: any) => {
        const idFilter = where?.id?.in as string[] | undefined
        return filterTenantSchools(idFilter)
      },
      findFirst: async ({ where }: any) => {
        const ors = where?.OR || []
        for (const s of schools.values()) {
          if (s.status === 'deleted') continue
          for (const cond of ors) {
            if ((cond.id && s.id === cond.id) || (cond.domain && s.domain === cond.domain)) {
              return { ...s }
            }
          }
        }
        return null
      },
      findUnique: async ({ where }: any) => {
        for (const s of schools.values()) {
          if (s.id === where.id) return { ...s }
        }
        return null
      },
      update: async ({ where, data }: any) => {
        const target = Array.from(schools.values()).find((s) => s.id === where.id)!
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === 'object' && 'increment' in (v as any)) {
            ;(target as any)[k] += (v as any).increment
          } else if (v && typeof v === 'object' && 'decrement' in (v as any)) {
            ;(target as any)[k] -= (v as any).decrement
          } else {
            ;(target as any)[k] = v
          }
        }
        return { ...target }
      },
      updateMany: async ({ where, data }: any) => {
        const target = Array.from(schools.values()).find((s) => s.id === where.id)
        if (!target) return { count: 0 }
        if (where.smsBalance?.gte !== undefined && target.smsBalance < where.smsBalance.gte) {
          return { count: 0 }
        }
        await prismaMock.school.update({ where: { id: target.id }, data })
        return { count: 1 }
      },
    },
    smsAllocation: {
      findMany: async ({ where }: any) =>
        where?.schoolId ? allocations.filter((a) => a.schoolId === where.schoolId) : [...allocations],
      create: async ({ data }: any) => {
        const rec = { id: `alc-${allocations.length + 1}`, allocatedAt: new Date(), ...data }
        allocations.unshift(rec)
        return rec
      },
    },
    smsDispatchLog: {
      aggregate: async () => ({
        _sum: {
          segments: dispatchLogs
            .filter((l) => l.schoolId === null && (l.status === 'sent' || l.status === 'delivered'))
            .reduce((a, l) => a + l.segments, 0),
        },
      }),
      findMany: async ({ where }: any) =>
        where?.schoolId ? dispatchLogs.filter((l) => l.schoolId === where.schoolId) : [...dispatchLogs],
      create: async ({ data }: any) => {
        const rec = { id: `log-${dispatchLogs.length + 1}`, sentAt: new Date(), ...data }
        dispatchLogs.unshift(rec)
        return rec
      },
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => fn(prismaMock),
  }

  return { prismaMock: prismaMock as PrismaClient, systemConfig, schools, dispatchLogs }
}

function authCookies(jti: string, userId: string, role: string, schoolId: string | null) {
  const token = jwt.sign({ jti, userId, role, schoolId }, JWT_SECRET, { expiresIn: '1h' })
  const csrf = 'test-csrf-token-value'
  return {
    cookie: `${SESSION_COOKIE}=${token}; ${CSRF_COOKIE}=${csrf}`,
    csrf,
  }
}

describe('SMS Router (/api/sms) — BD Provider Integration & Multi-Institution Distribution', () => {
  let prisma: ReturnType<typeof createInMemorySmsPrisma>
  let mockFetchBehavior: (url: string, init?: RequestInit) => Response
  let app: express.Express

  beforeEach(() => {
    prisma = createInMemorySmsPrisma()
    mockFetchBehavior = () =>
      new Response(JSON.stringify({ response_code: 202, message_id: 'BD-202', success_message: 'Queued' }), {
        status: 200,
      })

    app = express()
    app.use(express.json())
    app.use(cookieParser())
    app.use('/api', csrfProtection)
    app.use(
      '/api/sms',
      smsRouter(prisma.prismaMock, JWT_SECRET, {
        fetchImpl: (async (url: string | URL | Request, init?: RequestInit) =>
          mockFetchBehavior(String(url), init)) as typeof fetch,
      })
    )
  })

  it('starts with clean empty zero state (zero hardcoded demo records) and blocks non-super-admin from overview', async () => {
    const schoolAuth = authCookies('sess-school-1', 'user-school-1', 'school_admin', 'school-1')
    const forbidden = await request(app).get('/api/sms/super-admin/overview').set('Cookie', schoolAuth.cookie)
    expect(forbidden.status).toBe(403)

    const saAuth = authCookies('sess-super', 'user-super', 'super_admin', null)
    const ok = await request(app).get('/api/sms/super-admin/overview').set('Cookie', saAuth.cookie)
    expect(ok.status).toBe(200)
    expect(ok.body.masterPool).toEqual({ totalPurchased: 0, totalAllocated: 0, totalUsed: 0, available: 0 })
    expect(ok.body.purchases).toEqual([])
    expect(ok.body.allocations).toEqual([])
    expect(ok.body.dispatchLogs).toEqual([])
  })

  it('encrypts gateway API key at rest, returns masked key, purchases bulk SMS, and distributes across ALL institutions', async () => {
    const sa = authCookies('sess-super', 'user-super', 'super_admin', null)

    // 1. Configure BulkSMSBD gateway
    const gwRes = await request(app)
      .put('/api/sms/super-admin/gateway')
      .set('Cookie', sa.cookie)
      .set(CSRF_HEADER, sa.csrf)
      .send({
        providerName: 'BulkSMSBD Production',
        providerType: 'bulksmsbd',
        senderId: '8809617600111',
        apiKey: 'live-bd-secret-key-4321',
        isActive: true,
      })
    expect(gwRes.status).toBe(200)
    expect(gwRes.body.gatewayConfig.hasApiKey).toBe(true)
    expect(gwRes.body.gatewayConfig.maskedApiKey).toBe('••••4321')
    expect(gwRes.body.gatewayConfig.apiKey).toBeUndefined()

    // Ensure DB stored encrypted secret
    const storedRaw = prisma.systemConfig.get(SMS_GATEWAY_CONFIG_KEY)?.value || ''
    expect(storedRaw).toContain('enc:v1:')
    expect(storedRaw).not.toContain('live-bd-secret-key-4321')

    // 2. Live provider balance check
    mockFetchBehavior = () => new Response(JSON.stringify({ balance: '5200.75' }), { status: 200 })
    const balRes = await request(app).get('/api/sms/super-admin/provider-balance').set('Cookie', sa.cookie)
    expect(balRes.status).toBe(200)
    expect(balRes.body.balanceNumeric).toBe(5200.75)

    // 3. Purchase 10,000 SMS credits into Master Pool
    const buyRes = await request(app)
      .post('/api/sms/super-admin/purchases')
      .set('Cookie', sa.cookie)
      .set(CSRF_HEADER, sa.csrf)
      .send({ provider: 'BulkSMSBD', quantity: 10000, totalCost: 3000, refId: 'INV-900' })
    expect(buyRes.status).toBe(201)
    expect(buyRes.body.masterPool.totalPurchased).toBe(10000)

    // 4. Distribute 1,500 SMS per active institution (2 schools => 3,000 distributed)
    const distRes = await request(app)
      .post('/api/sms/super-admin/distribute-all')
      .set('Cookie', sa.cookie)
      .set(CSRF_HEADER, sa.csrf)
      .send({ mode: 'per_school', amount: 1500, onlyActive: true, note: 'Monthly rollout' })
    expect(distRes.status).toBe(200)
    expect(distRes.body.distributedCount).toBe(2)
    expect(distRes.body.totalDistributed).toBe(3000)
    expect(distRes.body.masterPool.available).toBe(7000)
    expect(prisma.schools.get('school-1')!.smsBalance).toBe(1500)
    expect(prisma.schools.get('school-2')!.smsBalance).toBe(1500)
  })

  it('enforces tenant isolation, deducts Unicode segment counts accurately, and refunds failed upstream sends', async () => {
    const sa = authCookies('sess-super', 'user-super', 'super_admin', null)
    const inst1 = authCookies('sess-school-1', 'user-school-1', 'school_admin', 'school-1')

    // Setup gateway + pool + allocate 10 credits to school-1
    await request(app)
      .put('/api/sms/super-admin/gateway')
      .set('Cookie', sa.cookie)
      .set(CSRF_HEADER, sa.csrf)
      .send({
        providerName: 'BulkSMSBD',
        providerType: 'bulksmsbd',
        apiKey: 'secret-key-xyz',
        senderId: 'EDUTECH',
        isActive: true,
      })
    await request(app)
      .post('/api/sms/super-admin/purchases')
      .set('Cookie', sa.cookie)
      .set(CSRF_HEADER, sa.csrf)
      .send({ provider: 'BulkSMSBD', quantity: 100, totalCost: 30 })
    await request(app)
      .post('/api/sms/super-admin/allocations')
      .set('Cookie', sa.cookie)
      .set(CSRF_HEADER, sa.csrf)
      .send({ schoolId: 'school-1', amount: 10, type: 'credit' })

    // Cross-tenant isolation: school-1 cannot inspect or spend school-2's quota
    const crossTenant = await request(app)
      .get('/api/sms/balance?schoolId=school-2')
      .set('Cookie', inst1.cookie)
    expect(crossTenant.status).toBe(403)

    // 71 Bangla characters => 2 Unicode segments deducted on success
    const banglaMsg = 'অ'.repeat(71)
    const sendOk = await request(app)
      .post('/api/sms/send')
      .set('Cookie', inst1.cookie)
      .set(CSRF_HEADER, inst1.csrf)
      .send({ phone: '01712345678', message: banglaMsg, triggerType: 'fee' })
    expect(sendOk.status).toBe(200)
    expect(sendOk.body.segmentsUsed).toBe(2)
    expect(sendOk.body.balance.remaining).toBe(8)

    // Provider rejection => credits refunded cleanly (still 8 remaining)
    mockFetchBehavior = () =>
      new Response(JSON.stringify({ response_code: 1007, error_message: 'Low gateway balance' }), { status: 200 })
    const sendFail = await request(app)
      .post('/api/sms/send')
      .set('Cookie', inst1.cookie)
      .set(CSRF_HEADER, inst1.csrf)
      .send({ phone: '01712345678', message: 'Hello', triggerType: 'fee' })
    expect(sendFail.status).toBe(502)
    expect(sendFail.body.balance.remaining).toBe(8)
  })
})
