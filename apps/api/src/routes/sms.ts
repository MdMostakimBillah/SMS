import { Router, type Request, type Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { rateLimit } from 'express-rate-limit'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'
import { audit } from '../audit.js'
import {
  calculateSmsSegments,
  fetchBdProviderBalance,
  maskGatewayConfig,
  normalizeBdPhone,
  sealGatewayConfigForDb,
  sendThroughBdProvider,
  unsealGatewayConfigFromDb,
  validateProviderEndpointUrl,
  DEFAULT_PROVIDER_URLS,
  type BdSmsProviderType,
  type FetchLike,
  type StoredSmsGatewayConfig,
} from '../lib/bdSmsProviders.js'

export const SMS_GATEWAY_CONFIG_KEY = 'super_admin_sms_gateway'

const EXCLUDED_SYSTEM_DOMAINS = ['edutech', 'main']

const gatewayUpdateSchema = z.object({
  providerName: z.string().trim().min(1).max(120),
  providerType: z.enum([
    'bulksmsbd',
    'smsnetbd',
    'greenweb',
    'mimsms',
    'sslwireless',
    'sim_gateway',
    'http_api',
    'custom',
  ]),
  apiUrl: z.string().trim().max(500).optional().default(''),
  senderId: z.string().trim().max(40).optional().default(''),
  username: z.string().trim().max(120).optional().default(''),
  isActive: z.boolean().optional().default(true),
  apiKey: z.string().max(500).optional(),
  password: z.string().max(500).optional(),
  clearApiKey: z.boolean().optional().default(false),
})

const purchaseCreateSchema = z.object({
  provider: z.string().trim().min(1).max(150),
  quantity: z.number().int().min(1).max(100_000_000),
  totalCost: z.number().min(0).max(1_000_000_000),
  refId: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
})

const allocationCreateSchema = z.object({
  schoolId: z.string().trim().min(1).max(120),
  amount: z.number().int().min(1).max(10_000_000),
  type: z.enum(['credit', 'debit']).optional().default('credit'),
  note: z.string().trim().max(300).optional(),
})

const distributeAllSchema = z.object({
  mode: z.enum(['per_school', 'split_total']).optional().default('per_school'),
  amount: z.number().int().min(1).max(50_000_000),
  schoolIds: z.array(z.string().trim().min(1)).max(500).optional(),
  onlyActive: z.boolean().optional().default(true),
  note: z.string().trim().max(300).optional(),
})

const broadcastSchema = z.object({
  recipients: z.array(z.string().trim().min(5).max(30)).max(500).optional().default([]),
  schoolIds: z.array(z.string().trim().min(1)).max(500).optional(),
  allSchools: z.boolean().optional().default(false),
  message: z.string().trim().min(1).max(1600),
  triggerType: z.enum(['broadcast', 'test']).optional().default('broadcast'),
})

const institutionSendSingleSchema = z.object({
  phone: z.string().trim().min(6).max(30),
  message: z.string().trim().min(1).max(1600),
  triggerType: z.enum(['fee', 'exam', 'attendance', 'admission', 'manual']).optional().default('manual'),
  schoolId: z.string().trim().optional(),
  slug: z.string().trim().optional(),
})

const institutionSendBulkSchema = z.object({
  phones: z.array(z.string().trim().min(6).max(30)).min(1).max(500),
  message: z.string().trim().min(1).max(1600),
  triggerType: z.enum(['fee', 'exam', 'attendance', 'admission', 'manual']).optional().default('manual'),
  schoolId: z.string().trim().optional(),
  slug: z.string().trim().optional(),
})

async function loadGatewayConfig(prisma: PrismaClient, jwtSecret: string): Promise<StoredSmsGatewayConfig> {
  const row = await prisma.systemConfig.findUnique({ where: { key: SMS_GATEWAY_CONFIG_KEY } })
  return unsealGatewayConfigFromDb(row?.value, jwtSecret)
}

async function computeMasterPoolStats(prisma: PrismaClient) {
  const [purchaseSum, schoolSum, superLogsSum] = await Promise.all([
    prisma.smsPurchase.aggregate({ _sum: { quantity: true } }),
    prisma.school.aggregate({
      where: {
        status: { not: 'deleted' },
        OR: [{ domain: null }, { domain: { notIn: EXCLUDED_SYSTEM_DOMAINS } }],
      },
      _sum: { smsAllocated: true, smsUsed: true, smsBalance: true },
    }),
    prisma.smsDispatchLog.aggregate({
      where: { schoolId: null, status: { in: ['sent', 'delivered'] } },
      _sum: { segments: true },
    }),
  ])

  const totalPurchased = purchaseSum._sum.quantity ?? 0
  const totalAllocated = schoolSum._sum.smsAllocated ?? 0
  const totalUsed = (schoolSum._sum.smsUsed ?? 0) + (superLogsSum._sum.segments ?? 0)
  const available = Math.max(0, totalPurchased - totalAllocated)

  return { totalPurchased, totalAllocated, totalUsed, available }
}

export interface SmsRouterOptions {
  fetchImpl?: FetchLike
}

export function smsRouter(prisma: PrismaClient, jwtSecret: string, options?: SmsRouterOptions) {
  const router = Router()
  const fetchImpl = options?.fetchImpl ?? fetch

  const sendLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.VITEST === 'true',
    message: { error: 'Too many SMS dispatch requests, please slow down' },
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPER ADMIN ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  router.get(
    '/super-admin/overview',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (_req: AuthenticatedRequest, res: Response) => {
      try {
        const [masterPool, gatewayCfg, schools, purchases, allocations, dispatchLogs] = await Promise.all([
          computeMasterPoolStats(prisma),
          loadGatewayConfig(prisma, jwtSecret),
          prisma.school.findMany({
            where: {
              status: { not: 'deleted' },
              OR: [{ domain: null }, { domain: { notIn: EXCLUDED_SYSTEM_DOMAINS } }],
            },
            select: {
              id: true,
              name: true,
              nameBn: true,
              domain: true,
              phone: true,
              email: true,
              eiin: true,
              status: true,
              smsAllocated: true,
              smsUsed: true,
              smsBalance: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.smsPurchase.findMany({ orderBy: { purchasedAt: 'desc' }, take: 100 }),
          prisma.smsAllocation.findMany({ orderBy: { allocatedAt: 'desc' }, take: 100 }),
          prisma.smsDispatchLog.findMany({ orderBy: { sentAt: 'desc' }, take: 200 }),
        ])

        res.json({
          masterPool,
          gatewayConfig: maskGatewayConfig(gatewayCfg),
          schools: schools.map((s) => ({
            id: s.id,
            name: s.name,
            nameBn: s.nameBn || s.name,
            slug: s.domain || s.id,
            subdomain: s.domain || s.id,
            phone: s.phone || '',
            email: s.email || '',
            eiin: s.eiin || '',
            status: s.status,
            balance: {
              allocated: s.smsAllocated,
              used: s.smsUsed,
              remaining: s.smsBalance,
            },
          })),
          purchases,
          allocations,
          dispatchLogs,
        })
      } catch (err) {
        console.error('[sms] super-admin overview failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  router.get(
    '/super-admin/provider-balance',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (_req: AuthenticatedRequest, res: Response) => {
      try {
        const cfg = await loadGatewayConfig(prisma, jwtSecret)
        const outcome = await fetchBdProviderBalance(cfg, fetchImpl)
        res.status(outcome.success ? 200 : 400).json(outcome)
      } catch (err) {
        console.error('[sms] provider balance check failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ success: false, error: 'Internal server error' })
      }
    }
  )

  router.put(
    '/super-admin/gateway',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const parsed = gatewayUpdateSchema.safeParse(req.body)
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
        }

        const data = parsed.data
        const existing = await loadGatewayConfig(prisma, jwtSecret)
        const pType = data.providerType as BdSmsProviderType

        const rawUrl = data.apiUrl || DEFAULT_PROVIDER_URLS[pType]?.sendUrl || ''
        if (rawUrl) {
          validateProviderEndpointUrl(rawUrl)
        }

        // Preserve stored encrypted key unless explicitly replaced or cleared
        let nextApiKey = existing.apiKey
        if (data.clearApiKey) {
          nextApiKey = ''
        } else if (data.apiKey !== undefined && data.apiKey.trim() && !data.apiKey.trim().startsWith('••••')) {
          nextApiKey = data.apiKey.trim()
        }

        let nextPassword = existing.password
        if (data.clearApiKey) {
          nextPassword = ''
        } else if (data.password !== undefined && data.password.trim() && !data.password.trim().startsWith('••••')) {
          nextPassword = data.password.trim()
        }

        const nextConfig: StoredSmsGatewayConfig = {
          providerName: data.providerName,
          providerType: pType,
          apiUrl: rawUrl,
          senderId: data.senderId,
          username: data.username,
          isActive: data.isActive,
          apiKey: nextApiKey,
          password: nextPassword,
        }

        const sealed = sealGatewayConfigForDb(nextConfig, jwtSecret)
        await prisma.systemConfig.upsert({
          where: { key: SMS_GATEWAY_CONFIG_KEY },
          update: { value: sealed },
          create: { key: SMS_GATEWAY_CONFIG_KEY, value: sealed },
        })

        audit({
          action: 'sms.gateway.update',
          actorId: req.userId,
          actorRole: req.userRole,
          outcome: 'success',
          detail: {
            providerType: nextConfig.providerType,
            isActive: nextConfig.isActive,
            hasApiKey: Boolean(nextConfig.apiKey),
          },
        })

        res.json({ success: true, gatewayConfig: maskGatewayConfig(nextConfig) })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Internal server error'
        if (msg.includes('Invalid SMS API') || msg.includes('Restricted') || msg.includes('HTTP')) {
          return res.status(400).json({ error: msg })
        }
        console.error('[sms] gateway update failed:', msg)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  router.post(
    '/super-admin/purchases',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const parsed = purchaseCreateSchema.safeParse(req.body)
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
        }

        const { provider, quantity, totalCost, refId, notes } = parsed.data
        const unitPrice = quantity > 0 ? Number((totalCost / quantity).toFixed(4)) : 0
        const record = await prisma.smsPurchase.create({
          data: {
            provider,
            quantity,
            unitPrice,
            totalCost,
            refId: refId || `TX-${Date.now().toString(36).toUpperCase()}`,
            notes: notes || null,
            purchasedBy: req.userId || null,
          },
        })

        const masterPool = await computeMasterPoolStats(prisma)
        audit({
          action: 'sms.purchase.create',
          actorId: req.userId,
          actorRole: req.userRole,
          resourceId: record.id,
          outcome: 'success',
          detail: { quantity, totalCost },
        })

        res.status(201).json({ success: true, purchase: record, masterPool })
      } catch (err) {
        console.error('[sms] create purchase failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  router.post(
    '/super-admin/allocations',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const parsed = allocationCreateSchema.safeParse(req.body)
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
        }

        const { schoolId, amount, type, note } = parsed.data

        const outcome = await prisma.$transaction(async (tx) => {
          const school = await tx.school.findFirst({
            where: { OR: [{ id: schoolId }, { domain: schoolId }], status: { not: 'deleted' } },
          })
          if (!school) {
            return { status: 404 as const, error: 'Institution not found' }
          }

          if (type === 'credit') {
            const [pSum, sSum] = await Promise.all([
              tx.smsPurchase.aggregate({ _sum: { quantity: true } }),
              tx.school.aggregate({
                where: {
                  status: { not: 'deleted' },
                  OR: [{ domain: null }, { domain: { notIn: EXCLUDED_SYSTEM_DOMAINS } }],
                },
                _sum: { smsAllocated: true },
              }),
            ])
            const availableMaster = (pSum._sum.quantity ?? 0) - (sSum._sum.smsAllocated ?? 0)
            if (amount > availableMaster) {
              return {
                status: 400 as const,
                error: `Insufficient master SMS pool balance. Available to allocate: ${Math.max(0, availableMaster).toLocaleString()} SMS`,
              }
            }

            const updated = await tx.school.update({
              where: { id: school.id },
              data: {
                smsAllocated: { increment: amount },
                smsBalance: { increment: amount },
              },
              select: { smsAllocated: true, smsUsed: true, smsBalance: true },
            })

            const allocation = await tx.smsAllocation.create({
              data: {
                schoolId: school.id,
                schoolName: school.name,
                amount,
                type: 'credit',
                note: note || 'Super Admin SMS Credit Allocation',
                allocatedBy: req.userId || 'super_admin',
              },
            })

            return {
              status: 200 as const,
              allocation,
              balance: {
                allocated: updated.smsAllocated,
                used: updated.smsUsed,
                remaining: updated.smsBalance,
              },
            }
          }

          // Debit / reclaim unused SMS back into master pool
          const reclaimable = Math.min(amount, school.smsBalance)
          if (reclaimable <= 0) {
            return { status: 400 as const, error: 'Institution has no remaining unused SMS balance to debit' }
          }

          const nextAllocated = Math.max(school.smsUsed, school.smsAllocated - reclaimable)
          const updated = await tx.school.update({
            where: { id: school.id },
            data: {
              smsAllocated: nextAllocated,
              smsBalance: school.smsBalance - reclaimable,
            },
            select: { smsAllocated: true, smsUsed: true, smsBalance: true },
          })

          const allocation = await tx.smsAllocation.create({
            data: {
              schoolId: school.id,
              schoolName: school.name,
              amount: reclaimable,
              type: 'debit',
              note: note || 'Super Admin SMS Balance Adjustment',
              allocatedBy: req.userId || 'super_admin',
            },
          })

          return {
            status: 200 as const,
            allocation,
            balance: {
              allocated: updated.smsAllocated,
              used: updated.smsUsed,
              remaining: updated.smsBalance,
            },
          }
        })

        if (outcome.status !== 200) {
          return res.status(outcome.status).json({ error: outcome.error })
        }

        const masterPool = await computeMasterPoolStats(prisma)
        audit({
          action: 'sms.allocation.create',
          actorId: req.userId,
          actorRole: req.userRole,
          schoolId: outcome.allocation.schoolId,
          resourceId: outcome.allocation.id,
          outcome: 'success',
          detail: { amount: outcome.allocation.amount, type },
        })

        res.json({ success: true, ...outcome, masterPool })
      } catch (err) {
        console.error('[sms] allocation failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  router.post(
    '/super-admin/distribute-all',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const parsed = distributeAllSchema.safeParse(req.body)
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
        }

        const { mode, amount, schoolIds, onlyActive, note } = parsed.data

        const outcome = await prisma.$transaction(async (tx) => {
          const schools = await tx.school.findMany({
            where: {
              ...(schoolIds && schoolIds.length > 0 ? { id: { in: schoolIds } } : {}),
              status: onlyActive ? 'active' : { not: 'deleted' },
              OR: [{ domain: null }, { domain: { notIn: EXCLUDED_SYSTEM_DOMAINS } }],
            },
            select: { id: true, name: true },
          })

          if (schools.length === 0) {
            return { status: 400 as const, error: 'No eligible institutions found to distribute SMS credits' }
          }

          if (mode === 'split_total' && amount < schools.length) {
            return {
              status: 400 as const,
              error: `Total amount (${amount}) must be at least ${schools.length} SMS to distribute across all ${schools.length} institutions`,
            }
          }

          const totalNeeded = mode === 'per_school' ? amount * schools.length : amount
          const [pSum, sSum] = await Promise.all([
            tx.smsPurchase.aggregate({ _sum: { quantity: true } }),
            tx.school.aggregate({
              where: {
                status: { not: 'deleted' },
                OR: [{ domain: null }, { domain: { notIn: EXCLUDED_SYSTEM_DOMAINS } }],
              },
              _sum: { smsAllocated: true },
            }),
          ])

          const availableMaster = (pSum._sum.quantity ?? 0) - (sSum._sum.smsAllocated ?? 0)
          if (totalNeeded > availableMaster) {
            return {
              status: 400 as const,
              error: `Insufficient master pool balance. Need ${totalNeeded.toLocaleString()} SMS, available: ${Math.max(0, availableMaster).toLocaleString()} SMS`,
            }
          }

          const baseShare = mode === 'per_school' ? amount : Math.floor(amount / schools.length)
          const remainder = mode === 'split_total' ? amount % schools.length : 0

          const allocations = []
          for (let i = 0; i < schools.length; i++) {
            const share = baseShare + (i < remainder ? 1 : 0)
            const s = schools[i]
            await tx.school.update({
              where: { id: s.id },
              data: {
                smsAllocated: { increment: share },
                smsBalance: { increment: share },
              },
            })
            const alloc = await tx.smsAllocation.create({
              data: {
                schoolId: s.id,
                schoolName: s.name,
                amount: share,
                type: 'credit',
                note: note || `Bulk distribution across ${schools.length} institutions`,
                allocatedBy: req.userId || 'super_admin',
              },
            })
            allocations.push(alloc)
          }

          return {
            status: 200 as const,
            distributedCount: schools.length,
            totalDistributed: totalNeeded,
            allocations,
          }
        })

        if (outcome.status !== 200) {
          return res.status(outcome.status).json({ error: outcome.error })
        }

        const masterPool = await computeMasterPoolStats(prisma)
        audit({
          action: 'sms.allocation.distribute_all',
          actorId: req.userId,
          actorRole: req.userRole,
          outcome: 'success',
          detail: { distributedCount: outcome.distributedCount, totalDistributed: outcome.totalDistributed },
        })

        res.json({ success: true, ...outcome, masterPool })
      } catch (err) {
        console.error('[sms] distribute-all failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  router.post(
    '/super-admin/broadcast',
    sendLimiter,
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const parsed = broadcastSchema.safeParse(req.body)
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
        }

        const { recipients, schoolIds, allSchools, message, triggerType } = parsed.data
        const cfg = await loadGatewayConfig(prisma, jwtSecret)
        if (!cfg.isActive) {
          return res.status(400).json({ error: 'SMS gateway is inactive. Enable it in Provider Gateway Settings first.' })
        }

        const targets: Array<{ phone: string; schoolId: string | null; schoolName: string }> = []
        const seenPhones = new Set<string>()
        let skippedCount = 0

        if (allSchools || (schoolIds && schoolIds.length > 0)) {
          const schools = await prisma.school.findMany({
            where: {
              ...(schoolIds && schoolIds.length > 0 ? { id: { in: schoolIds } } : {}),
              status: { not: 'deleted' },
              OR: [{ domain: null }, { domain: { notIn: EXCLUDED_SYSTEM_DOMAINS } }],
            },
            select: { id: true, name: true, phone: true },
          })
          for (const s of schools) {
            const norm = normalizeBdPhone(s.phone || '')
            if (!norm || norm.length < 10) {
              skippedCount++
              continue
            }
            if (!seenPhones.has(norm)) {
              seenPhones.add(norm)
              targets.push({ phone: norm, schoolId: null, schoolName: `Broadcast -> ${s.name}` })
            }
          }
        }

        for (const rawPhone of recipients) {
          const norm = normalizeBdPhone(rawPhone)
          if (!norm || norm.length < 10) {
            skippedCount++
            continue
          }
          if (!seenPhones.has(norm)) {
            seenPhones.add(norm)
            targets.push({
              phone: norm,
              schoolId: null,
              schoolName: triggerType === 'test' ? 'Super Admin Gateway Test' : 'Super Admin Broadcast',
            })
          }
        }

        if (targets.length === 0) {
          return res.status(400).json({ error: 'No valid recipient mobile numbers found' })
        }

        const seg = calculateSmsSegments(message)
        let sentCount = 0
        let failedCount = 0
        const createdLogs = []

        for (const t of targets) {
          const result = await sendThroughBdProvider({ phone: t.phone, message, config: cfg }, fetchImpl)
          if (result.success) sentCount++
          else failedCount++

          const log = await prisma.smsDispatchLog.create({
            data: {
              schoolId: t.schoolId,
              schoolName: t.schoolName,
              phone: t.phone,
              message,
              triggerType,
              provider: cfg.providerName,
              providerMessageId: result.providerMessageId || null,
              segments: result.success ? seg.segments : 0,
              status: result.status,
              providerResponse: result.providerResponse || null,
              error: result.error || null,
              sentBy: req.userId || null,
            },
          })
          createdLogs.push(log)
        }

        const masterPool = await computeMasterPoolStats(prisma)
        res.status(sentCount > 0 ? 200 : 502).json({
          success: sentCount > 0 && failedCount === 0,
          partialSuccess: sentCount > 0 && failedCount > 0,
          sentCount,
          failedCount,
          skippedCount,
          segmentsPerSms: seg.segments,
          isUnicode: seg.isUnicode,
          error: failedCount > 0 && sentCount === 0 ? createdLogs[0]?.error || 'Delivery failed' : undefined,
          logs: createdLogs,
          masterPool,
        })
      } catch (err) {
        console.error('[sms] broadcast failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // INSTITUTION TENANT ENDPOINTS
  // ═══════════════════════════════════════════════════════════════════════════

  router.get('/balance', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        name: true,
        smsAllocated: true,
        smsUsed: true,
        smsBalance: true,
      })

      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      if (req.userRole !== 'super_admin' && req.schoolId && req.schoolId !== school.id) {
        return res.status(403).json({ error: 'Forbidden: cross-tenant access denied' })
      }

      const [cfg, allocations, recentLogs] = await Promise.all([
        loadGatewayConfig(prisma, jwtSecret),
        prisma.smsAllocation.findMany({
          where: { schoolId: school.id },
          orderBy: { allocatedAt: 'desc' },
          take: 25,
        }),
        prisma.smsDispatchLog.findMany({
          where: { schoolId: school.id },
          orderBy: { sentAt: 'desc' },
          take: 50,
        }),
      ])

      res.json({
        schoolId: school.id,
        schoolName: school.name,
        balance: {
          allocated: school.smsAllocated,
          used: school.smsUsed,
          remaining: school.smsBalance,
        },
        gatewayConfigured: cfg.isActive && Boolean(cfg.apiKey || cfg.providerType === 'custom' || cfg.providerType === 'sim_gateway'),
        providerName: cfg.providerName,
        allocations,
        recentLogs,
      })
    } catch (err) {
      console.error('[sms] GET balance failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  async function handleInstitutionDispatch(
    req: AuthenticatedRequest,
    res: Response,
    phonesRaw: string[],
    message: string,
    triggerType: string
  ) {
    const school = await resolveTargetSchool(prisma, req, jwtSecret, {
      id: true,
      name: true,
      smsAllocated: true,
      smsUsed: true,
      smsBalance: true,
    })

    if (!school) {
      return res.status(404).json({ error: 'Institution not found' })
    }
    if (req.userRole !== 'super_admin' && req.schoolId && req.schoolId !== school.id) {
      return res.status(403).json({ error: 'Forbidden: cross-tenant access denied' })
    }

    const cfg = await loadGatewayConfig(prisma, jwtSecret)
    if (!cfg.isActive) {
      return res.status(400).json({ error: 'SMS gateway is currently inactive. Please contact Super Admin.' })
    }

    const normalizedSet = new Set<string>()
    for (const raw of phonesRaw) {
      const n = normalizeBdPhone(raw)
      if (n && n.length >= 10) normalizedSet.add(n)
    }
    const validPhones = Array.from(normalizedSet)
    if (validPhones.length === 0) {
      return res.status(400).json({ error: 'No valid mobile numbers supplied' })
    }

    const seg = calculateSmsSegments(message)
    const totalSegmentsNeeded = validPhones.length * seg.segments

    // Atomic credit reservation inside PostgreSQL transaction (prevents race overdraw)
    const reserved = await prisma.$transaction(async (tx) => {
      const updated = await tx.school.updateMany({
        where: { id: school.id, smsBalance: { gte: totalSegmentsNeeded } },
        data: {
          smsUsed: { increment: totalSegmentsNeeded },
          smsBalance: { decrement: totalSegmentsNeeded },
        },
      })
      return updated.count > 0
    })

    if (!reserved) {
      return res.status(400).json({
        error: `Insufficient SMS balance! Need ${totalSegmentsNeeded} credit(s) (${seg.segments} segment(s) x ${validPhones.length} recipient(s)), remaining: ${school.smsBalance}. Please contact Super Admin to recharge.`,
      })
    }

    let sentCount = 0
    let failedCount = 0
    const logs = []

    for (const phone of validPhones) {
      const outcome = await sendThroughBdProvider({ phone, message, config: cfg }, fetchImpl)
      if (outcome.success) {
        sentCount++
      } else {
        failedCount++
        // Refund segments atomically for failed delivery attempt
        await prisma.school.update({
          where: { id: school.id },
          data: {
            smsUsed: { decrement: seg.segments },
            smsBalance: { increment: seg.segments },
          },
        })
      }

      const log = await prisma.smsDispatchLog.create({
        data: {
          schoolId: school.id,
          schoolName: school.name,
          phone,
          message,
          triggerType,
          provider: cfg.providerName,
          providerMessageId: outcome.providerMessageId || null,
          segments: outcome.success ? seg.segments : 0,
          status: outcome.status,
          providerResponse: outcome.providerResponse || null,
          error: outcome.error || null,
          sentBy: req.userId || null,
        },
      })
      logs.push(log)
    }

    const freshSchool = await prisma.school.findUnique({
      where: { id: school.id },
      select: { smsAllocated: true, smsUsed: true, smsBalance: true },
    })

    return res.status(sentCount > 0 ? 200 : 502).json({
      success: sentCount > 0 && failedCount === 0,
      status: sentCount > 0 ? logs[0]?.status || 'delivered' : 'failed',
      messageId: logs[0]?.id || '',
      sentCount,
      failedCount,
      segmentsUsed: sentCount * seg.segments,
      error: failedCount > 0 && sentCount === 0 ? logs[0]?.error || 'SMS delivery failed' : undefined,
      providerResponse: logs[0]?.providerResponse || undefined,
      balance: {
        allocated: freshSchool?.smsAllocated ?? school.smsAllocated,
        used: freshSchool?.smsUsed ?? school.smsUsed,
        remaining: freshSchool?.smsBalance ?? school.smsBalance,
      },
    })
  }

  router.post(
    '/send',
    sendLimiter,
    requireAuth(prisma, jwtSecret),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const parsed = institutionSendSingleSchema.safeParse(req.body)
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
        }
        // Forward optional body schoolId/slug onto query lookup cleanly if super_admin
        if (parsed.data.schoolId && !req.query.schoolId) req.query.schoolId = parsed.data.schoolId
        if (parsed.data.slug && !req.query.slug) req.query.slug = parsed.data.slug

        return await handleInstitutionDispatch(
          req,
          res,
          [parsed.data.phone],
          parsed.data.message,
          parsed.data.triggerType
        )
      } catch (err) {
        console.error('[sms] POST send failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  router.post(
    '/send-bulk',
    sendLimiter,
    requireAuth(prisma, jwtSecret),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const parsed = institutionSendBulkSchema.safeParse(req.body)
        if (!parsed.success) {
          return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors })
        }
        if (parsed.data.schoolId && !req.query.schoolId) req.query.schoolId = parsed.data.schoolId
        if (parsed.data.slug && !req.query.slug) req.query.slug = parsed.data.slug

        return await handleInstitutionDispatch(
          req,
          res,
          parsed.data.phones,
          parsed.data.message,
          parsed.data.triggerType
        )
      } catch (err) {
        console.error('[sms] POST send-bulk failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  return router
}
