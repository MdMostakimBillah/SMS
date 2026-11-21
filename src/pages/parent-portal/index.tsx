import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  CalendarCheck,
  GraduationCap,
  CreditCard,
  BookOpen,
  MessageSquare,
  UserCheck,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTabSlider } from '@/hooks/useTabSlider'
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
import { ChildSelector } from './components/ChildSelector'
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

const PORTAL_TABS: Array<{
  id: PortalTab
  labelEn: string
  labelBn: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: 'overview', labelEn: 'Overview', labelBn: 'একনজরে', icon: LayoutDashboard },
  { id: 'attendance', labelEn: 'Attendance', labelBn: 'উপস্থিতি', icon: CalendarCheck },
  { id: 'academics', labelEn: 'Academics & Results', labelBn: 'ফলাফল ও পরীক্ষা', icon: GraduationCap },
  { id: 'fees', labelEn: 'Fees & Payments', labelBn: 'ফি ও পেমেন্ট', icon: CreditCard },
  { id: 'homework', labelEn: 'Homework & Diary', labelBn: 'হোমওয়ার্ক ও ডায়েরি', icon: BookOpen },
  { id: 'communication', labelEn: 'Notice & Teachers', labelBn: 'যোগাযোগ ও নোটিশ', icon: MessageSquare },
  { id: 'profile', labelEn: 'Student Profile', labelBn: 'শিক্ষার্থী প্রোফাইল', icon: UserCheck },
]

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
  const [fees, setFees] = useState<FeeItem[]>(DEMO_FEES)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(DEMO_LEAVE_REQUESTS)

  // Modals state
  const [showIdCardModal, setShowIdCardModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [selectedFeeToPay, setSelectedFeeToPay] = useState<FeeItem | undefined>(undefined)

  // Tab slider
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  useTabSlider({ activeTab, tabRefs, sliderRef })

  // Handlers
  const handleOpenPayModal = (fee?: FeeItem) => {
    const dueItem = fee || fees.find((f) => f.due > 0) || fees[0]
    setSelectedFeeToPay(dueItem)
    setShowFeeModal(true)
  }

  const handlePaymentSuccess = (paidAmount: number, _trxId: string) => {
    if (selectedFeeToPay) {
      setFees((prev) =>
        prev.map((f) =>
          f.id === selectedFeeToPay.id
            ? {
                ...f,
                paid: f.paid + paidAmount,
                due: Math.max(0, f.due - paidAmount),
                status: f.due - paidAmount <= 0 ? 'paid' : 'partial',
              }
            : f
        )
      )
    }
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

      {/* Tabs Navigation Bar */}
      <div className="bg-[var(--surface)] p-1 rounded-xl border border-[var(--border)] shadow-xs overflow-x-auto scrollbar-none">
        <div className="relative flex items-center min-w-max">
          {/* Animated Slider */}
          <div
            ref={sliderRef}
            className="absolute top-0 bottom-0 rounded-lg bg-[var(--brand)] transition-all duration-300 ease-out shadow-xs pointer-events-none"
          />

          {PORTAL_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el)
                  else tabRefs.current.delete(tab.id)
                }}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors duration-200 cursor-pointer border-none ${
                  isActive
                    ? 'text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                <span>{isBn ? tab.labelBn : tab.labelEn}</span>
              </button>
            )
          })}
        </div>
      </div>

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
      <StudentIdCardModal
        isOpen={showIdCardModal}
        onClose={() => setShowIdCardModal(false)}
        child={activeChild}
        isBn={isBn}
      />

      <FeePaymentModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        child={activeChild}
        fees={fees}
        fee={selectedFeeToPay}
        onSuccess={handlePaymentSuccess}
        isBn={isBn}
      />

      <LeaveRequestModal
        isOpen={showLeaveModal}
        child={activeChild}
        onClose={() => setShowLeaveModal(false)}
        onSubmit={handleCreateLeaveRequest}
        isBn={isBn}
      />
    </div>
  )
}
