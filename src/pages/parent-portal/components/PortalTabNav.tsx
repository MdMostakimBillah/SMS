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

export const PORTAL_TABS: Array<{
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
}

export const PortalTabNav = React.memo(function PortalTabNav({
  activeTab,
  onSelectTab,
  isBn,
}: PortalTabNavProps) {
  const [stripAtStart, setStripAtStart] = useState(true)
  const [stripAtEnd, setStripAtEnd] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleStripScroll = useCallback(() => {
    const el = stripRef.current
    if (!el) return
    const atStart = el.scrollLeft <= 2
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
    setStripAtStart(atStart)
    setStripAtEnd(atEnd)
  }, [])

  useTabSlider({ activeTab, tabRefs, sliderRef })

  return (
    <div className="relative glass rounded-xl mt-3 mb-3 w-full overflow-hidden">
      <div
        ref={stripRef}
        onScroll={handleStripScroll}
        className="relative flex gap-[0.375rem] p-[0.3125rem] rounded-[inherit] overflow-x-auto scrollbar-hide w-full touch-pan-x scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* HR-Style Sliding indicator */}
        <div
          ref={sliderRef}
          className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out] z-0"
          style={{
            background: 'var(--brand)',
            boxShadow: 'var(--shadow-sm)',
          }}
        />

        {PORTAL_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el)
                else tabRefs.current.delete(tab.id)
              }}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`relative z-10 flex-1 min-w-max flex items-center justify-center gap-[0.375rem] py-2 px-3 sm:px-3.5 rounded-[0.5625rem] border-none cursor-pointer text-[0.75rem] sm:text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${
                isActive
                  ? 'text-white font-semibold'
                  : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              style={{ background: 'transparent' }}
            >
              <Icon size={14} className="shrink-0" />
              <span>{isBn ? tab.labelBn : tab.labelEn}</span>
            </button>
          )
        })}
      </div>

      {/* Left-edge fade */}
      {!stripAtStart && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--bg-tertiary)] to-transparent z-20"
        />
      )}
      {/* Right-edge fade */}
      {!stripAtEnd && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--bg-tertiary)] to-transparent z-20"
        />
      )}
    </div>
  )
})
