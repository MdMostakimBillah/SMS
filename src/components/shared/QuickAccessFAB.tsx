import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

const BTN_SIZE = 48
const HALF = BTN_SIZE / 2

export default function QuickAccessFAB() {
  const location = useLocation()
  const navigate = useNavigate()
  const isBn = useBn()
  const sidebarPosition = useAppStore((s) => s.sidebarPosition)
  const isLeft = sidebarPosition === 'left'
  const [isOpen, setIsOpen] = useState(false)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

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

    if (overlayRef.current) {
      tl.to(overlayRef.current, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0)
    }
    if (ringRef.current) {
      tl.to(ringRef.current, { scale: 0.5, opacity: 0, duration: 0.25, ease: 'power2.in' }, 0)
    }

    const items = Array.from(itemRefs.current.values())
    items.forEach((el, i) => {
      tl.to(el, {
        scale: 0,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => { el.style.pointerEvents = 'none' },
      }, i * 0.015)
    })
  }, [isOpen, navigate])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, close])

  const open = useCallback(() => {
    if (!context) return
    setIsOpen(true)

    requestAnimationFrame(() => {
      const tl = gsap.timeline()
      tlRef.current = tl

      if (overlayRef.current) {
        gsap.set(overlayRef.current, { opacity: 0 })
        tl.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
      }

      if (ringRef.current) {
        gsap.set(ringRef.current, { scale: 0.5, opacity: 0 })
        tl.to(ringRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.4)' }, 0.05)
      }

      const items = Array.from(itemRefs.current.values())
      const total = items.length
      const orbitRadius = Math.min(window.innerWidth, window.innerHeight) * 0.25

      items.forEach((el, i) => {
        const angle = -Math.PI / 2 + (i / total) * Math.PI * 2
        const x = Math.cos(angle) * orbitRadius
        const y = Math.sin(angle) * orbitRadius

        gsap.set(el, { x: 0, y: 0, scale: 0, opacity: 0 })
        tl.to(el, {
          x,
          y,
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: 'back.out(1.7)',
          onStart: () => { el.style.pointerEvents = 'auto' },
        }, 0.08 + i * 0.035)
      })
    })
  }, [context])

  const toggle = () => {
    if (isOpen) close()
    else open()
  }

  if (!context) return null

  const orbitRadius = Math.min(window.innerWidth, window.innerHeight) * 0.25

  return (
    <>
      {/* Trigger button — fixed bottom-right */}
      <button
        className={`fixed bottom-6 z-[310] w-12 h-12 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer ${isLeft ? 'right-6' : 'left-6'}`}
        onClick={toggle}
        aria-label="Quick actions"
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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

      {/* Centered radial menu — portal */}
      {isOpen && createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[300] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === overlayRef.current) close()
          }}
        >
          {/* Circular track */}
          <div
            ref={ringRef}
            className="absolute rounded-full border border-[var(--brand)] opacity-30 pointer-events-none"
            style={{
              width: orbitRadius * 2,
              height: orbitRadius * 2,
              boxShadow: '0 0 30px rgba(var(--brand-rgb, 124,58,237), 0.15)',
            }}
          />

          {/* Center hub — close button */}
          <button
            className="absolute w-12 h-12 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] shadow-lg flex items-center justify-center z-[310] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
            onClick={() => close()}
          >
            <X size={22} className="text-[var(--text-muted)]" />
          </button>

          {/* Items */}
          {context.items.map((item, i) => {
            const Icon = iconMap[item.icon] || LayoutDashboard
            return (
              <div
                key={item.path}
                ref={(el) => { if (el) itemRefs.current.set(i, el) }}
                className="absolute opacity-0 pointer-events-none z-[310]"
                style={{ left: '50%', top: '50%', marginLeft: -HALF, marginTop: -HALF }}
              >
                <div
                  className="flex flex-col items-center gap-1.5 group relative cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    close(item.path)
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--surface)] shadow-lg flex items-center justify-center group-hover:scale-110 group-hover:shadow-xl transition-all duration-200 border border-[var(--border)]">
                    <Icon size={20} className="text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors" />
                  </div>
                  <span
                    className="absolute left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-[0.625rem] whitespace-nowrap opacity-100 pointer-events-none shadow-lg border border-[var(--border)] z-[320]"
                    style={{ top: '100%', marginTop: '0.375rem' }}
                  >
                    {isBn ? item.labelBn : item.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}
