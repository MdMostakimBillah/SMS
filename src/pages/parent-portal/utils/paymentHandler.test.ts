import { describe, it, expect, beforeEach } from 'vitest'
import { processParentOnlinePayment, approveStudentFee, rejectStudentFee } from './paymentHandler'
import { useFeeStore } from '@/store/feeStore'
import { useNotificationStore } from '@/store/notificationStore'
import { DEMO_CHILDREN, DEMO_FEES } from '../mockData'

describe('Online Fee Payment Workflow (Pending -> Verify TrxID -> Approve / Reject)', () => {
  beforeEach(() => {
    useFeeStore.getState().payments = []
    useFeeStore.getState().onlinePaymentRequests = []
    useNotificationStore.getState().notifications = []
    localStorage.clear()
  })

  it('submits payment as pending, records online request, and broadcasts notification to admin', () => {
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

    // 1. Fee status in parent portal becomes 'pending' with TrxID, balance still due until approved
    const updatedTarget = updatedFees.find((f) => f.id === targetFee.id)
    expect(updatedTarget?.status).toBe('pending')
    expect(updatedTarget?.pendingTrxId).toBe('TRX-TEST-12345')
    expect(updatedTarget?.pendingMethod).toBe('bkash')
    expect(updatedTarget?.pendingRequestId).toBeDefined()
    expect(updatedTarget?.due).toBe(1500)

    // 2. Persisted to student's LocalStorage as pending
    const stored = JSON.parse(localStorage.getItem(`edutech_parent_portal_fees_${child.id}`) || '[]')
    expect(stored.find((f: any) => f.id === targetFee.id)?.status).toBe('pending')

    // 3. Central FeeStore records pending request for institution finance inspection
    const requests = useFeeStore.getState().onlinePaymentRequests
    expect(requests).toHaveLength(1)
    expect(requests[0].studentId).toBe(child.id)
    expect(requests[0].amount).toBe(1500)
    expect(requests[0].trxId).toBe('TRX-TEST-12345')
    expect(requests[0].status).toBe('pending')
    expect(requests[0].method).toBe('bkash')

    // 4. Pending payment notification sent to institution finance & admin
    const notifs = useNotificationStore.getState().notifications
    expect(notifs).toHaveLength(1)
    expect(notifs[0].type).toBe('warning')
    expect(notifs[0].category).toBe('billing')
    expect(notifs[0].link).toBe('/finance?view=payments&sub=online')
    expect(notifs[0].message).toContain('TRX-TEST-12345')
  })

  it('institution admin/finance verifies TrxID and approves payment -> marks fee paid and generates payment receipt', () => {
    const child = DEMO_CHILDREN[0]
    const initialFees = [...DEMO_FEES]
    const targetFee = initialFees[0]

    // Step 1: Parent submits payment request
    const pendingFees = processParentOnlinePayment({
      activeChild: child,
      paidAmount: 1500,
      trxId: 'TRX-APPROVAL-777',
      feeId: targetFee.id,
      method: 'nagad',
      fees: initialFees,
      selectedFee: targetFee,
      isBn: true,
    })

    const pendingItem = pendingFees.find((f) => f.id === targetFee.id)!
    expect(pendingItem.status).toBe('pending')

    // Step 2: Institution Finance checks TrxID balance and approves
    const approvedFees = approveStudentFee(child, pendingItem, 'Finance Officer Ahmed')

    // Step 3: Verified student fee is now officially 'paid' with 0 due
    const approvedTarget = approvedFees.find((f) => f.id === targetFee.id)
    expect(approvedTarget?.status).toBe('paid')
    expect(approvedTarget?.due).toBe(0)
    expect(approvedTarget?.paid).toBe(1500)
    expect(approvedTarget?.pendingTrxId).toBeUndefined()

    // Step 4: Official payment receipt is recorded in useFeeStore.payments
    const payments = useFeeStore.getState().payments
    expect(payments).toHaveLength(1)
    expect(payments[0].studentId).toBe(child.id)
    expect(payments[0].amount).toBe(1500)
    expect(payments[0].reference).toBe('TRX-APPROVAL-777')
    expect(payments[0].collectedBy).toBe('Finance Officer Ahmed')
    expect(payments[0].receiptNo).toBeDefined()

    // Step 5: Online payment request is marked 'approved'
    const request = useFeeStore.getState().onlinePaymentRequests.find((r) => r.trxId === 'TRX-APPROVAL-777')
    expect(request?.status).toBe('approved')
    expect(request?.reviewedBy).toBe('Finance Officer Ahmed')
    expect(request?.receiptNo).toBeDefined()

    // Step 6: Approval notification dispatched
    const notifs = useNotificationStore.getState().notifications
    const approvalNotif = notifs.find((n) => n.type === 'success')
    expect(approvalNotif).toBeDefined()
    expect(approvalNotif?.title).toContain('Approved')
  })

  it('institution finance rejects invalid payment -> fee reverts back to due', () => {
    const child = DEMO_CHILDREN[0]
    const initialFees = [...DEMO_FEES]
    const targetFee = initialFees[0]

    // Step 1: Parent submits payment request
    const pendingFees = processParentOnlinePayment({
      activeChild: child,
      paidAmount: 1500,
      trxId: 'TRX-FAKE-999',
      feeId: targetFee.id,
      method: 'bkash',
      fees: initialFees,
      selectedFee: targetFee,
      isBn: false,
    })

    const pendingItem = pendingFees.find((f) => f.id === targetFee.id)!
    expect(pendingItem.status).toBe('pending')

    // Step 2: Institution Finance verifies TrxID, balance missing, rejects
    const rejectedFees = rejectStudentFee(child, pendingItem, 'Transaction ID not found in bKash statement', 'Finance Officer')

    // Step 3: Fee status reverts to 'due'
    const rejectedTarget = rejectedFees.find((f) => f.id === targetFee.id)
    expect(rejectedTarget?.status).toBe('due')
    expect(rejectedTarget?.due).toBe(1500)
    expect(rejectedTarget?.pendingTrxId).toBeUndefined()

    // Step 4: No payment was created
    expect(useFeeStore.getState().payments).toHaveLength(0)

    // Step 5: Request marked rejected with reason
    const request = useFeeStore.getState().onlinePaymentRequests.find((r) => r.trxId === 'TRX-FAKE-999')
    expect(request?.status).toBe('rejected')
    expect(request?.rejectionReason).toBe('Transaction ID not found in bKash statement')

    // Step 6: Rejection notification dispatched
    const notifs = useNotificationStore.getState().notifications
    const rejectNotif = notifs.find((n) => n.type === 'error')
    expect(rejectNotif).toBeDefined()
    expect(rejectNotif?.message).toContain('Transaction ID not found')
  })
})
