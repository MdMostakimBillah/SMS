import React from 'react'
import {
  Pin,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  UserCheck,
  Trash2,
  Edit3,
  ArrowRight,
  Printer,
  AlertCircle,
  AlertTriangle,
  Bell,
  Info,
} from 'lucide-react'
import type { Notice } from '@/store/noticeStore'
import { printNoticePDF } from './noticePdf'

export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    labelBn: 'কম',
    icon: Info,
    color: 'var(--text-muted)',
    bg: 'rgba(148, 163, 184, 0.14)',
    dot: 'bg-slate-400',
  },
  medium: {
    label: 'Medium',
    labelBn: 'মাঝারি',
    icon: Bell,
    color: 'var(--brand)',
    bg: 'color-mix(in srgb, var(--brand) 12%, transparent)',
    dot: 'bg-[var(--brand)]',
  },
  high: {
    label: 'High',
    labelBn: 'বেশি',
    icon: AlertTriangle,
    color: 'var(--orange, #f97316)',
    bg: 'rgba(249, 115, 22, 0.12)',
    dot: 'bg-orange-500',
  },
  urgent: {
    label: 'Urgent',
    labelBn: 'জরুরি',
    icon: AlertCircle,
    color: 'var(--red, #ef4444)',
    bg: 'rgba(239, 68, 68, 0.14)',
    dot: 'bg-red-500',
  },
} as const

export const TARGET_CONFIG = {
  all: { label: 'All', labelBn: 'সকল', icon: Users },
  students: { label: 'Students', labelBn: 'শিক্ষার্থী', icon: GraduationCap },
  teachers: { label: 'Teachers', labelBn: 'শিক্ষক', icon: UserCheck },
  parents: { label: 'Parents', labelBn: 'অভিভাবক', icon: Users },
} as const

