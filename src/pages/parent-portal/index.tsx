import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBn } from '@/hooks/useBn'
import { useAdmissionStore } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'
import { useNoticeStore } from '@/store/noticeStore'
import { useTeacherStore } from '@/store/teacherStore'
import { isLocalComputerMode, isLocalServerMode } from '@/lib/storageMode'
import type { PortalTab, FeeItem, LeaveRequest } from './types'
import { mapAdmittedStudentsToPortalChildren } from './utils/studentMapper'
import { getChildDatabaseFees } from './utils/feeMapper'
import { getChildHomework, getChildExamResults } from './utils/dataMappers'
import { processParentOnlinePayment, approveStudentFee, rejectStudentFee } from './utils/paymentHandler'
import { ChildSelector } from './components/ChildSelector'
import { PortalTabNav } from './components/PortalTabNav'
import { PortalNoStudentsNotice } from './components/PortalNoStudentsNotice'
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
  const isLocalServer = isLocalServerMode()

  // Sync from server database on mount when not in offline mode
  useEffect(() => {
    if (!isLocalPC) {
      void useAdmissionStore.getState().syncFromServer?.()
      void useFeeStore.getState().syncFromServer?.()
      void useNoticeStore.getState().syncFromServer?.()
      void useTeacherStore.getState().syncFromServer?.()
    }
  }, [isLocalPC])

  // Determine role: Parent accounts only see their own child
  const isParentAccount = Boolean(
    user?.role === 'parent' || user?.role === 'guardian' ||
    role === 'parent' || role === 'guardian' ||
    window.location.pathname.includes('/parent/') || window.location.pathname.includes('/guardian/')
  )

  // Institution admin and super admin can inspect and switch/search all students
  const isInstitutionAdmin = !isParentAccount && Boolean(
    !user || user.role === 'super_admin' || user.role === 'school_admin' || user.role === 'admin' ||
    role === 'admin' || role === 'school_admin' || role === 'super-admin' ||
    window.location.pathname.includes('/super-admin/')
  )

  // Pure mapping of actual admitted students
  const childrenList = useMemo(() => {
    return mapAdmittedStudentsToPortalChildren(admittedStudents)
  }, [admittedStudents])

  // Active child state
  const [activeChildId, setActiveChildId] = useState<string>(childrenList[0]?.id || '')

  useEffect(() => {
    if (!activeChildId && childrenList.length > 0) {
      setActiveChildId(childrenList[0].id)
    }
  }, [childrenList, activeChildId])

  const activeChild = useMemo(() => {
    return childrenList.find((c) => c.id === activeChildId) || childrenList[0]
  }, [childrenList, activeChildId])

  // Portal State
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')
  const [commSection, setCommSection] = useState<'notices' | 'teachers'>('notices')
  const [fees, setFees] = useState<FeeItem[]>(() => {
    return activeChild ? getChildDatabaseFees(activeChild) : []
  })
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    if (!activeChild?.id) return []
    try {
      const saved = localStorage.getItem(`edutech_parent_portal_leave_${activeChild.id}`)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return []
  })

  const feeStoreVersion = useFeeStore((s) => (s.onlinePaymentRequests || []).length + s.payments.length)

  // Sync fee state whenever active child or fee store changes
  useEffect(() => {
    if (activeChild) {
      setFees(getChildDatabaseFees(activeChild))
    }
  }, [activeChild?.id, feeStoreVersion])

  // Real homework and exam results derived from student assignments and marks
  const homeworkList = useMemo(() => (activeChild ? getChildHomework(activeChild) : []), [activeChild])
  const examResults = useMemo(() => (activeChild ? getChildExamResults(activeChild) : []), [activeChild])

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

  const handlePaymentSuccess = (paidAmount: number, trxId: string, feeId?: string, method = 'bkash', phone = '') => {
    if (!activeChild) return
    const updated = processParentOnlinePayment({
      activeChild,
      paidAmount,
      trxId,
      feeId,
      method,
      phone,
      fees,
      selectedFee: selectedFeeToPay,
      isBn,
    })
    setFees(updated)
  }

  const handleApproveFee = (fee: FeeItem) => {
    if (!activeChild) return
    const updated = approveStudentFee(activeChild, fee, user?.name || undefined)
    setFees(updated)
  }

  const handleRejectFee = (fee: FeeItem) => {
    if (!activeChild) return
    const updated = rejectStudentFee(activeChild, fee, 'Transaction ID not verified', user?.name || undefined)
    setFees(updated)
  }

  const handleCreateLeaveRequest = (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    if (!activeChild) return
    const newReq: LeaveRequest = {
      ...req,
      id: `leave-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      childId: activeChild.id,
    }
    setLeaveRequests((prev) => [newReq, ...prev])
  }

  // Clean empty state when no admitted students exist in the system
  if (childrenList.length === 0 || !activeChild) {
    return <PortalNoStudentsNotice isInstitutionAdmin={isInstitutionAdmin} />
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
        onOpenContact={() => {
          setCommSection('teachers')
          setActiveTab('communication')
        }}
        isBn={isBn}
        isSuperAdmin={isInstitutionAdmin}
        isInstitutionAdmin={isInstitutionAdmin}
        isLocalPC={isLocalPC}
        isLocalServer={isLocalServer}
      />

      {/* Tabs Navigation Bar - HR Management Style */}
      <PortalTabNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'communication') setCommSection('notices')
          setActiveTab(tab)
        }}
        isBn={isBn}
      />

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            child={activeChild}
            fees={fees}
            homeworkList={homeworkList}
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
            results={examResults}
            isBn={isBn}
          />
        )}

        {activeTab === 'fees' && (
          <FeesTab
            child={activeChild}
            fees={fees}
            onOpenPayModal={(f) => handleOpenPayModal(f)}
            isBn={isBn}
            isInstitutionAdmin={isInstitutionAdmin}
            onApproveFee={handleApproveFee}
            onRejectFee={handleRejectFee}
          />
        )}

        {activeTab === 'homework' && (
          <HomeworkTab
            child={activeChild}
            homeworkList={homeworkList}
            isBn={isBn}
          />
        )}

        {activeTab === 'communication' && (
          <CommunicationTab
            child={activeChild}
            isBn={isBn}
            initialSection={commSection}
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
