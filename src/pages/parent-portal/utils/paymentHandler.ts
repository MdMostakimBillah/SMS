import { useFeeStore, type FeePayment, getNextReceiptNo } from '@/store/feeStore'
import { useNotificationStore, notificationId, type Notification } from '@/store/notificationStore'
import type { PortalChild, FeeItem } from '../types'

export interface ProcessPaymentParams {
  activeChild: PortalChild
  paidAmount: number
  trxId: string
  feeId?: string
  method?: string
  fees: FeeItem[]
  selectedFee?: FeeItem
  isBn: boolean
}

export function processParentOnlinePayment({
  activeChild,
  paidAmount,
  trxId,
  feeId,
  method = 'bkash',
  fees,
  selectedFee,
  isBn,
}: ProcessPaymentParams): FeeItem[] {
  const targetFeeId = feeId || selectedFee?.id
  const targetFee = fees.find((f) => f.id === targetFeeId) || selectedFee

  // 1. Calculate updated fee list and persist per child
  const updatedFees = fees.map((f) =>
    f.id === targetFeeId
      ? {
          ...f,
          paid: f.paid + paidAmount,
          due: Math.max(0, f.due - paidAmount),
          status: (f.due - paidAmount <= 0 ? 'paid' : 'partial') as any,
        }
      : f
  )

  try {
    localStorage.setItem(`edutech_parent_portal_fees_${activeChild.id}`, JSON.stringify(updatedFees))
  } catch {
    /* ignore storage errors */
  }

  // 2. Record payment in institution finance store (useFeeStore)
  try {
    const newPayment: FeePayment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      studentId: activeChild.id,
      feeStructureId: targetFeeId || 'fee-online',
      amount: paidAmount,
      discount: 0,
      paidAt: new Date().toISOString().split('T')[0],
      method: (method === 'bank' ? 'bank' : 'mobile') as any,
      reference: trxId,
      note: `Parent Portal Online Payment (${method.toUpperCase()}) - ${targetFee?.title || 'Tuition Fee'}`,
      collectedBy: `Parent (${activeChild.guardianName || 'Online Portal'})`,
      createdAt: new Date().toISOString(),
      receiptNo: getNextReceiptNo(useFeeStore.getState().payments),
    }
    useFeeStore.getState().addPayment(newPayment)
  } catch {
    /* ignore finance sync errors */
  }

  // 3. Broadcast notification to institution admin & super admin
  try {
    const feeTitleEn = targetFee?.title || 'Tuition Fee'
    const feeTitleBn = targetFee?.titleBn || 'টিউশন ফি'
    const childDisplayName = isBn ? activeChild.nameBn || activeChild.nameEn : activeChild.nameEn

    const notif: Notification = {
      id: notificationId(),
      title: `Online Fee Payment: ৳${paidAmount.toLocaleString()} (${method.toUpperCase()})`,
      titleBn: `অনলাইন ফি পরিশোধ গ্রহণ: ৳${paidAmount.toLocaleString()} (${method.toUpperCase()})`,
      message: `Parent of ${activeChild.nameEn} (Class: ${activeChild.class}, Roll: ${activeChild.roll}, ID: ${activeChild.id}) paid ৳${paidAmount.toLocaleString()} for "${feeTitleEn}" via ${method.toUpperCase()} (TrxID: ${trxId}).`,
      messageBn: `${childDisplayName}-এর অভিভাবক (শ্রেণি: ${activeChild.class}, রোল: ${activeChild.roll}, আইডি: ${activeChild.id}) "${feeTitleBn}" বাবদ ${method.toUpperCase()} দিয়ে ৳${paidAmount.toLocaleString()} পরিশোধ করেছেন (TrxID: ${trxId})।`,
      type: 'success',
      category: 'billing',
      read: false,
      link: '/finance?tab=payments',
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
