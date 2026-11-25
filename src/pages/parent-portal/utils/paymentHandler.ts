import { useFeeStore, type OnlinePaymentRequest, type FeePayment } from '@/store/feeStore'
import { useNotificationStore, notificationId, type Notification } from '@/store/notificationStore'
import { isLocalComputerMode } from '@/lib/storageMode'
import type { PortalChild, FeeItem } from '../types'

export interface ProcessPaymentParams {
  activeChild: PortalChild
  paidAmount: number
  trxId: string
  feeId?: string
  method?: string
  phone?: string
  fees: FeeItem[]
  selectedFee?: FeeItem
  isBn: boolean
}

/**
 * Submits an online payment request from parent portal.
 * The request is recorded as 'pending' for finance admin review.
 */
export function processParentOnlinePayment({
  activeChild,
  paidAmount,
  trxId,
  feeId,
  method = 'bkash',
  phone = '',
  fees,
  selectedFee,
  isBn,
}: ProcessPaymentParams): FeeItem[] {
  const targetFeeId = feeId || selectedFee?.id
  const targetFee = fees.find((f) => f.id === targetFeeId) || selectedFee
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const feeTitleEn = targetFee?.title || 'Tuition Fee'
  const feeTitleBn = targetFee?.titleBn || 'টিউশন ফি'

  // 1. Mark fee status as pending verification in portal
  const updatedFees = fees.map((f) =>
    f.id === targetFeeId
      ? {
          ...f,
          status: 'pending' as const,
          pendingRequestId: requestId,
          pendingTrxId: trxId,
          pendingMethod: method,
          pendingDate: new Date().toISOString(),
          rejectedReason: undefined,
          rejectedDate: undefined,
        }
      : f
  )

  try {
    localStorage.setItem(`edutech_parent_portal_fees_${activeChild.id}`, JSON.stringify(updatedFees))
  } catch {
    /* ignore storage errors */
  }

  // 2. Add pending request to central fee store for institution finance inspection
  try {
    const newRequest: OnlinePaymentRequest = {
      id: requestId,
      studentId: activeChild.id,
      studentName: activeChild.nameEn,
      studentRoll: activeChild.roll,
      studentClass: activeChild.class,
      feeStructureId: targetFeeId || 'fee-online',
      feeTitle: feeTitleEn,
      feeTitleBn,
      amount: paidAmount,
      method: (method === 'bank' || method === 'nagad' || method === 'rocket' ? method : 'bkash') as OnlinePaymentRequest['method'],
      phone: phone || activeChild.guardianPhone,
      trxId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    }
    useFeeStore.getState().addOnlinePaymentRequest(newRequest)
    if (!isLocalComputerMode()) {
      void useFeeStore.getState().syncToServer?.()
    }
  } catch {
    /* ignore fee store errors */
  }

  // 3. Broadcast notification to institution admin & super admin
  try {
    const childDisplayName = isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn
    const notif: Notification = {
      id: notificationId(),
      title: `Pending Online Payment: ৳${paidAmount.toLocaleString()} (${method.toUpperCase()})`,
      titleBn: `অনলাইন পেমেন্ট যাচাই অপেক্ষমাণ: ৳${paidAmount.toLocaleString()} (${method.toUpperCase()})`,
      message: `Parent of ${activeChild.nameEn} (Class: ${activeChild.class}, Roll: ${activeChild.roll}, ID: ${activeChild.id}) submitted payment of ৳${paidAmount.toLocaleString()} via ${method.toUpperCase()} (TrxID: ${trxId}). Check balance and approve.`,
      messageBn: `${childDisplayName}-এর অভিভাবক ৳${paidAmount.toLocaleString()} ফি পরিশোধের রিকোয়েস্ট জমা দিয়েছেন (${method.toUpperCase()}, TrxID: ${trxId})। অনুগ্রহ করে ব্যালেন্স যাচাই করে অনুমোদন দিন।`,
      type: 'warning',
      category: 'billing',
      read: false,
      link: '/finance?view=payments&sub=online',
      sender: `Parent Portal (${activeChild.nameEn})`,
      senderRole: 'parent',
      broadcastToAll: true,
      targetType: 'all',
      createdAt: new Date().toISOString(),
    }
    void useNotificationStore.getState().broadcastNotification(notif)
  } catch {
    /* ignore notification errors */
  }

  return updatedFees
}

