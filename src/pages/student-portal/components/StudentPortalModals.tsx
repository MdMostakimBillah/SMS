import React from 'react'
import type { StudentProfile, StudentHomework, StudentFee, StudentLeaveRequest } from '../types'
import { StudentIdCardModal } from './StudentIdCardModal'
import { SubmitHomeworkModal } from './SubmitHomeworkModal'
import { FeePaymentModal } from './FeePaymentModal'
import { LeaveRequestModal } from './LeaveRequestModal'

interface StudentPortalModalsProps {
  student: StudentProfile
  fees: StudentFee[]
  selectedFeeToPay?: StudentFee
  selectedHomework: StudentHomework | null
  showIdCardModal: boolean
  showHomeworkModal: boolean
  showFeeModal: boolean
  showLeaveModal: boolean
  onCloseIdCard: () => void
  onCloseHomework: () => void
  onCloseFee: () => void
  onCloseLeave: () => void
  onFeePaymentSuccess: (amount: number, trxId: string, feeId?: string, method?: string, phone?: string) => void
  onAddLeaveRequest: (req: Omit<StudentLeaveRequest, 'id' | 'createdAt' | 'status'>) => void
  isBn: boolean
}

export const StudentPortalModals = React.memo(function StudentPortalModals({
  student,
  fees,
  selectedFeeToPay,
  selectedHomework,
  showIdCardModal,
  showHomeworkModal,
  showFeeModal,
  showLeaveModal,
  onCloseIdCard,
  onCloseHomework,
  onCloseFee,
  onCloseLeave,
  onFeePaymentSuccess,
  onAddLeaveRequest,
  isBn,
}: StudentPortalModalsProps) {
  return (
    <>
      <StudentIdCardModal
        isOpen={showIdCardModal}
        student={student}
        onClose={onCloseIdCard}
        isBn={isBn}
      />

      <SubmitHomeworkModal
        isOpen={showHomeworkModal}
        homework={selectedHomework}
        student={student}
        onClose={onCloseHomework}
        onSuccess={() => {}}
        isBn={isBn}
      />

      <FeePaymentModal
        isOpen={showFeeModal}
        student={student}
        fees={fees}
        fee={selectedFeeToPay}
        onClose={onCloseFee}
        onSuccess={onFeePaymentSuccess}
        isBn={isBn}
      />

      <LeaveRequestModal
        isOpen={showLeaveModal}
        student={student}
        onClose={onCloseLeave}
        onSubmit={onAddLeaveRequest}
        isBn={isBn}
      />
    </>
  )
})
