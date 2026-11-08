import React, { useEffect, useRef, useState, useCallback } from 'react'
import { GraduationCap } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useAuth } from '@/contexts/AuthContext'
import { usePermission } from '@/hooks/usePermission'
import { useSessionStudents, useAdmissionStore } from '@/store/admissionStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useFeeStore } from '@/store/feeStore'
import { useClassStore } from '@/store/classStore'
import { useExpenseStore } from '@/store/expenseStore'
import { useOthersIncomeStore } from '@/store/othersIncomeStore'
import { useExamStore } from '@/store/examStore'
import { useHRStore } from '@/store/hrStore'
import { useSyllabusStore } from '@/store/syllabusStore'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useTodoStore } from '@/store/todoStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { getSlug } from '@/lib/storage'
import { getActiveStorageMode } from '@/lib/storageMode'
import gsap from 'gsap'
import { useShallow } from 'zustand/shallow'

import { DashboardSkeleton } from './components/DashboardSkeleton'
import { DashboardHeader } from './components/DashboardHeader'
import { LocalPCControlCard } from './components/LocalPCControlCard'
import { StatsRow } from './components/StatsRow'
import { FinanceCards } from './components/FinanceCards'
import { TodoSection } from './components/TodoSection'
import { ChartsRow } from './components/ChartsRow'
import { DemographicsRow } from './components/DemographicsRow'
import { ActivityRow } from './components/ActivityRow'
import { AcademicRow } from './components/AcademicRow'
import { CreateTaskModal } from './modals/CreateTaskModal'
import { useDashboardStats } from './hooks/useDashboardStats'

