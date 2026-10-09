import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Users,
  Building2,
  BookOpen,
  UserCheck,
  Banknote,
  Layers,
  Briefcase,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useShallow } from 'zustand/shallow'
import { useTeacherStore } from '@/store/teacherStore'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAppStore } from '@/store/appStore'
import { useNavPath } from '@/hooks/useNavPath'
import { usePermission } from '@/hooks/usePermission'
import { QuickAccessGrid } from '@/components/shared/QuickAccessGrid'

import gsap from 'gsap'

const STATIC_OPTIONS = [
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

import { toBnNum } from '@/lib/i18n'

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
  const nav = useNavPath()
  const isBn = useBn()
  const { teachers, departments, subjects, designations } = useTeacherStore(
    useShallow((s) => ({
      teachers: s.teachers,
      departments: s.departments,
      subjects: s.subjects,
      designations: s.designations,
    }))
  )
  const { isMobile, isTablet } = useWindowSize()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { teacherCardsOrder, setTeacherCardsOrder } = useAppStore()
  const { canCreate, canEdit, canView } = usePermission()

  const defaultCardIds = STATIC_OPTIONS.map((o) => o.id)

  const orderedCardIds = teacherCardsOrder.length > 0
    ? [...teacherCardsOrder.filter((id) => defaultCardIds.includes(id)), ...defaultCardIds.filter((id) => !teacherCardsOrder.includes(id))]
    : defaultCardIds

  const handleReorder = useCallback((from: number, to: number) => {
    const newOrder = [...orderedCardIds]
    const [removed] = newOrder.splice(from, 1)
    newOrder.splice(to, 0, removed)
    setTeacherCardsOrder(newOrder)
  }, [orderedCardIds, setTeacherCardsOrder])

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
    if (opt.id === 'add') return { valueBn: toBnNum(teachersThisMonth), valueEn: String(teachersThisMonth), statBn: `${toBnNum(teachersThisMonth)} জন এই মাসে`, statEn: `${teachersThisMonth} added this month` }
    if (opt.id === 'all') return { valueBn: toBnNum(teachers.length), valueEn: String(teachers.length), statBn: `${toBnNum(teachers.length)} জন মোট`, statEn: `${teachers.length} total` }
    if (opt.id === 'departments') return { valueBn: toBnNum(departments.length), valueEn: String(departments.length), statBn: `${toBnNum(departments.length)}টি বিভাগ`, statEn: `${departments.length} departments` }
    if (opt.id === 'subjects') return { valueBn: toBnNum(subjects.length), valueEn: String(subjects.length), statBn: `${toBnNum(subjects.length)}টি বিষয়`, statEn: `${subjects.length} subjects` }
    if (opt.id === 'designations') return { valueBn: toBnNum(designations.length), valueEn: String(designations.length), statBn: `${toBnNum(designations.length)}টি পদবি`, statEn: `${designations.length} designations` }
    if (opt.id === 'bulk-update') return { valueBn: toBnNum(teachers.length), valueEn: String(teachers.length), statBn: `${toBnNum(teachers.length)} জন+ একসাথে`, statEn: `${teachers.length}+ at once` }
    return { valueBn: '0', valueEn: '0', statBn: '', statEn: '' }
  }

  const orderedOptions = orderedCardIds.map((id) => {
    const opt = STATIC_OPTIONS.find((o) => o.id === id)!
    return { ...opt, ...getStatForOpt(opt) }
  }).filter(Boolean).filter((opt) => {
    if (opt.id === 'add') return canCreate('teachers.add')
    if (opt.id === 'all') return canView('teachers.all')
    if (opt.id === 'departments') return canCreate('teachers.departments')
    if (opt.id === 'subjects') return canCreate('teachers.subjects')
    if (opt.id === 'designations') return canCreate('teachers.designations')
    if (opt.id === 'bulk-update') return canEdit('teachers.bulk-update')
    return true
  })

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
              className="glass"
              style={{
                borderRadius: '0.75rem',
                padding: isMobile ? '12px' : '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '8px' : '0.625rem',
                transition: 'all 0.2s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
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
      <QuickAccessGrid
        items={orderedOptions}
        isBn={isBn}
        isMobile={isMobile}
        isTablet={isTablet}
        actionId="add"
        onSelect={(id) => {
          const opt = orderedOptions.find((o) => o.id === id)
          if (opt) navigate(nav(opt.path))
        }}
        onReorder={handleReorder}
      />
    </div>
  )
}
