import { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, Megaphone, Pin, Search, AlertTriangle, Tag, Trash2, Calendar, Users, ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useNoticeStore, type Notice, noticeId } from '@/store/noticeStore'
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
  const categories = useNoticeStore((s) => s.categories)
  const addNotice = useNoticeStore((s) => s.addNotice)
  const updateNotice = useNoticeStore((s) => s.updateNotice)
  const deleteNotice = useNoticeStore((s) => s.deleteNotice)
  const togglePin = useNoticeStore((s) => s.togglePin)
  const addCategory = useNoticeStore((s) => s.addCategory)
  const removeCategory = useNoticeStore((s) => s.removeCategory)

  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Notice | null>(null)
  const [viewNotice, setViewNotice] = useState<Notice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategory, setNewCategory] = useState('')
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
    if (filterCategory) list = list.filter((n) => n.category === filterCategory)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((n) =>
        n.title.toLowerCase().includes(q) || n.titleBn.includes(search) ||
        n.content.toLowerCase().includes(q) || n.contentBn.includes(search) ||
        n.author.toLowerCase().includes(q) || n.authorBn.includes(search) ||
        n.category.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
  }, [notices, activeTab, search, filterCategory])

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

  const handleAddCategory = () => {
    if (!newCategory.trim()) return
    addCategory(newCategory.trim())
    setNewCategory('')
  }

  const handleRemoveCategory = (cat: string) => {
    if (window.confirm(bn ? `'${cat}' ক্যাটাগরি মুছে ফেলতে চান?` : `Delete category '${cat}'?`)) {
      removeCategory(cat)
    }
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
      {/* Header */}
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Tag size={13} />
            {bn ? 'ক্যাটাগরি' : 'Categories'}
            {categories.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0 rounded-full text-[0.5625rem] font-bold text-white" style={{ background: 'var(--brand)' }}>
                {categories.length}
              </span>
            )}
          </button>
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

      {/* Search + Category Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={bn ? 'নোটিশ খুঁজুন...' : 'Search notices...'}
            className="w-full pl-9 px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none pl-3 pr-8 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer"
          >
            <option value="">{bn ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        </div>
      </div>

      {/* Notice List - Social Media Style Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
          <Megaphone size={48} className="mb-3 opacity-30" />
          <p className="text-[0.9375rem]">{bn ? 'কোনো নোটিশ নেই' : 'No notices found'}</p>
          <p className="text-[0.75rem] mt-1">{bn ? 'নতুন নোটিশ তৈরি করতে উপরের বোতাম ক্লিক করুন' : 'Click the button above to create a notice'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notice) => {
            const priority = PRIORITY_OPTIONS.find((p) => p.value === notice.priority) || PRIORITY_OPTIONS[0]
            const target = TARGET_OPTIONS.find((t) => t.value === notice.target)
            const plainContent = (bn ? notice.contentBn : notice.content).replace(/<[^>]*>/g, '')
            return (
              <div
                key={notice.id}
                onClick={() => setViewNotice(notice)}
                className="rounded-2xl border transition-all cursor-pointer overflow-hidden"
                style={notice.pinned
                  ? { borderColor: 'var(--brand)', background: 'var(--bg-primary)' }
                  : { borderColor: 'var(--border)', background: 'var(--bg-primary)' }
                }
              >
                {/* Card header: avatar + author + date */}
                <div className="flex items-start gap-3 p-4 pb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[0.75rem]" style={{ background: 'var(--brand)' }}>
                    {notice.storage ? (
                      <img src={notice.storage} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>{(bn ? notice.authorBn : notice.author).charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                        {bn ? notice.authorBn : notice.author}
                      </span>
                      {notice.pinned && <Pin size={12} className="text-[var(--brand)] shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--text-muted)]">
                      <Calendar size={11} />
                      {new Date(notice.publishedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {canEdit('notice') && (
                      <button
                        onClick={() => togglePin(notice.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                        title={notice.pinned ? (bn ? 'পিন সরান' : 'Unpin') : (bn ? 'পিন করুন' : 'Pin')}
                      >
                        <Pin size={14} />
                      </button>
                    )}
                    {canDelete('notice') && (
                      <button
                        onClick={() => setDeleteTarget(notice.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-colors"
                        title={bn ? 'মুছুন' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="px-4 pb-2 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium" style={{ background: `${priority.color}15`, color: priority.color }}>
                    {bn ? priority.labelBn : priority.label}
                  </span>
                  {notice.category && (
                    <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium flex items-center gap-0.5" style={{ background: 'var(--brand)15', color: 'var(--brand)' }}>
                      <Tag size={9} /> {notice.category}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[0.5625rem] font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] flex items-center gap-0.5">
                    <Users size={9} /> {bn ? target?.labelBn : target?.label}
                  </span>
                </div>

                {/* Title + Content preview */}
                <div className="px-4 pb-3">
                  <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)] leading-snug mb-1">
                    {bn ? notice.titleBn : notice.title}
                  </h3>
                  <p className="text-[0.8125rem] text-[var(--text-muted)] leading-relaxed line-clamp-3">
                    {plainContent}
                  </p>
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
          categories={categories}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditItem(null) }}
          bn={bn}
        />
      )}

      {/* Category Management Modal */}
      {showCategoryModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-primary)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl" style={{ background: 'var(--brand)' }}>
              <h3 className="font-semibold text-[0.9375rem] text-white flex items-center gap-2">
                <Tag size={16} />
                {bn ? 'ক্যাটাগরি পরিচালনা' : 'Manage Categories'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="p-1.5 rounded-lg hover:bg-white/20 text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-auto">
              {categories.length === 0 && (
                <p className="text-[0.75rem] text-[var(--text-muted)] text-center py-3">{bn ? 'কোনো ক্যাটাগরি নেই' : 'No categories yet'}</p>
              )}
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--brand)]/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand)' }}>
                      <Tag size={13} className="text-white" />
                    </div>
                    <span className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{cat}</span>
                  </div>
                  <button onClick={() => handleRemoveCategory(cat)} className="p-1.5 rounded-lg hover:bg-[var(--red)]/10 text-[var(--text-muted)] hover:text-[var(--red)] transition-colors" title={bn ? 'মুছুন' : 'Delete'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div className="pt-3 border-t border-[var(--border)] flex gap-2">
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} placeholder={bn ? 'নতুন ক্যাটাগরি নাম' : 'New category name'} className="flex-1 px-3 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors" />
                <button onClick={handleAddCategory} disabled={!newCategory.trim()} className="px-4 py-2 rounded-xl text-[0.8125rem] font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--brand)' }}>
                  {bn ? 'জোড়া দিন' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
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
