import React, { useMemo } from 'react'
import {
  CalendarCheck,
  Wallet,
  Award,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import type { FeeItem, HomeworkItem, PortalChild, ExamResultItem, PortalTab } from '../../types'
import { getChildAttendanceStats } from '../../utils/dataMappers'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useClassStore } from '@/store/classStore'

interface OverviewKpiCardsProps {
  child: PortalChild
  fees: FeeItem[]
  homeworkList: HomeworkItem[]
  results: ExamResultItem[]
  onNavigateTab: (tab: PortalTab) => void
  onOpenPayModal: () => void
  isBn: boolean
}

export const OverviewKpiCards = React.memo(function OverviewKpiCards({
  child,
  fees,
  homeworkList,
  results,
  onNavigateTab,
  onOpenPayModal,
  isBn,
}: OverviewKpiCardsProps) {
  const attendance = useAttendanceStore((s) => s.attendance)
  const classes = useClassStore((s) => s.classes)
  const routines = useClassStore((s) => s.routines)

  const totalDue = useMemo(() => fees.reduce((acc, f) => acc + f.due, 0), [fees])
  const hasPendingFee = useMemo(() => fees.some((f) => f.status === 'pending'), [fees])
  const pendingHw = useMemo(
    () => homeworkList.filter((h) => h.status === 'pending').length,
    [homeworkList]
  )

  const attendanceStats = useMemo(() => {
    void attendance
    void classes
    void routines
    return getChildAttendanceStats(child.id, new Date(), child.class, child.section)
  }, [child.id, child.class, child.section, attendance, classes, routines])

  const hasFailed = useMemo(() => results.some((r) => r.status === 'failed'), [results])
  const avgGpa = useMemo(() => {
    if (results.length === 0) return null
    if (hasFailed) return '0.00'
    return (results.reduce((acc, r) => acc + (r.point || 0), 0) / results.length).toFixed(2)
  }, [results, hasFailed])

  const cards = [
    {
      key: 'attendance',
      labelBn: 'মাসিক উপস্থিতি',
      labelEn: 'Monthly Attendance',
      value: attendanceStats.attendanceRate,
      icon: <CalendarCheck size={16} />,
      color: 'var(--brand)',
      sub: (
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
          {isBn ? 'চলতি মাস' : 'This Month'}
        </span>
      ),
      onClick: () => onNavigateTab('attendance'),
    },
    {
      key: 'fees',
      labelBn: 'ফি ও বকেয়া',
      labelEn: 'Fees & Dues',
      value: totalDue > 0 ? `৳${totalDue.toLocaleString()}` : isBn ? '৳০' : '৳0',
      icon: <Wallet size={16} />,
      color: totalDue > 0 ? 'var(--amber)' : 'var(--green)',
      sub: hasPendingFee ? (
        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--amber)' }}>
          {isBn ? 'যাচাইাধীন' : 'Pending verification'}
        </span>
      ) : totalDue > 0 ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--amber)' }}>
            {isBn ? 'বকেয়া' : 'Due'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenPayModal()
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--brand)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <span>{isBn ? 'পরিশোধ' : 'Pay'}</span>
            <ArrowRight size={10} style={{ marginLeft: '0.125rem' }} />
          </button>
        </div>
      ) : (
        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--green)' }}>
          {isBn ? 'পরিশোধ সম্পন্ন' : 'Paid in full'}
        </span>
      ),
      onClick: () => {
        if (totalDue > 0 && !hasPendingFee) onOpenPayModal()
        else onNavigateTab('fees')
      },
    },
    {
      key: 'academics',
      labelBn: 'একাডেমিক মূল্যায়ন',
      labelEn: 'Academic Evaluation',
      value: avgGpa ? (avgGpa === '0.00' ? '0.00' : avgGpa) : '—',
      icon: <Award size={16} />,
      color: 'var(--purple)',
      sub: hasFailed ? (
        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--red)' }}>
          {isBn ? 'উন্নতি প্রয়োজন' : 'Needs work'}
        </span>
      ) : avgGpa ? (
        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--green)' }}>
          {isBn ? 'ফলাফল প্রকাশিত' : 'Result published'}
        </span>
      ) : (
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
          {isBn ? 'চলমান' : 'In progress'}
        </span>
      ),
      onClick: () => onNavigateTab('academics'),
    },
    {
      key: 'homework',
      labelBn: 'বাকি বাড়ির কাজ',
      labelEn: 'Pending Homework',
      value: pendingHw,
      icon: <BookOpen size={16} />,
      color: pendingHw > 0 ? 'var(--teal)' : 'var(--green)',
      sub: pendingHw === 0 ? (
        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--green)' }}>
          {isBn ? 'সব সম্পন্ন' : 'All done'}
        </span>
      ) : (
        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--amber)' }}>
          {isBn ? `${pendingHw}টি কাজ বাকি` : `${pendingHw} pending`}
        </span>
      ),
      onClick: () => onNavigateTab('homework'),
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {cards.map((c) => (
        <div
          key={c.key}
          onClick={c.onClick}
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
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: c.color,
              flexShrink: 0,
            }}
          >
            {c.icon}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {c.value}
            </div>
            <div
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.375rem',
                marginTop: '0.1875rem',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isBn ? c.labelBn : c.labelEn}
              </span>
              <div style={{ flexShrink: 0 }}>{c.sub}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
})
