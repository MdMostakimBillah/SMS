import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Megaphone, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { Notice, NoticeTarget, NoticePriority } from '@/store/noticeStore'

const TARGET_OPTIONS = [
  { value: 'all', label: 'All', labelBn: 'সকল' },
  { value: 'students', label: 'Students', labelBn: 'শিক্ষার্থী' },
  { value: 'teachers', label: 'Teachers', labelBn: 'শিক্ষক' },
  { value: 'parents', label: 'Parents', labelBn: 'অভিভাবক' },
]
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', labelBn: 'কম', color: 'var(--text-muted)' },
  { value: 'medium', label: 'Medium', labelBn: 'মাঝারি', color: 'var(--brand)' },
  { value: 'high', label: 'High', labelBn: 'বেশি', color: 'var(--orange)' },
  { value: 'urgent', label: 'Urgent', labelBn: 'জরুরি', color: 'var(--red)' },
]

interface Props {
  item: Notice | null
  onSave: (data: Omit<Notice, 'id'>) => void
  onClose: () => void
  bn: boolean
}

export function NoticeModal({ item, onSave, onClose, bn }: Props) {
  const { user } = useAuth()
  const [title, setTitle] = useState(item?.title || '')
  const [titleBn, setTitleBn] = useState(item?.titleBn || '')
  const [content, setContent] = useState(item?.content || '')
  const [contentBn, setContentBn] = useState(item?.contentBn || '')
  const [target, setTarget] = useState<NoticeTarget>(item?.target || 'all')
  const [priority, setPriority] = useState<NoticePriority>(item?.priority || 'medium')
  const [expiresAt, setExpiresAt] = useState(item?.expiresAt || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    onSave({
      title: title.trim(),
      titleBn: titleBn.trim() || title.trim(),
      content: content.trim(),
      contentBn: contentBn.trim() || content.trim(),
      author: user?.name || 'Admin',
      authorBn: user?.name || 'Admin',
      target,
      priority,
      pinned: item?.pinned || false,
      isActive: item?.isActive ?? true,
      publishedAt: item?.publishedAt || new Date().toISOString(),
      expiresAt: expiresAt || '',
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-primary)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl" style={{ background: 'var(--brand)' }}>
          <h3 className="font-semibold text-[0.9375rem] text-white flex items-center gap-2">
            <Megaphone size={16} />
            {item ? (bn ? 'নোটিশ সম্পাদনা' : 'Edit Notice') : (bn ? 'নতুন নোটিশ' : 'New Notice')}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-auto">
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'শিরোনাম (ইংরেজি)*' : 'Title (English)*'}</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" required />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'শিরোনাম (বাংলা)' : 'Title (Bangla)'}</label>
            <input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" placeholder={bn ? 'বাংলায় শিরোনাম' : 'Title in Bangla'} />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'বিষয়বস্তু (ইংরেজি)*' : 'Content (English)*'}</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors resize-none leading-relaxed" required />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'বিষয়বস্তু (বাংলা)' : 'Content (Bangla)'}</label>
            <textarea value={contentBn} onChange={(e) => setContentBn(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors resize-none leading-relaxed" placeholder={bn ? 'বাংলায় বিষয়বস্তু' : 'Content in Bangla'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'মূল্যায়ন' : 'Target'}</label>
              <select value={target} onChange={(e) => setTarget(e.target.value as NoticeTarget)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                {TARGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'অগ্রাধিকার' : 'Priority'}</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as NoticePriority)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer">
                {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-medium text-[var(--text-muted)] mb-1">{bn ? 'মেয়াদ শেষ' : 'Expires At'}</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium text-white transition-opacity hover:opacity-90" style={{ background: 'var(--brand)' }}>
              {item ? (bn ? 'আপডেট' : 'Update') : (bn ? 'প্রকাশ' : 'Publish')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
