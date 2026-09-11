import { ArrowLeft, Pin, PinOff, Edit3, Trash2, AlertTriangle, Info, Megaphone } from 'lucide-react'
import type { Notice, NoticePriority } from '@/store/noticeStore'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', labelBn: 'কম', color: 'var(--text-muted)' },
  { value: 'medium', label: 'Medium', labelBn: 'মাঝারি', color: 'var(--brand)' },
  { value: 'high', label: 'High', labelBn: 'বেশি', color: 'var(--orange)' },
  { value: 'urgent', label: 'Urgent', labelBn: 'জরুরি', color: 'var(--red)' },
]
const TARGET_OPTIONS = [
  { value: 'all', label: 'All', labelBn: 'সকল' },
  { value: 'students', label: 'Students', labelBn: 'শিক্ষার্থী' },
  { value: 'teachers', label: 'Teachers', labelBn: 'শিক্ষক' },
  { value: 'parents', label: 'Parents', labelBn: 'অভিভাবক' },
]
const PRIORITY_ICONS: Record<NoticePriority, typeof AlertTriangle> = {
  low: Info,
  medium: Megaphone,
  high: AlertTriangle,
  urgent: AlertTriangle,
}

interface Props {
  notice: Notice
  onBack: () => void
  onEdit: (n: Notice) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  canEdit: boolean
  canDelete: boolean
  bn: boolean
}

export function NoticeDetail({ notice, onBack, onEdit, onDelete, onTogglePin, canEdit: canEditNotice, canDelete: canDeleteNotice, bn }: Props) {
  const priority = PRIORITY_OPTIONS.find((p) => p.value === notice.priority) || PRIORITY_OPTIONS[0]
  const target = TARGET_OPTIONS.find((t) => t.value === notice.target)
  const PriorityIcon = PRIORITY_ICONS[notice.priority] || Megaphone

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-[1rem] text-[var(--text-primary)]">
            {bn ? notice.titleBn : notice.title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[0.625rem] font-bold text-white" style={{ background: priority.color }}>
              <PriorityIcon size={14} />
            </div>
            <div>
              <span className="text-[0.75rem] font-medium text-[var(--text-primary)]">{bn ? notice.authorBn : notice.author}</span>
              <span className="text-[0.625rem] text-[var(--text-muted)] ml-2">
                {new Date(notice.publishedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {canEditNotice && (
            <button onClick={() => onTogglePin(notice.id)} className="px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]" title={notice.pinned ? (bn ? 'পিন সরান' : 'Unpin') : (bn ? 'পিন করুন' : 'Pin')}>
              {notice.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          )}
          {canEditNotice && (
            <button onClick={() => onEdit(notice)} className="px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
              <Edit3 size={14} />
            </button>
          )}
          {canDeleteNotice && (
            <button onClick={() => onDelete(notice.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--red)]">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {notice.pinned && (
          <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium" style={{ background: 'var(--brand)15', color: 'var(--brand)' }}>
            {bn ? 'পিন করা' : 'Pinned'}
          </span>
        )}
        <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium" style={{ background: `${priority.color}15`, color: priority.color }}>
          {bn ? priority.labelBn : priority.label}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
          {bn ? target?.labelBn : target?.label}
        </span>
        {notice.expiresAt && (
          <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium bg-[var(--orange)]/10 text-[var(--orange)]">
            {bn ? `মেয়াদ: ${notice.expiresAt}` : `Expires: ${notice.expiresAt}`}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4">
        <div className="text-[0.875rem] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
          {bn ? notice.contentBn : notice.content}
        </div>
      </div>
    </div>
  )
}
