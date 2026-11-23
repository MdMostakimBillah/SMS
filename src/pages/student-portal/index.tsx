import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBn } from '@/hooks/useBn'
import { useAdmissionStore } from '@/store/admissionStore'
import { useClassStore } from '@/store/classStore'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useExamStore } from '@/store/examStore'
import { useFeeStore } from '@/store/feeStore'
import { useNoticeStore } from '@/store/noticeStore'
import { useTeacherStore } from '@/store/teacherStore'
import { isLocalComputerMode, isLocalServerMode } from '@/lib/storageMode'

import type { StudentPortalTab, StudentHomework, StudentFee, StudentLeaveRequest } from './types'
import {
  mapStudentsToPortalProfiles,
  getStudentWeeklyRoutine,
  getStudentHomework,
  getStudentFees,
  getStudentAttendanceStats,
} from './utils/studentPortalMapper'

import { StudentPortalHeader } from './components/StudentPortalHeader'
import { StudentPortalTabNav } from './components/StudentPortalTabNav'
import { StudentPortalEmptyState } from './components/StudentPortalEmptyState'
import { StudentPortalModals } from './components/StudentPortalModals'

// Tabs
import { OverviewTab } from './tabs/OverviewTab'
import { RoutineTab } from './tabs/RoutineTab'
import { AcademicsTab } from './tabs/AcademicsTab'
import { HomeworkTab } from './tabs/HomeworkTab'
import { AttendanceTab } from './tabs/AttendanceTab'
import { FeesTab } from './tabs/FeesTab'
import { ProfileTab } from './tabs/ProfileTab'

