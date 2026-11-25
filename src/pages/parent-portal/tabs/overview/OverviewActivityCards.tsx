import React, { useMemo, useState } from 'react'
import {
  ChevronRight,
  Phone,
  Mail,
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
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'আজকের কার্যক্রম ও সময়সূচি' : "Today's Schedule & Activity"}
            </h3>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  punch.isPresent ? 'bg-emerald-500' : 'bg-[var(--brand)]'
                }`}
              />
              <span>
                {punch.isPresent
                  ? isBn ? 'উপস্থিত' : 'Present Today'
                  : isBn ? 'স্কুল দিবস' : 'Active Day'}
              </span>
            </span>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-white/[0.03] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
            {/* 1. In-Time */}
            <div className="p-4 flex items-center justify-between sm:block">
              <div>
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  {isBn ? 'প্রবেশের সময়' : 'In-Time'}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] hidden sm:block mt-0.5">
                  {punch.isPresent ? (isBn ? 'উপস্থিত লিপিবদ্ধ' : 'Marked Present') : (isBn ? 'লিপিবদ্ধ নয়' : 'Not logged')}
                </div>
              </div>
              <div className="text-right sm:text-left sm:mt-2">
                <div className="text-base font-semibold text-[var(--text-primary)] tabular-nums">
                  {punch.inTime}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] sm:hidden mt-0.5">
                  {punch.isPresent ? (isBn ? 'উপস্থিত' : 'Present') : (isBn ? 'লিপিবদ্ধ নয়' : 'Not logged')}
                </div>
              </div>
            </div>

            {/* 2. Exit Time */}
            <div className="p-4 flex items-center justify-between sm:block">
              <div>
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  {isBn ? 'ছুটির সময়' : 'Exit Time'}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] hidden sm:block mt-0.5">
                  {punch.outTime !== '—' ? (isBn ? 'প্রস্থান সম্পন্ন' : 'Exit Logged') : (isBn ? 'নিয়মিত কার্যক্রম' : 'Scheduled')}
                </div>
              </div>
              <div className="text-right sm:text-left sm:mt-2">
                <div className="text-base font-semibold text-[var(--text-primary)] tabular-nums">
                  {punch.outTime}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] sm:hidden mt-0.5">
                  {punch.outTime !== '—' ? (isBn ? 'প্রস্থান সম্পন্ন' : 'Exit Logged') : (isBn ? 'নিয়মিত' : 'Scheduled')}
                </div>
              </div>
            </div>

            {/* 3. Class & Section */}
            <div className="p-4 flex items-center justify-between sm:block min-w-0">
              <div>
                <div className="text-xs font-medium text-[var(--text-secondary)]">
                  {isBn ? 'শ্রেণি ও শাখা' : 'Class & Section'}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] hidden sm:block mt-0.5">
                  {isBn ? 'রোল' : 'Roll'} {child.roll || '—'}
                </div>
              </div>
              <div className="text-right sm:text-left sm:mt-2 min-w-0">
                <div className="text-base font-semibold text-[var(--text-primary)] truncate">
                  {child.class} ({child.section || '—'})
                </div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] sm:hidden mt-0.5">
                  {isBn ? 'রোল' : 'Roll'} {child.roll || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Homework Preview */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'হোমওয়ার্ক ও অ্যাসাইনমেন্ট' : 'Homework & Tasks'}
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('homework')}
              className="text-xs font-medium text-[var(--brand)] hover:underline inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            >
              <span>{isBn ? 'সব দেখুন' : 'View All'}</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {previewHomework.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--text-muted)]">
              {isBn ? 'কোনো সক্রিয় হোমওয়ার্ক নেই।' : 'No pending homework assignments.'}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {previewHomework.map((hw) => {
                const desc = isBn ? hw.descriptionBn || hw.description : hw.description
                return (
                  <div
                    key={hw.id}
                    onClick={() => onNavigateTab('homework')}
                    className="flex items-start justify-between gap-4 py-3 first:pt-1 last:pb-1 -mx-2 px-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-white/[0.025] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[0.6875rem] font-semibold text-[var(--brand)]">
                          {isBn ? hw.subjectBn : hw.subject}
                        </span>
                        <span className="text-[var(--text-muted)] text-xs">·</span>
                        <h4 className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">
                          {isBn ? hw.titleBn : hw.title}
                        </h4>
                      </div>
                      {desc && (
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                          {desc}
                        </p>
                      )}
                      {(hw.teacherName || hw.dueDate) && (
                        <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1.5 mt-1 flex-wrap">
                          {hw.teacherName && <span>{hw.teacherName}</span>}
                          {hw.teacherName && hw.dueDate && <span>·</span>}
                          {hw.dueDate && <span>{isBn ? 'শেষ তারিখ:' : 'Due'} {hw.dueDate}</span>}
                        </div>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-[0.6875rem] font-medium shrink-0 mt-0.5 ${
                        hw.status === 'evaluated'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : hw.status === 'submitted'
                          ? 'text-[var(--brand)]'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          hw.status === 'evaluated'
                            ? 'bg-emerald-500'
                            : hw.status === 'submitted'
                            ? 'bg-[var(--brand)]'
                            : 'bg-amber-500'
                        }`}
                      />
                      <span>
                        {hw.status === 'evaluated'
                          ? isBn
                            ? `মূল্যায়িত (${hw.marks ?? 0}/${hw.maxMarks || 100})`
                            : `Graded (${hw.marks ?? 0}/${hw.maxMarks || 100})`
                          : hw.status === 'submitted'
                          ? isBn ? 'জমা দেওয়া' : 'Submitted'
                          : isBn ? 'অপেক্ষমাণ' : 'Pending'}
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column (1 span): Teacher Contact & School Notices */}
      <div className="space-y-4">
        {/* Class Teacher Contact Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('communication')}
              className="text-xs font-medium text-[var(--brand)] hover:underline inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            >
              <span>{isBn ? 'সব' : 'Directory'}</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {child.classTeacherName ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] text-[var(--brand)] flex items-center justify-center font-bold text-sm shrink-0 border border-[var(--brand)]/20">
                  {child.classTeacherName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {child.classTeacherName}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section || '—'})
                  </div>
                </div>
              </div>

              {(child.classTeacherPhone || child.classTeacherEmail) && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1 text-xs">
                  {child.classTeacherPhone && (
                    <a
                      href={`tel:${child.classTeacherPhone}`}
                      className="flex items-center gap-2.5 px-2.5 py-2 -mx-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors no-underline"
                    >
                      <Phone size={13} className="text-[var(--brand)] shrink-0" />
                      <span className="truncate font-medium tabular-nums">{child.classTeacherPhone}</span>
                    </a>
                  )}
                  {child.classTeacherEmail && (
                    <a
                      href={`mailto:${child.classTeacherEmail}`}
                      className="flex items-center gap-2.5 px-2.5 py-2 -mx-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors no-underline"
                    >
                      <Mail size={13} className="text-[var(--brand)] shrink-0" />
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
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn ? 'বিজ্ঞপ্তি' : 'Notices'}
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('communication')}
              className="text-xs font-medium text-[var(--brand)] hover:underline inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0"
            >
              <span>{isBn ? 'সব' : 'All'}</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {parentNotices.length > 0 ? (
            <div className="divide-y divide-[var(--border)]">
              {parentNotices.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  className="py-2.5 first:pt-1 last:pb-1 -mx-2 px-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-white/[0.025] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-[0.6875rem] text-[var(--text-muted)] mb-0.5">
                    <span className="font-semibold text-[var(--brand)]">
                      {n.category || (isBn ? 'সাধারণ' : 'General')}
                    </span>
                    {n.publishedAt && (
                      <span className="tabular-nums">{n.publishedAt.split('T')[0]}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {isBn ? n.titleBn || n.title : n.title}
                  </h4>
                  <p className="text-[0.6875rem] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                    {(isBn ? n.contentBn || n.content : n.content || '').replace(/<[^>]*>/g, '').trim()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-5 text-center text-xs text-[var(--text-muted)]">
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
