import React, { useState, useRef, useCallback } from 'react'
import {
  LayoutDashboard,
  CalendarCheck,
  GraduationCap,
  CreditCard,
  BookOpen,
  MessageSquare,
  UserCheck,
} from 'lucide-react'
import { useTabSlider } from '@/hooks/useTabSlider'
import type { PortalTab } from '../types'

const PORTAL_TABS: Array<{
  id: PortalTab
  labelEn: string
  labelBn: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}> = [
  { id: 'overview', labelEn: 'Overview', labelBn: 'একনজরে', icon: LayoutDashboard },
  { id: 'attendance', labelEn: 'Attendance', labelBn: 'উপস্থিতি', icon: CalendarCheck },
  { id: 'academics', labelEn: 'Academics & Results', labelBn: 'ফলাফল ও পরীক্ষা', icon: GraduationCap },
  { id: 'fees', labelEn: 'Fees & Payments', labelBn: 'ফি ও পেমেন্ট', icon: CreditCard },
  { id: 'homework', labelEn: 'Homework & Diary', labelBn: 'হোমওয়ার্ক ও ডায়েরি', icon: BookOpen },
  { id: 'communication', labelEn: 'Notice & Teachers', labelBn: 'যোগাযোগ ও নোটিশ', icon: MessageSquare },
  { id: 'profile', labelEn: 'Student Profile', labelBn: 'শিক্ষার্থী প্রোফাইল', icon: UserCheck },
]

interface PortalTabNavProps {
  activeTab: PortalTab
  onSelectTab: (tab: PortalTab) => void
  isBn: boolean
  dueFeesCount?: number
  pendingHwCount?: number
  noticeCount?: number
}

export const PortalTabNav = React.memo(function PortalTabNav({
  activeTab,
  onSelectTab,
  isBn,
  dueFeesCount = 0,
  pendingHwCount = 0,
  noticeCount = 0,
}: PortalTabNavProps) {
  const [stripAtStart, setStripAtStart] = useState(true)
  const [stripAtEnd, setStripAtEnd] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleStripScroll = useCallback(() => {
    const el = stripRef.current
    if (!el) return
    setStripAtStart(el.scrollLeft <= 2)
    setStripAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2)
  }, [])

  useTabSlider({ activeTab, tabRefs, sliderRef, scrollIntoView: true })

  const getBadge = (tabId: PortalTab): number => {
    if (tabId === 'fees') return dueFeesCount
    if (tabId === 'homework') return pendingHwCount
    if (tabId === 'communication') return noticeCount
    return 0
  }

  return (
    <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs w-full overflow-hidden">
      <div
        ref={stripRef}
        onScroll={handleStripScroll}
        className="relative flex gap-1.5 p-1.5 rounded-[inherit] overflow-x-auto scrollbar-hide w-full touch-pan-x scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Sliding active indicator */}
        <div
          ref={sliderRef}
          className="absolute top-1.5 bottom-1.5 rounded-xl [transition:width_280ms_ease-out,transform_280ms_ease-out,background-color_280ms_ease-out] z-0"
          style={{
            background: 'var(--brand)',
            boxShadow: 'var(--shadow-sm)',
          }}
        />

        {PORTAL_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const badge = getBadge(tab.id)
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el)
                else tabRefs.current.delete(tab.id)
              }}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative z-10 flex-1 min-w-max flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl border-none cursor-pointer text-xs sm:text-[0.8125rem] font-[inherit] transition-colors duration-200 whitespace-nowrap ${
                isActive
                  ? 'text-white font-semibold'
                  : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
              style={{ background: 'transparent' }}
            >
              <Icon size={15} className="shrink-0" />
              <span>{isBn ? tab.labelBn : tab.labelEn}</span>
              {badge > 0 && (
                <span
                  aria-hidden="true"
                  className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[0.6875rem] leading-none font-semibold tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.id === 'fees'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-[var(--brand-light)] text-[var(--brand)]'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Left-edge fade */}
      {!stripAtStart && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-[var(--surface)] to-transparent z-20"
        />
      )}
      {/* Right-edge fade */}
      {!stripAtEnd && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-[var(--surface)] to-transparent z-20"
        />
      )}
    </div>
  )
})
