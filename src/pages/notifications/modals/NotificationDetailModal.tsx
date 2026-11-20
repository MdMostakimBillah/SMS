import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Clock,
  Sparkles,
  CreditCard,
  GraduationCap,
  Megaphone,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Building2,
} from 'lucide-react'
import type { Notification, NotificationType, NotificationCategory } from '@/store/notificationStore'

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; labelBn: string; icon: typeof Info; color: string; bg: string }
> = {
  info: {
    label: 'Info',
    labelBn: 'তথ্য',
    icon: Info,
    color: 'var(--brand)',
    bg: 'color-mix(in srgb, var(--brand) 12%, transparent)',
  },
  success: {
    label: 'Success',
    labelBn: 'সফল',
    icon: CheckCircle2,
    color: 'var(--green)',
    bg: 'var(--green-light)',
  },
  warning: {
    label: 'Warning',
    labelBn: 'সতর্কতা',
    icon: AlertTriangle,
    color: 'var(--orange)',
    bg: 'var(--orange-light)',
  },
  error: {
    label: 'Alert',
    labelBn: 'জরুরি',
    icon: XCircle,
    color: 'var(--red)',
    bg: 'var(--red-light)',
  },
}

const CATEGORY_CONFIG: Record<
  NotificationCategory,
  { label: string; labelBn: string; icon: typeof Sparkles; color: string }
> = {
  system: {
    label: 'Software & Updates',
    labelBn: 'সফটওয়্যার ও সিস্টেম আপডেট',
    icon: Sparkles,
    color: 'var(--brand)',
  },
  billing: {
    label: 'Monthly Payment & Billing',
    labelBn: 'মাসিক পেমেন্ট ও বিলিং',
    icon: CreditCard,
    color: '#D12053',
  },
  academic: {
    label: 'Academic & Operations',
    labelBn: 'একাডেমিক ও কার্যক্রম',
    icon: GraduationCap,
    color: 'var(--teal)',
  },
  general: {
    label: 'General Announcement',
    labelBn: 'সাধারণ ঘোষণা',
    icon: Megaphone,
    color: 'var(--purple)',
  },
}

interface Props {
  notification: Notification
  onClose: () => void
  onToggleRead: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (item: Notification) => void
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

  const typeConf = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info
  const catConf = CATEGORY_CONFIG[notification.category || 'general'] || CATEGORY_CONFIG.general
  const senderDisplayName =
    notification.sender || (notification.category === 'system' ? 'Super Admin' : 'Admin')
  const displayTitle =
    (bn ? notification.titleBn || notification.title : notification.title || notification.titleBn) ||
    ''
  const displayMessage =
    (bn
      ? notification.messageBn || notification.message
      : notification.message || notification.messageBn) || ''

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 modal-backdrop-animate"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-[var(--bg-primary)] rounded-2xl sm:rounded-3xl w-[36rem] max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden modal-card-animate"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5"
              style={{ background: typeConf.bg, color: typeConf.color }}
            >
              <typeConf.icon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="inline-flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{ background: `${catConf.color}18`, color: catConf.color }}
                >
                  <catConf.icon size={11} />
                  {bn ? catConf.labelBn : catConf.label}
                </span>

                <span
                  className="inline-flex items-center text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{ background: typeConf.bg, color: typeConf.color }}
                >
                  {bn ? typeConf.labelBn : typeConf.label}
                </span>

                {notification.targetType === 'specific' ? (
                  <span className="inline-flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                    <Building2 size={10} />
                    {bn ? 'নির্দিষ্ট প্রতিষ্ঠান' : 'Targeted'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--teal-light)] text-[var(--teal)]">
                    <Sparkles size={10} />
                    {bn ? 'সকল প্রতিষ্ঠান' : 'All Institutes'}
                  </span>
                )}
              </div>

              <h2 className="text-[1.0625rem] font-bold text-[var(--text-primary)] leading-snug m-0">
                {displayTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] flex items-center justify-center cursor-pointer transition-colors shrink-0"
            title={bn ? 'বন্ধ করুন' : 'Close'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Sender & Timestamp Card */}
          <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between gap-3 text-[0.75rem]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">{bn ? 'প্রেরক:' : 'From:'}</span>
              <span className="font-bold text-[var(--text-primary)]">{senderDisplayName}</span>
              {notification.senderRole && (
                <span className="px-1.5 py-0.2 rounded text-[0.625rem] font-medium bg-[var(--border)] text-[var(--text-secondary)]">
                  {notification.senderRole}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[0.6875rem]">
              <Clock size={12} />
              <span>
                {new Date(notification.createdAt).toLocaleString(bn ? 'bn-BD' : 'en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          {/* Targeted Institutions Badge/List (if targeted) */}
          {notification.targetType === 'specific' && notification.targetInstitutionNames && notification.targetInstitutionNames.length > 0 && (
            <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-2.5">
              <Building2 size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-indigo-500">
                  {bn ? 'টার্গেট প্রতিষ্ঠান' : 'Targeted Institutions'}
                </div>
                <div className="text-[0.75rem] text-[var(--text-primary)] font-medium mt-1 flex flex-wrap gap-1.5">
                  {notification.targetInstitutionNames.map((name, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-indigo-500/20 text-indigo-600 text-[0.6875rem] font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bilingual Secondary Title */}
          {notification.titleBn &&
            notification.title &&
            notification.titleBn !== notification.title && (
              <div className="text-[0.75rem] font-medium text-[var(--text-muted)] italic">
                {bn ? notification.title : notification.titleBn}
              </div>
            )}

          {/* Main Message Body */}
          <div className="text-[0.875rem] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap select-text">
            {displayMessage}
          </div>

          {/* Attached Action Link (Optional Button inside modal) */}
          {notification.link && (
            <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                  {bn ? 'সংযুক্ত পেজ লিংক' : 'Attached Action Link'}
                </div>
                <div className="text-[0.75rem] font-mono text-[var(--brand)] truncate max-w-xs sm:max-w-md">
                  {notification.link}
                </div>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onNavigate(notification.link!)
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold hover:opacity-90 transition-opacity cursor-pointer border-none shadow-sm shrink-0"
                >
                  <ExternalLink size={13} />
                  {bn ? 'পেজে যান' : 'Go to Page'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleRead(notification.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] text-[0.75rem] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer bg-transparent"
            >
              {notification.read ? <EyeOff size={14} /> : <Eye size={14} />}
              {notification.read
                ? bn
                  ? 'অপঠিত করুন'
                  : 'Mark Unread'
                : bn
                  ? 'পঠিত করুন'
                  : 'Mark Read'}
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEdit(notification)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] text-[0.75rem] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--brand)] transition-colors cursor-pointer bg-transparent"
                title={bn ? 'সম্পাদনা' : 'Edit'}
              >
                <Edit3 size={14} />
                {bn ? 'সম্পাদনা' : 'Edit'}
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(notification.id)
                  onClose()
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent text-[0.75rem] font-medium"
                title={bn ? 'মুছুন' : 'Delete'}
              >
                <Trash2 size={14} />
                {bn ? 'মুছুন' : 'Delete'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--border)] hover:bg-[var(--border)]/80 text-[var(--text-primary)] text-[0.75rem] font-semibold transition-colors cursor-pointer border-none"
          >
            {bn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
