import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, User, UserPen, TableProperties, IdCard, ArrowUpCircle, ArrowRight } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useSessionStudents } from '@/store/admissionStore'
import { useAppStore } from '@/store/appStore'
import type { LucideIcon } from 'lucide-react'
import gsap from 'gsap'

function toBnNum(n: number): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n).replace(/\d/g, (d) => bn[+d])
}

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
  const { isMobile, isTablet } = useWindowSize()
  const students = useSessionStudents()
  const isBn = useBn()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const { studentCardsOrder, setStudentCardsOrder } = useAppStore()

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
    if (opt.id === 'admission') return { statBn: `${toBnNum(admissionThisMonth)} জন এই মাসে`, statEn: `${admissionThisMonth} this month` }
    if (opt.id === 'all') return { statBn: `${toBnNum(allStudentsCount)} জন`, statEn: `${allStudentsCount} total` }
    if (opt.id === 'update') return { statBn: `${toBnNum(pendingStudents)} টি অপেক্ষমান`, statEn: `${pendingStudents} pending` }
    if (opt.id === 'bulk-update') return { statBn: 'CSV সাপোর্ট', statEn: 'CSV supported' }
    if (opt.id === 'id-cards') return { statBn: `${toBnNum(allStudentsCount)} জন`, statEn: `${allStudentsCount} students` }
    if (opt.id === 'promotion') return { statBn: 'পরীক্ষার পরে', statEn: 'After exams' }
    return { statBn: '', statEn: '' }
  }

  const orderedOptions = orderedCardIds.map((id) => {
    const opt = STATIC_OPTIONS.find((o) => o.id === id)!
    return { ...opt, ...getStatForOpt(opt) }
  }).filter(Boolean)

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
    setStudentCardsOrder(newOrder)
    setDraggedIdx(null)
    setDragOverIdx(null)
  }, [draggedIdx, orderedCardIds, setStudentCardsOrder])

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }, [])

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

      <div
        className={`gsap-fade-up grid ${isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-2' : 'grid-cols-3'} ${isMobile ? 'gap-2' : 'gap-3'}`}
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
              className={`glass rounded-[0.75rem] cursor-grab transition-all duration-200 flex ${isMobile ? 'flex-row items-center gap-3' : 'flex-col items-start gap-0'} ${isMobile ? 'p-3' : 'p-4'} ${isDragOver ? '!border-[var(--brand)] shadow-[0_8px_32px_rgba(0,0,0,0.12)]' : ''} ${isDragging ? 'opacity-50' : ''}`}
              style={{ transform: isDragOver ? 'translateY(-2px)' : undefined }}
              onMouseEnter={(e) => {
                if (draggedIdx !== null) return
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
              }}
              onMouseLeave={(e) => {
                if (draggedIdx !== null) return
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                className={`rounded-[0.625rem] flex items-center justify-center flex-shrink-0 ${isMobile ? 'w-[2.75rem] h-[2.75rem] rounded-xl mb-0' : 'w-10 h-10 mb-[0.625rem]'}`}
                style={{ background: opt.iconBg }}
              >
                <IconComp size={isMobile ? 21 : 19} style={{ color: opt.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[var(--text-primary)] font-semibold ${isMobile ? 'text-[0.8125rem] mb-[0.125rem]' : 'text-sm mb-1'}`}>
                  {isBn ? opt.titleBn : opt.titleEn}
                </div>
                <div className={`text-[0.6875rem] text-[var(--text-secondary)] leading-[1.5] ${isMobile ? 'mb-1.5' : 'mb-2'}`}>
                  {isBn ? opt.descBn : opt.descEn}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-[0.625rem] font-medium rounded px-1.5 py-0.5"
                    style={{ color: opt.statColor, background: `${opt.statColor}15` }}
                  >
                    {isBn ? opt.statBn : opt.statEn}
                  </span>
                  <ArrowRight size={14} className="text-[var(--text-muted)]" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
