import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  Bell,
  CheckCircle2,
} from 'lucide-react'
import type { StudentDayRoutine, StudentHomework, StudentFee } from '../types'
import { useNoticeStore, type Notice } from '@/store/noticeStore'
import { OverviewKpiCards } from './overview/OverviewKpiCards'
import { NoticeDetailModal } from '@/pages/parent-portal/tabs/communication/NoticeDetailModal'

interface OverviewTabProps {
  routine: StudentDayRoutine[]
  homework: StudentHomework[]
  fees: StudentFee[]
  attendanceRate: string
  onNavigateTab: (tab: any) => void
  onOpenSubmitHomework: (hw: StudentHomework) => void
  isBn: boolean
}

export const OverviewTab = React.memo(function OverviewTab({
  routine,
  homework,
  fees,
  attendanceRate,
  onNavigateTab,
  onOpenSubmitHomework,
  isBn,
}: OverviewTabProps) {
  const notices = useNoticeStore((s) => s.notices)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  // Find today's routine
  const todayRoutine = useMemo(() => {
    return routine.find((d) => d.isToday) || routine[0]
  }, [routine])

  // Homework due soon (pending)
  const pendingHomework = useMemo(() => {
    return homework.filter((h) => h.status === 'pending').slice(0, 3)
  }, [homework])

  // Total due fees
  const totalDue = useMemo(() => {
    return fees.reduce((sum, f) => sum + (f.status === 'pending' ? 0 : f.due), 0)
  }, [fees])

  // Recent 3 notices
  const recentNotices = useMemo(() => {
    return notices
      .filter((n) => n.isActive !== false)
      .slice(0, 3)
  }, [notices])

  return (
    <div className="space-y-4">
      {/* 4 Summary KPI Cards */}
      <OverviewKpiCards
        attendanceRate={attendanceRate}
        todayRoutine={todayRoutine}
        pendingHomeworkCount={homework.filter((h) => h.status === 'pending').length}
        totalDue={totalDue}
        onNavigateTab={onNavigateTab}
        isBn={isBn}
      />

      {/* Main Grid: Today's Routine + Pending Homework */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Schedule Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--brand)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'আজকের ক্লাস রুটিন' : "Today's Schedule"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('routine')}
              className="text-xs text-[var(--brand)] hover:underline flex items-center gap-1 font-medium"
            >
              <span>{isBn ? 'সম্পূর্ণ রুটিন' : 'Full Timetable'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {todayRoutine?.isWeekend ? (
            <div className="py-8 text-center text-[var(--text-secondary)]">
              <Calendar size={28} className="mx-auto mb-2 text-[var(--text-muted)]" />
              <p className="text-xs font-semibold">{isBn ? 'আজ সাপ্তাহিক ছুটি' : 'Today is Weekend / Holiday'}</p>
              <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">{isBn ? 'কোনো ক্লাস নির্ধারিত নেই' : 'No classes scheduled for today'}</p>
            </div>
          ) : todayRoutine?.periods && todayRoutine.periods.length > 0 ? (
            <div className="space-y-2">
              {todayRoutine.periods.map((period) => (
                <div
                  key={period.periodIndex}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[var(--brandLight)] text-[var(--brand)] font-bold flex items-center justify-center text-[0.6875rem] shrink-0">
                      P{period.periodIndex}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-primary)] truncate">
                        {isBn ? period.subjectNameBn : period.subjectName}
                      </p>
                      <p className="text-[0.6875rem] text-[var(--text-secondary)] truncate">
                        {period.teacherName} {period.room ? `• ${period.room}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[0.6875rem] text-[var(--text-muted)] font-mono shrink-0">
                    {period.startTime} - {period.endTime}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[var(--text-muted)] text-xs">
              {isBn ? 'আজকের জন্য কোনো ক্লাস নির্ধারিত নেই' : 'No class routine defined for today'}
            </div>
          )}
        </div>

        {/* Pending Homework Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'জরুরি হোমওয়ার্ক ও অ্যাসাইনমেন্ট' : 'Homework Due Soon'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('homework')}
              className="text-xs text-[var(--brand)] hover:underline flex items-center gap-1 font-medium"
            >
              <span>{isBn ? 'সব দেখুন' : 'View All'}</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {pendingHomework.length > 0 ? (
            <div className="space-y-2">
              {pendingHomework.map((hw) => (
                <div
                  key={hw.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {isBn ? hw.titleBn || hw.title : hw.title}
                      </span>
                      <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {isBn ? hw.subjectBn : hw.subject}
                      </span>
                    </div>
                    <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                      {isBn ? 'জমার শেষ তারিখ:' : 'Due:'} <strong className="text-rose-500">{hw.dueDate}</strong> • {hw.teacherName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenSubmitHomework(hw)}
                    className="px-2.5 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-medium hover:opacity-90 shrink-0"
                  >
                    {isBn ? 'জমা দিন' : 'Submit'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-[var(--text-muted)] text-xs">
              <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-500" />
              <p>{isBn ? 'কোনো বকেয়া হোমওয়ার্ক নেই!' : 'No pending homework!'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Institutional Notices */}
      {recentNotices.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[var(--brand)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'প্রতিষ্ঠানের নোটিশ ও ঘোষণা' : 'Institution Notices & Announcements'}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentNotices.map((n) => {
              const plainContent = (isBn ? n.contentBn || n.content : n.content)
                .replace(/<[^>]*>/g, '')
                .trim()
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--brand)] text-xs space-y-1.5 flex flex-col justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-[var(--brandLight)] text-[var(--brand)] font-semibold">
                        {n.category || 'General'}
                      </span>
                      <span className="text-[0.625rem] text-[var(--text-muted)]">
                        {n.publishedAt?.split('T')[0] || ''}
                      </span>
                    </div>
                    <h4 className="font-semibold text-[var(--text-primary)] line-clamp-1">
                      {isBn ? n.titleBn || n.title : n.title}
                    </h4>
                    <p className="text-[0.6875rem] text-[var(--text-secondary)] line-clamp-2 mt-1">
                      {plainContent}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Notice Detail Modal */}
      {selectedNotice && (
        <NoticeDetailModal
          notice={selectedNotice}
          onClose={() => setSelectedNotice(null)}
          isBn={isBn}
        />
      )}
    </div>
  )
})
