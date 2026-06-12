import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Download, Plus, GripVertical } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import gsap from 'gsap'

import { useDashboardStore, getWidgetLabel, type WidgetId, type WidgetColSpan } from '@/store/dashboardStore'

import StatCards from './widgets/StatCards'
import EnrollmentTrend from './widgets/EnrollmentTrend'
import ClassDistribution from './widgets/ClassDistribution'
import StatusDistribution from './widgets/StatusDistribution'
import GenderRatio from './widgets/GenderRatio'
import TeacherStatus from './widgets/TeacherStatus'
import QuickStats from './widgets/QuickStats'
import RecentAdmissions from './widgets/RecentAdmissions'
import UpcomingEvents from './widgets/UpcomingEvents'
import TopStudents from './widgets/TopStudents'
import AcademicOverview from './widgets/AcademicOverview'
import ExamOverview from './widgets/ExamOverview'
import HRSummary from './widgets/HRSummary'
import SortableWidget from './widgets/SortableWidget'
import WidgetTogglePanel from './widgets/WidgetTogglePanel'

function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="skeleton skeleton-title" style={{ width: '12.5rem' }} />
          <div className="skeleton skeleton-text" style={{ width: '9.375rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton" style={{ width: '5rem', height: '2rem', borderRadius: '0.5rem' }} />
          <div className="skeleton" style={{ width: '6.25rem', height: '2rem', borderRadius: '0.5rem' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div className="skeleton skeleton-circle" style={{ width: '2.25rem', height: '2.25rem' }} />
              <div className="skeleton" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem' }} />
            </div>
            <div className="skeleton" style={{ width: '5rem', height: '1.5rem', marginBottom: '0.375rem' }} />
            <div className="skeleton skeleton-text" style={{ width: '6.25rem' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card" style={{ minHeight: '11.25rem' }} />
        ))}
      </div>
    </div>
  )
}

function getColSpan(id: WidgetId): WidgetColSpan {
  if (id.startsWith('stat-')) return 1
  return 2
}

export default function DashboardPage() {
  const isBn = useBn()
  const { isMobile, isTablet } = useWindowSize()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const { order, visibility, setOrder } = useDashboardStore()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading || !containerRef.current) return
    const cards = containerRef.current.querySelectorAll('.gsap-fade-up')
    gsap.fromTo(cards, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' })
  }, [isLoading])

  const visibleOrder = useMemo(() => order.filter((id) => visibility[id]), [order, visibility])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = order.indexOf(active.id as WidgetId)
      const newIndex = order.indexOf(over.id as WidgetId)
      if (oldIndex === -1 || newIndex === -1) return
      setOrder(arrayMove(order, oldIndex, newIndex))
    },
    [order, setOrder]
  )

  const gap = isMobile ? '10px' : '0.875rem'

  if (isLoading) return <DashboardSkeleton />

  const statWidgetIds = visibleOrder.filter((id) => id.startsWith('stat-'))
  const nonStatWidgets = visibleOrder.filter((id) => !id.startsWith('stat-'))

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {/* Header */}
      <div
        className="gsap-fade-up"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.625rem' }}
      >
        <div>
          <h1 style={{ fontSize: isMobile ? '18px' : '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {isBn ? 'সুপ্রভাত, Admin 👋' : 'Good morning, Admin 👋'}
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1875rem' }}>
            {new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <WidgetTogglePanel />
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '6px 12px',
              borderRadius: '0.5rem',
              background: isEditing ? 'var(--brand)' : 'var(--bg-secondary)',
              border: `1px solid ${isEditing ? 'var(--brand)' : 'var(--border)'}`,
              color: isEditing ? '#fff' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            <GripVertical size={14} />
            {isEditing ? (isBn ? 'সম্পন্ন' : 'Done') : (isBn ? 'সাজান' : 'Customize')}
          </button>
          {!isMobile && (
            <>
              <button className="btn-minimal">
                <Download size={14} /> Export
              </button>
              <button className="btn-minimal btn-brand">
                <Plus size={14} />
                {isBn ? 'নতুন' : 'Add New'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alert */}
      <div
        className="gsap-fade-up"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--brand-light)',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '0.5rem',
          padding: '8px 14px',
          fontSize: '0.75rem',
          color: 'var(--brand)',
          alignSelf: 'flex-start',
          fontWeight: 500,
        }}
      >
        <span
          style={{
            width: '0.375rem',
            height: '0.375rem',
            borderRadius: '50%',
            background: 'var(--brand)',
            animation: 'pulse 2s infinite',
            flexShrink: 0,
          }}
        />
        {isBn ? 'ড্যাশবোর্ড কাস্টমাইজ করতে "সাজান" বাটনে ক্লিক করুন' : 'Click "Customize" to rearrange your dashboard'}
      </div>

      {/* DnD Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleOrder} strategy={rectSortingStrategy}>
          {/* Stat cards row — full width, single column */}
          {statWidgetIds.length > 0 && (
            <div className="gsap-fade-up">
              <SortableWidget
                id={statWidgetIds[0]}
                title={getWidgetLabel(statWidgetIds[0], isBn)}
                colSpan={4}
                isEditing={isEditing}
              >
                <StatCards />
              </SortableWidget>
            </div>
          )}

          {/* Non-stat widgets grid */}
          <div
            className="gsap-fade-up"
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
              gap,
              alignItems: 'start',
            }}
          >
            {nonStatWidgets.map((id) => (
              <SortableWidget
                key={id}
                id={id}
                title={getWidgetLabel(id, isBn)}
                colSpan={getColSpan(id)}
                isEditing={isEditing}
              >
                {renderWidget(id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  )
}

function renderWidget(id: WidgetId) {
  switch (id) {
    case 'enrollment-trend':
      return <EnrollmentTrend />
    case 'class-distribution':
      return <ClassDistribution />
    case 'status-distribution':
      return <StatusDistribution />
    case 'gender-ratio':
      return <GenderRatio />
    case 'teacher-status':
      return <TeacherStatus />
    case 'quick-stats':
      return <QuickStats />
    case 'recent-admissions':
      return <RecentAdmissions />
    case 'upcoming-events':
      return <UpcomingEvents />
    case 'top-students':
      return <TopStudents />
    case 'academic-overview':
      return <AcademicOverview />
    case 'exam-overview':
      return <ExamOverview />
    case 'hr-summary':
      return <HRSummary />
    default:
      return <></>
  }
}
