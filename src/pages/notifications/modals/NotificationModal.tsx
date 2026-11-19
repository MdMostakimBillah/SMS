import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X, Info, CheckCircle, AlertTriangle, XCircle, Link as LinkIcon, Send, Radio, Sparkles, CreditCard, GraduationCap, Megaphone } from 'lucide-react'
import { useNotificationStore, notificationId, type Notification, type NotificationType, type NotificationCategory } from '@/store/notificationStore'
import { useAuth } from '@/contexts/AuthContext'
import ModernCheckbox from '@/components/ui/ModernCheckbox'

const inputCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10'
const textareaCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 resize-none'
const labelCls = 'block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[5px]'

const CATEGORY_OPTIONS: { value: NotificationCategory; label: string; labelBn: string; icon: typeof Sparkles }[] = [
  { value: 'system', label: 'System & Software Update', labelBn: 'সফটওয়্যার ও সিস্টেম আপডেট', icon: Sparkles },
  { value: 'billing', label: 'Payment & Billing', labelBn: 'পেমেন্ট ও বিলিং', icon: CreditCard },
  { value: 'academic', label: 'Academic & Operations', labelBn: 'একাডেমিক ও কার্যক্রম', icon: GraduationCap },
  { value: 'general', label: 'General Announcement', labelBn: 'সাধারণ ঘোষণা', icon: Megaphone },
]

const TYPE_OPTIONS: { value: NotificationType; label: string; labelBn: string; icon: typeof Info; color: string; bg: string }[] = [
  { value: 'info', label: 'Info', labelBn: 'তথ্য', icon: Info, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)' },
  { value: 'success', label: 'Success', labelBn: 'সফল', icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-light)' },
  { value: 'warning', label: 'Warning', labelBn: 'সতর্কতা', icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-light)' },
  { value: 'error', label: 'Alert / Error', labelBn: 'জরুরি / ত্রুটি', icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)' },
]

