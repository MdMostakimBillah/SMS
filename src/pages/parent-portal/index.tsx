import React, { useState, useMemo, useRef } from 'react'
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
import type { PortalChild, PortalTab, FeeItem, LeaveRequest } from './types'
import {
  DEMO_CHILDREN,
  DEMO_FEES,
  DEMO_HOMEWORK,
  DEMO_EXAM_RESULTS,
  DEMO_LEAVE_REQUESTS,
} from './mockData'
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
  const admittedStudents = useAdmissionStore((s) => s.students)

  // Merge admitted students if available with demo children
  const childrenList: PortalChild[] = useMemo(() => {
    if (admittedStudents && admittedStudents.length > 0) {
      const mapped: PortalChild[] = admittedStudents.slice(0, 3).map((s, idx) => ({
        id: s.id || `student-${idx}`,
        nameEn: s.nameEn || `Student ${idx + 1}`,
        nameBn: s.nameBn || s.nameEn || `শিক্ষার্থী ${idx + 1}`,
        photo:
          s.photo ||
          (idx % 2 === 0
            ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&h=150&fit=crop&crop=faces'
            : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces'),
        class: s.class || 'Class 8',
        section: s.section || 'A',
        roll: s.roll || `0${idx + 1}`,
        academicYear: '2026',
        dob: s.dob || '2012-05-14',
        gender: s.gender || 'Male',
        bloodGroup: s.bloodGroup || 'B+',
        fatherName: s.fatherNameEn || 'Dr. Mahfuzur Rahman',
        fatherPhone: s.fatherPhone || s.phone || '+880 1711-234567',
        motherName: s.motherNameEn || 'Nasrin Sultana',
        motherPhone: s.motherPhone || '+880 1819-345678',
        guardianName: s.guardianName || s.fatherNameEn || 'Dr. Mahfuzur Rahman',
        guardianPhone: s.guardianPhone || s.phone || '+880 1711-234567',
        guardianRelation: s.guardianRelation || 'Father',
        emergencyContact: s.phone || '+880 1711-234567',
        presentAddress: s.presentAddress || 'House 14, Road 5, Dhanmondi, Dhaka',
        classTeacherName: 'Md. Anwar Hossain',
        classTeacherPhone: '+880 1712-889900',
        classTeacherEmail: 'anwar.hossain@edutech.edu.bd',
      }))
      return mapped
    }
    return DEMO_CHILDREN
  }, [admittedStudents])

  // Active child state
  const [activeChildId, setActiveChildId] = useState<string>(childrenList[0]?.id || 'child-1')
  const activeChild = useMemo(() => {
    return childrenList.find((c) => c.id === activeChildId) || childrenList[0] || DEMO_CHILDREN[0]
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

  const handleCreateLeaveRequest = (newLeave: {
    startDate: string
    endDate: string
    type: 'sick' | 'casual' | 'family' | 'other'
    reason: string
  }) => {
    const created: LeaveRequest = {
      id: `leave-${Date.now()}`,
      childId: activeChild.id,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      type: newLeave.type,
      reason: newLeave.reason,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
    }
    setLeaveRequests((prev) => [created, ...prev])
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Child Switcher */}
      <ChildSelector
        childrenList={childrenList}
        activeChild={activeChild}
        onSelectChild={(child) => setActiveChildId(child.id)}
        onOpenPayModal={() => handleOpenPayModal()}
        onOpenIdCardModal={() => setShowIdCardModal(true)}
        onOpenMessage={() => setActiveTab('communication')}
        isBn={isBn}
      />

      {/* Modern Tab Bar with useTabSlider */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-1.5 border border-gray-200 dark:border-gray-700 shadow-2xs">
        <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* Sliding indicator */}
          <div
            ref={sliderRef}
            className="absolute top-1 bottom-1 rounded-lg bg-blue-600 transition-all duration-300 ease-out shadow-xs pointer-events-none"
            style={{ zIndex: 0 }}
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
                className={`relative z-10 flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
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
