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
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--brand)]" />
              <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'আজকের উপস্থিতি ও কার্যক্রম' : "Today's Attendance & Clock Log"}
              </h3>
            </div>
            <span className="text-[0.6875rem] font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              {isBn ? 'সক্রিয় স্কুল দিবস' : 'Active School Day'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]/60">
              <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'প্রবেশের সময় (In-Time)' : 'In-Time (RFID Entry)'}</div>
              <div className="text-[1rem] font-bold text-emerald-600 mt-1">08:55 AM</div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">{isBn ? 'মূল গেট ডিভাইস #০১' : 'Gate Reader #01'}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]/60">
              <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'ছুটির সময় (Expected Exit)' : 'Expected Exit Time'}</div>
              <div className="text-[1rem] font-bold text-[var(--text-primary)] mt-1">02:30 PM</div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">{isBn ? 'নিয়মিত ক্লাস শিফট' : 'Regular Shift'}</div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]/60">
              <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'আজকের ক্লাস সংখ্যা' : "Today's Periods"}</div>
              <div className="text-[1rem] font-bold text-[var(--brand)] mt-1">6 {isBn ? 'টি ক্লাস' : 'Classes'}</div>
              <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">{isBn ? 'গণিত, বিজ্ঞান, ইংরেজি...' : 'Math, Science, English...'}</div>
            </div>
          </div>
        </div>

        {/* Pending Homework Preview */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-blue-500" />
              <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'সাম্প্রতিক হোমওয়ার্ক ও অ্যাসাইনমেন্ট' : 'Recent Homework & Tasks'}
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
                className="flex items-start justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[0.625rem] font-bold bg-[var(--brand)]/10 text-[var(--brand)]">
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
                    <span className="text-amber-600 font-medium">
                      {isBn ? 'জমা দেওয়ার শেষ তারিখ:' : 'Due:'} {hw.dueDate}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[0.625rem] font-bold shrink-0 ${
                    hw.status === 'evaluated'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : hw.status === 'submitted'
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {hw.status === 'evaluated'
                    ? isBn
                      ? `মূল্যায়িত (${hw.marks}/${hw.maxMarks})`
                      : `Graded (${hw.marks}/${hw.maxMarks})`
                    : hw.status === 'submitted'
                    ? isBn
                      ? 'জমা দেওয়া হয়েছে'
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

      {/* Right Column (1 span): Teacher Contact, School Notices & Dues */}
      <div className="space-y-4">
        {/* Class Teacher Contact Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
          <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border)] mb-3">
            <UserCheck size={16} className="text-[var(--brand)]" />
            <h3 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
              {isBn ? 'শ্রেণি শিক্ষক' : 'Class Teacher'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center font-bold text-base shrink-0">
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
          <div className="mt-3 space-y-1.5 text-[0.75rem] text-[var(--text-secondary)]">
            <a
              href={`tel:${child.classTeacherPhone}`}
              className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors no-underline"
            >
              <Phone size={13} className="text-emerald-500 shrink-0" />
              <span className="truncate">{child.classTeacherPhone}</span>
            </a>
            <a
              href={`mailto:${child.classTeacherEmail}`}
              className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors no-underline"
            >
              <Mail size={13} className="text-blue-500 shrink-0" />
              <span className="truncate">{child.classTeacherEmail}</span>
            </a>
          </div>
        </div>

        {/* School Notices for Parents */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-3">
            <div className="flex items-center gap-2">
              <Megaphone size={16} className="text-[var(--brand)]" />
              <h3 className="text-[0.8125rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'অভিভাবক বিজ্ঞপ্তি' : 'Parent Notices'}
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
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 hover:border-[var(--brand)]/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {n.priority === 'urgent' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    )}
                    <h4 className="text-[0.75rem] font-semibold text-[var(--text-primary)] truncate">
                      {isBn ? n.titleBn || n.title : n.title}
                    </h4>
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] line-clamp-1">
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
