import React from 'react'
import { Pin, Calendar, Users, GraduationCap, UserCheck, Trash2, Edit3, ArrowRight, Printer, FileText } from 'lucide-react'
import type { Notice } from '@/store/noticeStore'
import { printNoticePDF } from './noticePdf'

export const PRIORITY_CONFIG = {
  low: { label: 'Low', labelBn: 'কম', color: 'var(--text-muted)', dot: 'bg-slate-400' },
  medium: { label: 'Medium', labelBn: 'মাঝারি', color: 'var(--brand)', dot: 'bg-[var(--brand)]' },
  high: { label: 'High', labelBn: 'বেশি', color: 'var(--orange, #f97316)', dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', labelBn: 'জরুরি', color: 'var(--red, #ef4444)', dot: 'bg-red-500' },
} as const

export const TARGET_CONFIG = {
  all: { label: 'All', labelBn: 'সকল', icon: Users },
  students: { label: 'Students', labelBn: 'শিক্ষার্থী', icon: GraduationCap },
  teachers: { label: 'Teachers', labelBn: 'শিক্ষক', icon: UserCheck },
  parents: { label: 'Parents', labelBn: 'অভিভাবক', icon: Users },
} as const

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

  const displayTitle = (bn ? notice.titleBn || notice.title : notice.title || notice.titleBn) || ''
  const displayAuthor = (bn ? notice.authorBn || notice.author : notice.author || notice.authorBn) || ''
  const contentText = (bn ? notice.contentBn || notice.content : notice.content || notice.contentBn) || ''
  const plainContent = contentText.replace(/<[^>]*>/g, '').trim()

  const isUrgent = notice.priority === 'urgent'

  const formattedDate = new Date(notice.publishedAt).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const handlePrintPDF = (e: React.MouseEvent) => {
    e.stopPropagation()
    printNoticePDF(notice, bn, logo)
  }

  // Minimal List View
  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer bg-[var(--bg-primary)] hover:border-[var(--brand)]/60 hover:shadow-xs ${
          notice.pinned ? 'border-[var(--brand)]/40 bg-[var(--brand)]/[0.015]' : 'border-[var(--border)]'
        } ${isUrgent ? 'border-l-[3px] border-l-[var(--red)]' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Priority indicator dot */}
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${priority.dot} ${
              isUrgent ? 'animate-pulse' : ''
            }`}
            title={bn ? priority.labelBn : priority.label}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {notice.pinned && <Pin size={12} className="text-[var(--brand)] shrink-0 fill-[var(--brand)]" />}
              <h3 className="text-[0.875rem] font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--brand)] transition-colors">
                {displayTitle}
              </h3>
              {notice.category && (
                <span className="px-1.5 py-0.5 rounded text-[0.625rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-muted)] shrink-0">
                  {notice.category}
                </span>
              )}
            </div>
            <p className="text-[0.75rem] text-[var(--text-muted)] truncate mt-0.5">
              {plainContent}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[0.6875rem] text-[var(--text-muted)] hidden sm:flex items-center gap-1">
            <Calendar size={11} /> {formattedDate}
          </span>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handlePrintPDF}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--bg-secondary)] transition-colors"
              title={bn ? 'PDF মুদ্রণ করুন (ওয়াটারমার্ক সহ)' : 'Print PDF (with watermark)'}
            >
              <FileText size={14} />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => onTogglePin(notice.id)}
                className={`p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors ${
                  notice.pinned ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'
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
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--bg-secondary)] transition-colors"
                title={bn ? 'সম্পাদনা' : 'Edit'}
              >
                <Edit3 size={14} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(notice.id)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors"
                title={bn ? 'মুছুন' : 'Delete'}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Minimal Grid View
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between bg-[var(--bg-primary)] hover:border-[var(--brand)]/60 hover:shadow-xs p-4 ${
        notice.pinned
          ? 'border-[var(--brand)]/40 bg-[var(--brand)]/[0.015]'
          : 'border-[var(--border)]'
      } ${isUrgent ? 'border-l-[3px] border-l-[var(--red)]' : ''}`}
    >
      <div>
        {/* Minimal Meta Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category tag */}
            {notice.category && (
              <span className="px-2 py-0.5 rounded text-[0.6875rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                {notice.category}
              </span>
            )}

            {/* Target audience */}
            <span className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1 font-medium">
              <TargetIcon size={11} /> {bn ? target.labelBn : target.label}
            </span>

            {/* Urgent badge */}
            {isUrgent && (
              <span className="flex items-center gap-1 text-[0.625rem] font-semibold text-[var(--red)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] animate-pulse" />
                {bn ? 'জরুরি' : 'Urgent'}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handlePrintPDF}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--bg-secondary)] transition-colors"
              title={bn ? 'PDF মুদ্রণ করুন (ওয়াটারমার্ক সহ)' : 'Print PDF (with watermark)'}
            >
              <Printer size={13} />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => onTogglePin(notice.id)}
                className={`p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors ${
                  notice.pinned ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'
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
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--bg-secondary)] transition-colors"
                title={bn ? 'সম্পাদনা' : 'Edit'}
              >
                <Edit3 size={13} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(notice.id)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors"
                title={bn ? 'মুছুন' : 'Delete'}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--brand)] transition-colors line-clamp-2">
          {displayTitle}
        </h3>

        {/* Plain Excerpt */}
        <p className="text-[0.8125rem] text-[var(--text-muted)] leading-relaxed line-clamp-2 mt-1.5">
          {plainContent}
        </p>
      </div>

      {/* Minimal Footer */}
      <div className="flex items-center justify-between text-[0.6875rem] text-[var(--text-muted)] pt-3 mt-3 border-t border-[var(--border)]/60">
        <span className="flex items-center gap-1.5">
          <Calendar size={11} />
          {formattedDate}
          {displayAuthor && <span>· {displayAuthor}</span>}
        </span>

        <span className="text-[var(--brand)] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          {bn ? 'বিস্তারিত' : 'View'}
          <ArrowRight size={11} />
        </span>
      </div>
    </div>
  )
})
