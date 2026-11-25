import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { eachDayOfInterval, format, parseISO } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { useBn } from '@/hooks/useBn'
import { useAdmissionStore } from '@/store/admissionStore'
import { useFeeStore } from '@/store/feeStore'
import { useNoticeStore } from '@/store/noticeStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useClassStore } from '@/store/classStore'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useExamStore } from '@/store/examStore'
import { isLocalComputerMode, isLocalServerMode } from '@/lib/storageMode'
import type { PortalTab, FeeItem, LeaveRequest } from './types'
import { mapAdmittedStudentsToPortalChildren, resolvePortalChildrenForUser } from './utils/studentMapper'
import { getChildDatabaseFees } from './utils/feeMapper'
import { getChildHomework, getChildExamResults } from './utils/dataMappers'
import { processParentOnlinePayment, approveStudentFee, rejectStudentFee } from './utils/paymentHandler'
import { ChildSelector } from './components/ChildSelector'
import { PortalTabNav } from './components/PortalTabNav'
import { PortalNoStudentsNotice } from './components/PortalNoStudentsNotice'
import { ParentPortalModals } from './components/ParentPortalModals'

// Tabs
import { OverviewTab } from './tabs/OverviewTab'
import { AttendanceTab } from './tabs/AttendanceTab'
import { AcademicsTab } from './tabs/AcademicsTab'
import { FeesTab } from './tabs/FeesTab'
import { HomeworkTab } from './tabs/HomeworkTab'
import { CommunicationTab } from './tabs/CommunicationTab'
import { ProfileTab } from './tabs/ProfileTab'

