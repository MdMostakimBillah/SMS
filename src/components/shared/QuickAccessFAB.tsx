import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { useBn } from '@/hooks/useBn'
import { useAppStore } from '@/store/appStore'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  Briefcase,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  FileText,
  User,
  BarChart2,
  FileBarChart,
  Receipt,
  Zap,
  X,
  type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  users: Users,
  'graduation-cap': GraduationCap,
  briefcase: Briefcase,
  'calendar-check': CalendarCheck,
  'clipboard-list': ClipboardList,
  'book-open': BookOpen,
  'file-text': FileText,
  user: User,
  'bar-chart-2': BarChart2,
  'file-bar-chart': FileBarChart,
  receipt: Receipt,
  'building-2': Building2,
  zap: Zap,
}

interface RouteItem {
  path: string
  label: string
  labelBn: string
  icon: string
}

const sectionRoutes: Record<string, RouteItem[]> = {
  teachers: [
    { path: '/teachers', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: 'layout-dashboard' },
    { path: '/teachers/all', label: 'All Teachers', labelBn: 'সকল শিক্ষক', icon: 'users' },
    { path: '/teachers/add', label: 'Add Teacher', labelBn: 'শিক্ষক যোগ', icon: 'user' },
    { path: '/teachers/departments', label: 'Departments', labelBn: 'বিভাগ', icon: 'building-2' },
    { path: '/teachers/subjects', label: 'Subjects', labelBn: 'বিষয়', icon: 'book-open' },
    { path: '/teachers/designations', label: 'Designations', labelBn: 'পদবি', icon: 'briefcase' },
    { path: '/teachers/bulk-update', label: 'Bulk Update', labelBn: 'বাল্ক আপডেট', icon: 'clipboard-list' },
  ],
  students: [
    { path: '/students', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: 'layout-dashboard' },
    { path: '/students/all', label: 'All Students', labelBn: 'সকল শিক্ষার্থী', icon: 'graduation-cap' },
    { path: '/students/admission', label: 'Admission', labelBn: 'ভর্তি', icon: 'user' },
    { path: '/students/update', label: 'Update', labelBn: 'আপডেট', icon: 'file-text' },
    { path: '/students/bulk-update', label: 'Bulk Update', labelBn: 'বাল্ক আপডেট', icon: 'clipboard-list' },
    { path: '/students/id-cards', label: 'ID Cards', labelBn: 'আইডি কার্ড', icon: 'receipt' },
    { path: '/students/promotion', label: 'Promotion', labelBn: 'প্রমোশন', icon: 'zap' },
  ],
  exams: [
    { path: '/exams', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: 'layout-dashboard' },
    { path: '/exams/planning', label: 'Planning', labelBn: 'পরিকল্পনা', icon: 'file-text' },
    { path: '/exams/scheduling', label: 'Scheduling', labelBn: 'সময়সূচী', icon: 'calendar-check' },
    { path: '/exams/evaluation', label: 'Evaluation', labelBn: 'মূল্যায়ন', icon: 'clipboard-list' },
    { path: '/exams/results', label: 'Results', labelBn: 'ফলাফল', icon: 'bar-chart-2' },
    { path: '/exams/marksheet', label: 'Marksheet', labelBn: 'মার্কশিট', icon: 'file-bar-chart' },
    { path: '/exams/omr', label: 'OMR Sheet', labelBn: 'ওএমআর শিট', icon: 'check-square' },
  ],
}

function getSectionForPath(pathname: string): { section: string; items: RouteItem[] } | null {
  for (const [section, items] of Object.entries(sectionRoutes)) {
    if (pathname.startsWith(`/${section}`)) {
      return { section, items }
    }
  }
  return null
}