export default function DashboardPage() {
  const isBn = useBn()
  const { user } = useAuth()
  const { canRead } = usePermission()
  const { isMobile, isTablet } = useWindowSize()
  const containerRef = useRef<HTMLDivElement>(null)

  // Store bindings
  const students = useSessionStudents()
  const teachers = useTeacherStore(useShallow((s) => s.teachers))
  const { payments, structures, generateWaivers } = useFeeStore(
    useShallow((s) => ({
      payments: s.payments,
      structures: s.structures,
      generateWaivers: s.generateWaivers,
    }))
  )
  const { classes, routines } = useClassStore(
    useShallow((s) => ({ classes: s.classes, routines: s.routines }))
  )
  const examConfigs = useExamStore((s) => s.examConfigs || [])
  const assignments = useAssignmentStore((s) => s.assignments || [])
  const syllabi = useSyllabusStore((s) => s.syllabi || [])
  const { todos, updateTodo, deleteTodo } = useTodoStore(
    useShallow((s) => ({
      todos: s.todos || [],
      updateTodo: s.updateTodo,
      deleteTodo: s.deleteTodo,
    }))
  )

  // Local state
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(() => Date.now())
  const [syncError, setSyncError] = useState<string | null>(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all')

  const storageMode = getActiveStorageMode()
  const schoolSlug =
    getSlug() ||
    (typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('edutech_inst_slug')
      : null) ||
    'edutech'
  const schoolName = user?.schoolName || 'EduTech School'

  // Unified synchronization with Backend & Database / Local PC stores
  const syncDashboardData = useCallback(async () => {
    setIsRefreshing(true)
    setSyncError(null)
    const effectiveSlug =
      getSlug() ||
      (typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('edutech_inst_slug')
        : undefined) ||
      undefined

    try {
      await Promise.allSettled([
        useAdmissionStore.getState().syncFromServer(),
        useTeacherStore.getState().syncFromServer(),
        useFeeStore.getState().syncFromServer(effectiveSlug),
        useClassStore.getState().syncFromServer(effectiveSlug),
        useExpenseStore.getState().syncFromServer(effectiveSlug),
        useOthersIncomeStore.getState().syncFromServer(effectiveSlug),
        useExamStore.getState().syncFromServer(effectiveSlug),
        useHRStore.getState().syncFromServer(effectiveSlug),
        useSyllabusStore.getState().syncFromServer(effectiveSlug),
        useAssignmentStore.getState().syncFromServer(effectiveSlug),
      ])
      setLastSyncAt(Date.now())
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync note')
    } finally {
      setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncDashboardData()
  }, [syncDashboardData])

  // GSAP animation
  useEffect(() => {
    if (isLoading || !containerRef.current) return
    const cards = containerRef.current.querySelectorAll('.gsap-fade-up')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
    )
  }, [isLoading])

  // Computed metrics and distributions
  const {
    totalStudents,
    approvedStudents,
    pendingStudents,
    maleStudents,
    femaleStudents,
    totalTeachers,
    activeTeachers,
    totalTeacherSalary,
    teacherStats,
    classDist,
    statusData,
    weeklyTrend,
    financeStats,
    recentStudents,
    topStudentsList,
  } = useDashboardStats({
    students,
    teachers,
    payments,
    structures,
    generateWaivers,
    isBn,
  })

  const totalRecordsCount =
    (students?.length || 0) +
    (teachers?.length || 0) +
    (classes?.length || 0) +
    (routines?.length || 0) +
    (examConfigs?.length || 0) +
    (payments?.length || 0) +
    (assignments?.length || 0) +
    (syllabi?.length || 0) +
    (todos?.length || 0)

  const col4 = isMobile ? '1fr 1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)'
  const col3 = isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3,1fr)'
  const col2 = isMobile ? '1fr' : '1fr 1fr'
  const gap = isMobile ? '0.625rem' : '0.875rem'

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: isMobile ? '0.875rem' : '1rem',
    boxShadow: 'var(--shadow-xs)',
  }

  const sectionHead = (color: string) => (
    <div
      style={{
        width: '0.1875rem',
        height: '0.875rem',
        background: color,
        borderRadius: '0.125rem',
        flexShrink: 0,
      }}
    />
  )

  if (isLoading) return <DashboardSkeleton />

  const hasAnySection =
    canRead('students') ||
    canRead('teachers') ||
    canRead('finance') ||
    canRead('exams') ||
    canRead('attendance') ||
    canRead('classes')

  if (!hasAnySection) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '1rem',
            background: 'var(--brand-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GraduationCap size={28} style={{ color: 'var(--brand)' }} />
        </div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {isBn ? 'স্বাগতম' : 'Welcome'}
        </h2>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            maxWidth: '24rem',
          }}
        >
          {isBn
            ? 'আপনার ভূমিকার জন্য কোনো ড্যাশবোর্ড ডেটা উপলব্ধ নেই। মেনু থেকে আপনার অনুমোদিত পৃষ্ঠাগুলো অ্যাক্সেস করুন।'
            : 'No dashboard data is available for your role. Access your authorized pages from the menu.'}
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {/* Header with DB Status, Sync Button, Export Menu, and Add Task */}
      <DashboardHeader
        isBn={isBn}
        isMobile={isMobile}
        userName={user?.name || ''}
        storageMode={storageMode}
        isRefreshing={isRefreshing}
        lastSyncAt={lastSyncAt}
        syncError={syncError}
        schoolSlug={schoolSlug}
        schoolName={schoolName}
        onRefresh={() => void syncDashboardData()}
        onAddNewTask={() => setShowCreateTask(true)}
      />

      {/* Local PC & Database Integration Hub */}
      <LocalPCControlCard
        isBn={isBn}
        isMobile={isMobile}
        storageMode={storageMode}
        schoolSlug={schoolSlug}
        schoolName={schoolName}
        totalRecordsCount={totalRecordsCount}
        isRefreshing={isRefreshing}
        onSyncDatabase={() => void syncDashboardData()}
      />

      {/* Main KPI Stats */}
      <StatsRow
        isBn={isBn}
        isMobile={isMobile}
        totalStudents={totalStudents}
        approvedStudents={approvedStudents}
        maleStudents={maleStudents}
        femaleStudents={femaleStudents}
        totalTeacherSalary={totalTeacherSalary}
        canReadStudents={canRead('students')}
        canReadTeachers={canRead('teachers')}
        col4={col4}
        gap={gap}
      />

      {/* Financial Overview Cards */}
      <FinanceCards
        isBn={isBn}
        isMobile={isMobile}
        stats={financeStats}
        canReadFinance={canRead('finance')}
        col4={col4}
        gap={gap}
      />

      {/* Tasks / Todos with Staff Filter and Quick Actions */}
      <TodoSection
        isBn={isBn}
        todos={todos}
        teachers={teachers}
        selectedTeacherId={selectedTeacherId}
        setSelectedTeacherId={setSelectedTeacherId}
        updateTodo={updateTodo}
        deleteTodo={deleteTodo}
        cardStyle={cardStyle}
        sectionHead={sectionHead}
        col2={col2}
        gap={gap}
      />

      {/* Visual Analytics Charts */}
      <ChartsRow
        isBn={isBn}
        isMobile={isMobile}
        weeklyTrend={weeklyTrend}
        classDist={classDist}
        statusData={statusData}
        cardStyle={cardStyle}
        sectionHead={sectionHead}
        col3={col3}
        gap={gap}
      />

      {/* Demographics & Quick Metrics */}
      <DemographicsRow
        isBn={isBn}
        totalStudents={totalStudents}
        maleStudents={maleStudents}
        femaleStudents={femaleStudents}
        totalTeachers={totalTeachers}
        teacherStats={teacherStats}
        approvedStudents={approvedStudents}
        pendingStudents={pendingStudents}
        cardStyle={cardStyle}
        sectionHead={sectionHead}
        col3={col3}
        gap={gap}
      />

      {/* Recent Admissions & Events */}
      <ActivityRow
        isBn={isBn}
        recentStudents={recentStudents}
        cardStyle={cardStyle}
        sectionHead={sectionHead}
        col2={col2}
        gap={gap}
      />

      {/* Academic Highlights & Top Students */}
      <AcademicRow
        isBn={isBn}
        topStudentsList={topStudentsList}
        totalStudents={totalStudents}
        approvedStudents={approvedStudents}
        totalTeachers={totalTeachers}
        activeTeachers={activeTeachers}
        cardStyle={cardStyle}
        sectionHead={sectionHead}
        col2={col2}
        gap={gap}
      />

      {showCreateTask && <CreateTaskModal onClose={() => setShowCreateTask(false)} />}
    </div>
  )
}
