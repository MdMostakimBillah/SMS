import React from 'react'
import { Eye, Edit2, Trash2, BookOpen, FileText } from 'lucide-react'
import type { Assignment } from '@/store/assignmentStore'
import { toBnNum } from '@/lib/i18n'

export interface AssignmentCardProps {
  item: Assignment
  isBn: boolean
  isMobile: boolean
  subjectName: string
  className: string
  sectionName: string
  teacherName: string
  canEdit: boolean
  canDelete: boolean
  onView: (item: Assignment) => void
  onEdit: (item: Assignment) => void
  onDelete: (item: Assignment) => void
}

export const AssignmentCard = React.memo(function AssignmentCard({
  item,
  isBn,
  isMobile,
  subjectName,
  className,
  sectionName,
  teacherName,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: AssignmentCardProps) {
  const isHomework = item.type === 'homework'
  const typeLabel = isBn
    ? isHomework
      ? 'গৃহকাজ'
      : 'অ্যাসাইনমেন্ট'
    : isHomework
    ? 'Homework'
    : 'Assignment'
  const title = isBn ? item.titleBn || item.title : item.title || item.titleBn

  return (
    <div
      className="glass flex items-center gap-3"
      style={{
        borderRadius: '0.5rem',
        padding: isMobile ? '10px 12px' : '0.75rem 1rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${isHomework ? 'var(--amber)' : 'var(--brand)'}`,
      }}
      onClick={() => onView(item)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-secondary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = ''
      }}
    >
      {/* Type Icon */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: '0.5rem',
          background: isHomework ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
        }}
      >
        {isHomework ? (
          <BookOpen size={16} style={{ color: 'var(--amber)' }} />
        ) : (
          <FileText size={16} style={{ color: 'var(--brand)' }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: isMobile ? '0.8125rem' : '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              color: isHomework ? 'var(--amber)' : 'var(--brand)',
            }}
          >
            {typeLabel}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {subjectName} · {className}-{sectionName}
          {item.maxMarks > 0 ? ` · ${isBn ? toBnNum(item.maxMarks) : item.maxMarks}${isBn ? ' নম্বর' : ' marks'}` : ''}
          {teacherName ? ` · ${teacherName}` : ''}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-0.5 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onView(item)}
          className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] transition-colors border-none bg-transparent cursor-pointer"
          title={isBn ? 'বিস্তারিত দেখুন' : 'View Details'}
        >
          <Eye size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] transition-colors border-none bg-transparent cursor-pointer"
            title={isBn ? 'সম্পাদনা' : 'Edit'}
          >
            <Edit2 size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="p-1.5 rounded-md hover:bg-[var(--bg-primary)] transition-colors border-none bg-transparent cursor-pointer"
          >
            <Trash2 size={14} style={{ color: 'var(--red)' }} />
          </button>
        )}
      </div>
    </div>
  )
})
