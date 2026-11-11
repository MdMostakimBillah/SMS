import { describe, it, expect, beforeEach } from 'vitest'
import { useSmsStore } from '@/store/smsStore'
import { useMessageStore, sendTemplateSMS } from '@/store/messageStore'

describe('Full End-to-End SMS Lifecycle: Super Admin SIM Buy -> Manual Distribution -> Institution Usage', () => {
  const TEST_INST_ID = 'inst-greenwood-prep'
  const TEST_INST_NAME = 'Greenwood International School'

  beforeEach(() => {
    // Reset SMS Store to clean slate for testing full process
    useSmsStore.setState({
      masterPool: {
        totalPurchased: 50000,
        totalAllocated: 0,
        totalUsed: 0,
      },
      purchases: [],
      allocations: [],
      institutionBalances: {},
      dispatchLogs: [],
      gatewayConfig: {
        providerName: 'SIM SMS Provider (GP / Banglalink)',
        providerType: 'sim_gateway',
        apiUrl: '',
        apiKey: '',
        senderId: 'EduTech',
        isActive: true,
      },
    })

    // Reset message store
    useMessageStore.setState({ messages: [] })
  })

  it('Step 1: Super Admin buys bulk SMS pool from SIM provider', () => {
    const initialPurchased = useSmsStore.getState().masterPool.totalPurchased

    const purchase = useSmsStore.getState().buySMS({
      quantity: 25000,
      totalCost: 8750,
      provider: 'Grameenphone SIM Wholesale Pool',
      refId: 'GP-SIM-2026-X99',
      notes: 'Semester bulk pack for all schools',
    })

    expect(purchase.id).toBeDefined()
    expect(purchase.quantity).toBe(25000)
    expect(purchase.unitPrice).toBe(0.35)

    const pool = useSmsStore.getState().masterPool
    expect(pool.totalPurchased).toBe(initialPurchased + 25000) // 75,000 total
    expect(useSmsStore.getState().purchases).toHaveLength(1)
  })

  it('Step 2: Super Admin configures gateway settings and sends test SMS', async () => {
    // Configure gateway
    useSmsStore.getState().updateGatewayConfig({
      providerName: 'Custom SIM GSM Modem Hub',
      senderId: 'SchoolSMS',
      isActive: true,
    })

    expect(useSmsStore.getState().gatewayConfig.senderId).toBe('SchoolSMS')

    // Super Admin live test SMS
    const testResult = await useSmsStore.getState().sendSMS({
      institutionId: 'super-admin-test',
      institutionName: 'Super Admin Gateway Diagnostics',
      phone: '01711000000',
      message: 'EduTech SMS Gateway diagnostics test: SIM status OK.',
      type: 'test',
    })

    expect(testResult.success).toBe(true)
    expect(testResult.status).toBe('delivered')

    // Verify test was logged
    const logs = useSmsStore.getState().dispatchLogs
    expect(logs.some((l) => l.type === 'test' && l.phone === '01711000000')).toBe(true)
  })

  it('Step 3: Super Admin manually distributes SMS credits to an institution', () => {
    const store = useSmsStore.getState()
    const availableBefore = store.masterPool.totalPurchased - store.masterPool.totalAllocated

    // Attempt over-allocation (more than available in master pool)
    const invalidAllocation = store.allocateSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      amount: availableBefore + 10000,
      type: 'credit',
    })
    expect(invalidAllocation.success).toBe(false)
    expect(invalidAllocation.error).toContain('Insufficient master SMS pool balance')

    // Legitimate allocation of 5,000 SMS
    const validAllocation = store.allocateSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      amount: 5000,
      type: 'credit',
      note: 'Term 1 SMS Allocation for Fee & Exam notices',
      adminUser: 'Super Admin',
    })

    expect(validAllocation.success).toBe(true)

    // Verify institution balance
    const instBal = useSmsStore.getState().getInstitutionBalance(TEST_INST_ID)
    expect(instBal.allocated).toBe(5000)
    expect(instBal.remaining).toBe(5000)
    expect(instBal.used).toBe(0)

    // Verify master pool updated
    expect(useSmsStore.getState().masterPool.totalAllocated).toBe(5000)
  })

  it('Step 4: Institution sends Fee Collection SMS (deducts 1 credit per transaction)', async () => {
    // Allocate 100 credits to test school
    useSmsStore.getState().allocateSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      amount: 100,
      type: 'credit',
    })

    // Simulate Fee Collection dispatch
    const msg = sendTemplateSMS({
      studentId: 'STU-9901',
      studentName: 'Zubair Hossain',
      phoneNumber: '01819999999',
      subject: 'Tuition Fee Payment Received',
      body: 'Dear Guardian, 3,000 BDT received for March 2026. Receipt: RN-10029. Thank you.',
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
    })

    expect(msg.status).toBe('sent')
    expect(msg.isSMS).toBe(true)

    // Allow async dispatchSMS to execute
    await new Promise((resolve) => setTimeout(resolve, 120))

    // Check institution balance decremented by 1
    const instBal = useSmsStore.getState().getInstitutionBalance(TEST_INST_ID)
    expect(instBal.used).toBe(1)
    expect(instBal.remaining).toBe(99)

    // Check message store logged the message
    const msgs = useMessageStore.getState().messages
    expect(msgs.some((m) => m.recipientId === 'STU-9901')).toBe(true)
  })

  it('Step 5: Institution sends Exam Results SMS batch (deducts multiple credits atomically)', async () => {
    // Allocate 50 credits to test school
    useSmsStore.getState().allocateSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      amount: 50,
      type: 'credit',
    })

    const initialBal = useSmsStore.getState().getInstitutionBalance(TEST_INST_ID).remaining
    expect(initialBal).toBe(50)

    // Simulate MarksheetTab batch result SMS
    const studentsToNotify = [
      { id: 'S1', name: 'Alim', phone: '01711111111', msg: 'Exam Result: GPA 5.00 (A+)' },
      { id: 'S2', name: 'Bithi', phone: '01722222222', msg: 'Exam Result: GPA 4.80 (A)' },
      { id: 'S3', name: 'Chayan', phone: '01733333333', msg: 'Exam Result: GPA 4.50 (A)' },
    ]

    for (const student of studentsToNotify) {
      const res = await useSmsStore.getState().sendSMS({
        institutionId: TEST_INST_ID,
        institutionName: TEST_INST_NAME,
        phone: student.phone,
        message: student.msg,
        type: 'exam',
      })
      expect(res.success).toBe(true)
    }

    // Check institution balance decremented by 3
    const updatedBal = useSmsStore.getState().getInstitutionBalance(TEST_INST_ID)
    expect(updatedBal.used).toBe(3)
    expect(updatedBal.remaining).toBe(47)

    // Check master pool totalUsed increased by 3
    expect(useSmsStore.getState().masterPool.totalUsed).toBe(3)
  })

  it('Step 6: Exhausted SMS balance blocks sending and protects against overdraft', async () => {
    // Allocate exactly 2 credits
    useSmsStore.getState().allocateSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      amount: 2,
      type: 'credit',
    })

    // Consume 1st credit
    const res1 = await useSmsStore.getState().sendSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      phone: '01700000001',
      message: 'Message 1',
      type: 'fee',
    })
    expect(res1.success).toBe(true)

    // Consume 2nd credit
    const res2 = await useSmsStore.getState().sendSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      phone: '01700000002',
      message: 'Message 2',
      type: 'fee',
    })
    expect(res2.success).toBe(true)

    const depletedBal = useSmsStore.getState().getInstitutionBalance(TEST_INST_ID)
    expect(depletedBal.remaining).toBe(0)
    expect(depletedBal.used).toBe(2)

    // Attempt 3rd credit when balance is 0
    const res3 = await useSmsStore.getState().sendSMS({
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
      phone: '01700000003',
      message: 'Message 3 (should fail due to 0 balance)',
      type: 'fee',
    })

    expect(res3.success).toBe(false)
    expect(res3.status).toBe('failed')
    expect(res3.error).toContain('exhausted')

    // Balance must not go negative
    const finalBal = useSmsStore.getState().getInstitutionBalance(TEST_INST_ID)
    expect(finalBal.remaining).toBe(0)
    expect(finalBal.used).toBe(2)

    // Fee SMS template must also flag as failed when balance is 0
    const failedFeeMsg = sendTemplateSMS({
      studentId: 'STU-FAIL',
      studentName: 'Overdraft Student',
      phoneNumber: '01700000004',
      subject: 'Fee Receipt',
      body: 'Will fail due to empty balance',
      institutionId: TEST_INST_ID,
      institutionName: TEST_INST_NAME,
    })

    expect(failedFeeMsg.status).toBe('failed')
  })
})
