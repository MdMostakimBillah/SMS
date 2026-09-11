import { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, Megaphone, Pin, Search, AlertTriangle, Info } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useNoticeStore, type Notice, type NoticePriority, noticeId } from '@/store/noticeStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { NoticeDetail } from './NoticeDetail'
import { NoticeModal } from './NoticeModal'

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

const ALL_TABS = [
  { key: 'all', icon: Megaphone },
  { key: 'pinned', icon: Pin },
  { key: 'expired', icon: AlertTriangle },
]

export default function NoticeBoardPage() {
  const bn = useBn()
  const { canCreate, canEdit, canDelete } = usePermission()
  const { isMobile } = useWindowSize()
  const notices = useNoticeStore((s) => s.notices)
  const addNotice = useNoticeStore((s) => s.addNotice)
  const updateNotice = useNoticeStore((s) => s.updateNotice)
  const deleteNotice = useNoticeStore((s) => s.deleteNotice)
  const togglePin = useNoticeStore((s) => s.togglePin)

  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Notice | null>(null)
  const [viewNotice, setViewNotice] = useState<Notice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  useTabSlider({ activeTab, tabRefs, sliderRef })

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const isExpired = (n: Notice) => n.expiresAt && new Date(n.expiresAt) < new Date()

  const filtered = useMemo(() => {
    let list = notices.filter((n) => n.isActive)
    if (activeTab === 'pinned') list = list.filter((n) => n.pinned)
    if (activeTab === 'expired') list = list.filter((n) => isExpired(n))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((n) =>
        n.title.toLowerCase().includes(q) || n.titleBn.includes(search) ||
        n.content.toLowerCase().includes(q) || n.contentBn.includes(search) ||
        n.author.toLowerCase().includes(q) || n.authorBn.includes(search)
      )
    }
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
  }, [notices, activeTab, search])

  const pinnedCount = useMemo(() => notices.filter((n) => n.pinned && n.isActive).length, [notices])
  const expiredCount = useMemo(() => notices.filter((n) => n.isActive && isExpired(n)).length, [notices])

  const tabs = useMemo(() => {
    return ALL_TABS.map((t) => ({
      ...t,
      count: t.key === 'all' ? filtered.length : t.key === 'pinned' ? pinnedCount : expiredCount,
      label: t.key === 'all' ? (bn ? 'সকল' : 'All') : t.key === 'pinned' ? (bn ? 'পিন করা' : 'Pinned') : (bn ? 'মেয়াদোত্তীর্ণ' : 'Expired'),
    }))
  }, [bn, filtered.length, pinnedCount, expiredCount])

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
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      </div>
    )
  }

  if (viewNotice) {
    return (
      <NoticeDetail
        notice={viewNotice}
        onBack={() => setViewNotice(null)}
        onEdit={(n) => { setEditItem(n); setShowModal(true); setViewNotice(null) }}
        onDelete={(id) => { deleteNotice(id); setViewNotice(null) }}
        onTogglePin={togglePin}
        canEdit={canEdit('notice')}
        canDelete={canDelete('notice')}
        bn={bn}
      />
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
        {canCreate('notice') && (
          <button
            onClick={() => { setEditItem(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.8125rem] font-medium text-white transition-colors"
            style={{ background: 'var(--brand)' }}
          >
            <Plus size={16} />
            {bn ? 'নোটিশ তৈরি' : 'Create Notice'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="relative mb-4">
        <div className="flex gap-1 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => { if (!tabRefs.current) tabRefs.current = new Map(); if (el) tabRefs.current.set(tab.key, el) }}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors relative ${activeTab === tab.key ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0 rounded-full text-[0.625rem] font-bold text-white" style={{ background: 'var(--brand)' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <div ref={sliderRef} className="absolute bottom-0 h-[2px] bg-[var(--brand)] transition-all duration-200 rounded-full" style={{ zIndex: 1 }} />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={bn ? 'নোটিশ খুঁজুন...' : 'Search notices...'}
          className="w-full pl-9 px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
        />
      </div>

      {/* Notice List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <Megaphone size={48} className="mb-3 opacity-30" />
          <p className="text-[0.9375rem]">{bn ? 'কোনো নোটিশ নেই' : 'No notices found'}</p>
          <p className="text-[0.75rem] mt-1">{bn ? 'নতুন নোটিশ তৈরি করতে উপরের বোতাম ক্লিক করুন' : 'Click the button above to create a notice'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notice) => {
            const priority = PRIORITY_OPTIONS.find((p) => p.value === notice.priority) || PRIORITY_OPTIONS[0]
            const PriorityIcon = PRIORITY_ICONS[notice.priority] || Megaphone
            const target = TARGET_OPTIONS.find((t) => t.value === notice.target)
            return (
              <div
                key={notice.id}
                onClick={() => setViewNotice(notice)}
                className="flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer"
                style={notice.pinned ? { borderColor: 'var(--brand)', background: 'var(--bg-secondary)' } : { borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${priority.color}18`, color: priority.color }}>
                  <PriorityIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate">
                      {bn ? notice.titleBn : notice.title}
                    </span>
                    {notice.pinned && <Pin size={12} className="text-[var(--brand)] shrink-0" />}
                    <span className="px-1.5 py-0 rounded-full text-[0.5625rem] font-medium" style={{ background: `${priority.color}15`, color: priority.color }}>
                      {bn ? priority.labelBn : priority.label}
                    </span>
                    <span className="px-1.5 py-0 rounded-full text-[0.5625rem] font-medium bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                      {bn ? target?.labelBn : target?.label}
                    </span>
                    <span className="text-[0.625rem] text-[var(--text-muted)] ml-auto shrink-0">
                      {new Date(notice.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[0.75rem] text-[var(--text-muted)] truncate mt-0.5">
                    {(bn ? notice.contentBn : notice.content).replace(/<[^>]*>/g, '')}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[0.6875rem] text-[var(--text-muted)]">
                      {bn ? notice.authorBn : notice.author}
                    </span>
                    <div className="flex items-center gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
                      {canEdit('notice') && (
                        <button
                          onClick={() => togglePin(notice.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors"
                          title={notice.pinned ? (bn ? 'পিন সরান' : 'Unpin') : (bn ? 'পিন করুন' : 'Pin')}
                        >
                          <Pin size={14} />
                        </button>
                      )}
                      {canDelete('notice') && (
                        <button
                          onClick={() => setDeleteTarget(notice.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-colors"
                          title={bn ? 'মুছুন' : 'Delete'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}
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
