import { describe, it, expect, beforeEach } from 'vitest'
import { processParentOnlinePayment } from './paymentHandler'
import { useFeeStore } from '@/store/feeStore'
import { useNotificationStore } from '@/store/notificationStore'
import { DEMO_CHILDREN, DEMO_FEES } from '../mockData'

describe('processParentOnlinePayment', () => {
  beforeEach(() => {
    useFeeStore.getState().payments = []
    useNotificationStore.getState().notifications = []
    localStorage.clear()
  })

  it('records payment in feeStore and broadcasts notification to admin', () => {
    const child = DEMO_CHILDREN[0]
    const initialFees = [...DEMO_FEES]
    const targetFee = initialFees[0] // due: 1500

    const updatedFees = processParentOnlinePayment({
      activeChild: child,
      paidAmount: 1500,
      trxId: 'TRX-TEST-12345',
      feeId: targetFee.id,
      method: 'bkash',
      fees: initialFees,
      selectedFee: targetFee,
      isBn: false,
    })

    // 1. Fee status updated
    const updatedTarget = updatedFees.find((f) => f.id === targetFee.id)
    expect(updatedTarget?.due).toBe(0)
    expect(updatedTarget?.paid).toBe(1500)
    expect(updatedTarget?.status).toBe('paid')

    // 2. LocalStorage persisted
    const stored = JSON.parse(localStorage.getItem(`edutech_parent_portal_fees_${child.id}`) || '[]')
    expect(stored.find((f: any) => f.id === targetFee.id)?.status).toBe('paid')

    // 3. Recorded in useFeeStore
    const payments = useFeeStore.getState().payments
    expect(payments).toHaveLength(1)
    expect(payments[0].studentId).toBe(child.id)
    expect(payments[0].amount).toBe(1500)
    expect(payments[0].reference).toBe('TRX-TEST-12345')
    expect(payments[0].receiptNo).toBeDefined()

    // 4. Notification broadcast to institution admin & super admin
    const notifs = useNotificationStore.getState().notifications
    expect(notifs).toHaveLength(1)
    expect(notifs[0].type).toBe('success')
    expect(notifs[0].category).toBe('billing')
    expect(notifs[0].broadcastToAll).toBe(true)
    expect(notifs[0].targetType).toBe('all')
    expect(notifs[0].title).toContain('1,500')
    expect(notifs[0].message).toContain(child.nameEn)
  })

  it('handles partial fee payments correctly', () => {
    const child = DEMO_CHILDREN[0]
    const initialFees = [...DEMO_FEES]
    const targetFee = initialFees[0] // 1500

    const updatedFees = processParentOnlinePayment({
      activeChild: child,
      paidAmount: 500,
      trxId: 'TRX-PARTIAL-999',
      feeId: targetFee.id,
      method: 'nagad',
      fees: initialFees,
      selectedFee: targetFee,
      isBn: true,
    })

    const updatedTarget = updatedFees.find((f) => f.id === targetFee.id)
    expect(updatedTarget?.due).toBe(1000)
    expect(updatedTarget?.paid).toBe(500)
    expect(updatedTarget?.status).toBe('partial')

    const notifs = useNotificationStore.getState().notifications
    expect(notifs).toHaveLength(1)
    expect(notifs[0].titleBn).toContain('500')
  })
})
