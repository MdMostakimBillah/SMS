import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSmsStore } from '@/store/smsStore'
import { useMessageStore, sendTemplateSMS } from '@/store/messageStore'
import { smsApi } from '@/lib/api'

describe('End-to-End Bangladesh Bulk SMS Lifecycle (API-backed)', () => {
  const TEST_INST_ID = 'inst-greenwood-prep'
  const TEST_INST_NAME = 'Greenwood International School'

  let poolPurchased = 0
  let poolAllocated = 0
  let instAlloc = 0
  let instUsed = 0
  let instRemaining = 0

  beforeEach(() => {
    vi.restoreAllMocks()
    poolPurchased = 50000
    poolAllocated = 0
    instAlloc = 0
    instUsed = 0
    instRemaining = 0

    useSmsStore.setState({
      masterPool: {
        totalPurchased: poolPurchased,
        totalAllocated: 0,
        totalUsed: 0,
        available: poolPurchased,
      },
      schools: [],
      purchases: [],
      allocations: [],
      institutionBalances: {},
      dispatchLogs: [],
      gatewayConfigured: true,
      gatewayConfig: {
        providerName: 'BulkSMSBD (Bangladesh)',
        providerType: 'bulksmsbd',
        apiUrl: 'https://bulksmsbd.net/api/smsapi',
        senderId: 'EduTech',
        isActive: true,
        hasApiKey: true,
        maskedApiKey: '••••9999',
      },
    })
    useMessageStore.setState({ messages: [] })

    vi.spyOn(smsApi, 'recordPurchase').mockImplementation(async ({ provider, quantity, totalCost, refId }) => {
      poolPurchased += quantity
      return {
        success: true,
        purchase: {
          id: `buy-${Date.now()}`,
          provider,
          quantity,
          unitPrice: totalCost / quantity,
          totalCost,
          refId: refId || 'INV-1',
          purchasedAt: new Date().toISOString(),
        },
        masterPool: {
          totalPurchased: poolPurchased,
          totalAllocated: poolAllocated,
          totalUsed: instUsed,
          available: poolPurchased - poolAllocated,
        },
      }
    })

    vi.spyOn(smsApi, 'allocateToSchool').mockImplementation(async ({ schoolId, amount, note }) => {
      if (amount > poolPurchased - poolAllocated) {
        throw new Error('Insufficient master SMS pool balance')
      }
      poolAllocated += amount
      instAlloc += amount
      instRemaining += amount
      return {
        success: true,
        allocation: {
          id: `alc-${Date.now()}`,
          schoolId,
          schoolName: TEST_INST_NAME,
          amount,
          type: 'credit',
          note: note || 'Allocated',
          allocatedAt: new Date().toISOString(),
        },
        balance: { allocated: instAlloc, used: instUsed, remaining: instRemaining },
        masterPool: {
          totalPurchased: poolPurchased,
          totalAllocated: poolAllocated,
          totalUsed: instUsed,
          available: poolPurchased - poolAllocated,
        },
      }
    })

    vi.spyOn(smsApi, 'updateGateway').mockImplementation(async (cfg) => ({
      success: true,
      gatewayConfig: {
        providerName: cfg.providerName,
        providerType: cfg.providerType as any,
        apiUrl: cfg.apiUrl || 'https://bulksmsbd.net/api/smsapi',
        senderId: cfg.senderId || '',
        username: cfg.username || '',
        isActive: cfg.isActive,
        hasApiKey: true,
        maskedApiKey: '••••8888',
        hasPassword: false,
      },
    }))

    vi.spyOn(smsApi, 'superAdminBroadcast').mockImplementation(async () => ({
      success: true,
      sentCount: 1,
      failedCount: 0,
      skippedCount: 0,
      segmentsPerSms: 1,
      isUnicode: false,
      logs: [],
      masterPool: {
        totalPurchased: poolPurchased,
        totalAllocated: poolAllocated,
        totalUsed: instUsed + 1,
        available: poolPurchased - poolAllocated,
      },
    }))

    vi.spyOn(smsApi, 'getSuperAdminOverview').mockImplementation(async () => ({
      masterPool: {
        totalPurchased: poolPurchased,
        totalAllocated: poolAllocated,
        totalUsed: instUsed,
        available: poolPurchased - poolAllocated,
      },
      gatewayConfig: useSmsStore.getState().gatewayConfig as any,
      schools: [],
      purchases: useSmsStore.getState().purchases,
      allocations: [],
      dispatchLogs: [],
    }))

    vi.spyOn(smsApi, 'sendSingle').mockImplementation(async () => {
      if (instRemaining <= 0) {
        throw new Error('Insufficient SMS balance! Please contact Super Admin.')
      }
      instUsed += 1
      instRemaining -= 1
      return {
        success: true,
        status: 'delivered',
        messageId: `BD-${Date.now()}`,
        segmentsUsed: 1,
        providerResponse: 'Submitted (BulkSMSBD 202)',
        balance: { allocated: instAlloc, used: instUsed, remaining: instRemaining },
      }
    })
  })

  it('Step 1: Super Admin purchases bulk SMS pool from Bangladesh provider', async () => {
    const purchase = await useSmsStore.getState().buySMS({
      quantity: 25000,
      totalCost: 7500,
      provider: 'BulkSMSBD',
      refId: 'BD-INV-2026',
    })

    expect(purchase.quantity).toBe(25000)
    expect(useSmsStore.getState().masterPool.totalPurchased).toBe(75000)
  })

  it('Step 2: Super Admin configures BD gateway settings & dispatches Test SMS', async () => {
    const saveRes = await useSmsStore.getState().updateGatewayConfig({
      providerName: 'BulkSMSBD Production',
      providerType: 'bulksmsbd',
      senderId: 'EDUTECH',
      apiKey: 'secret-token-bd',
      isActive: true,
    })

    expect(saveRes.success).toBe(true)
    expect(useSmsStore.getState().gatewayConfig.senderId).toBe('EDUTECH')

    const testResult = await useSmsStore.getState().sendSMS({
      institutionId: 'super-admin-test',
      institutionName: 'Super Admin Gateway Diagnostics',
      phone: '01711000000',
      message: 'EduTech BD Gateway test',
      type: 'test',
    })

    expect(testResult.success).toBe(true)
    expect(testResult.status).toBe('delivered')
  })

  it('Step 3: Super Admin allocates credits and blocks over-allocation beyond Master Pool', async () => {
    const tooMuch = await useSmsStore.getState().allocateSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      amount: 999999,
      type: 'credit',
    })
    expect(tooMuch.success).toBe(false)
    expect(tooMuch.error).toContain('Insufficient')

    const valid = await useSmsStore.getState().allocateSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      amount: 5000,
      type: 'credit',
      note: 'Term 1 quota',
    })
    expect(valid.success).toBe(true)
    expect(useSmsStore.getState().getInstitutionBalance(TEST_INST_ID).remaining).toBe(5000)
  })

  it('Step 4: Institution sends Fee SMS and deducts credits via server API', async () => {
    await useSmsStore.getState().allocateSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      amount: 100,
      type: 'credit',
    })

    const msg = sendTemplateSMS({
      studentId: 'STU-9901',
      studentName: 'Zubair Hossain',
      phoneNumber: '01819999999',
      subject: 'Tuition Fee Payment Received',
      body: '3,000 BDT received. Receipt: RN-10029.',
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      triggerType: 'fee',
    })

    expect(msg.isSMS).toBe(true)

    await new Promise((r) => setTimeout(r, 40))

    const instBal = useSmsStore.getState().getInstitutionBalance(TEST_INST_ID)
    expect(instBal.used).toBe(1)
    expect(instBal.remaining).toBe(99)
  })

  it('Step 5: Blocks SMS sending when institution balance is 0', () => {
    const blockedMsg = sendTemplateSMS({
      studentId: 'STU-9902',
      studentName: 'Sadia Afrin',
      phoneNumber: '01911000000',
      subject: 'Fee Notice',
      body: 'Reminder',
      institutionId: 'inst-zero-balance',
      institutionName: 'Empty School',
    })

    expect(blockedMsg.status).toBe('failed')
    expect(blockedMsg.isSMS).toBe(true)
  })
})
