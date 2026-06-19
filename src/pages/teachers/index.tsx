import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Users,
  Building2,
  BookOpen,
  UserCheck,
  Banknote,
  ArrowRight,
  Layers,
  Briefcase,
  GripVertical,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAppStore } from '@/store/appStore'

import gsap from 'gsap'

const STATIC_OPTIONS = [
  {
    id: 'add',
    path: '/teachers/add',
    icon: UserPlus,
    iconColor: 'var(--teal)',
    iconBg: 'var(--teal-light)',
    titleBn: 'নতুন শিক্ষক',
    titleEn: 'Add Teacher',
    descBn: 'নতুন শিক্ষক যোগ করুন।',
    descEn: 'Add a new teacher.',
    statColor: 'var(--teal)',
  },
  {
    id: 'all',
    path: '/teachers/all',
    icon: Users,
    iconColor: 'var(--brand)',
    iconBg: 'var(--brand-light)',
    titleBn: 'সকল শিক্ষক',
    titleEn: 'All Teachers',
    descBn: 'সকল শিক্ষকের তালিকা।',
    descEn: 'View all teachers.',
    statColor: 'var(--brand)',
  },
  {
    id: 'departments',
    path: '/teachers/departments',
    icon: Building2,
    iconColor: 'var(--amber)',
    iconBg: 'var(--amber-light)',
    titleBn: 'বিভাগ',
    titleEn: 'Departments',
    descBn: 'বিভাগ পরিচালনা করুন।',
    descEn: 'Manage departments.',
    statColor: 'var(--amber)',
  },
  {
    id: 'subjects',
    path: '/teachers/subjects',
    icon: BookOpen,
    iconColor: 'var(--green)',
    iconBg: 'var(--green-light)',
    titleBn: 'বিষয়',
    titleEn: 'Subjects',
    descBn: 'বিষয় পরিচালনা করুন।',
    descEn: 'Manage subjects.',
    statColor: 'var(--green)',
  },
  {
    id: 'designations',
    path: '/teachers/designations',
    icon: Briefcase,
    iconColor: 'var(--purple)',
    iconBg: 'var(--purple-light)',
    titleBn: 'পদবি',
    titleEn: 'Designations',
    descBn: 'পদবি পরিচালনা করুন।',
    descEn: 'Manage designations.',
    statColor: 'var(--purple)',
  },
  {
    id: 'bulk-update',
    path: '/teachers/bulk-update',
    icon: Layers,
    iconColor: 'var(--purple)',
    iconBg: 'var(--purple-light)',
    titleBn: 'বাল্ক আপডেট',
    titleEn: 'Bulk Update',
    descBn: 'একসাথে অনেক শিক্ষকের তথ্য পরিবর্তন করুন।',
    descEn: 'Update multiple teachers at once.',
    statColor: 'var(--purple)',
  },
]

function toBnNum(n: number): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n).replace(/\d/g, (d) => bn[+d])
}

