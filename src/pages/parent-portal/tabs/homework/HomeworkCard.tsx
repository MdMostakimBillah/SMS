import React from 'react'
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  CheckCircle,
  Paperclip,
} from 'lucide-react'
import type { HomeworkItem } from '../../types'

interface HomeworkCardProps {
  item: HomeworkItem
  onMarkAsDone: (id: string) => void
  isBn: boolean
}

export const HomeworkCard = React.memo(function HomeworkCard({
  item,
  onMarkAsDone,
  isBn,
}: HomeworkCardProps) {
  const isPending = item.status === 'pending'
  const isSubmitted = item.status === 'submitted'
  const isEvaluated = item.status === 'evaluated'
  const isHomework = (item.type || 'homework') === 'homework'

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-[var(--brand)]/50 transition-all p-3.5 sm:p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap text-xs">
            {/* Type Badge: Diary / Homework vs Assignment */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] font-semibold rounded-md border ${
                isHomework
                  ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-purple-500/25 bg-purple-500/10 text-purple-600 dark:text-purple-400'
              }`}
            >
              {isHomework ? <BookOpen size={11} /> : <FileText size={11} />}
              <span>
                {isHomework
                  ? isBn ? 'ডায়েরি / গৃহকাজ' : 'Diary / Homework'
                  : isBn ? 'অ্যাসাইনমেন্ট' : 'Assignment'}
              </span>
            </span>

            <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
              {isBn ? item.subjectBn : item.subject}
            </span>

            {isPending && (
              <span className="px-2 py-0.5 text-[0.6875rem] font-medium rounded border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isBn ? 'বাকি' : 'Pending'}
              </span>
            )}
            {isSubmitted && (
              <span className="px-2 py-0.5 text-[0.6875rem] font-medium rounded border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {isBn ? 'জমা দেওয়া' : 'Submitted'}
              </span>
            )}
            {isEvaluated && (
              <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {isBn ? 'মূল্যায়িত' : 'Evaluated'}
              </span>
            )}
          </div>

          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            {isBn ? item.titleBn : item.title}
          </h4>
        </div>

        {/* Submission Marks or Action */}
        <div className="shrink-0 flex items-center gap-2">
          {isEvaluated && item.marks !== undefined && (
            <div className="text-right">
              <div className="text-[0.625rem] text-[var(--text-muted)]">
                {isBn ? 'প্রাপ্ত নম্বর' : 'Score'}
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                {item.marks} / {item.maxMarks}
              </div>
            </div>
          )}
          {isPending && (
            <button
              type="button"
              onClick={() => onMarkAsDone(item.id)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--brand)] hover:opacity-90 text-white transition-opacity shadow-2xs flex items-center gap-1.5 cursor-pointer border-none"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isBn ? 'সম্পন্ন চিহ্নিত করুন' : 'Mark Completed'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Description Body */}
      <p className="text-xs text-[var(--text-secondary)] mb-2.5 leading-relaxed whitespace-pre-wrap">
        {item.description}
      </p>

      {/* Attachments if any */}
      {item.attachments && item.attachments.length > 0 && (
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          {item.attachments.map((att, i) => (
            <a
              key={i}
              href={att}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--brand)] text-[0.6875rem] hover:underline"
            >
              <Paperclip size={11} />
              <span>{isBn ? `সংযুক্তি #${i + 1}` : `Attachment #${i + 1}`}</span>
            </a>
          ))}
        </div>
      )}

      {/* Teacher feedback if evaluated */}
      {isEvaluated && item.feedback && (
        <div className="mb-2.5 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-xs text-[var(--text-primary)] flex items-start gap-2">
          <FileText className="w-4 h-4 text-[var(--brand)] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{isBn ? 'শিক্ষকের মন্তব্য: ' : "Teacher's Feedback: "}</span>
            {item.feedback}
          </div>
        </div>
      )}

      {/* Footer Dates & Teacher */}
      <div className="flex flex-wrap items-center justify-between text-[0.6875rem] text-[var(--text-muted)] pt-2 border-t border-[var(--border)] gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {isBn ? 'বরাদ্দ:' : 'Assigned:'} {item.assignedDate}
          </span>
          <span className="flex items-center gap-1 font-medium text-[var(--text-primary)]">
            <Clock className="w-3 h-3" />
            {isBn ? 'শেষ তারিখ:' : 'Due:'} {item.dueDate}
          </span>
        </div>

        <div>
          <span>{isBn ? 'শিক্ষক: ' : 'Teacher: '}</span>
          <span className="font-medium text-[var(--text-secondary)]">{item.teacherName}</span>
        </div>
      </div>
    </div>
  )
})
