import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  id: string
  children: ReactNode
  title: string
  colSpan?: number
  isEditing?: boolean
}

export default function SortableWidget({ id, children, title, colSpan = 2, isEditing }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditing })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    gridColumn: `span ${colSpan}`,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: '1rem',
    boxShadow: 'var(--shadow-xs)',
    position: 'relative',
  }

  const titleBar: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  }

  const bar = (color: string) => (
    <div style={{ width: '0.1875rem', height: '0.875rem', background: color, borderRadius: '0.125rem', flexShrink: 0 }} />
  )

  const colorMap: Record<string, string> = {
    'stat-students': 'var(--brand)',
    'stat-teachers': 'var(--amber)',
    'stat-approved': 'var(--green)',
    'stat-pending': 'var(--purple)',
    'enrollment-trend': 'var(--brand)',
    'class-distribution': 'var(--amber)',
    'status-distribution': 'var(--green)',
    'gender-ratio': 'var(--purple)',
    'teacher-status': 'var(--amber)',
    'quick-stats': 'var(--teal)',
    'recent-admissions': 'var(--brand)',
    'upcoming-events': 'var(--teal)',
    'top-students': 'var(--amber)',
    'academic-overview': 'var(--green)',
    'exam-overview': 'var(--brand)',
    'hr-summary': 'var(--teal)',
  }

  return (
    <div ref={setNodeRef} style={style} className="card--premium">
      <div style={titleBar}>
        {isEditing && (
          <div
            {...attributes}
            {...listeners}
            style={{
              cursor: 'grab',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '0.25rem',
              touchAction: 'none',
            }}
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </div>
        )}
        {bar(colorMap[id] || 'var(--brand)')}
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}