// Skeleton Loading
function TeachersSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-title" style={{ width: '12.5rem', marginBottom: '1rem' }} />
      <div className="skeleton skeleton-text" style={{ width: '9.375rem', marginBottom: '1.25rem' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.625rem', marginBottom: '1.25rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div className="skeleton skeleton-circle" style={{ width: '2rem', height: '2rem' }} />
              <div>
                <div className="skeleton" style={{ width: '3.125rem', height: '1.125rem', marginBottom: '0.25rem' }} />
                <div className="skeleton skeleton-text" style={{ width: '2.5rem', height: '0.625rem' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="skeleton" style={{ width: '6.25rem', height: '0.75rem', marginBottom: '0.75rem' }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-circle" style={{ width: '2.5rem', height: '2.5rem', marginBottom: '0.625rem' }} />
            <div className="skeleton" style={{ width: '5rem', height: '0.875rem', marginBottom: '0.375rem' }} />
            <div className="skeleton skeleton-text" style={{ width: '100%' }} />
            <div className="skeleton skeleton-text" style={{ width: '3.75rem', height: '0.625rem' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TeachersPage() {
  const navigate = useNavigate()
  const isBn = useBn()
  const { teachers, departments, subjects, designations } = useTeacherStore()
  const { isMobile, isTablet } = useWindowSize()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const { teacherCardsOrder, setTeacherCardsOrder } = useAppStore()

  const defaultCardIds = STATIC_OPTIONS.map((o) => o.id)

  const orderedCardIds = teacherCardsOrder.length > 0
    ? [...teacherCardsOrder.filter((id) => defaultCardIds.includes(id)), ...defaultCardIds.filter((id) => !teacherCardsOrder.includes(id))]
    : defaultCardIds

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === dropIdx) return
    const newOrder = [...orderedCardIds]
    const [removed] = newOrder.splice(draggedIdx, 1)
    newOrder.splice(dropIdx, 0, removed)
    setTeacherCardsOrder(newOrder)
    setDraggedIdx(null)
    setDragOverIdx(null)
  }, [draggedIdx, orderedCardIds, setTeacherCardsOrder])

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isLoading || !containerRef.current) return

    const cards = containerRef.current.querySelectorAll('.gsap-fade-up')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out',
      }
    )
  }, [isLoading])

  const activeTeachers = teachers.filter((t) => t.status === 'active').length
  const maleTeachers = teachers.filter((t) => t.gender === 'Male').length
  const femaleTeachers = teachers.filter((t) => t.gender === 'Female').length
  const totalSalary = teachers.reduce((sum, t) => sum + t.salary, 0)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const teachersThisMonth = teachers.filter((t) => t.createdAt.startsWith(currentMonth)).length

  const getStatForOpt = (opt: typeof STATIC_OPTIONS[number]) => {
    if (opt.id === 'add') return { statBn: `${toBnNum(teachersThisMonth)} জন এই মাসে`, statEn: `${teachersThisMonth} this month` }
    if (opt.id === 'all') return { statBn: `${toBnNum(teachers.length)} জন মোট`, statEn: `${teachers.length} total` }
    if (opt.id === 'departments') return { statBn: `${toBnNum(departments.length)}টি বিভাগ`, statEn: `${departments.length} departments` }
    if (opt.id === 'subjects') return { statBn: `${toBnNum(subjects.length)}টি বিষয়`, statEn: `${subjects.length} subjects` }
    if (opt.id === 'designations') return { statBn: `${toBnNum(designations.length)}টি পদবি`, statEn: `${designations.length} designations` }
    if (opt.id === 'bulk-update') return { statBn: `${toBnNum(teachers.length)} জন+ একসাথে`, statEn: `${teachers.length}+ at once` }
    return { statBn: '', statEn: '' }
  }

  const orderedOptions = orderedCardIds.map((id) => {
    const opt = STATIC_OPTIONS.find((o) => o.id === id)!
    return { ...opt, ...getStatForOpt(opt) }
  }).filter(Boolean)

  const statsData = [
    {
      labelBn: 'মোট',
      labelEn: 'Total',
      valueBn: toBnNum(teachers.length),
      valueEn: String(teachers.length),
      icon: Users,
      color: 'var(--brand)',
      bg: 'var(--brand-light)',
    },
    {
      labelBn: 'সক্রিয়',
      labelEn: 'Active',
      valueBn: toBnNum(activeTeachers),
      valueEn: String(activeTeachers),
      icon: UserCheck,
      color: 'var(--green)',
      bg: 'var(--green-light)',
    },
    {
      labelBn: 'পুরুষ/মহিলা',
      labelEn: 'M/F',
      valueBn: `${toBnNum(maleTeachers)}/${toBnNum(femaleTeachers)}`,
      valueEn: `${maleTeachers}/${femaleTeachers}`,
      icon: Users,
      color: 'var(--teal)',
      bg: 'var(--teal-light)',
    },
    {
      labelBn: 'বেতন',
      labelEn: 'Salary',
      valueBn: `৳${toBnNum(totalSalary)}`,
      valueEn: `৳${totalSalary.toLocaleString()}`,
      icon: Banknote,
      color: 'var(--amber)',
      bg: 'var(--amber-light)',
    },
  ]

  if (isLoading) {
    return <TeachersSkeleton />
  }

  return (
    <div ref={containerRef}>
      <div className="gsap-fade-up" style={{ marginBottom: isMobile ? '16px' : '1.25rem' }}>
        <h1
          style={{
            fontSize: isMobile ? '18px' : '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
          }}
        >
          {isBn ? 'শিক্ষক ব্যবস্থাপনা' : 'Teacher Management'}
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {isBn ? 'নিচের অপশন বেছে নিন' : 'Select an option below'}
        </p>
      </div>

      {/* Quick stats */}
      <div
        className="gsap-fade-up"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '8px' : '0.625rem',
          marginBottom: isMobile ? '16px' : '1.25rem',
        }}
      >
        {statsData.map((s) => {
          const IconComp = s.icon
          return (
            <div
              key={s.labelEn}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.625rem',
                padding: isMobile ? '12px' : '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '0.625rem',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-xs)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = s.color
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  width: isMobile ? '28px' : '2rem',
                  height: isMobile ? '28px' : '2rem',
                  borderRadius: '0.5rem',
                  background: s.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconComp size={isMobile ? 13 : 15} style={{ color: s.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? '16px' : '1.125rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {isBn ? s.valueBn : s.valueEn}
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{isBn ? s.labelBn : s.labelEn}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Section title */}
      <div
        className="gsap-fade-up"
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.0313rem',
          marginBottom: '0.625rem',
        }}
      >
        {isBn ? 'কী করতে চান?' : 'Quick Actions'}
      </div>

      {/* Option cards */}
      <div
        className="gsap-fade-up"
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '8px' : '0.75rem',
        }}
      >
        {orderedOptions.map((opt, idx) => {
          const IconComp = opt.icon
          const isDragging = draggedIdx === idx
          const isDragOver = dragOverIdx === idx
          return (
            <div
              key={opt.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => {
                if (draggedIdx !== null) return
                navigate(opt.path)
              }}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${isDragOver ? 'var(--brand)' : 'var(--border)'}`,
                borderRadius: '0.625rem',
                padding: isMobile ? '12px' : '1rem',
                cursor: 'grab',
                transition: 'all 0.15s ease',
                boxShadow: isDragOver ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'center' : 'flex-start',
                gap: isMobile ? '12px' : '0',
                opacity: isDragging ? 0.5 : 1,
                transform: isDragOver ? 'translateY(-2px)' : undefined,
              }}
              onMouseEnter={(e) => {
                if (draggedIdx !== null) return
                e.currentTarget.style.borderColor = opt.iconColor
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              }}
              onMouseLeave={(e) => {
                if (draggedIdx !== null) return
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
              }}
            >
              <div
                style={{
                  width: isMobile ? '44px' : '2.5rem',
                  height: isMobile ? '44px' : '2.5rem',
                  borderRadius: isMobile ? '12px' : '0.625rem',
                  background: opt.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginBottom: isMobile ? '0' : '0.625rem',
                  position: 'relative',
                }}
              >
                <IconComp size={isMobile ? 21 : 19} style={{ color: opt.iconColor }} />
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.6,
                  }}
                >
                  <GripVertical size={10} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: isMobile ? '13px' : '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: isMobile ? '2px' : '0.25rem',
                  }}
                >
                  {isBn ? opt.titleBn : opt.titleEn}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: isMobile ? '6px' : '0.5rem' }}>
                  {isBn ? opt.descBn : opt.descEn}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      color: opt.statColor,
                      fontWeight: 500,
                      background: `${opt.statColor}15`,
                      padding: '2px 6px',
                      borderRadius: '0.25rem',
                    }}
                  >
                    {isBn ? opt.statBn : opt.statEn}
                  </span>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
