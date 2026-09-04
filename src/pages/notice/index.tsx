import { useState, useMemo, useEffect } from 'react'
import { Plus, Megaphone, Pin, PinOff, Edit3, Trash2, X, AlertTriangle, Info } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useNoticeStore, type Notice, type NoticeTarget, type NoticePriority, noticeId } from '@/store/noticeStore'
import { useAuth } from '@/contexts/AuthContext'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

const selectCls = 'px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer appearance-none pr-7 bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75rem] bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")]'
const inputCls = 'px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'
const textareaCls = inputCls + ' resize-none'

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

const PRIORITY_ICONS: Record<NoticePriority, typeof AlertTriangle> = {
  low: Info,
  medium: Megaphone,
  high: AlertTriangle,
  urgent: AlertTriangle,
}

export default function NoticeBoardPage() {
  const bn = useBn()
  usePermission()
  const { isMobile } = useWindowSize()
  const notices = useNoticeStore((s) => s.notices)
  const addNotice = useNoticeStore((s) => s.addNotice)
  const updateNotice = useNoticeStore((s) => s.updateNotice)
  const deleteNotice = useNoticeStore((s) => s.deleteNotice)
  const togglePin = useNoticeStore((s) => s.togglePin)

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Notice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [filterTarget, setFilterTarget] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    let list = notices.filter((n) => n.isActive)
    if (filterTarget) list = list.filter((n) => n.target === filterTarget)
    if (filterPriority) list = list.filter((n) => n.priority === filterPriority)
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
  }, [notices, filterTarget, filterPriority])

  const pinnedCount = useMemo(() => notices.filter((n) => n.pinned && n.isActive).length, [notices])

  const handleSave = (data: Omit<Notice, 'id'>) => {
    if (editItem) {
      updateNotice(editItem.id, data)
    } else {
      addNotice({ ...data, id: noticeId() })
    }
    setShowModal(false)
    setEditItem(null)
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
            {bn ? 'নোটিশ বোর্ড' : 'Notice Board'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mt-0.5">
            {bn ? `মোট: ${filtered.length}টি নোটিশ` : `Total: ${filtered.length} notices`}
            {pinnedCount > 0 && ` · ${bn ? `${pinnedCount}টি পিন করা` : `${pinnedCount} pinned`}`}
          </p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.8125rem] font-medium text-white transition-colors"
          style={{ background: 'var(--brand)' }}
        >
          <Plus size={16} />
          {bn ? 'নোটিশ তৈরি' : 'Create Notice'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={filterTarget} onChange={(e) => setFilterTarget(e.target.value)} className={selectCls}>
          <option value="">{bn ? 'সকল মূল্যায়ন' : 'All Targets'}</option>
          {TARGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className={selectCls}>
          <option value="">{bn ? 'সকল অগ্রাধিকার' : 'All Priorities'}</option>
          {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
        </select>
      </div>

      {/* Notice List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <Megaphone size={48} className="mb-3 opacity-30" />
          <p className="text-[0.9375rem]">{bn ? 'কোনো নোটিশ নেই' : 'No notices yet'}</p>
          <p className="text-[0.75rem] mt-1">{bn ? 'নতুন নোটিশ তৈরি করতে উপরের বোতাম ক্লিক করুন' : 'Click the button above to create a notice'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notice) => {
            const priority = PRIORITY_OPTIONS.find((p) => p.value === notice.priority) || PRIORITY_OPTIONS[0]
            const PriorityIcon = PRIORITY_ICONS[notice.priority] || Megaphone
            const target = TARGET_OPTIONS.find((t) => t.value === notice.target)
            return (
              <div
                key={notice.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all hover:border-[var(--brand)]"
                style={notice.pinned ? { borderColor: 'var(--brand)', borderWidth: '2px' } : {}}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 rounded-lg" style={{ background: `${priority.color}15`, color: priority.color }}>
                    <PriorityIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {notice.pinned && (
                        <span className="text-[0.625rem] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'var(--brand)15', color: 'var(--brand)' }}>
                          {bn ? 'পিন' : 'Pinned'}
                        </span>
                      )}
                      <span className="text-[0.625rem] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${priority.color}15`, color: priority.color }}>
                        {bn ? priority.labelBn : priority.label}
                      </span>
                      <span className="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                        {bn ? target?.labelBn : target?.label}
                      </span>
                      <span className="text-[0.625rem] text-[var(--text-muted)] ml-auto">
                        {new Date(notice.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[0.9375rem] text-[var(--text-primary)] mb-1">
                      {bn ? notice.titleBn : notice.title}
                    </h3>
                    <p className="text-[0.8125rem] text-[var(--text-secondary)] line-clamp-3 whitespace-pre-line">
                      {bn ? notice.contentBn : notice.content}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[0.6875rem] text-[var(--text-muted)]">
                        {bn ? notice.authorBn : notice.author}
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          onClick={() => togglePin(notice.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                          title={notice.pinned ? (bn ? 'পিন সরান' : 'Unpin') : (bn ? 'পিন করুন' : 'Pin')}
                        >
                          {notice.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                        </button>
                        <button
                          onClick={() => { setEditItem(notice); setShowModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                          title={bn ? 'সম্পাদনা' : 'Edit'}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(notice.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--red)] transition-colors"
                          title={bn ? 'মুছুন' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <NoticeModal
          item={editItem}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          bn={bn}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmDialog
          onConfirm={() => { deleteNotice(deleteTarget); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
          title={bn ? 'নোটিশ মুছুন' : 'Delete Notice'}
          message={bn ? 'আপনি কি নিশ্চিত এই নোটিশ মুছে ফেলতে চান?' : 'Are you sure you want to delete this notice?'}
          isBn={bn}
        />
      )}
    </div>
  )
}

function NoticeModal({ item, onSave, onClose, bn }: { item: Notice | null; onSave: (data: Omit<Notice, 'id'>) => void; onClose: () => void; bn: boolean }) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[1rem] text-[var(--text-primary)]">
            {item ? (bn ? 'নোটিশ সম্পাদনা' : 'Edit Notice') : (bn ? 'নতুন নোটিশ' : 'New Notice')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'} *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls + ' w-full'} required />
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'শিরোনাম (বাংলা)' : 'Title (Bangla)'}</label>
            <input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} className={inputCls + ' w-full'} placeholder={bn ? 'বাংলায় শিরোনাম' : 'Title in Bangla'} />
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'বিষয়বস্তু (ইংরেজি)' : 'Content (English)'} *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className={textareaCls + ' w-full'} required />
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'বিষয়বস্তু (বাংলা)' : 'Content (Bangla)'}</label>
            <textarea value={contentBn} onChange={(e) => setContentBn(e.target.value)} rows={4} className={textareaCls + ' w-full'} placeholder={bn ? 'বাংলায় বিষয়বস্তু' : 'Content in Bangla'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'মূল্যায়ন' : 'Target'}</label>
              <select value={target} onChange={(e) => setTarget(e.target.value as NoticeTarget)} className={selectCls + ' w-full'}>
                {TARGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'অগ্রাধিকার' : 'Priority'}</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as NoticePriority)} className={selectCls + ' w-full'}>
                {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{bn ? o.labelBn : o.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1">{bn ? 'মেয়াদ শেষ' : 'Expires At'}</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls + ' w-full'} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[0.8125rem] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]">
              {bn ? 'বাতিল' : 'Cancel'}
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-[0.8125rem] font-medium text-white" style={{ background: 'var(--brand)' }}>
              {item ? (bn ? 'আপডেট' : 'Update') : (bn ? 'প্রকাশ' : 'Publish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
