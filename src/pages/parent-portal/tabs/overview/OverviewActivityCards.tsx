import React from 'react'
import {
  Clock,
  BookOpen,
  Megaphone,
  UserCheck,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react'
import type { PortalChild, HomeworkItem } from '../../types'
import { useNoticeStore } from '@/store/noticeStore'

interface OverviewActivityCardsProps {
  child: PortalChild
  homeworkList: HomeworkItem[]
  onNavigateTab: (tab: any) => void
  isBn: boolean
}

export const OverviewActivityCards = React.memo(function OverviewActivityCards({
  child,
  homeworkList,
  onNavigateTab,
  isBn,
}: OverviewActivityCardsProps) {
  const notices = useNoticeStore((s) => s.notices)
  const parentNotices = notices
    .filter((n) => n && n.isActive && (n.target === 'parents' || n.target === 'all'))
    .slice(0, 3)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left Column (2 spans): Today's Schedule & Homework */}
      <div className="lg:col-span-2 space-y-4">
        {/* Today's Activity & Punch Log */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--brand)]" />
              <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'আজকের কার্যক্রম ও সময়সূচি' : "Today's Schedule & Activity"}
              </h3>
            </div>
            <span className="text-[0.6875rem] font-medium text-[var(--text-secondary)] border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-0.5 rounded-full">
              {isBn ? 'স্কুল দিবস' : 'Active Day'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'প্রবেশের সময়' : 'In-Time'}</div>
              <div className="text-[1rem] font-bold text-[var(--text-primary)] mt-1">08:55 AM</div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">{isBn ? 'গেট ডিভাইস #০১' : 'Gate Reader #01'}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'ছুটির সময়' : 'Exit Time'}</div>
              <div className="text-[1rem] font-bold text-[var(--text-primary)] mt-1">02:30 PM</div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">{isBn ? 'নিয়মিত শিফট' : 'Regular Shift'}</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'আজকের ক্লাস' : "Today's Classes"}</div>
              <div className="text-[1rem] font-bold text-[var(--text-primary)] mt-1">6 {isBn ? 'টি' : 'Periods'}</div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">{isBn ? 'গণিত, বিজ্ঞান, ইংরেজি...' : 'Math, Science...'}</div>
            </div>
          </div>
        </div>

        {/* Pending Homework Preview */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[var(--brand)]" />
              <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'হোমওয়ার্ক ও অ্যাসাইনমেন্ট' : 'Homework & Tasks'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('homework')}
              className="text-[0.75rem] font-semibold text-[var(--brand)] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              {isBn ? 'সব দেখুন' : 'View All'}
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-2.5">
            {homeworkList.slice(0, 3).map((hw) => (
              <div
                key={hw.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-gray-400 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[0.625rem] font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]">
                      {isBn ? hw.subjectBn : hw.subject}
                    </span>
                    <h4 className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate">
                      {isBn ? hw.titleBn : hw.title}
                    </h4>
                  </div>
                  <p className="text-[0.75rem] text-[var(--text-secondary)] line-clamp-1 mt-1">
                    {hw.description}
                  </p>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-2 mt-1">
                    <span>{isBn ? 'শিক্ষক:' : 'By:'} {hw.teacherName}</span>
                    <span>·</span>
                    <span>{isBn ? 'শেষ তারিখ:' : 'Due:'} {hw.dueDate}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[0.625rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] shrink-0">
                  {hw.status === 'evaluated'
                    ? isBn
                      ? `মূল্যায়িত (${hw.marks}/${hw.maxMarks})`
                      : `Graded (${hw.marks}/${hw.maxMarks})`
                    : hw.status === 'submitted'
                    ? isBn
                      ? 'জমা দেওয়া'
                      : 'Submitted'
                    : isBn
                    ? 'অপেক্ষমাণ'
                    : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column (1 span): Teacher Contact & School Notices */}
      <div className="space-y-4">
        {/* Class Teacher Contact Card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border)] mb-3">
            <UserCheck size={16} className="text-[var(--brand)]" />
            <h3 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center font-bold text-base shrink-0">
              {child.classTeacherName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[0.875rem] font-bold text-[var(--text-primary)] truncate">
                {child.classTeacherName}
              </div>
              <div className="text-[0.6875rem] text-[var(--text-muted)] truncate">
                {child.class} ({isBn ? 'শাখা' : 'Sec'} {child.section}) {isBn ? 'শিক্ষক' : 'Teacher'}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-[0.75rem]">
            <a
              href={`tel:${child.classTeacherPhone}`}
              className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-gray-400 transition-colors no-underline"
            >
              <Phone size={13} className="text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{child.classTeacherPhone}</span>
            </a>
            <a
              href={`mailto:${child.classTeacherEmail}`}
              className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-gray-400 transition-colors no-underline"
            >
              <Mail size={13} className="text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{child.classTeacherEmail}</span>
            </a>
          </div>
        </div>

        {/* School Notices for Parents */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-[var(--brand)]" />
              <h3 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'বিজ্ঞপ্তি' : 'Notices'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('communication')}
              className="text-[0.6875rem] font-semibold text-[var(--brand)] hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-none"
            >
              {isBn ? 'সব' : 'All'}
              <ChevronRight size={12} />
            </button>
          </div>

          {parentNotices.length > 0 ? (
            <div className="space-y-2">
              {parentNotices.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onNavigateTab('communication')}
                  className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <h4 className="text-[0.75rem] font-semibold text-[var(--text-primary)] truncate">
                    {isBn ? n.titleBn || n.title : n.title}
                  </h4>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                    {(n.contentBn || n.content || '').replace(/<[^>]*>/g, '')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-[0.75rem] text-[var(--text-muted)]">
              {isBn ? 'কোনো নতুন বিজ্ঞপ্তি নেই' : 'No new notices'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
