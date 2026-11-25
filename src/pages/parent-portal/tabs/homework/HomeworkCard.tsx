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
  const displayDesc = isBn ? item.descriptionBn || item.description : item.description
  const todayStr = new Date().toISOString().split('T')[0]
  const isOverdue = isPending && Boolean(item.dueDate && item.dueDate < todayStr)

  return (
    <div className="py-4 first:pt-1 last:pb-1 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap text-[0.6875rem]">
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                isHomework
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-purple-600 dark:text-purple-400'
              }`}
            >
              {isHomework ? <BookOpen size={12} /> : <FileText size={12} />}
              <span>
                {isHomework
                  ? isBn ? 'ডায়েরি / গৃহকাজ' : 'Diary / Homework'
                  : isBn ? 'অ্যাসাইনমেন্ট' : 'Assignment'}
              </span>
            </span>

            <span className="text-[var(--text-muted)]">·</span>

            <span className="font-semibold text-[var(--brand)]">
              {isBn ? item.subjectBn : item.subject}
            </span>

            <span className="text-[var(--text-muted)]">·</span>

            {isPending && (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  isOverdue
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                <Clock className="w-3 h-3" />
                {isOverdue ? (isBn ? 'সময় অতিক্রান্ত' : 'Overdue') : (isBn ? 'বাকি' : 'Pending')}
              </span>
            )}
            {isSubmitted && (
              <span className="inline-flex items-center gap-1 font-semibold text-[var(--brand)]">
                <CheckCircle className="w-3 h-3" />
                {isBn ? 'জমা দেওয়া' : 'Submitted'}
              </span>
            )}
            {isEvaluated && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                {isBn ? 'মূল্যায়িত' : 'Evaluated'}
              </span>
            )}
          </div>

          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {isBn ? item.titleBn : item.title}
          </h4>
        </div>

        {/* Submission Marks or Action */}
        <div className="shrink-0 flex items-center gap-2">
          {isEvaluated && item.marks !== undefined && (
            <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-right">
              <div className="text-[0.6875rem] text-emerald-700 dark:text-emerald-300 font-medium">
                {isBn ? 'প্রাপ্ত নম্বর' : 'Score'}
              </div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {item.marks} / {item.maxMarks || 100}
              </div>
            </div>
          )}
          {isPending && (
            <button
              type="button"
              onClick={() => onMarkAsDone(item.id)}
              className="h-8 px-3.5 text-xs font-semibold rounded-lg bg-[var(--brand)] hover:opacity-90 text-white transition-opacity flex items-center gap-1.5 cursor-pointer border-none shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isBn ? 'সম্পন্ন চিহ্নিত করুন' : 'Mark Completed'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Description Body */}
      {displayDesc && (
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
          {displayDesc}
        </p>
      )}

      {/* Attachments */}
      {item.attachments && item.attachments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {item.attachments.map((att, i) => (
            <a
              key={i}
              href={att}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--brand-light)] text-[var(--brand)] text-[0.6875rem] font-medium hover:underline no-underline"
            >
              <Paperclip size={11} />
              <span>{isBn ? `সংযুক্তি #${i + 1}` : `Attachment #${i + 1}`}</span>
            </a>
          ))}
        </div>
      )}

      {/* Teacher feedback */}
      {isEvaluated && item.feedback && (
        <div className="pl-3 border-l-2 border-[var(--brand)] text-xs text-[var(--text-primary)] py-0.5">
          <span className="font-semibold">{isBn ? 'শিক্ষকের মন্তব্য: ' : "Teacher's Feedback: "}</span>
          <span className="text-[var(--text-secondary)]">{item.feedback}</span>
        </div>
      )}

      {/* Footer Dates & Teacher */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-[var(--text-muted)] pt-0.5">
        {item.assignedDate && (
          <span className="flex items-center gap-1 tabular-nums">
            <Calendar className="w-3 h-3" />
            <span>{isBn ? 'বরাদ্দ:' : 'Assigned:'} {item.assignedDate}</span>
          </span>
        )}
        {item.dueDate && (
          <span className={`flex items-center gap-1 font-medium tabular-nums ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-secondary)]'}`}>
            <Clock className="w-3 h-3" />
            <span>{isBn ? 'শেষ তারিখ:' : 'Due:'} {item.dueDate}</span>
          </span>
        )}
        {item.teacherName && (
          <span>
            {isBn ? 'শিক্ষক: ' : 'By '}
            <span className="font-medium text-[var(--text-secondary)]">{item.teacherName}</span>
          </span>
        )}
      </div>
    </div>
  )
})