export default function QuickAccessFAB() {
  const location = useLocation()
  const navigate = useNavigate()
  const isBn = useBn()
  const sidebarPosition = useAppStore((s) => s.sidebarPosition)
  const [isOpen, setIsOpen] = useState(false)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const context = useMemo(() => {
    const result = getSectionForPath(location.pathname)
    if (!result) return null
    const basePath = `/${result.section}`
    if (location.pathname === basePath || location.pathname === `${basePath}/`) return null
    const siblings = result.items.filter((item) => {
      if (location.pathname.startsWith(`${item.path}/`)) return false
      return location.pathname !== item.path
    })
    if (siblings.length === 0) return null
    return { section: result.section, items: siblings.slice(0, 8) }
  }, [location.pathname])

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const close = useCallback((navigateTo?: string) => {
    if (!isOpen) return
    tlRef.current?.kill()

    const tl = gsap.timeline({
      onComplete: () => {
        setIsOpen(false)
        if (navigateTo) navigate(navigateTo)
      },
    })
    tlRef.current = tl

    const items = Array.from(itemRefs.current.values())
    items.forEach((el, i) => {
      tl.to(el, {
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => { el.style.pointerEvents = 'none' },
      }, i * 0.02)
    })
  }, [isOpen, navigate])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      const container = wrapperRef.current
      if (container && !container.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, close])

  const isLeft = sidebarPosition === 'left'

  const open = useCallback(() => {
    if (!context) return
    setIsOpen(true)

    const tl = gsap.timeline()
    tlRef.current = tl

    const items = Array.from(itemRefs.current.values())
    const total = items.length
    const radius = 80

    items.forEach((el, i) => {
      // Arc angles based on sidebar position
      const startAngle = isLeft ? -Math.PI / 2 : 0          // -90° (up) or 0° (right)
      const endAngle = isLeft ? -Math.PI : -Math.PI / 2     // -180° (left) or -90° (up)
      const angle = startAngle + (i / Math.max(total - 1, 1)) * (endAngle - startAngle)
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      gsap.set(el, { x: 0, y: 0, scale: 0, opacity: 0 })
      tl.to(el, {
        x,
        y,
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: 'back.out(1.7)',
        onStart: () => { el.style.pointerEvents = 'auto' },
      }, 0.05 + i * 0.04)
    })
  }, [context, isLeft])

  const toggle = () => {
    if (isOpen) close()
    else open()
  }

  if (!context) return null

  return (
    <div
      ref={wrapperRef}
      className={`fixed bottom-6 z-[300] ${isLeft ? 'right-6' : 'left-6'}`}
      style={{ overflow: 'visible' }}
    >
      {/* Orbiting items */}
      {context.items.map((item, i) => {
        const Icon = iconMap[item.icon] || LayoutDashboard
        return (
          <div
            key={item.path}
            ref={(el) => { if (el) itemRefs.current.set(i, el) }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none"
            style={{ zIndex: 310 }}
          >
            <div
              className="flex flex-col items-center gap-1 group relative cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                close(item.path)
              }}
            >
              <div className="w-9 h-9 rounded-full bg-[var(--surface)] shadow-lg flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl transition-all duration-200 border border-[var(--border)]">
                <Icon size={16} className="text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors" />
              </div>
              {/* Tooltip */}
              <span className={`absolute -top-8 px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-[0.625rem] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg border border-[var(--border)] z-[320] ${isLeft ? 'right-full mr-2' : 'left-full ml-2'}`}>
                {isBn ? item.labelBn : item.label}
              </span>
            </div>
          </div>
        )
      })}

      {/* Center button */}
      <button
        className="w-10 h-10 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer relative"
        style={{ zIndex: 310 }}
        onClick={toggle}
        aria-label="Quick actions"
      >
        {isOpen ? (
          <X size={18} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <circle cx="3" cy="3" r="1.5" fill="white" />
            <circle cx="9" cy="3" r="1.5" fill="white" />
            <circle cx="15" cy="3" r="1.5" fill="white" />
            <circle cx="3" cy="9" r="1.5" fill="white" />
            <circle cx="9" cy="9" r="1.5" fill="white" />
            <circle cx="15" cy="9" r="1.5" fill="white" />
            <circle cx="3" cy="15" r="1.5" fill="white" />
            <circle cx="9" cy="15" r="1.5" fill="white" />
            <circle cx="15" cy="15" r="1.5" fill="white" />
          </svg>
        )}
      </button>
    </div>
  )
}
