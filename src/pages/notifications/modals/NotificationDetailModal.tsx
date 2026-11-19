import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ExternalLink, Calendar, Check, Clock, Trash2, Edit3, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import type { Notification, NotificationType } from '@/store/notificationStore'

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Info; color: string; bg: string; label: string; labelBn: string }> = {
  info: { icon: Info, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)', label: 'Information', labelBn: 'তথ্য' },
  success: { icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-light)', label: 'Success', labelBn: 'সফল' },
  warning: { icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-light)', label: 'Warning', labelBn: 'সতর্কতা' },
  error: { icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)', label: 'Alert', labelBn: 'জরুরি' },
}

interface Props {
  notification: Notification
  onClose: () => void
  onToggleRead: (id: string) => void
  onDelete: (id: string) => void
  onEdit?: (notification: Notification) => void
  onNavigate?: (link: string) => void
  bn: boolean
}

export function NotificationDetailModal({
  notification,
  onClose,
  onToggleRead,
  onDelete,
  onEdit,
  onNavigate,
  bn,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const typeInfo = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info
  const Icon = typeInfo.icon
  const displayTitle = (bn ? notification.titleBn || notification.title : notification.title || notification.titleBn) || ''
  const displayMessage = (bn ? notification.messageBn || notification.message : notification.message || notification.messageBn) || ''

  const formattedDate = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString(bn ? 'bn-BD' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : ''

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--bg-primary)] rounded-2xl w-[32.5rem] max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: typeInfo.bg, color: typeInfo.color }}>
              <Icon size={18} />
            </div>
            <div>
              <span className="text-[0.625rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: typeInfo.bg, color: typeInfo.color }}>
                {bn ? typeInfo.labelBn : typeInfo.label}
              </span>
              <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                <Calendar size={11} />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <h2 className="text-[1.125rem] font-bold text-[var(--text-primary)] leading-snug m-0">
              {displayTitle}
            </h2>
            {notification.titleBn && notification.title && notification.titleBn !== notification.title && (
              <p className="text-[0.75rem] text-[var(--text-muted)] mt-1">
                {bn ? notification.title : notification.titleBn}
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[0.8125rem] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
            {displayMessage}
          </div>

          {notification.link && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5">
              <span className="text-[0.75rem] text-[var(--text-secondary)] font-mono truncate max-w-[17.5rem]">
                {notification.link}
              </span>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(notification.link!)
                    onClose()
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-semibold hover:opacity-90 transition-opacity cursor-pointer border-none"
                >
                  <ExternalLink size={12} />
                  {bn ? 'পেজে যান' : 'Go to Page'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleRead(notification.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium border transition-colors cursor-pointer ${
                notification.read
                  ? 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                  : 'border-[var(--brand)] text-[var(--brand)] bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20'
              }`}
            >
              {notification.read ? <Clock size={13} /> : <Check size={13} />}
              {notification.read ? (bn ? 'অপঠিত চিহ্নিত করুন' : 'Mark as Unread') : (bn ? 'পঠিত চিহ্নিত করুন' : 'Mark as Read')}
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(notification.id)
                onClose()
              }}
              className="p-2 rounded-lg text-[var(--red)] hover:bg-[var(--red-light)] transition-colors cursor-pointer border border-[var(--border)]"
              title={bn ? 'মুছে ফেলুন' : 'Delete'}
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEdit(notification)
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors cursor-pointer bg-transparent text-[0.75rem] font-medium"
              >
                <Edit3 size={13} />
                {bn ? 'সম্পাদনা' : 'Edit'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[var(--text-secondary)] text-white text-[0.75rem] font-medium hover:opacity-90 transition-opacity cursor-pointer border-none"
            >
              {bn ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