function loadLeaveRequests(childId?: string): LeaveRequest[] {
  if (!childId) return []
  try {
    const saved = localStorage.getItem(`edutech_parent_portal_leave_${childId}`)
    if (saved) {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch {
    /* ignore storage errors */
  }
  return []
}

function saveLeaveRequests(childId: string, list: LeaveRequest[]) {
  try {
    localStorage.setItem(`edutech_parent_portal_leave_${childId}`, JSON.stringify(list))
  } catch {
    /* ignore storage errors */
  }
}

export default function ParentPortalPage() {
  const isBn = useBn()
  const { user } = useAuth()
  const { role } = useParams<{ role?: string }>()

  const admittedStudents = useAdmissionStore((s) => s.students)
  const teachers = useTeacherStore((s) => s.teachers)
  const subjects = useTeacherStore((s) => s.subjects)
  const classes = useClassStore((s) => s.classes)
  const notices = useNoticeStore((s) => s.notices)

  const feeStructures = useFeeStore((s) => s.structures)
  const feePayments = useFeeStore((s) => s.payments)
  const feeRequests = useFeeStore((s) => s.onlinePaymentRequests)
  const waiverEntries = useFeeStore((s) => s.waiverEntries)
  const studentWaivers = useFeeStore((s) => s.studentWaivers)

  const assignments = useAssignmentStore((s) => s.assignments)
  const submissions = useAssignmentStore((s) => s.submissions)

  const studentMarks = useExamStore((s) => s.studentMarks)
  const subjectMarkConfigs = useExamStore((s) => s.subjectMarkConfigs)
  const examConfigs = useExamStore((s) => s.examConfigs)

  const isLocalPC = isLocalComputerMode()
  const isLocalServer = isLocalServerMode()

  // Sync from server database on mount when not in offline mode
  useEffect(() => {
    if (!isLocalPC) {
      void useAdmissionStore.getState().syncFromServer?.()
      void useClassStore.getState().syncFromServer?.()
      void useAssignmentStore.getState().syncFromServer?.()
      void useFeeStore.getState().syncFromServer?.()
      void useNoticeStore.getState().syncFromServer?.()
      void useTeacherStore.getState().syncFromServer?.()
      void useAttendanceStore.getState().syncFromServer?.()
      void useExamStore.getState().syncFromServer?.()
    }
  }, [isLocalPC])

  // Determine role: Parent accounts only see their own child / siblings
  const isParentAccount = Boolean(
    user?.role === 'parent' ||
      user?.role === 'guardian' ||
      role === 'parent' ||
      role === 'guardian' ||
      window.location.pathname.includes('/parent/') ||
      window.location.pathname.includes('/guardian/')
  )

  // Institution admin and super admin can inspect and switch/search all students
  const isInstitutionAdmin =
    !isParentAccount &&
    Boolean(
      !user ||
        user.role === 'super_admin' ||
        user.role === 'school_admin' ||
        user.role === 'admin' ||
        role === 'admin' ||
        role === 'school_admin' ||
        role === 'super-admin' ||
        window.location.pathname.includes('/super-admin/')
    )

  // Map admitted students and apply parent isolation if logged in as a parent
  const allMappedChildren = useMemo(() => {
    void teachers
    void classes
    return mapAdmittedStudentsToPortalChildren(admittedStudents)
  }, [admittedStudents, teachers, classes])

  const childrenList = useMemo(() => {
    return resolvePortalChildrenForUser(allMappedChildren, user, isParentAccount)
  }, [allMappedChildren, user, isParentAccount])

  // Active child state (activeChild gracefully resolves to childrenList[0] if unset/stale)
  const [activeChildId, setActiveChildId] = useState<string>('')

  const activeChild = useMemo(() => {
    return childrenList.find((c) => c.id === activeChildId) || childrenList[0]
  }, [childrenList, activeChildId])

  // Portal Navigation State
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')
  const [commSection, setCommSection] = useState<'notices' | 'teachers'>('notices')

  // Fees state derived reactively from fee store + local handler updates
  const feeStoreSignature = useMemo(() => {
    const reqSig = (feeRequests || []).map((r) => `${r.id}:${r.status}`).join(',')
    return `${feeStructures.length}|${feePayments.length}|${reqSig}|${waiverEntries.length}|${studentWaivers.length}`
  }, [feeStructures, feePayments, feeRequests, waiverEntries, studentWaivers])

  const [feeOverride, setFeeOverride] = useState<{
    childId: string
    signature: string
    fees: FeeItem[]
  } | null>(null)

  const fees = useMemo<FeeItem[]>(() => {
    if (!activeChild) return []
    if (
      feeOverride &&
      feeOverride.childId === activeChild.id &&
      feeOverride.signature === feeStoreSignature
    ) {
      return feeOverride.fees
    }
    return getChildDatabaseFees(activeChild)
  }, [activeChild, feeOverride, feeStoreSignature])

  // Leave requests keyed by childId (persisted to localStorage)
  const [leaveMap, setLeaveMap] = useState<Record<string, LeaveRequest[]>>({})
  const resolvedChildId = activeChild?.id ?? null

  const leaveRequests = useMemo<LeaveRequest[]>(() => {
    if (!resolvedChildId) return []
    return leaveMap[resolvedChildId] ?? loadLeaveRequests(resolvedChildId)
  }, [resolvedChildId, leaveMap])

  // Real homework and exam results derived reactively from stores
  const homeworkList = useMemo(() => {
    void assignments
    void submissions
    void teachers
    void subjects
    void classes
    return activeChild ? getChildHomework(activeChild) : []
  }, [activeChild, assignments, submissions, teachers, subjects, classes])

  const examResults = useMemo(() => {
    void studentMarks
    void subjectMarkConfigs
    void examConfigs
    void subjects
    return activeChild ? getChildExamResults(activeChild) : []
  }, [activeChild, studentMarks, subjectMarkConfigs, examConfigs, subjects])

  // Tab badge counts
  const dueFeesCount = useMemo(() => fees.filter((f) => f.due > 0).length, [fees])
  const pendingHwCount = useMemo(
    () => homeworkList.filter((h) => h.status === 'pending').length,
    [homeworkList]
  )
  const noticeCount = useMemo(
    () => notices.filter((n) => n && n.isActive !== false && n.target !== 'teachers').length,
    [notices]
  )

  // Modals state
  const [showIdCardModal, setShowIdCardModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedFeeToPay, setSelectedFeeToPay] = useState<FeeItem | undefined>(undefined)

  // Handlers
  const handleOpenPayModal = useCallback(
    (fee?: FeeItem) => {
      const dueItem =
        fee ||
        fees.find((f) => f.due > 0 && f.status !== 'pending') ||
        fees.find((f) => f.due > 0) ||
        fees[0]
      setSelectedFeeToPay(dueItem)
      setShowFeeModal(true)
    },
    [fees]
  )

  const getCurrentStoreSignature = () => {
    const s = useFeeStore.getState()
    const reqSig = (s.onlinePaymentRequests || []).map((r) => `${r.id}:${r.status}`).join(',')
    return `${s.structures.length}|${s.payments.length}|${reqSig}|${s.waiverEntries.length}|${s.studentWaivers.length}`
  }

  const handlePaymentSuccess = useCallback(
    (paidAmount: number, trxId: string, feeId?: string, method = 'bkash', phone = '') => {
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
      setFeeOverride({
        childId: activeChild.id,
        signature: getCurrentStoreSignature(),
        fees: updated,
      })
    },
    [activeChild, fees, selectedFeeToPay, isBn]
  )

  const handleApproveFee = useCallback(
    (fee: FeeItem) => {
      if (!activeChild) return
      const updated = approveStudentFee(activeChild, fee, user?.name || undefined)
      setFeeOverride({
        childId: activeChild.id,
        signature: getCurrentStoreSignature(),
        fees: updated,
      })
    },
    [activeChild, user?.name]
  )

  const handleRejectFee = useCallback(
    (fee: FeeItem, reason = 'Transaction ID not verified') => {
      if (!activeChild) return
      const updated = rejectStudentFee(activeChild, fee, reason, user?.name || undefined)
      setFeeOverride({
        childId: activeChild.id,
        signature: getCurrentStoreSignature(),
        fees: updated,
      })
    },
    [activeChild, user?.name]
  )

  const handleCreateLeaveRequest = useCallback(
    (req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
      if (!activeChild) return
      const newReq: LeaveRequest = {
        ...req,
        id: `leave-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        childId: activeChild.id,
      }
      const current = leaveMap[activeChild.id] ?? loadLeaveRequests(activeChild.id)
      const next = [newReq, ...current]
      saveLeaveRequests(activeChild.id, next)
      setLeaveMap((prev) => ({ ...prev, [activeChild.id]: next }))
    },
    [activeChild, leaveMap]
  )

  const handleUpdateLeaveStatus = useCallback(
    (leaveId: string, status: 'approved' | 'rejected') => {
      if (!activeChild) return
      const current = leaveMap[activeChild.id] ?? loadLeaveRequests(activeChild.id)
      const target = current.find((l) => l.id === leaveId)
      const next = current.map((l) => (l.id === leaveId ? { ...l, status } : l))
      saveLeaveRequests(activeChild.id, next)
      setLeaveMap((prev) => ({ ...prev, [activeChild.id]: next }))

      if (status === 'approved' && target) {
        try {
          const start = parseISO(target.startDate)
          const end = parseISO(target.endDate)
          if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
            const days = eachDayOfInterval({ start, end })
            const markAttendance = useAttendanceStore.getState().markAttendance
            days.forEach((d) => {
              markAttendance(format(d, 'yyyy-MM-dd'), activeChild.id, 'on-leave', undefined, target.reason)
            })
          }
        } catch {
          /* ignore date errors */
        }
      }
    },
    [activeChild, leaveMap]
  )

  const handleCancelLeaveRequest = useCallback(
    (leaveId: string) => {
      if (!activeChild) return
      const current = leaveMap[activeChild.id] ?? loadLeaveRequests(activeChild.id)
      const next = current.filter((l) => l.id !== leaveId)
      saveLeaveRequests(activeChild.id, next)
      setLeaveMap((prev) => ({ ...prev, [activeChild.id]: next }))
    },
    [activeChild, leaveMap]
  )

  // Clean empty state when no admitted students exist in the system
  if (childrenList.length === 0 || !activeChild) {
    return <PortalNoStudentsNotice isInstitutionAdmin={isInstitutionAdmin} />
  }

  return (
    <div className="w-full space-y-4 pb-10">
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

      {/* Tabs Navigation Bar */}
      <PortalTabNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'communication') setCommSection('notices')
          setActiveTab(tab)
        }}
        isBn={isBn}
        dueFeesCount={dueFeesCount}
        pendingHwCount={pendingHwCount}
        noticeCount={noticeCount}
      />

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            child={activeChild}
            fees={fees}
            homeworkList={homeworkList}
            results={examResults}
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
            onUpdateLeaveStatus={isInstitutionAdmin ? handleUpdateLeaveStatus : undefined}
            onCancelLeave={handleCancelLeaveRequest}
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
      <ParentPortalModals
        showIdCardModal={showIdCardModal}
        setShowIdCardModal={setShowIdCardModal}
        showFeeModal={showFeeModal}
        setShowFeeModal={setShowFeeModal}
        showLeaveModal={showLeaveModal}
        setShowLeaveModal={setShowLeaveModal}
        child={activeChild}
        fees={fees}
        selectedFeeToPay={selectedFeeToPay}
        onPaymentSuccess={handlePaymentSuccess}
        onCreateLeaveRequest={handleCreateLeaveRequest}
        isBn={isBn}
      />
    </div>
  )
}
