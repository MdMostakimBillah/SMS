import React from 'react'
import {
  CheckCircle2,
  CreditCard,
  Award,
  BookOpen,
} from 'lucide-react'
import type { FeeItem, HomeworkItem } from '../../types'

interface OverviewKpiCardsProps {
  fees: FeeItem[]
  homeworkList: HomeworkItem[]
  onNavigateTab: (tab: any) => void
  onOpenPayModal: () => void
  isBn: boolean
}

export const OverviewKpiCards = React.memo(function OverviewKpiCards({
  fees,
  homeworkList,
  onNavigateTab,
  onOpenPayModal: _onOpenPayModal,
  isBn,
}: OverviewKpiCardsProps) {
  const totalDue = fees.reduce((acc, f) => acc + f.due, 0)
  const pendingHw = homeworkList.filter((h) => h.status === 'pending').length

  const cards = [
    {
      id: 'attendance',
      labelBn: 'মাসিক উপস্থিতি হার',
      labelEn: 'Monthly Attendance',
      value: '94.5%',
      icon: <CheckCircle2 size={16} />,
      tab: 'attendance',
    },
    {
      id: 'fees',
      labelBn: 'মোট বকেয়া ফি',
      labelEn: 'Total Fee Dues',
      value: `৳${totalDue.toLocaleString()}`,
      icon: <CreditCard size={16} />,
      tab: 'fees',
    },
    {
      id: 'academics',
      labelBn: '১ম সাময়িক মূল্যায়ন',
      labelEn: '1st Term Result',
      value: 'GPA 5.00',
      icon: <Award size={16} />,
      tab: 'academics',
    },
    {
      id: 'homework',
      labelBn: 'বাকি হোমওয়ার্ক',
      labelEn: 'Pending Homework',
      value: `${pendingHw} ${isBn ? 'টি' : 'Tasks'}`,
      icon: <BookOpen size={16} />,
      tab: 'homework',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.id}
          onClick={() => onNavigateTab(c.tab)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.625rem',
            boxShadow: 'var(--shadow-xs)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.375rem',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand)',
              flexShrink: 0,
            }}
          >
            {c.icon}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
              }}
            >
              {c.value}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isBn ? c.labelBn : c.labelEn}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})
