import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBn } from '@/hooks/useBn'
import { useAdmissionStore } from '@/store/admissionStore'
import { isLocalComputerMode } from '@/lib/storageMode'
import type { PortalTab, FeeItem, LeaveRequest } from './types'
import {
  DEMO_FEES,
  DEMO_HOMEWORK,
  DEMO_EXAM_RESULTS,
  DEMO_LEAVE_REQUESTS,
} from './mockData'
import { mapAdmittedStudentsToPortalChildren } from './utils/studentMapper'
import { processParentOnlinePayment } from './utils/paymentHandler'
import { ChildSelector } from './components/ChildSelector'
import { PortalTabNav } from './components/PortalTabNav'
import { StudentIdCardModal } from './components/StudentIdCardModal'
import { FeePaymentModal } from './components/FeePaymentModal'
import { LeaveRequestModal } from './components/LeaveRequestModal'

// Tabs
import { OverviewTab } from './tabs/OverviewTab'
import { AttendanceTab } from './tabs/AttendanceTab'
import { AcademicsTab } from './tabs/AcademicsTab'
import { FeesTab } from './tabs/FeesTab'
import { HomeworkTab } from './tabs/HomeworkTab'
import { CommunicationTab } from './tabs/CommunicationTab'
import { ProfileTab } from './tabs/ProfileTab'

export default function ParentPortalPage() {
  const isBn = useBn()
  const { user } = useAuth()
  const { role } = useParams<{ role?: string }>()
  const admittedStudents = useAdmissionStore((s) => s.students)
  const isLocalPC = isLocalComputerMode()

  // Sync from server database or local PC storage on mount
  useEffect(() => {
    useAdmissionStore.getState().syncFromServer?.()
  }, [])

  // Determine role: Parent accounts only see their own child without switching
  const isParentAccount = Boolean(
    user?.role === 'parent' ||
    user?.role === 'guardian' ||
    role === 'parent' ||
    role === 'guardian' ||
    window.location.pathname.includes('/parent/') ||
    window.location.pathname.includes('/guardian/')
  )

  // Institution admin and super admin can inspect and switch/search all students
  const isInstitutionAdmin = !isParentAccount && Boolean(
    !user ||
    user.role === 'super_admin' ||
    user.role === 'school_admin' ||
    user.role === 'admin' ||
    role === 'admin' ||
    role === 'school_admin' ||
    role === 'super-admin' ||
    window.location.pathname.includes('/super-admin/')
  )

  // Merge admitted students if available with demo children
  const childrenList = useMemo(() => {
    return mapAdmittedStudentsToPortalChildren(admittedStudents)
  }, [admittedStudents])

  // Active child state
  const [activeChildId, setActiveChildId] = useState<string>(childrenList[0]?.id || 'child-1')
  const activeChild = useMemo(() => {
    return childrenList.find((c) => c.id === activeChildId) || childrenList[0]
  }, [childrenList, activeChildId])

  // Portal State
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')
  const [fees, setFees] = useState<FeeItem[]>(() => {
    try {
      const saved = localStorage.getItem(`edutech_parent_portal_fees_${childrenList[0]?.id || 'child-1'}`)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return DEMO_FEES
  })
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(DEMO_LEAVE_REQUESTS)

  // Sync child-specific fee payment state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`edutech_parent_portal_fees_${activeChild.id}`)
      if (saved) {
        setFees(JSON.parse(saved))
        return
      }
    } catch { /* ignore */ }
    setFees(DEMO_FEES)
  }, [activeChild.id])

  // Modals state
  const [showIdCardModal, setShowIdCardModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedFeeToPay, setSelectedFeeToPay] = useState<FeeItem | undefined>(undefined)

  // Handlers
  const handleOpenPayModal = (fee?: FeeItem) => {
    const dueItem = fee || fees.find((f) => f.due > 0) || fees[0]
    setSelectedFeeToPay(dueItem)
    setShowFeeModal(true)
  }

  const handlePaymentSuccess = (paidAmount: number, trxId: string, feeId?: string, method = 'bkash') => {
    const updated = processParentOnlinePayment({
      activeChild,
      paidAmount,
      trxId,
      feeId,
      method,
      fees,
      selectedFee: selectedFeeToPay,
      isBn,
    })
    setFees(updated)
  }

  const handleCreateLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: LeaveRequest = {
      ...req,
      id: `leave-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      childId: activeChild.id,
    }
    setLeaveRequests((prev) => [newReq, ...prev])
  }

  return (
    <div className="w-full space-y-4 pb-12">
      {/* Student Identity Bar */}
      <ChildSelector
        childrenList={childrenList}
        activeChild={activeChild}
        onSelectChild={(child) => setActiveChildId(child.id)}
        onOpenIdCardModal={() => setShowIdCardModal(true)}
        onOpenPayModal={() => handleOpenPayModal()}
        onOpenContact={() => setActiveTab('communication')}
        isBn={isBn}
        isSuperAdmin={isInstitutionAdmin}
        isInstitutionAdmin={isInstitutionAdmin}
        isLocalPC={isLocalPC}
      />

      {/* Tabs Navigation Bar - HR Management Style */}
      <PortalTabNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isBn={isBn}
      />

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            child={activeChild}
            fees={fees}
            homeworkList={DEMO_HOMEWORK}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenPayModal={() => handleOpenPayModal()}
            isBn={isBn}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            child={activeChild}
            leaveRequests={leaveRequests.filter((l) => l.childId === activeChild.id || !l.childId)}
            onOpenLeaveModal={() => setShowLeaveModal(true)}
            isBn={isBn}
          />
        )}

        {activeTab === 'academics' && (
          <AcademicsTab
            child={activeChild}
            results={DEMO_EXAM_RESULTS}
            isBn={isBn}
          />
        )}

        {activeTab === 'fees' && (
          <FeesTab
            child={activeChild}
            fees={fees}
            onOpenPayModal={() => handleOpenPayModal()}
            isBn={isBn}
          />
        )}

        {activeTab === 'homework' && (
          <HomeworkTab
            child={activeChild}
            isBn={isBn}
          />
        )}

        {activeTab === 'communication' && (
          <CommunicationTab
            child={activeChild}
            isBn={isBn}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            child={activeChild}
            onOpenIdCard={() => setShowIdCardModal(true)}
            isBn={isBn}
          />
        )}
      </div>

      {/* Global Modals */}
      {showIdCardModal && (
        <StudentIdCardModal
          isOpen={showIdCardModal}
          onClose={() => setShowIdCardModal(false)}
          child={activeChild}
          isBn={isBn}
        />
      )}

      {showFeeModal && (
        <FeePaymentModal
          isOpen={showFeeModal}
          onClose={() => setShowFeeModal(false)}
          child={activeChild}
          fees={fees}
          fee={selectedFeeToPay}
          onSuccess={handlePaymentSuccess}
          isBn={isBn}
        />
      )}

      {showLeaveModal && (
        <LeaveRequestModal
          isOpen={showLeaveModal}
          child={activeChild}
          onClose={() => setShowLeaveModal(false)}
          onSubmit={handleCreateLeaveRequest}
          isBn={isBn}
        />
      )}
    </div>
  )
}
