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
    <div className="relative px-3 sm:px-5 w-full overflow-hidden">
      <div
        ref={stripRef}
        onScroll={handleStripScroll}
        className="relative flex items-center gap-1 overflow-x-auto scrollbar-hide w-full touch-pan-x scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Sliding underline indicator */}
        <div
          ref={sliderRef}
          className="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-[var(--brand)] [transition:width_240ms_ease-out,transform_240ms_ease-out] z-10"
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
              className={`relative z-10 min-w-max flex items-center gap-1.5 py-3 px-3 border-none bg-transparent cursor-pointer text-xs sm:text-[0.8125rem] font-[inherit] transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-[var(--text-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
            >
              <Icon
                size={14}
                className={`shrink-0 ${
                  isActive ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'
                }`}
              />
              <span>{isBn ? tab.labelBn : tab.labelEn}</span>
              {badge > 0 && (
                <span
                  aria-hidden="true"
                  className={`px-1.5 py-0.5 rounded-full text-[0.6875rem] leading-none font-medium tabular-nums ${
                    isActive
                      ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Edge fade hints on mobile overflow */}
      {!stripAtStart && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 bottom-0 w-6 z-20 sm:hidden"
          style={{ background: 'linear-gradient(to right, var(--surface), transparent)' }}
        />
      )}
      {!stripAtEnd && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-6 z-20 sm:hidden"
          style={{ background: 'linear-gradient(to left, var(--surface), transparent)' }}
        />
      )}
    </div>
  )
})
