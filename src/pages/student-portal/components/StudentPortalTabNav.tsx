import React, { useRef } from 'react'
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  CreditCard,
  UserCheck,
} from 'lucide-react'
import { useTabSlider } from '@/hooks/useTabSlider'
import type { StudentPortalTab } from '../types'

export const STUDENT_PORTAL_TABS: Array<{
  id: StudentPortalTab
  labelEn: string
  labelBn: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}> = [
  { id: 'overview', labelEn: 'Overview', labelBn: 'একনজরে', icon: LayoutDashboard },
  { id: 'routine', labelEn: 'Class Routine', labelBn: 'ক্লাস রুটিন', icon: Calendar },
  { id: 'academics', labelEn: 'Results & Grades', labelBn: 'ফলাফল ও গ্রেড', icon: GraduationCap },
  { id: 'homework', labelEn: 'Homework', labelBn: 'হোমওয়ার্ক', icon: BookOpen },
  { id: 'attendance', labelEn: 'Attendance', labelBn: 'উপস্থিতি', icon: CalendarCheck },
  { id: 'fees', labelEn: 'Fees & Payments', labelBn: 'ফি ও পেমেন্ট', icon: CreditCard },
  { id: 'profile', labelEn: 'My Profile', labelBn: 'আমার প্রোফাইল', icon: UserCheck },
]

interface StudentPortalTabNavProps {
  activeTab: StudentPortalTab
  onSelectTab: (tab: StudentPortalTab) => void
  isBn: boolean
}

export const StudentPortalTabNav = React.memo(function StudentPortalTabNav({
  activeTab,
  onSelectTab,
  isBn,
}: StudentPortalTabNavProps) {
  const stripRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({ activeTab, tabRefs, sliderRef })

  return (
    <div className="relative glass rounded-xl mb-3 w-full overflow-hidden">
      <div
        ref={stripRef}
        className="relative flex gap-[0.375rem] p-[0.3125rem] rounded-[inherit] overflow-x-auto scrollbar-hide w-full"
      >
        {/* Sliding indicator */}
        <div
          ref={sliderRef}
          className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out] z-0"
          style={{
            background: 'var(--brand)',
            boxShadow: 'var(--shadow-sm)',
          }}
        />

        {STUDENT_PORTAL_TABS.map((tab) => {
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
              className={`relative z-10 flex-1 min-w-max flex items-center justify-center gap-[0.375rem] py-2 px-3 sm:px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${
                isActive
                  ? 'text-white'
                  : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={16} />
              <span>{isBn ? tab.labelBn : tab.labelEn}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
})
