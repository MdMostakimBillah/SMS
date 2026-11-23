import React from 'react'
import type { PortalChild, FeeItem, LeaveRequest } from '../types'
import { StudentIdCardModal } from './StudentIdCardModal'
import { FeePaymentModal } from './FeePaymentModal'
import { LeaveRequestModal } from './LeaveRequestModal'

interface ParentPortalModalsProps {
  showIdCardModal: boolean
  setShowIdCardModal: (show: boolean) => void
  showFeeModal: boolean
  setShowFeeModal: (show: boolean) => void
  showLeaveModal: boolean
  setShowLeaveModal: (show: boolean) => void
  child: PortalChild
  fees: FeeItem[]
  selectedFeeToPay?: FeeItem
  onPaymentSuccess: (amount: number, trxId: string, feeId?: string, method?: string, phone?: string) => void
  onCreateLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => void
  isBn: boolean
}

export const ParentPortalModals = React.memo(function ParentPortalModals({
  showIdCardModal,
  setShowIdCardModal,
  showFeeModal,
  setShowFeeModal,
  showLeaveModal,
  setShowLeaveModal,
  child,
  fees,
  selectedFeeToPay,
  onPaymentSuccess,
  onCreateLeaveRequest,
  isBn,
}: ParentPortalModalsProps) {
  return (
    <>
      {showIdCardModal && (
        <StudentIdCardModal
          isOpen={showIdCardModal}
          onClose={() => setShowIdCardModal(false)}
          child={child}
          isBn={isBn}
        />
      )}

      {showFeeModal && (
        <FeePaymentModal
          isOpen={showFeeModal}
          onClose={() => setShowFeeModal(false)}
          child={child}
          fees={fees}
          fee={selectedFeeToPay}
          onSuccess={onPaymentSuccess}
          isBn={isBn}
        />
      )}

      {showLeaveModal && (
        <LeaveRequestModal
          isOpen={showLeaveModal}
          child={child}
          onClose={() => setShowLeaveModal(false)}
          onSubmit={onCreateLeaveRequest}
          isBn={isBn}
        />
      )}
    </>
  )
})