/**
 * Approves a pending fee payment for a student.
 * Updates feeStore, creates official payment receipt, and marks fee paid/partial.
 */
export function approveStudentFee(child: PortalChild, fee: FeeItem, reviewedBy = 'Institution Admin'): FeeItem[] {
  const childKey = `edutech_parent_portal_fees_${child.id}`
  let currentFees: FeeItem[] = []
  try {
    const raw = localStorage.getItem(childKey)
    if (raw) currentFees = JSON.parse(raw)
  } catch {
    /* ignore */
  }

  const req = useFeeStore.getState().onlinePaymentRequests.find(
    (r) => r.studentId === child.id && (r.id === fee.pendingRequestId || r.feeStructureId === fee.id) && r.status === 'pending'
  )

  const approvedAmount = req?.amount ?? fee.due

  if (req) {
    useFeeStore.getState().approveOnlinePaymentRequest(req.id, reviewedBy)
  } else {
    // Fallback if request record was cleared
    useFeeStore.getState().addPayment({
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      studentId: child.id,
      feeStructureId: fee.id,
      amount: approvedAmount,
      discount: 0,
      paidAt: new Date().toISOString().split('T')[0],
      method: (fee.pendingMethod === 'bank' ? 'bank' : 'mobile') as FeePayment['method'],
      reference: fee.pendingTrxId || `TRX${Date.now().toString().slice(-8)}`,
      note: `Online Payment Approved - ${fee.title}`,
      collectedBy: reviewedBy,
      createdAt: new Date().toISOString(),
    })
  }

  const updatedFees = (currentFees.length > 0 ? currentFees : [fee]).map((f) => {
    if (f.id !== fee.id) return f
    const nextPaid = (f.paid || 0) + approvedAmount
    const nextDue = Math.max(0, (f.due || 0) - approvedAmount)
    return {
      ...f,
      paid: nextPaid,
      due: nextDue,
      status: nextDue <= 0 ? ('paid' as const) : ('partial' as const),
      pendingRequestId: undefined,
      pendingTrxId: undefined,
      pendingMethod: undefined,
      pendingDate: undefined,
      rejectedReason: undefined,
      rejectedDate: undefined,
    }
  })

  try {
    localStorage.setItem(childKey, JSON.stringify(updatedFees))
  } catch {
    /* ignore */
  }

  if (!isLocalComputerMode()) {
    void useFeeStore.getState().syncToServer?.()
  }

  return updatedFees
}

/**
 * Rejects a pending fee payment for a student with a given reason.
 * Reverts fee back to due/partial and updates feeStore.
 */
export function rejectStudentFee(
  child: PortalChild,
  fee: FeeItem,
  reason = 'Transaction ID not verified',
  reviewedBy = 'Institution Admin'
): FeeItem[] {
  const req = useFeeStore.getState().onlinePaymentRequests.find(
    (r) => r.studentId === child.id && (r.id === fee.pendingRequestId || r.feeStructureId === fee.id) && r.status === 'pending'
  )

  if (req) {
    useFeeStore.getState().rejectOnlinePaymentRequest(req.id, reason, reviewedBy)
  }

  const childKey = `edutech_parent_portal_fees_${child.id}`
  let currentFees: FeeItem[] = []
  try {
    const raw = localStorage.getItem(childKey)
    if (raw) currentFees = JSON.parse(raw)
  } catch {
    /* ignore */
  }

  const nowIso = new Date().toISOString()
  const updatedFees = (currentFees.length > 0 ? currentFees : [fee]).map((f) =>
    f.id === fee.id
      ? {
          ...f,
          status: f.due > 0 ? (f.paid > 0 ? ('partial' as const) : ('due' as const)) : ('paid' as const),
          pendingRequestId: undefined,
          pendingTrxId: undefined,
          pendingMethod: undefined,
          pendingDate: undefined,
          rejectedReason: reason,
          rejectedDate: nowIso,
        }
      : f
  )

  try {
    localStorage.setItem(childKey, JSON.stringify(updatedFees))
  } catch {
    /* ignore */
  }

  if (!isLocalComputerMode()) {
    void useFeeStore.getState().syncToServer?.()
  }

  return updatedFees
}
