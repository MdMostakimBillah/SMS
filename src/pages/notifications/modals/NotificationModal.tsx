import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell, X, Info, CheckCircle, AlertTriangle, XCircle, Link as LinkIcon, Send } from 'lucide-react'
import { useNotificationStore, notificationId, type Notification, type NotificationType } from '@/store/notificationStore'

const inputCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10'
const textareaCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 resize-none'
const labelCls = 'block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[5px]'

const TYPE_OPTIONS: { value: NotificationType; label: string; labelBn: string; icon: typeof Info; color: string; bg: string }[] = [
  { value: 'info', label: 'Info', labelBn: 'তথ্য', icon: Info, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)' },
  { value: 'success', label: 'Success', labelBn: 'সফল', icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-light)' },
  { value: 'warning', label: 'Warning', labelBn: 'সতর্কতা', icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-light)' },
  { value: 'error', label: 'Alert / Error', labelBn: 'জরুরি / ত্রুটি', icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)' },
]

const QUICK_LINKS = [
  { label: 'Exams', labelBn: 'পরীক্ষা', path: '/exams' },
  { label: 'Finance', labelBn: 'অর্থ', path: '/finance' },
  { label: 'Attendance', labelBn: 'উপস্থিতি', path: '/attendance' },
  { label: 'Notice Board', labelBn: 'নোটিশ বোর্ড', path: '/notice' },
  { label: 'Students', labelBn: 'শিক্ষার্থী', path: '/students' },
  { label: 'Syllabus', labelBn: 'পাঠ্যক্রম', path: '/syllabus' },
]

interface Props {
  existing?: Notification | null
  onSaved: () => void
  onClose: () => void
  bn: boolean
}

export function NotificationModal({ existing, onSaved, onClose, bn }: Props) {
  const addNotification = useNotificationStore((s) => s.addNotification)
  const updateNotification = useNotificationStore((s) => s.updateNotification)

  const [title, setTitle] = useState(existing?.title || '')
  const [titleBn, setTitleBn] = useState(existing?.titleBn || '')
  const [message, setMessage] = useState(existing?.message || '')
  const [messageBn, setMessageBn] = useState(existing?.messageBn || '')
  const [type, setType] = useState<NotificationType>(existing?.type || 'info')
  const [link, setLink] = useState(existing?.link || '')
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

  const handleSave = () => {
    if (!validate()) return
    const primaryTitle = title.trim() || titleBn.trim()
    const primaryTitleBn = titleBn.trim() || primaryTitle
    const primaryMessage = message.trim() || messageBn.trim()
    const primaryMessageBn = messageBn.trim() || primaryMessage
    const cleanLink = link.trim() || undefined

    if (existing) {
      updateNotification(existing.id, {
        title: primaryTitle,
        titleBn: primaryTitleBn,
        message: primaryMessage,
        messageBn: primaryMessageBn,
        type,
        link: cleanLink,
      })
    } else {
      addNotification({
        id: notificationId(),
        title: primaryTitle,
        titleBn: primaryTitleBn,
        message: primaryMessage,
        messageBn: primaryMessageBn,
        type,
        read: false,
        link: cleanLink,
        createdAt: new Date().toISOString(),
      })
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--bg-primary)] rounded-2xl w-[32.5rem] max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden"
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
                  : (bn ? 'নতুন নোটিফিকেশন তৈরি' : 'Create Notification')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)] m-0">
                {bn ? 'সকল সদস্যের কাছে বার্তা সম্প্রচার করুন' : 'Broadcast announcement to institution members'}
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
          {/* Notification Type Selector */}
          <div>
            <label className={labelCls}>{bn ? 'ধরন নির্বাচন করুন' : 'Notification Type'}</label>
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
                    <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: opt.bg, color: opt.color }}>
                      <Icon size={14} />
                    </div>
                    <span className={`text-[0.75rem] font-medium ${isSelected ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'}`}>
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
                placeholder="e.g. Exam Results Published"
                className={`${inputCls} ${errors.title ? 'border-[var(--red)] ring-1 ring-[var(--red)]/20' : ''}`}
              />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'}</label>
              <input
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="যেমন: পরীক্ষার ফলাফল প্রকাশিত"
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
                placeholder="Enter detailed notification message..."
                className={`${textareaCls} ${errors.message ? 'border-[var(--red)] ring-1 ring-[var(--red)]/20' : ''}`}
              />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'বার্তা (বাংলা)' : 'Message (Bengali)'}</label>
              <textarea
                rows={3}
                value={messageBn}
                onChange={(e) => setMessageBn(e.target.value)}
                placeholder="বিস্তারিত নোটিফিকেশন বার্তা লিখুন..."
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
              placeholder="e.g. /exams, /finance, /attendance"
              className={inputCls}
            />
            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[0.6875rem] text-[var(--text-muted)] mr-1">{bn ? 'দ্রুত নির্বাচন:' : 'Quick:'}</span>
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
