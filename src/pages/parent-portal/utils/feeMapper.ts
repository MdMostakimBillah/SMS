import type { FeeItem, PortalChild } from '../types'
import { useFeeStore } from '@/store/feeStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { normalizeClassString } from '@/lib/assignmentUtils'

/**
 * Derives real fees, dues, waivers, and payment statuses for a child from the central fee database.
 * Accounts for class/section/student fee structures, payments, waivers, pending and rejected online requests.
 */
export function getChildDatabaseFees(child: PortalChild): FeeItem[] {
  const state = useFeeStore.getState()
  const dbStructures = state.structures || []
  const dbPayments = state.payments || []
  const dbRequests = state.onlinePaymentRequests || []
  const dbCategories = state.feeCategories || []
  const allStudents = useAdmissionStore.getState().students || []

  const childClassNorm = normalizeClassString(child.class)
  const childSecNorm = (child.section || '').trim().toLowerCase()

  const relevant = dbStructures.filter((s) => {
    if (!s.isActive) return false
    if (s.studentId && s.studentId !== child.id) return false
    if (s.section && s.section.trim().toLowerCase() !== childSecNorm) return false
    if (!s.class) return true
    return (
      s.class === child.class ||
      s.class.toLowerCase().trim() === (child.class || '').toLowerCase().trim() ||
      normalizeClassString(s.class) === childClassNorm
    )
  })

  if (relevant.length > 0) {
    const waivers = typeof state.generateWaivers === 'function'
      ? state.generateWaivers(allStudents)
      : []

    return relevant.map((st) => {
      const structPayments = dbPayments
        .filter((p) => p.studentId === child.id && p.feeStructureId === st.id)
      const paid = structPayments.reduce((sum, p) => sum + p.amount, 0)
      const waived = waivers
        .filter((w) => w.studentId === child.id && w.feeStructureId === st.id)
        .reduce((sum, w) => sum + w.amount, 0)

      const matchingReqs = dbRequests.filter(
        (r) => r.studentId === child.id && (r.feeStructureId === st.id || r.id === st.id)
      )
      const pendingReq = matchingReqs.find((r) => r.status === 'pending')
      const latestRejected = !pendingReq
        ? matchingReqs.find((r) => r.status === 'rejected')
        : undefined
      const lastPayment = structPayments[structPayments.length - 1]
      const catObj = st.categoryId ? dbCategories.find((c) => c.id === st.categoryId) : undefined

      const due = Math.max(0, st.amount - paid - waived)
      return {
        id: st.id,
        title: st.name,
        titleBn: st.nameBn || st.name,
        category: catObj?.name || (st.type === 'monthly' ? 'Tuition' : 'General'),
        categoryBn: catObj?.nameBn || (st.type === 'monthly' ? 'মাসিক বেতন' : 'সাধারণ ফি'),
        dueDate: st.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        amount: st.amount,
        waived,
        paid,
        due,
        status: pendingReq ? 'pending' : due <= 0 ? 'paid' : paid > 0 ? 'partial' : 'due',
        pendingRequestId: pendingReq?.id,
        pendingTrxId: pendingReq?.trxId,
        pendingMethod: pendingReq?.method,
        pendingDate: pendingReq?.submittedAt,
        rejectedReason: due > 0 ? latestRejected?.rejectionReason : undefined,
        rejectedDate: due > 0 ? latestRejected?.reviewedAt : undefined,
        lastPaymentMethod: lastPayment?.method,
        lastPaidAt: lastPayment?.paidAt,
        receiptNo: lastPayment?.receiptNo,
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
