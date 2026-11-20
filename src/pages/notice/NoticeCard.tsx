import React from 'react'
import { Pin, Calendar, Users, GraduationCap, UserCheck, Tag, Trash2, Edit3, ArrowRight, Clock } from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import type { Notice } from '@/store/noticeStore'

export const PRIORITY_CONFIG = {
  low: { label: 'Low', labelBn: 'কম', color: 'var(--text-muted)', bg: 'rgba(148, 163, 184, 0.12)', border: 'var(--border)' },
  medium: { label: 'Medium', labelBn: 'মাঝারি', color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)', border: 'var(--brand)' },
  high: { label: 'High', labelBn: 'বেশি', color: 'var(--orange, #f97316)', bg: 'rgba(249, 115, 22, 0.12)', border: 'var(--orange, #f97316)' },
  urgent: { label: 'Urgent', labelBn: 'জরুরি', color: 'var(--red, #ef4444)', bg: 'rgba(239, 68, 68, 0.14)', border: 'var(--red, #ef4444)' },
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

  const displayTitle = (bn ? notice.titleBn || notice.title : notice.title || notice.titleBn) || ''
  const displayAuthor = (bn ? notice.authorBn || notice.author : notice.author || notice.authorBn) || ''
  const contentText = (bn ? notice.contentBn || notice.content : notice.content || notice.contentBn) || ''
  const plainContent = contentText.replace(/<[^>]*>/g, '').trim()

  const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date()
  const isUrgent = notice.priority === 'urgent'

  const formattedDate = new Date(notice.publishedAt).toLocaleDateString(bn ? 'bn-BD' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className={`group relative flex items-center justify-between gap-4 p-3.5 rounded-xl border transition-all cursor-pointer bg-[var(--bg-primary)] hover:border-[var(--brand)]/60 hover:shadow-sm ${
          notice.pinned ? 'border-[var(--brand)]/40 bg-[var(--brand)]/[0.02]' : 'border-[var(--border)]'
        } ${isUrgent ? 'border-l-4 border-l-[var(--red)]' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden"
            style={{ borderColor: priority.color, background: priority.bg }}
          >
            {logo ? (
              <img src={logo} alt={schoolName} className="w-full h-full object-contain p-0.5" />
            ) : (
              <BrandLogo size={20} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {notice.pinned && <Pin size={12} className="text-[var(--brand)] shrink-0 fill-[var(--brand)]" />}
              {isUrgent && (
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--red)] animate-pulse shrink-0" />
              )}
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--brand)] transition-colors">
                {displayTitle}
              </h3>
              <span
                className="px-2 py-0.5 rounded-full text-[0.625rem] font-medium shrink-0"
                style={{ background: priority.bg, color: priority.color }}
              >
                {bn ? priority.labelBn : priority.label}
              </span>
              {notice.category && (
                <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] shrink-0">
                  {notice.category}
                </span>
              )}
            </div>
            <p className="text-[0.75rem] text-[var(--text-muted)] truncate mt-0.5">
              {plainContent}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1 justify-end">
              <Calendar size={11} /> {formattedDate}
            </span>
            <span className="text-[0.625rem] text-[var(--text-secondary)] block mt-0.5">
              {displayAuthor}
            </span>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
                title={bn ? 'সম্পাদনা' : 'Edit'}
              >
                <Edit3 size={14} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(notice.id)}
                className="p-1.5 rounded-lg hover:bg-[var(--red)]/10 text-[var(--text-muted)] hover:text-[var(--red)] transition-colors"
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

  // Grid / Card view
  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between bg-[var(--bg-primary)] hover:border-[var(--brand)] hover:shadow-md ${
        notice.pinned
          ? 'border-[var(--brand)]/50 shadow-sm bg-gradient-to-b from-[var(--brand)]/[0.03] to-transparent'
          : 'border-[var(--border)]'
      } ${isUrgent ? 'border-t-4 border-t-[var(--red)]' : ''}`}
    >
      {/* Top section: Header & Meta */}
      <div>
        {/* Urgent strip */}
        {isUrgent && (
          <div className="px-4 py-1 bg-[var(--red)]/10 text-[var(--red)] text-[0.625rem] font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] animate-ping" />
              {bn ? 'জরুরি নোটিশ' : 'URGENT NOTICE'}
            </span>
            <span className="opacity-75">{formattedDate}</span>
          </div>
        )}

        {/* Card header */}
        <div className="flex items-start gap-3 p-4 pb-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border"
            style={{ borderColor: priority.border, background: priority.bg }}
          >
            {logo ? (
              <img src={logo} alt={schoolName} className="w-full h-full object-contain p-0.5" />
            ) : (
              <BrandLogo size={22} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate">
                {schoolName}
              </span>
              {notice.pinned && (
                <span className="px-1.5 py-0.2 rounded-full text-[0.5625rem] font-semibold text-[var(--brand)] bg-[var(--brand)]/10 flex items-center gap-0.5 shrink-0">
                  <Pin size={10} className="fill-[var(--brand)]" />
                  {bn ? 'পিন' : 'Pinned'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
              <span className="font-medium text-[var(--text-secondary)]">{displayAuthor}</span>
              <span>·</span>
              <Calendar size={11} />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
                title={bn ? 'সম্পাদনা' : 'Edit'}
              >
                <Edit3 size={14} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(notice.id)}
                className="p-1.5 rounded-lg hover:bg-[var(--red)]/10 text-[var(--text-muted)] hover:text-[var(--red)] transition-colors"
                title={bn ? 'মুছুন' : 'Delete'}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="px-4 pb-2.5 flex items-center gap-1.5 flex-wrap">
          <span
            className="px-2 py-0.5 rounded-full text-[0.625rem] font-semibold"
            style={{ background: priority.bg, color: priority.color }}
          >
            {bn ? priority.labelBn : priority.label}
          </span>
          {notice.category && (
            <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center gap-1">
              <Tag size={10} /> {notice.category}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center gap-1">
            <TargetIcon size={10} /> {bn ? target.labelBn : target.label}
          </span>
          {isExpired && (
            <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-medium bg-[var(--orange)]/15 text-[var(--orange)] flex items-center gap-1">
              <Clock size={10} /> {bn ? 'মেয়াদ শেষ' : 'Expired'}
            </span>
          )}
        </div>

        {/* Title and Excerpt */}
        <div className="px-4 pb-3">
          <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)] leading-snug mb-1.5 group-hover:text-[var(--brand)] transition-colors line-clamp-2">
            {displayTitle}
          </h3>
          <p className="text-[0.8125rem] text-[var(--text-muted)] leading-relaxed line-clamp-3">
            {plainContent}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)]/40 flex items-center justify-between text-[0.75rem]">
        <span className="text-[var(--text-muted)] text-[0.6875rem]">
          {notice.expiresAt ? (
            <span>{bn ? `মেয়াদ: ${notice.expiresAt}` : `Expires: ${notice.expiresAt}`}</span>
          ) : (
            <span>{bn ? 'স্থায়ী নোটিশ' : 'Open notice'}</span>
          )}
        </span>
        <span className="text-[var(--brand)] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          {bn ? 'বিস্তারিত দেখুন' : 'Read more'}
          <ArrowRight size={13} />
        </span>
      </div>
    </div>
  )
})
