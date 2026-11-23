import React, { useState, useMemo } from 'react'
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Upload,
  Award,
} from 'lucide-react'
import type { StudentProfile, StudentHomework } from '../types'

interface HomeworkTabProps {
  student: StudentProfile
  homework: StudentHomework[]
  onOpenSubmitModal: (hw: StudentHomework) => void
  isBn: boolean
}

export const HomeworkTab = React.memo(function HomeworkTab({
  student,
  homework,
  onOpenSubmitModal,
  isBn,
}: HomeworkTabProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'evaluated'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return homework
    return homework.filter((h) => h.status === filter)
  }, [homework, filter])

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <BookOpen size={18} className="text-[var(--brand)]" />
            <span>{isBn ? 'হোমওয়ার্ক ও অ্যাসাইনমেন্ট' : 'Homework & Class Assignments'}</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {isBn ? 'শ্রেণি:' : 'Class:'} {student.class} • {isBn ? 'মোট অ্যাসাইনমেন্ট:' : 'Total Tasks:'} {homework.length}
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] self-start sm:self-auto">
          {[
            { id: 'all', en: 'All', bn: 'সকল' },
            { id: 'pending', en: 'Pending', bn: 'বাকি' },
            { id: 'submitted', en: 'Submitted', bn: 'জমা দেওয়া' },
            { id: 'evaluated', en: 'Evaluated', bn: 'মূল্যায়িত' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-2xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isBn ? tab.bn : tab.en}
            </button>
          ))}
        </div>
      </div>

      {/* Homework List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((hw) => {
            const isPending = hw.status === 'pending'
            const isEvaluated = hw.status === 'evaluated'
            const isSubmitted = hw.status === 'submitted'

            return (
              <div
                key={hw.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between transition-colors hover:border-[var(--brand)]"
              >
                <div>
                  {/* Subject & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[var(--brandLight)] text-[var(--brand)] font-semibold">
                      {isBn ? hw.subjectBn : hw.subject}
                    </span>
                    <span
                      className={`text-[0.6875rem] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        isPending
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          : isEvaluated
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {isPending && <Clock size={11} />}
                      {isEvaluated && <Award size={11} />}
                      {isSubmitted && <CheckCircle2 size={11} />}
                      <span>
                        {isPending
                          ? isBn ? 'জমা বাকি' : 'Pending'
                          : isEvaluated
                            ? isBn ? 'মূল্যায়িত' : 'Evaluated'
                            : isBn ? 'জমা দেওয়া' : 'Submitted'}
                      </span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                    {isBn ? hw.titleBn || hw.title : hw.title}
                  </h3>
                  {hw.description && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 mb-3 leading-relaxed">
                      {hw.description}
                    </p>
                  )}

                  {/* Evaluated Marks or Feedback */}
                  {isEvaluated && (
                    <div className="mb-3 p-2.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                          {isBn ? 'প্রাপ্ত নম্বর:' : 'Score:'} {hw.marks ?? 0} / {hw.maxMarks || 100}
                        </span>
                        <Award size={14} className="text-emerald-600" />
                      </div>
                      {hw.feedback && (
                        <p className="text-[0.6875rem] text-emerald-900 dark:text-emerald-200">
                          <strong>{isBn ? 'শিক্ষকের মন্তব্য:' : 'Teacher Feedback:'}</strong> {hw.feedback}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submitted Notes */}
                  {isSubmitted && hw.submission?.notes && (
                    <div className="mb-3 p-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-xs">
                      <p className="text-[0.6875rem] text-[var(--text-secondary)] line-clamp-2">
                        <strong>{isBn ? 'আপনার সমাধান নোট:' : 'Your Note:'}</strong> {hw.submission.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Info & Action */}
                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2 mt-2">
                  <div className="text-[0.6875rem] text-[var(--text-secondary)]">
                    <div>{isBn ? 'শিক্ষক:' : 'Teacher:'} {hw.teacherName}</div>
                    <div>{isBn ? 'জমার শেষ তারিখ:' : 'Due:'} <span className="font-medium text-[var(--text-primary)]">{hw.dueDate}</span></div>
                  </div>

                  {isPending ? (
                    <button
                      type="button"
                      onClick={() => onOpenSubmitModal(hw)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--brand)] text-white text-xs font-medium hover:opacity-90 cursor-pointer shrink-0"
                    >
                      <Upload size={13} />
                      <span>{isBn ? 'জমা দিন' : 'Submit'}</span>
                    </button>
                  ) : (
                    <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                      {isBn ? 'নথিভুক্ত' : 'Recorded'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl py-16 text-center text-[var(--text-muted)] p-6 shadow-2xs">
          <BookOpen size={36} className="mx-auto mb-3 opacity-50" />
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {isBn ? 'কোনো হোমওয়ার্ক পাওয়া যায়নি' : 'No Homework Found'}
          </h4>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            {isBn
              ? 'আপনার শ্রেণির জন্য নতুন কোনো অ্যাসাইনমেন্ট প্রকাশ করা হলে এখানে দেখা যাবে।'
              : 'Tasks will appear here once assigned by your class subject teachers.'}
          </p>
        </div>
      )}
    </div>
  )
})
