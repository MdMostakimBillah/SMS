import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, User, UserPen, TableProperties, IdCard, ArrowUpCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useNavPath } from '@/hooks/useNavPath'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useSessionStudents } from '@/store/admissionStore'
import { useAppStore } from '@/store/appStore'
import { usePermission } from '@/hooks/usePermission'
import { QuickAccessGrid } from '@/components/shared/QuickAccessGrid'
import type { LucideIcon } from 'lucide-react'
import gsap from 'gsap'
import { toBnNum } from '@/lib/i18n'

function StudentsSkeleton() {
  return (
    <div>
      <div className="skeleton skeleton-title w-[11.25rem] mb-4" />
      <div className="skeleton skeleton-text w-[8.75rem] mb-5" />

      <div className="grid grid-cols-4 gap-[0.625rem] mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="flex items-center gap-[0.625rem]">
              <div className="skeleton skeleton-circle w-8 h-8" />
              <div>
                <div className="skeleton w-[3.125rem] h-[1.125rem] mb-1" />
                <div className="skeleton skeleton-text w-[2.5rem] h-[0.625rem]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="skeleton w-[6.25rem] h-[0.75rem] mb-3" />

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-circle w-10 h-10 mb-[0.625rem]" />
            <div className="skeleton w-[5rem] h-[0.875rem] mb-1.5" />
            <div className="skeleton skeleton-text w-full" />
            <div className="skeleton skeleton-text w-[3.75rem] h-[0.625rem]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const nav = useNavPath()
  const { isMobile, isTablet } = useWindowSize()
  const students = useSessionStudents()
  const isBn = useBn()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { studentCardsOrder, setStudentCardsOrder } = useAppStore()
  const { canRead } = usePermission()

  const approvedStudents = students.filter((s) => s.status === 'approved' && s.active !== false)
  const totalStudents = approvedStudents.length
  const maleStudents = approvedStudents.filter((s) => s.gender.includes('Male')).length
  const femaleStudents = approvedStudents.filter((s) => s.gender.includes('Female')).length
  const currentMonth = new Date().toISOString().slice(0, 7)
  const newStudents = approvedStudents.filter((s) => s.admissionDate?.startsWith(currentMonth)).length

  // Dynamic stats for options
  const admissionThisMonth = newStudents
  const allStudentsCount = totalStudents
  const pendingStudents = students.filter((s) => s.status === 'pending').length

  const STATIC_OPTIONS: {
    id: string
    path: string
    icon: LucideIcon
    iconColor: string
    iconBg: string
    titleBn: string
    titleEn: string
    descBn: string
    descEn: string
    statColor: string
  }[] = [
    {
      id: 'all',
      path: '/students/all',
      icon: Users,
      iconColor: 'var(--brand)',
      iconBg: 'var(--brand-light)',
      titleBn: 'সকল ছাত্র',
      titleEn: 'All Students',
      descBn: 'সকল ছাত্রের তালিকা।',
      descEn: 'View all students.',
      statColor: 'var(--brand)',
    },
    {
      id: 'admission',
      path: '/students/admission',
      icon: UserPlus,
      iconColor: 'var(--teal)',
      iconBg: 'var(--teal-light)',
      titleBn: 'নতুন ভর্তি',
      titleEn: 'New Admission',
      descBn: 'নতুন ছাত্র ভর্তি করুন।',
      descEn: 'Admit a new student.',
      statColor: 'var(--teal)',
    },
    {
      id: 'update',
      path: '/students/update',
      icon: UserPen,
      iconColor: 'var(--amber)',
      iconBg: 'var(--amber-light)',
      titleBn: 'তথ্য আপডেট',
      titleEn: 'Update Student',
      descBn: 'ছাত্রের তথ্য আপডেট করুন।',
      descEn: 'Update student info.',
      statColor: 'var(--amber)',
    },
    {
      id: 'bulk-update',
      path: '/students/bulk-update',
      icon: TableProperties,
      iconColor: 'var(--green)',
      iconBg: 'var(--green-light)',
      titleBn: 'বাল্ক আপডেট',
      titleEn: 'Bulk Update',
      descBn: 'একসাথে আপডেট করুন।',
      descEn: 'Update at once.',
      statColor: 'var(--green)',
    },
    {
      id: 'id-cards',
      path: '/students/id-cards',
      icon: IdCard,
      iconColor: 'var(--purple)',
      iconBg: 'var(--purple-light)',
      titleBn: 'ID কার্ড',
      titleEn: 'ID Cards',
      descBn: 'ID কার্ড তৈরি করুন।',
      descEn: 'Generate ID cards.',
      statColor: 'var(--purple)',
    },
    {
      id: 'promotion',
      path: '/students/promotion',
      icon: ArrowUpCircle,
      iconColor: 'var(--red)',
      iconBg: 'var(--red-light)',
      titleBn: 'প্রমোশন',
      titleEn: 'Promotion',
      descBn: 'পরবর্তী ক্লাসে প্রমোট করুন।',
      descEn: 'Promote to next class.',
      statColor: 'var(--red)',
    },
  ]

  const defaultCardIds = STATIC_OPTIONS.map((o) => o.id)

  const orderedCardIds = studentCardsOrder.length > 0
    ? [...studentCardsOrder.filter((id) => defaultCardIds.includes(id)), ...defaultCardIds.filter((id) => !studentCardsOrder.includes(id))]
    : defaultCardIds

  const getStatForOpt = (opt: typeof STATIC_OPTIONS[number]) => {
    if (opt.id === 'admission') return { valueBn: toBnNum(admissionThisMonth), valueEn: String(admissionThisMonth), statBn: `${toBnNum(admissionThisMonth)} জন এই মাসে`, statEn: `${admissionThisMonth} added this month` }
    if (opt.id === 'all') return { valueBn: toBnNum(allStudentsCount), valueEn: String(allStudentsCount), statBn: `${toBnNum(allStudentsCount)} জন`, statEn: `${allStudentsCount} total` }
    if (opt.id === 'update') return { valueBn: toBnNum(pendingStudents), valueEn: String(pendingStudents), statBn: `${toBnNum(pendingStudents)} টি অপেক্ষমান`, statEn: `${pendingStudents} pending` }
    if (opt.id === 'bulk-update') return { valueBn: toBnNum(allStudentsCount), valueEn: String(allStudentsCount), statBn: 'CSV সাপোর্ট', statEn: 'CSV supported' }
    if (opt.id === 'id-cards') return { valueBn: toBnNum(allStudentsCount), valueEn: String(allStudentsCount), statBn: `${toBnNum(allStudentsCount)} জন`, statEn: `${allStudentsCount} students` }
    if (opt.id === 'promotion') return { valueBn: toBnNum(allStudentsCount), valueEn: String(allStudentsCount), statBn: 'পরীক্ষার পরে', statEn: 'After exams' }
    return { valueBn: '0', valueEn: '0', statBn: '', statEn: '' }
  }

  const orderedOptions = orderedCardIds.map((id) => {
    const opt = STATIC_OPTIONS.find((o) => o.id === id)!
    return { ...opt, ...getStatForOpt(opt) }
  }).filter(Boolean).filter((opt) => canRead('students', opt.id))

  const handleReorder = useCallback((from: number, to: number) => {
    const newOrder = [...orderedCardIds]
    const [removed] = newOrder.splice(from, 1)
    newOrder.splice(to, 0, removed)
    setStudentCardsOrder(newOrder)
  }, [orderedCardIds, setStudentCardsOrder])

  const statsData = [
    {
      labelBn: 'মোট',
      labelEn: 'Total',
      valueBn: toBnNum(totalStudents),
      valueEn: String(totalStudents),
      icon: Users,
      color: 'var(--brand)',
      bg: 'var(--brand-light)',
    },
    {
      labelBn: 'ছেলে',
      labelEn: 'Male',
      valueBn: toBnNum(maleStudents),
      valueEn: String(maleStudents),
      icon: User,
      color: 'var(--teal)',
      bg: 'var(--teal-light)',
    },
    {
      labelBn: 'মেয়ে',
      labelEn: 'Female',
      valueBn: toBnNum(femaleStudents),
      valueEn: String(femaleStudents),
      icon: User,
      color: 'var(--purple)',
      bg: 'var(--purple-light)',
    },
    {
      labelBn: 'নতুন',
      labelEn: 'New',
      valueBn: toBnNum(newStudents),
      valueEn: String(newStudents),
      icon: UserPlus,
      color: 'var(--green)',
      bg: 'var(--green-light)',
    },
  ]

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

  if (isLoading) {
    return <StudentsSkeleton />
  }

  return (
    <div ref={containerRef}>
      <div className={`gsap-fade-up ${isMobile ? 'mb-4' : 'mb-5'}`}>
        <h1 className={`text-[var(--text-primary)] font-semibold tracking-[-0.3px] ${isMobile ? 'text-lg' : 'text-xl'}`}>
          {isBn ? 'ছাত্র ব্যবস্থাপনা' : 'Student Management'}
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">{isBn ? 'নিচের অপশন বেছে নিন' : 'Select an option below'}</p>
      </div>

      <div
        className={`gsap-fade-up grid ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} ${isMobile ? 'gap-2' : 'gap-[0.625rem]'} ${isMobile ? 'mb-4' : 'mb-5'}`}
      >
        {statsData.map((s) => {
          const IconComp = s.icon
          return (
            <div
              key={s.labelEn}
              className={`glass rounded-[0.75rem] flex items-center ${isMobile ? 'gap-2' : 'gap-[0.625rem]'} cursor-default transition-all duration-200 ${isMobile ? 'p-3' : 'p-[0.875rem]'}`}
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
                className={`rounded-lg flex items-center justify-center flex-shrink-0 ${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`}
                style={{ background: s.bg }}
              >
                <IconComp size={isMobile ? 13 : 15} style={{ color: s.color }} />
              </div>
              <div className="min-w-0">
                <div className={`text-[var(--text-primary)] leading-none font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>
                  {isBn ? s.valueBn : s.valueEn}
                </div>
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem]">{isBn ? s.labelBn : s.labelEn}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="gsap-fade-up text-xs font-semibold text-[var(--text-muted)] uppercase tracking-[0.0313rem] mb-[0.625rem]">
        {isBn ? 'কী করতে চান?' : 'Quick Actions'}
      </div>

      <QuickAccessGrid
        items={orderedOptions}
        isBn={isBn}
        isMobile={isMobile}
        isTablet={isTablet}
        actionId="admission"
        onSelect={(id) => {
          const opt = orderedOptions.find((o) => o.id === id)
          if (opt) navigate(nav(opt.path))
        }}
        onReorder={handleReorder}
      />
    </div>
  )
}