const QUICK_LINKS = [
  { label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', path: '/dashboard' },
  { label: 'Exams', labelBn: 'পরীক্ষা', path: '/exams' },
  { label: 'Finance', labelBn: 'অর্থ', path: '/finance' },
  { label: 'Settings', labelBn: 'সেটিংস', path: '/settings' },
  { label: 'Attendance', labelBn: 'উপস্থিতি', path: '/attendance' },
  { label: 'Notice Board', labelBn: 'নোটিশ', path: '/notice' },
]

interface Props {
  existing?: Notification | null
  onSaved: () => void
  onClose: () => void
  bn: boolean
}

export function NotificationModal({ existing, onSaved, onClose, bn }: Props) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const addNotification = useNotificationStore((s) => s.addNotification)
  const updateNotification = useNotificationStore((s) => s.updateNotification)
  const broadcastNotification = useNotificationStore((s) => s.broadcastNotification)

  const [category, setCategory] = useState<NotificationCategory>(existing?.category || (isSuperAdmin ? 'system' : 'general'))
  const [type, setType] = useState<NotificationType>(existing?.type || 'info')
  const [title, setTitle] = useState(existing?.title || '')
  const [titleBn, setTitleBn] = useState(existing?.titleBn || '')
  const [message, setMessage] = useState(existing?.message || '')
  const [messageBn, setMessageBn] = useState(existing?.messageBn || '')
  const [link, setLink] = useState(existing?.link || '')
  const [broadcastToAll, setBroadcastToAll] = useState(isSuperAdmin)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const validate = () => {
    const errs: Record<string, boolean> = {}
    if (!title.trim() && !titleBn.trim()) errs.title = true
    if (!message.trim() && !messageBn.trim()) errs.message = true
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    const primaryTitle = title.trim() || titleBn.trim()
    const primaryTitleBn = titleBn.trim() || primaryTitle
    const primaryMessage = message.trim() || messageBn.trim()
    const primaryMessageBn = messageBn.trim() || primaryMessage
    const cleanLink = link.trim() || undefined
    const senderName = isSuperAdmin ? 'Super Admin (EduTech)' : (user?.name || 'Institution Admin')

    if (existing) {
      updateNotification(existing.id, {
        title: primaryTitle,
        titleBn: primaryTitleBn,
        message: primaryMessage,
        messageBn: primaryMessageBn,
        type,
        category,
        link: cleanLink,
      })
    } else {
      const newNotif: Notification = {
        id: notificationId(),
        title: primaryTitle,
        titleBn: primaryTitleBn,
        message: primaryMessage,
        messageBn: primaryMessageBn,
        type,
        category,
        read: false,
        link: cleanLink,
        sender: senderName,
        senderRole: user?.role || 'admin',
        broadcastToAll: isSuperAdmin && broadcastToAll,
        createdAt: new Date().toISOString(),
      }

      if (isSuperAdmin && broadcastToAll) {
        await broadcastNotification(newNotif)
      } else {
        addNotification(newNotif)
      }
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--bg-primary)] rounded-2xl w-[35rem] max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0">
                {existing
                  ? (bn ? 'নোটিফিকেশন সম্পাদনা' : 'Edit Notification')
                  : (bn ? 'নতুন নোটিফিকেশন প্রেরণ' : 'Compose Notification')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)] m-0">
                {isSuperAdmin
                  ? (bn ? 'সকল প্রতিষ্ঠানে সফটওয়্যার ও সিস্টেম আপডেট সম্প্রচার করুন' : 'Broadcast software update & announcements to institutions')
                  : (bn ? 'প্রতিষ্ঠানের সদস্যদের জন্য নোটিফিকেশন তৈরি করুন' : 'Send announcement or alert to institution members')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Super Admin Broadcast Option */}
          {isSuperAdmin && !existing && (
            <div className="p-3 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Radio size={16} className="text-[var(--brand)] shrink-0" />
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {bn ? 'সকল প্রতিষ্ঠানে সম্প্রচার করুন' : 'Broadcast to all institutions'}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)]">
                    {bn ? 'সিস্টেম বা সফটওয়্যার আপডেট নোটিফিকেশন সব স্কুলের ড্যাশবোর্ডে যাবে' : 'Every active school will receive this notification immediately'}
                  </div>
                </div>
              </div>
              <ModernCheckbox checked={broadcastToAll} onChange={() => setBroadcastToAll(!broadcastToAll)} />
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className={labelCls}>{bn ? 'বিভাগ / ক্যাটাগরি' : 'Notification Category'}</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((c) => {
                const Icon = c.icon
                const isSelected = category === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] font-semibold'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="text-[0.75rem] truncate">{bn ? c.labelBn : c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notification Type Selector */}
          <div>
            <label className={labelCls}>{bn ? 'ধরন' : 'Alert Level'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = type === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-[var(--brand)] shadow-sm bg-[var(--brand)]/5'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: opt.bg, color: opt.color }}>
                      <Icon size={12} />
                    </div>
                    <span className={`text-[0.75rem] ${isSelected ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] font-medium'}`}>
                      {bn ? opt.labelBn : opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                {bn ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'}
                <span className="text-[var(--red)] ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Update / Payment Reminder"
                className={`${inputCls} ${errors.title ? 'border-[var(--red)] ring-1 ring-[var(--red)]/20' : ''}`}
              />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'}</label>
              <input
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="যেমন: সফটওয়্যার আপডেট / পেমেন্ট তাগিদ"
                className={inputCls}
              />
            </div>
          </div>

          {/* Message Textareas */}
          <div className="space-y-3">
            <div>
              <label className={labelCls}>
                {bn ? 'বার্তা (ইংরেজি)' : 'Message (English)'}
                <span className="text-[var(--red)] ml-0.5">*</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter detailed notification content..."
                className={`${textareaCls} ${errors.message ? 'border-[var(--red)] ring-1 ring-[var(--red)]/20' : ''}`}
              />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'বার্তা (বাংলা)' : 'Message (Bengali)'}</label>
              <textarea
                rows={3}
                value={messageBn}
                onChange={(e) => setMessageBn(e.target.value)}
                placeholder="বিস্তারিত বার্তা লিখুন..."
                className={textareaCls}
              />
            </div>
          </div>

          {/* Optional Action Link */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>{bn ? 'নেভিগেশন লিংক (ঐচ্ছিক)' : 'Action Link (Optional)'}</label>
              <span className="text-[0.625rem] text-[var(--text-muted)] flex items-center gap-1">
                <LinkIcon size={10} /> {bn ? 'ক্লিক করলে পেজে নিয়ে যাবে' : 'Directs user on click'}
              </span>
            </div>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /dashboard, /settings, /finance"
              className={inputCls}
            />
            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[0.6875rem] text-[var(--text-muted)] mr-1">{bn ? 'দ্রুত লিংক:' : 'Quick:'}</span>
              {QUICK_LINKS.map((ql) => (
                <button
                  key={ql.path}
                  type="button"
                  onClick={() => setLink(ql.path)}
                  className={`text-[0.6875rem] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    link === ql.path
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/50'
                  }`}
                >
                  {bn ? ql.labelBn : ql.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[0.75rem] font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors cursor-pointer border-none bg-transparent"
          >
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold hover:opacity-90 transition-opacity cursor-pointer border-none shadow-sm"
          >
            <Send size={13} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update Notification') : (bn ? 'নোটিফিকেশন পাঠান' : 'Send Notification')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
