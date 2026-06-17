import { useEffect, useRef, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Users,
  Building2,
  BookOpen,
  ClipboardCheck,
  Wallet,
  Layers,
  Briefcase,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTeacherStore } from '@/store/teacherStore'
import gsap from 'gsap'

const QUICK_ACTIONS = [
  { id: 'add', path: '/teachers/add', icon: UserPlus, color: 'var(--teal)', bg: 'var(--teal-light)', titleBn: 'নতুন শিক্ষক', titleEn: 'Add Teacher' },
  { id: 'all', path: '/teachers/all', icon: Users, color: 'var(--brand)', bg: 'var(--brand-light)', titleBn: 'সকল শিক্ষক', titleEn: 'All Teachers' },
  { id: 'departments', path: '/teachers/departments', icon: Building2, color: 'var(--amber)', bg: 'var(--amber-light)', titleBn: 'বিভাগ', titleEn: 'Departments' },
  { id: 'subjects', path: '/teachers/subjects', icon: BookOpen, color: 'var(--green)', bg: 'var(--green-light)', titleBn: 'বিষয়', titleEn: 'Subjects' },
  { id: 'designations', path: '/teachers/designations', icon: Briefcase, color: 'var(--purple)', bg: 'var(--purple-light)', titleBn: 'পদবি', titleEn: 'Designations' },
  { id: 'bulk-update', path: '/teachers/bulk-update', icon: Layers, color: 'var(--purple)', bg: 'var(--purple-light)', titleBn: 'বাল্ক আপডেট', titleEn: 'Bulk Update' },
  { id: 'attendance', path: '/attendance', icon: ClipboardCheck, color: 'var(--red)', bg: 'var(--red-light)', titleBn: 'উপস্থিতি', titleEn: 'Attendance' },
  { id: 'payroll', path: '/payroll', icon: Wallet, color: 'var(--purple)', bg: 'var(--purple-light)', titleBn: 'বেতন', titleEn: 'Payroll' },
]

export default function TeacherLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isBn = useBn()
  const { teachers, departments, subjects, designations } = useTeacherStore()
  const barRef = useRef<HTMLDivElement>(null)
  const prevPath = useRef(location.pathname)

  const isDashboard = location.pathname === '/teachers'

  const currentId = useMemo(() => {
    const path = location.pathname
    if (path === '/teachers/add') return 'add'
    if (path === '/teachers/all') return 'all'
    if (path === '/teachers/departments') return 'departments'
    if (path === '/teachers/subjects') return 'subjects'
    if (path === '/teachers/designations') return 'designations'
    if (path === '/teachers/bulk-update') return 'bulk-update'
    if (path === '/attendance') return 'attendance'
    if (path === '/payroll') return 'payroll'
    return ''
  }, [location.pathname])

  const getStat = (id: string) => {
    switch (id) {
      case 'add': return `${teachers.filter((t) => t.createdAt.startsWith(new Date().toISOString().slice(0, 7))).length}`
      case 'all': return `${teachers.length}`
      case 'departments': return `${departments.length}`
      case 'subjects': return `${subjects.length}`
      case 'designations': return `${designations.length}`
      case 'bulk-update': return `${teachers.length}+`
      default: return ''
    }
  }

  useEffect(() => {
    if (isDashboard || !barRef.current) return
    const cards = barRef.current.querySelectorAll('.teacher-compact-card')
    if (prevPath.current === '/teachers' || prevPath.current === '') {
      gsap.fromTo(cards, { opacity: 0, y: -8, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.03, ease: 'power2.out' })
    } else {
      gsap.fromTo(cards, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.02, ease: 'power2.out' })
    }
    prevPath.current = location.pathname
  }, [isDashboard, location.pathname])

  return (
    <div>
      {!isDashboard && (
        <div ref={barRef} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.0313rem' }}>
              {isBn ? 'কী করতে চান?' : 'Quick Actions'}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {QUICK_ACTIONS.map((opt) => {
              const IconComp = opt.icon
              const isActive = currentId === opt.id
              const stat = getStat(opt.id)
              return (
                <div
                  key={opt.id}
                  className="teacher-compact-card"
                  onClick={() => navigate(opt.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: `1.5px solid ${isActive ? opt.color : 'var(--border)'}`,
                    background: isActive ? `${opt.color}10` : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                    boxShadow: isActive ? `0 0 0 1px ${opt.color}20` : 'var(--shadow-xs)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = opt.color
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  <div style={{
                    width: '1.75rem', height: '1.75rem', borderRadius: '0.375rem',
                    background: isActive ? opt.color : opt.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <IconComp size={12} style={{ color: isActive ? '#fff' : opt.color }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: isActive ? 600 : 500, color: isActive ? opt.color : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {isBn ? opt.titleBn : opt.titleEn}
                    </div>
                    {stat && (
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{stat}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <Outlet />
    </div>
  )
}
