import type { FeeItem, PortalChild } from '../types'
import { useFeeStore } from '@/store/feeStore'

/**
 * Derives real fees, dues, and payment statuses for a child from the central fee database.
 * If live database structures exist for the student's class, maps them with payments and pending requests.
 * Otherwise returns saved portal overrides or an empty array (no demo/mock fees).
 */
export function getChildDatabaseFees(child: PortalChild): FeeItem[] {
  const state = useFeeStore.getState()
  const dbStructures = state.structures || []
  const dbPayments = state.payments || []
  const dbRequests = state.onlinePaymentRequests || []

  const relevant = dbStructures.filter(
    (s) => s.isActive && (s.class === child.class || !s.class)
  )

  if (relevant.length > 0) {
    return relevant.map((st) => {
      const paid = dbPayments
        .filter((p) => p.studentId === child.id && p.feeStructureId === st.id)
        .reduce((sum, p) => sum + p.amount, 0)
      const pendingReq = dbRequests.find(
        (r) => r.studentId === child.id && (r.feeStructureId === st.id || r.id === st.id) && r.status === 'pending'
      )
      const due = Math.max(0, st.amount - paid)
      return {
        id: st.id,
        title: st.name,
        titleBn: st.nameBn,
        category: st.type === 'monthly' ? 'Tuition' : 'General',
        dueDate: new Date().toISOString().split('T')[0],
        amount: st.amount,
        paid,
        due,
        status: pendingReq ? 'pending' : due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'due',
        pendingRequestId: pendingReq?.id,
        pendingTrxId: pendingReq?.trxId,
        pendingMethod: pendingReq?.method,
        pendingDate: pendingReq?.submittedAt,
      }
    })
  }

  try {
    const saved = localStorage.getItem(`edutech_parent_portal_fees_${child.id}`)
    if (saved) return JSON.parse(saved)
  } catch {
    /* ignore storage errors */
  }

  return []
}