export default function StudentPortalPage() {
  const isBn = useBn()
  const { user } = useAuth()
  const { role } = useParams<{ role?: string }>()

  const admittedStudents = useAdmissionStore((s) => s.students)
  const isLocalPC = isLocalComputerMode()
  const isLocalServer = isLocalServerMode()

  // Sync from cloud server database on mount when not in local computer mode
  useEffect(() => {
    if (!isLocalPC) {
      useAdmissionStore.getState().syncFromServer?.().catch(() => {})
      useClassStore.getState().syncFromServer?.().catch(() => {})
      useAssignmentStore.getState().syncFromServer?.().catch(() => {})
      useExamStore.getState().syncFromServer?.().catch(() => {})
      useFeeStore.getState().syncFromServer?.().catch(() => {})
      useNoticeStore.getState().syncFromServer?.().catch(() => {})
      useTeacherStore.getState().syncFromServer?.().catch(() => {})
    }
  }, [isLocalPC])

  // Map real admitted students
  const studentsList = useMemo(() => {
    return mapStudentsToPortalProfiles(admittedStudents)
  }, [admittedStudents])

  // Check if admin is viewing or inspecting
  const isStudentRole = Boolean(
    user?.role === 'student' || role === 'student' || window.location.pathname.includes('/student/')
  )
  const isInstitutionAdmin = !isStudentRole && Boolean(
    !user || user.role === 'super_admin' || user.role === 'school_admin' || user.role === 'admin' ||
    role === 'admin' || role === 'school_admin' || role === 'super-admin' ||
    window.location.pathname.includes('/super-admin/')
  )

  // Active student selection
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    if (user?.id) {
      const matched = studentsList.find((s) => s.id === user.id || s.studentPhone === user.id)
      if (matched) return matched.id
    }
    return studentsList[0]?.id || ''
  })

  useEffect(() => {
    if (!activeStudentId && studentsList.length > 0) {
      setActiveStudentId(studentsList[0].id)
    }
  }, [studentsList, activeStudentId])

  const activeStudent = useMemo(() => {
    return studentsList.find((s) => s.id === activeStudentId) || studentsList[0]
  }, [studentsList, activeStudentId])

  // Tab State
  const [activeTab, setActiveTab] = useState<StudentPortalTab>('overview')

  // Modals state
  const [showIdCardModal, setShowIdCardModal] = useState(false)
  const [showHomeworkModal, setShowHomeworkModal] = useState(false)
  const [selectedHomework, setSelectedHomework] = useState<StudentHomework | null>(null)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [selectedFeeToPay, setSelectedFeeToPay] = useState<StudentFee | undefined>(undefined)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  // Real derived data
  const weeklyRoutine = useMemo(() => (activeStudent ? getStudentWeeklyRoutine(activeStudent) : []), [activeStudent])
  const homeworkList = useMemo(() => (activeStudent ? getStudentHomework(activeStudent) : []), [activeStudent])
  const [fees, setFees] = useState<StudentFee[]>(() => (activeStudent ? getStudentFees(activeStudent) : []))

  // Update fees when active student changes
  useEffect(() => {
    if (activeStudent) {
      setFees(getStudentFees(activeStudent))
    }
  }, [activeStudent?.id])

  // Leave requests persisted for the student
  const [leaveRequests, setLeaveRequests] = useState<StudentLeaveRequest[]>(() => {
    if (!activeStudent?.id) return []
    try {
      const saved = localStorage.getItem(`edutech_student_leave_${activeStudent.id}`)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return []
  })

  // Attendance rate
  const attendanceStats = useMemo(() => {
    return activeStudent ? getStudentAttendanceStats(activeStudent.id, new Date()) : { attendanceRate: '0.0%' }
  }, [activeStudent])

  // Handlers
  const handleOpenSubmitHomework = (hw: StudentHomework) => {
    setSelectedHomework(hw)
    setShowHomeworkModal(true)
  }

  const handleOpenPayFee = (fee?: StudentFee) => {
    const dueItem = fee || fees.find((f) => f.due > 0) || fees[0]
    setSelectedFeeToPay(dueItem)
    setShowFeeModal(true)
  }

  const handleFeePaymentSuccess = (amount: number, trxId: string, feeId?: string, method = 'bkash', phone = '') => {
    if (!activeStudent) return

    const targetFeeId = feeId || selectedFeeToPay?.id
    const updated = fees.map((f) => {
      if (f.id === targetFeeId) {
        return {
          ...f,
          status: 'pending' as const,
          pendingTrxId: trxId,
          pendingMethod: method,
          pendingDate: new Date().toISOString(),
        }
      }
      return f
    })
    setFees(updated)
    try {
      localStorage.setItem(`edutech_student_portal_fees_${activeStudent.id}`, JSON.stringify(updated))
    } catch { /* ignore */ }

    // Record online payment request in feeStore
    try {
      useFeeStore.getState().addOnlinePaymentRequest?.({
        id: `req-${Date.now()}`,
        studentId: activeStudent.id,
        studentName: activeStudent.nameEn,
        studentRoll: activeStudent.roll,
        studentClass: activeStudent.class,
        feeStructureId: targetFeeId || 'fee-online',
        feeTitle: selectedFeeToPay?.title || 'Fee Payment',
        feeTitleBn: selectedFeeToPay?.titleBn || 'ফি পেমেন্ট',
        amount,
        method: method as any,
        phone,
        trxId,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      })
    } catch { /* ignore */ }
  }

  const handleAddLeaveRequest = (req: Omit<StudentLeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    if (!activeStudent) return
    const newReq: StudentLeaveRequest = {
      ...req,
      id: `leave-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    const updated = [newReq, ...leaveRequests]
    setLeaveRequests(updated)
    try {
      localStorage.setItem(`edutech_student_leave_${activeStudent.id}`, JSON.stringify(updated))
    } catch { /* ignore */ }
  }

  if (studentsList.length === 0 || !activeStudent) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <StudentPortalEmptyState isBn={isBn} isLocalPC={isLocalPC} />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto min-h-screen">
      {/* Student Portal Header */}
      <StudentPortalHeader
        student={activeStudent}
        studentsList={studentsList}
        onSelectStudent={setActiveStudentId}
        onOpenIdCard={() => setShowIdCardModal(true)}
        isLocalPC={isLocalPC}
        isLocalServer={isLocalServer}
        isInstitutionAdmin={isInstitutionAdmin}
        isBn={isBn}
      />

      {/* Tab Navigation */}
      <StudentPortalTabNav activeTab={activeTab} onSelectTab={setActiveTab} isBn={isBn} />

      {/* Tab Panels */}
      <main className="mt-4">
        {activeTab === 'overview' && (
          <OverviewTab
            routine={weeklyRoutine}
            homework={homeworkList}
            fees={fees}
            attendanceRate={attendanceStats.attendanceRate}
            onNavigateTab={setActiveTab}
            onOpenSubmitHomework={handleOpenSubmitHomework}
            isBn={isBn}
          />
        )}

        {activeTab === 'routine' && (
          <RoutineTab student={activeStudent} routine={weeklyRoutine} isBn={isBn} />
        )}

        {activeTab === 'academics' && (
          <AcademicsTab student={activeStudent} isBn={isBn} />
        )}

        {activeTab === 'homework' && (
          <HomeworkTab
            student={activeStudent}
            homework={homeworkList}
            onOpenSubmitModal={handleOpenSubmitHomework}
            isBn={isBn}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            student={activeStudent}
            leaveRequests={leaveRequests}
            onOpenLeaveModal={() => setShowLeaveModal(true)}
            isBn={isBn}
          />
        )}

        {activeTab === 'fees' && (
          <FeesTab
            student={activeStudent}
            fees={fees}
            onOpenPayModal={handleOpenPayFee}
            isBn={isBn}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            student={activeStudent}
            onOpenIdCard={() => setShowIdCardModal(true)}
            isBn={isBn}
          />
        )}
      </main>

      {/* Modals Container */}
      <StudentPortalModals
        student={activeStudent}
        fees={fees}
        selectedFeeToPay={selectedFeeToPay}
        selectedHomework={selectedHomework}
        showIdCardModal={showIdCardModal}
        showHomeworkModal={showHomeworkModal}
        showFeeModal={showFeeModal}
        showLeaveModal={showLeaveModal}
        onCloseIdCard={() => setShowIdCardModal(false)}
        onCloseHomework={() => setShowHomeworkModal(false)}
        onCloseFee={() => setShowFeeModal(false)}
        onCloseLeave={() => setShowLeaveModal(false)}
        onFeePaymentSuccess={handleFeePaymentSuccess}
        onAddLeaveRequest={handleAddLeaveRequest}
        isBn={isBn}
      />
    </div>
  )
}
