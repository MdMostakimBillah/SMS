import React, { useMemo, useState } from 'react'
import {
  Clock,
  BookOpen,
  Megaphone,
  UserCheck,
  ChevronRight,
  Phone,
  Mail,
  LogIn,
  LogOut,
  GraduationCap,
} from 'lucide-react'
import type { PortalChild, HomeworkItem, PortalTab } from '../../types'
import { useNoticeStore, type Notice } from '@/store/noticeStore'
import { useAttendanceStore } from '@/store/attendanceStore'
import { getTodayPunchInfo } from '../../utils/dataMappers'
import { NoticeDetailModal } from '../communication/NoticeDetailModal'

interface OverviewActivityCardsProps {
  child: PortalChild
  homeworkList: HomeworkItem[]
  onNavigateTab: (tab: PortalTab) => void
  isBn: boolean
}

export const OverviewActivityCards = React.memo(function OverviewActivityCards({
  child,
  homeworkList,
  onNavigateTab,
  isBn,
}: OverviewActivityCardsProps) {
  const notices = useNoticeStore((s) => s.notices)
  const attendance = useAttendanceStore((s) => s.attendance)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)

  const punch = useMemo(() => {
    void attendance
    return getTodayPunchInfo(child.id)
  }, [child.id, attendance])

  const parentNotices = useMemo(() => {
    return notices
      .filter((n) => n && n.isActive !== false && n.target !== 'teachers')
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
      })
      .slice(0, 3)
  }, [notices])

  const previewHomework = useMemo(() => {
    return [...homeworkList]
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (a.status !== 'pending' && b.status === 'pending') return 1
        return (a.dueDate || '').localeCompare(b.dueDate || '')
      })
      .slice(0, 3)
  }, [homeworkList])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left Column (2 spans): Today's Schedule & Homework */}
      <div className="lg:col-span-2 space-y-4">
        {/* Today's Activity & Punch Log */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {isBn ? 'আজকের কার্যক্রম ও সময়সূচি' : "Today's Schedule & Activity"}
              </h3>
            </div>
            <span className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-full">
              {punch.isPresent
                ? isBn ? 'উপস্থিত' : 'Present Today'
                : isBn ? 'স্কুল দিবস' : 'Active Day'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. In-Time */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between sm:block">
              <div className="flex items-center gap-2.5 sm:block">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 sm:mb-2">
                  <LogIn size={15} />
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    {isBn ? 'প্রবেশের সময়' : 'In-Time'}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] hidden sm:block mt-0.5">
                    {punch.isPresent ? (isBn ? 'উপস্থিত লিপিবদ্ধ' : 'Marked Present') : (isBn ? 'লিপিবদ্ধ নয়' : 'Not logged')}
                  </div>
                </div>
              </div>
              <div className="text-right sm:text-left sm:mt-1.5">
                <div className="text-base font-bold text-[var(--text-primary)] leading-tight tabular-nums">
                  {punch.inTime}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] sm:hidden mt-0.5">
                  {punch.isPresent ? (isBn ? 'উপস্থিত' : 'Present') : (isBn ? 'লিপিবদ্ধ নয়' : 'Not logged')}
                </div>
              </div>
            </div>

            {/* 2. Exit Time */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between sm:block">
              <div className="flex items-center gap-2.5 sm:block">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 sm:mb-2">
                  <LogOut size={15} />
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    {isBn ? 'ছুটির সময়' : 'Exit Time'}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] hidden sm:block mt-0.5">
                    {punch.outTime !== '—' ? (isBn ? 'প্রস্থান সম্পন্ন' : 'Exit Logged') : (isBn ? 'নিয়মিত কার্যক্রম' : 'Scheduled')}
                  </div>
                </div>
              </div>
              <div className="text-right sm:text-left sm:mt-1.5">
                <div className="text-base font-bold text-[var(--text-primary)] leading-tight tabular-nums">
                  {punch.outTime}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] sm:hidden mt-0.5">
                  {punch.outTime !== '—' ? (isBn ? 'প্রস্থান সম্পন্ন' : 'Exit Logged') : (isBn ? 'নিয়মিত' : 'Scheduled')}
                </div>
              </div>
            </div>

            {/* 3. Class & Section */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between sm:block">
              <div className="flex items-center gap-2.5 sm:block min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 sm:mb-2">
                  <GraduationCap size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    {isBn ? 'শ্রেণি ও শাখা' : 'Class & Section'}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] hidden sm:block mt-0.5">
                    {isBn ? 'রোল:' : 'Roll:'} {child.roll || '—'}
                  </div>
                </div>
              </div>
              <div className="text-right sm:text-left sm:mt-1.5 min-w-0">
                <div className="text-base font-bold text-[var(--text-primary)] leading-tight truncate">
                  {child.class} ({child.section || '—'})
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] sm:hidden mt-0.5">
                  {isBn ? 'রোল:' : 'Roll:'} {child.roll || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Homework Preview */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen size={16} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {isBn ? 'হোমওয়ার্ক ও অ্যাসাইনমেন্ট' : 'Homework & Tasks'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('homework')}
              className="text-xs font-semibold text-[var(--brand)] hover:underline inline-flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
            >
              <span>{isBn ? 'সব দেখুন' : 'View All'}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-2.5">
            {previewHomework.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                {isBn ? 'কোনো সক্রিয় হোমওয়ার্ক নেই।' : 'No pending homework assignments.'}
              </div>
            ) : (
              previewHomework.map((hw) => {
                const desc = isBn ? hw.descriptionBn || hw.description : hw.description
                return (
                  <div
                    key={hw.id}
                    onClick={() => onNavigateTab('homework')}
                    className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[0.6875rem] font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]">
                          {isBn ? hw.subjectBn : hw.subject}
                        </span>
                        <h4 className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate">
                          {isBn ? hw.titleBn : hw.title}
                        </h4>
                      </div>
                      {desc && (
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-1">
                          {desc}
                        </p>
                      )}
                      <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-2 mt-1.5 flex-wrap">
                        {hw.teacherName && <span>{isBn ? 'শিক্ষক:' : 'By:'} {hw.teacherName}</span>}
                        {hw.teacherName && hw.dueDate && <span>·</span>}
                        {hw.dueDate && <span>{isBn ? 'শেষ তারিখ:' : 'Due:'} {hw.dueDate}</span>}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold border shrink-0 ${
                        hw.status === 'evaluated'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : hw.status === 'submitted'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {hw.status === 'evaluated'
                        ? isBn
                          ? `মূল্যায়িত (${hw.marks ?? 0}/${hw.maxMarks || 100})`
                          : `Graded (${hw.marks ?? 0}/${hw.maxMarks || 100})`
                        : hw.status === 'submitted'
                        ? isBn
                          ? 'জমা দেওয়া'
                          : 'Submitted'
                        : isBn
                        ? 'অপেক্ষমাণ'
                        : 'Pending'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column (1 span): Teacher Contact & School Notices */}
      <div className="space-y-4">
        {/* Class Teacher Contact Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border)] mb-3.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <UserCheck size={16} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
            </h3>
          </div>

          {child.classTeacherName ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--brand-light)] border border-[var(--border)] text-[var(--brand)] flex items-center justify-center font-bold text-base shrink-0">
                  {child.classTeacherName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {child.classTeacherName}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                    {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section || '—'})
                  </div>
                </div>
              </div>

              {(child.classTeacherPhone || child.classTeacherEmail) && (
                <div className="mt-3.5 space-y-2 text-xs">
                  {child.classTeacherPhone && (
                    <a
                      href={`tel:${child.classTeacherPhone}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors no-underline"
                    >
                      <Phone size={14} className="text-[var(--brand)] shrink-0" />
                      <span className="truncate font-medium">{child.classTeacherPhone}</span>
                    </a>
                  )}
                  {child.classTeacherEmail && (
                    <a
                      href={`mailto:${child.classTeacherEmail}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors no-underline"
                    >
                      <Mail size={14} className="text-[var(--brand)] shrink-0" />
                      <span className="truncate font-medium">{child.classTeacherEmail}</span>
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="py-5 text-center text-xs text-[var(--text-muted)]">
              {isBn ? 'শ্রেণি শিক্ষক নির্ধারিত হয়নি' : 'No class teacher assigned yet'}
            </div>
          )}
        </div>

        {/* School Notices for Parents */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Megaphone size={16} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {isBn ? 'বিজ্ঞপ্তি' : 'Notices'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('communication')}
              className="text-xs font-semibold text-[var(--brand)] hover:underline inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            >
              <span>{isBn ? 'সব' : 'All'}</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {parentNotices.length > 0 ? (
            <div className="space-y-2.5">
              {parentNotices.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[0.6875rem] font-semibold text-[var(--brand)]">
                      {n.category || (isBn ? 'সাধারণ' : 'General')}
                    </span>
                    {n.publishedAt && (
                      <span className="text-[0.6875rem] text-[var(--text-muted)]">
                        {n.publishedAt.split('T')[0]}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {isBn ? n.titleBn || n.title : n.title}
                  </h4>
                  <p className="text-[0.6875rem] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                    {(isBn ? n.contentBn || n.content : n.content || '').replace(/<[^>]*>/g, '').trim()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[var(--text-muted)]">
              {isBn ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No new notices'}
            </div>
          )}
        </div>
      </div>

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
