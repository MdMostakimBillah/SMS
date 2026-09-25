import { useState, memo } from 'react'
import { Pin, Tag, Users, Calendar, ChevronRight } from 'lucide-react'
import type { Notice, NoticeTarget, NoticePriority } from '@/store/noticeStore'

const PRIORITY_COLORS: Record<NoticePriority, { bg: string; text: string; label: string; labelBn: string }> = {
  low: { bg: 'var(--text-muted)', text: 'var(--text-muted)', label: 'Low', labelBn: 'কম' },
  medium: { bg: 'var(--brand)', text: 'var(--brand)', label: 'Medium', labelBn: 'মাঝারি' },
  high: { bg: 'var(--orange)', text: 'var(--orange)', label: 'High', labelBn: 'বেশি' },
  urgent: { bg: 'var(--red)', text: 'var(--red)', label: 'Urgent', labelBn: 'জরুরি' },
}

const TARGET_LABELS: Record<NoticeTarget, { label: string; labelBn: string }> = {
  all: { label: 'All', labelBn: 'সকল' },
  students: { label: 'Students', labelBn: 'শিক্ষার্থী' },
  teachers: { label: 'Teachers', labelBn: 'শিক্ষক' },
  parents: { label: 'Parents', labelBn: 'অভিভাবক' },
}

interface NoticeCardProps {
  notice: Notice
  onClick: () => void
  onPin?: () => void
  onDelete?: () => void
  canEdit?: boolean
  canDelete?: boolean
  bn: boolean
}

function NoticeCardInner({ notice, onClick, onPin, onDelete, canEdit, canDelete, bn }: NoticeCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const priority = PRIORITY_COLORS[notice.priority]
  const target = TARGET_LABELS[notice.target]
  const plainContent = (bn ? notice.contentBn : notice.content).replace(/<[^>]*>/g, '')

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fade-in glass rounded-[0.75rem] cursor-pointer overflow-hidden transition-all duration-200 ${
        notice.pinned ? 'border-[var(--brand)]' : 'border-[var(--border)]'
      } ${isHovered ? 'translate-y-[-2px] shadow-[var(--shadow-md)]' : 'shadow-[var(--shadow-xs)]'}`}
    >
      {/* Priority accent bar */}
      <div className="h-[0.1875rem] w-full" style={{ background: priority.text }} />

      <div className="p-[1rem]">
        {/* Header: Logo + Author + Date + Actions */}
        <div className="flex items-start gap-[0.75rem] mb-[0.75rem]">
          {/* School logo avatar */}
          <div className="w-[2.5rem] h-[2.5rem] rounded-full flex items-center justify-center shrink-0 overflow-hidden border-[1.5px]" style={{ borderColor: 'var(--brand)', background: notice.pinned ? 'var(--brand)' : 'var(--bg-secondary)' }}>
            <span className="text-white font-bold text-[0.75rem]">
              {(bn ? notice.authorBn : notice.author).charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-[0.375rem] flex-wrap">
              <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                {bn ? notice.authorBn : notice.author}
              </span>
              {notice.pinned && (
                <span className="px-[0.375rem] py-[0.125rem] rounded-[0.375rem] text-[0.5625rem] font-medium flex items-center gap-[0.25rem]" style={{ background: 'var(--brand)15', color: 'var(--brand)' }}>
                  <Pin size={8} /> {bn ? 'পিন করা' : 'Pinned'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-[0.25rem] text-[0.6875rem] text-[var(--text-muted)] mt-[0.125rem]">
              <Calendar size={10} />
              {new Date(notice.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-[0.25rem] shrink-0" onClick={(e) => e.stopPropagation()}>
            {canEdit && (
              <button
                onClick={onPin}
                className="p-[0.5rem] rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                title={notice.pinned ? (bn ? 'পিন সরান' : 'Unpin') : (bn ? 'পিন করুন' : 'Pin')}
              >
                <Pin size={14} className={notice.pinned ? 'text-[var(--brand)]' : ''} />
              </button>
            )}
            {canDelete && (
              <button
                onClick={onDelete}
                className="p-[0.5rem] rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                title={bn ? 'মুছুন' : 'Delete'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            )}
            <ChevronRight size={16} className="text-[var(--text-muted)] ml-[0.25rem]" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-[0.375rem] flex-wrap mb-[0.75rem]">
          <span className="px-[0.5rem] py-[0.125rem] rounded-[0.375rem] text-[0.5625rem] font-medium" style={{ background: `${priority.bg}18`, color: priority.text }}>
            {bn ? priority.labelBn : priority.label}
          </span>
          {notice.category && (
            <span className="px-[0.5rem] py-[0.125rem] rounded-[0.375rem] text-[0.5625rem] font-medium flex items-center gap-[0.25rem]" style={{ background: 'var(--brand)15', color: 'var(--brand)' }}>
              <Tag size={8} /> {notice.category}
            </span>
          )}
          <span className="px-[0.5rem] py-[0.125rem] rounded-[0.375rem] text-[0.5625rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center gap-[0.25rem]">
            <Users size={8} /> {bn ? target.labelBn : target.label}
          </span>
        </div>

        {/* Title + Content preview */}
        <div>
          <h3 className="text-[0.875rem] font-bold text-[var(--text-primary)] leading-snug mb-[0.375rem]">
            {bn ? notice.titleBn : notice.title}
          </h3>
          <p className="text-[0.75rem] text-[var(--text-muted)] leading-[1.6] line-clamp-2">
            {plainContent}
          </p>
        </div>

        {/* Expires indicator */}
        {notice.expiresAt && (
          <div className="mt-[0.625rem] pt-[0.5rem] border-t border-[var(--border)] flex items-center gap-[0.25rem] text-[0.625rem] text-[var(--amber)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {bn ? `মেয়াদ: ${notice.expiresAt}` : `Expires: ${notice.expiresAt}`}
          </div>
        )}
      </div>
    </div>
  )
}

export const NoticeCard = memo(NoticeCardInner)