function getTimeAgo(dateStr: string, bn: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return bn ? 'এইমাত্র' : 'Just now'
  if (mins < 60) return bn ? `${mins} মি. আগে` : `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return bn ? `${hours} ঘণ্টা আগে` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return bn ? `${days} দিন আগে` : `${days}d ago`
  return new Date(dateStr).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface NoticeCardProps {
  notice: Notice
  schoolName: string
  logo?: string | null
  canEdit: boolean
  canDelete: boolean
  bn: boolean
  viewMode?: 'grid' | 'list'
  onClick: () => void
  onTogglePin: (id: string) => void
  onEdit: (n: Notice) => void
  onDelete: (id: string) => void
}

export const NoticeCard = React.memo(function NoticeCard({
  notice,
  schoolName,
  logo,
  canEdit,
  canDelete,
  bn,
  viewMode = 'grid',
  onClick,
  onTogglePin,
  onEdit,
  onDelete,
}: NoticeCardProps) {
  const priority = PRIORITY_CONFIG[notice.priority] || PRIORITY_CONFIG.medium
  const target = TARGET_CONFIG[notice.target] || TARGET_CONFIG.all
  const TargetIcon = target.icon
  const PriorityIcon = priority.icon

  const displayTitle = (bn ? notice.titleBn || notice.title : notice.title || notice.titleBn) || ''
  const displayAuthor = (bn ? notice.authorBn || notice.author : notice.author || notice.authorBn) || ''
  const contentText = (bn ? notice.contentBn || notice.content : notice.content || notice.contentBn) || ''
  const plainContent = contentText.replace(/<[^>]*>/g, '').trim()

  const isUrgent = notice.priority === 'urgent'
  const formattedTime = getTimeAgo(notice.publishedAt, bn)
  const formattedDate = new Date(notice.publishedAt).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const handlePrintPDF = (e: React.MouseEvent) => {
    e.stopPropagation()
    printNoticePDF(notice, bn, logo)
  }

  // List View (Identical to Notifications & SMS list cards)
  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
          notice.pinned
            ? 'border-[var(--brand)] bg-[var(--bg-secondary)] shadow-xs hover:border-[var(--brand)]'
            : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)]/60 hover:bg-[var(--bg-secondary)]'
        } ${isUrgent ? 'border-l-4 border-l-[var(--red)]' : ''}`}
      >
        {/* Avatar Icon */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs overflow-hidden"
          style={{ background: priority.bg, color: priority.color }}
        >
          {logo ? (
            <img src={logo} alt="" className="w-5 h-5 object-contain" />
          ) : (
            <PriorityIcon size={17} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-[0.8125rem] font-bold text-[var(--text-primary)] truncate">
              {displayAuthor || schoolName || (bn ? 'কর্তৃপক্ষ' : 'Authority')}
            </span>

            {notice.pinned && (
              <span className="inline-flex items-center gap-0.5 text-[0.5625rem] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] shrink-0">
                <Pin size={9} className="fill-[var(--brand)]" />
                {bn ? 'পিন' : 'Pinned'}
              </span>
            )}

            {/* Category Badge */}
            {notice.category && (
              <span
                className="inline-flex items-center gap-1 text-[0.625rem] font-semibold px-2 py-0.5 rounded-md shrink-0"
                style={{
                  background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
                  color: 'var(--brand)',
                }}
              >
                {notice.category}
              </span>
            )}

            {/* Priority Badge */}
            <span
              className="inline-flex items-center text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
              style={{ background: priority.bg, color: priority.color }}
            >
              {bn ? priority.labelBn : priority.label}
            </span>

            {/* Target Audience Badge */}
            <span className="inline-flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--teal-light)] text-[var(--teal)] shrink-0">
              <TargetIcon size={10} />
              {bn ? target.labelBn : target.label}
            </span>

            {/* Timestamp on right */}
            <span className="text-[0.6875rem] text-[var(--text-muted)] ml-auto shrink-0 flex items-center gap-1">
              <Clock size={11} />
              {formattedTime}
            </span>
          </div>

          {/* Title */}
          <p className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate mt-1 mb-0 group-hover:text-[var(--brand)] transition-colors">
            {displayTitle}
          </p>

          {/* Message / Excerpt */}
          <p className="text-[0.75rem] text-[var(--text-secondary)] line-clamp-2 mt-0.5 mb-0">
            {plainContent}
          </p>
        </div>

        {/* Hover Action Buttons */}
        <div
          className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handlePrintPDF}
            className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors cursor-pointer border-none bg-transparent"
            title={bn ? 'PDF মুদ্রণ করুন (ওয়াটারমার্ক সহ)' : 'Print PDF (with watermark)'}
          >
            <Printer size={14} />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => onTogglePin(notice.id)}
              className={`p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors cursor-pointer border-none bg-transparent ${
                notice.pinned ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--brand)]'
              }`}
              title={notice.pinned ? (bn ? 'আনপিন করুন' : 'Unpin') : (bn ? 'পিন করুন' : 'Pin')}
            >
              <Pin size={14} className={notice.pinned ? 'fill-[var(--brand)]' : ''} />
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(notice)}
              className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors cursor-pointer border-none bg-transparent"
              title={bn ? 'সম্পাদনা' : 'Edit'}
            >
              <Edit3 size={14} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(notice.id)}
              className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--red)] transition-colors cursor-pointer border-none bg-transparent"
              title={bn ? 'মুছুন' : 'Delete'}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Grid View (Harmonized with Notification & SMS card anatomy)
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border transition-all cursor-pointer flex flex-col justify-between p-3.5 bg-[var(--bg-primary)] ${
        notice.pinned
          ? 'border-[var(--brand)] bg-[var(--bg-secondary)] shadow-xs hover:border-[var(--brand)]'
          : 'border-[var(--border)] hover:border-[var(--brand)]/60 hover:bg-[var(--bg-secondary)]'
      } ${isUrgent ? 'border-l-4 border-l-[var(--red)]' : ''}`}
    >
      <div>
        {/* Header with Avatar, Author, Pinned, Date, Actions */}
        <div className="flex items-start gap-3">
          {/* Avatar Icon */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs overflow-hidden"
            style={{ background: priority.bg, color: priority.color }}
          >
            {logo ? (
              <img src={logo} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <PriorityIcon size={17} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[0.8125rem] font-bold text-[var(--text-primary)] truncate">
                {displayAuthor || schoolName || (bn ? 'কর্তৃপক্ষ' : 'Authority')}
              </span>
              {notice.pinned && (
                <Pin size={11} className="text-[var(--brand)] shrink-0 fill-[var(--brand)]" />
              )}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              <Clock size={11} />
              {formattedTime}
            </div>
          </div>

          {/* Hover Actions */}
          <div
            className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handlePrintPDF}
              className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors cursor-pointer border-none bg-transparent"
              title={bn ? 'PDF মুদ্রণ করুন (ওয়াটারমার্ক সহ)' : 'Print PDF (with watermark)'}
            >
              <Printer size={13} />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => onTogglePin(notice.id)}
                className={`p-1.5 rounded-lg hover:bg-[var(--border)] transition-colors cursor-pointer border-none bg-transparent ${
                  notice.pinned ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--brand)]'
                }`}
                title={notice.pinned ? (bn ? 'আনপিন করুন' : 'Unpin') : (bn ? 'পিন করুন' : 'Pin')}
              >
                <Pin size={13} className={notice.pinned ? 'fill-[var(--brand)]' : ''} />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit(notice)}
                className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors cursor-pointer border-none bg-transparent"
                title={bn ? 'সম্পাদনা' : 'Edit'}
              >
                <Edit3 size={13} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(notice.id)}
                className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--red)] transition-colors cursor-pointer border-none bg-transparent"
                title={bn ? 'মুছুন' : 'Delete'}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          {notice.category && (
            <span
              className="inline-flex items-center gap-1 text-[0.625rem] font-semibold px-2 py-0.5 rounded-md"
              style={{
                background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
                color: 'var(--brand)',
              }}
            >
              {notice.category}
            </span>
          )}
          <span
            className="inline-flex items-center text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: priority.bg, color: priority.color }}
          >
            {bn ? priority.labelBn : priority.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--teal-light)] text-[var(--teal)]">
            <TargetIcon size={10} />
            {bn ? target.labelBn : target.label}
          </span>
        </div>

        {/* Title */}
        <p className="text-[0.8125rem] font-semibold text-[var(--text-primary)] line-clamp-2 mt-2 mb-0 group-hover:text-[var(--brand)] transition-colors leading-snug">
          {displayTitle}
        </p>

        {/* Excerpt */}
        <p className="text-[0.75rem] text-[var(--text-secondary)] line-clamp-2 mt-1 mb-0 leading-normal">
          {plainContent}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[0.6875rem] text-[var(--text-muted)] pt-2.5 mt-3 border-t border-[var(--border)]/60">
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {formattedDate}
        </span>
        <span className="text-[var(--brand)] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[0.75rem]">
          {bn ? 'বিস্তারিত' : 'View'}
          <ArrowRight size={11} />
        </span>
      </div>
    </div>
  )
})
