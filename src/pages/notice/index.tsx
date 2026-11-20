import { useState, useMemo, useRef, useCallback } from 'react'
import {
  Plus,
  Megaphone,
  Pin,
  Search,
  AlertTriangle,
  Tag,
  ChevronDown,
  UploadCloud,
  HardDrive,
  Cloud,
  Download,
  Upload,
  LayoutGrid,
  List,
  X,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useTabSlider } from '@/hooks/useTabSlider'
import { useNotices } from '@/hooks/useNotices'
import { useNoticeStore, type Notice } from '@/store/noticeStore'
import { useClassStore } from '@/store/classStore'
import { isLocalComputerMode } from '@/lib/storageMode'
import { useVault } from '@/hooks/useVault'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { NoticeDetail } from './NoticeDetail'
import { NoticeModal } from './NoticeModal'
import { CategoryModal } from './CategoryModal'
import { NoticeCard, PRIORITY_CONFIG, TARGET_CONFIG } from './NoticeCard'

const ALL_TABS = [
  { key: 'all', icon: Megaphone },
  { key: 'pinned', icon: Pin },
  { key: 'urgent', icon: AlertTriangle },
  { key: 'expired', icon: AlertTriangle },
]

export default function NoticeBoardPage() {
  const bn = useBn()
  const { canCreate, canEdit, canDelete } = usePermission()
  const { isMobile } = useWindowSize()
  const isLocalPC = isLocalComputerMode()
  const vault = useVault()

  const {
    status,
    notices,
    categories,
    error,
    retry,
    save,
    remove,
    togglePin,
    addCategory,
    removeCategory,
    importLocal,
    dismissImport,
    importCandidate,
    importing,
    serverSynced,
  } = useNotices()

  const institution = useClassStore((s) => s.institution)
  const logo = institution.logo
  const schoolName = institution.name || (bn ? 'এডুটেক একাডেমি' : 'EduTech Academy')

  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterTarget, setFilterTarget] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<Notice | null>(null)
  const [viewNotice, setViewNotice] = useState<Notice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  useTabSlider({ activeTab, tabRefs, sliderRef })

  const isExpired = (n: Notice) => Boolean(n.expiresAt && new Date(n.expiresAt) < new Date())

  // Filter notices
  const filtered = useMemo(() => {
    let list = notices.filter((n) => n && n.isActive)

    if (activeTab === 'pinned') list = list.filter((n) => n.pinned)
    else if (activeTab === 'urgent') list = list.filter((n) => n.priority === 'urgent')
    else if (activeTab === 'expired') list = list.filter((n) => isExpired(n))

    if (filterCategory) list = list.filter((n) => n.category === filterCategory)
    if (filterTarget) list = list.filter((n) => n.target === filterTarget)
    if (filterPriority) list = list.filter((n) => n.priority === filterPriority)

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          (n.titleBn || '').includes(search) ||
          (n.content || '').toLowerCase().includes(q) ||
          (n.contentBn || '').includes(search) ||
          (n.author || '').toLowerCase().includes(q) ||
          (n.authorBn || '').includes(search) ||
          (n.category || '').toLowerCase().includes(q)
      )
    }

    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
  }, [notices, activeTab, search, filterCategory, filterTarget, filterPriority])

  const pinnedCount = useMemo(() => notices.filter((n) => n.pinned && n.isActive).length, [notices])
  const urgentCount = useMemo(() => notices.filter((n) => n.priority === 'urgent' && n.isActive).length, [notices])
  const expiredCount = useMemo(() => notices.filter((n) => n.isActive && isExpired(n)).length, [notices])

  const tabs = useMemo(() => {
    return ALL_TABS.map((t) => ({
      ...t,
      count:
        t.key === 'all'
          ? notices.filter((n) => n && n.isActive).length
          : t.key === 'pinned'
          ? pinnedCount
          : t.key === 'urgent'
          ? urgentCount
          : expiredCount,
      label:
        t.key === 'all'
          ? bn
            ? 'সকল'
            : 'All'
          : t.key === 'pinned'
          ? bn
            ? 'পিন করা'
            : 'Pinned'
          : t.key === 'urgent'
          ? bn
            ? 'জরুরি'
            : 'Urgent'
          : bn
          ? 'মেয়াদোত্তীর্ণ'
          : 'Expired',
    }))
  }, [bn, notices, pinnedCount, urgentCount, expiredCount])

  const reportError = (err: unknown, actionBn: string, actionEn: string) => {
    const message = err instanceof Error ? err.message : 'Unknown error'
    window.alert(`${bn ? actionBn : actionEn}: ${message}`)
  }

  const handleSave = useCallback(
    (data: Omit<Notice, 'id'>) => {
      save(data, editItem?.id)
        .then(() => {
          setShowModal(false)
          setEditItem(null)
        })
        .catch((err) => reportError(err, 'সংরক্ষণ ব্যর্থ', 'Save failed'))
    },
    [save, editItem, bn]
  )

  const handleImportLegacy = useCallback(() => {
    importLocal()
      .then((r) => {
        const conflictNote =
          r.conflicts.length > 0
            ? bn
              ? ` · ${r.conflicts.length}টি দ্ব্যর্থক/আগে আমদানি করা`
              : ` · ${r.conflicts.length} conflicting/already imported`
            : ''
        window.alert(
          bn
            ? `আমদানি সম্পন্ন: ${r.imported}টি নতুন, ${r.skipped}টি আগে থেকেই আছে${conflictNote}`
            : `Import complete: ${r.imported} new, ${r.skipped} already present${conflictNote}`
        )
      })
      .catch((err) => reportError(err, 'আমদানি ব্যর্থ', 'Import failed'))
  }, [importLocal, bn])

  // Export JSON file for Local PC storage / backup
  const handleExportJSON = useCallback(() => {
    const payload = {
      institution: schoolName,
      storageMode: isLocalPC ? 'local_computer' : 'cloud',
      exportedAt: new Date().toISOString(),
      categories,
      notices,
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `notices-${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [schoolName, isLocalPC, categories, notices])

  // Import JSON file from PC
  const handleImportJSONFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const raw = event.target?.result as string
          const parsed = JSON.parse(raw)
          let incomingNotices: Notice[] = []
          if (Array.isArray(parsed)) {
            incomingNotices = parsed
          } else if (Array.isArray(parsed?.notices)) {
            incomingNotices = parsed.notices
          } else if (Array.isArray(parsed?.state?.notices)) {
            incomingNotices = parsed.state.notices
          }

          if (incomingNotices.length === 0) {
            window.alert(bn ? 'কোনো বৈধ নোটিশ পাওয়া যায়নি' : 'No valid notice entries found in file')
            return
          }

          // Merge with existing notices
          const currentMap = new Map<string, Notice>()
          useNoticeStore.getState().notices.forEach((n) => currentMap.set(n.id, n))
          incomingNotices.forEach((n) => {
            if (n && n.id) currentMap.set(n.id, n)
          })

          const merged = Array.from(currentMap.values())
          useNoticeStore.getState().setNotices(merged)

          if (Array.isArray(parsed?.categories)) {
            parsed.categories.forEach((c: string) => {
              if (c) void useNoticeStore.getState().addCategory(c)
            })
          }

          window.alert(
            bn
              ? `সফলভাবে ${incomingNotices.length}টি নোটিশ লোড ও লোকাল ফাইলে সংরক্ষিত হয়েছে!`
              : `Successfully imported ${incomingNotices.length} notices and saved to local PC file!`
          )
        } catch {
          window.alert(bn ? 'JSON ফাইলটি সঠিক নয়' : 'Invalid JSON file format')
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
      reader.readAsText(file)
    },
    [bn]
  )

  const clearFilters = () => {
    setSearch('')
    setFilterCategory('')
    setFilterTarget('')
    setFilterPriority('')
    setActiveTab('all')
  }

  const hasActiveFilters = Boolean(search || filterCategory || filterTarget || filterPriority || activeTab !== 'all')

  if (status === 'loading') {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (viewNotice) {
    return (
      <NoticeDetail
        notice={viewNotice}
        onBack={() => setViewNotice(null)}
        onEdit={(n) => {
          setEditItem(n)
          setShowModal(true)
          setViewNotice(null)
        }}
        onDelete={(id) => {
          remove(id).catch((err) => reportError(err, 'মুছে ফেলা যায়নি', 'Could not delete'))
          setViewNotice(null)
        }}
        onTogglePin={(id) => {
          togglePin(id).catch((err) => reportError(err, 'পিন পরিবর্তন ব্যর্থ', 'Could not toggle pin'))
        }}
        canEdit={canEdit('notice')}
        canDelete={canDelete('notice')}
        bn={bn}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Title, Mode Badge and Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className={`font-bold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
              {bn ? 'নোটিশ বোর্ড' : 'Notice Board'}
            </h1>

            {/* Storage Mode Badge */}
            {isLocalPC ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm"
                title={
                  vault.folderName
                    ? `Saved locally: ${vault.folderName}/notices.json`
                    : 'Saved to local PC storage (notices.json)'
                }
              >
                <HardDrive size={12} className="text-emerald-600" />
                {bn ? 'লোকাল পিসি স্টোরেজ (notices.json)' : 'Local PC Storage (notices.json)'}
              </span>
            ) : serverSynced ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20 shadow-sm"
                title="Synchronized with cloud database"
              >
                <Cloud size={12} className="text-[var(--brand)]" />
                {bn ? 'ক্লাউড সিঙ্কড' : 'Cloud Synced'}
              </span>
            ) : null}
          </div>

          <p className="text-[0.8125rem] text-[var(--text-muted)] mt-1">
            {bn ? `মোট ${notices.length}টি নোটিশ` : `${notices.length} total notices`}
            {pinnedCount > 0 && ` · ${bn ? `${pinnedCount}টি পিন করা` : `${pinnedCount} pinned`}`}
            {urgentCount > 0 && ` · ${bn ? `${urgentCount}টি জরুরি` : `${urgentCount} urgent`}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* JSON Export */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--brand)]/30 transition-colors shadow-sm"
            title={bn ? 'লোকাল পিসিতে ব্যাকআপ JSON ডাউনলোড করুন' : 'Export JSON file for local PC'}
          >
            <Download size={14} className="text-[var(--brand)]" />
            <span className="hidden sm:inline">{bn ? 'ব্যাকআপ JSON' : 'Export JSON'}</span>
          </button>

          {/* JSON Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportJSONFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--brand)]/30 transition-colors shadow-sm"
            title={bn ? 'লোকাল পিসি থেকে JSON নোটিশ ফাইল আপলোড করুন' : 'Import JSON file from local PC'}
          >
            <Upload size={14} className="text-[var(--text-muted)]" />
            <span className="hidden sm:inline">{bn ? 'ইম্পোর্ট JSON' : 'Import JSON'}</span>
          </button>

          {/* Categories Button */}
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--brand)]/30 transition-colors shadow-sm"
          >
            <Tag size={14} />
            {bn ? 'ক্যাটাগরি' : 'Categories'}
            {categories.length > 0 && (
              <span
                className="ml-1 px-1.5 py-0.2 rounded-full text-[0.625rem] font-bold text-white"
                style={{ background: 'var(--brand)' }}
              >
                {categories.length}
              </span>
            )}
          </button>

          {/* Create Notice Button */}
          {canCreate('notice') && (
            <button
              onClick={() => {
                setEditItem(null)
                setShowModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
              style={{ background: 'var(--brand)' }}
            >
              <Plus size={16} />
              {bn ? 'নোটিশ তৈরি' : 'Create Notice'}
            </button>
          )}
        </div>
      </div>

      {/* Sync Error Banner if any */}
      {error && !isLocalPC && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[var(--red)]/10 border border-[var(--red)]/20 text-[var(--red)] text-[0.75rem]">
          <span>{error}</span>
          <button
            onClick={retry}
            className="px-2.5 py-1 rounded-lg bg-[var(--red)] text-white text-[0.6875rem] font-medium hover:opacity-90 shrink-0"
          >
            {bn ? 'পুনরায় চেষ্টা' : 'Retry'}
          </button>
        </div>
      )}

      {/* One-time local data import offer */}
      {importCandidate && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border flex-wrap shadow-sm"
          style={{ borderColor: 'var(--brand)', background: 'var(--bg-secondary)' }}
        >
          <p className="text-[0.75rem] text-[var(--text-secondary)] flex items-center gap-2">
            <UploadCloud size={16} className="text-[var(--brand)] shrink-0" />
            {bn
              ? 'এই ডিভাইসে পুরনো নোটিশ পাওয়া গেছে — সার্ভারে এককালীন আমদানি করবেন? (স্থানীয় কপি মুছে ফেলা হবে না)'
              : 'Older notices found on this device — import them to the server? (Your local copy is kept intact)'}
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleImportLegacy}
              disabled={importing}
              className="px-3 py-1.5 rounded-lg text-[0.75rem] font-medium text-white transition-opacity disabled:opacity-50"
              style={{ background: 'var(--brand)' }}
            >
              {importing ? (bn ? 'আমদানি হচ্ছে…' : 'Importing…') : bn ? 'আমদানি করুন' : 'Import'}
            </button>
            <button
              type="button"
              onClick={dismissImport}
              className="px-3 py-1.5 rounded-lg text-[0.75rem] font-medium bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {bn ? 'পরে' : 'Later'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="relative border-b border-[var(--border)]">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.key, el)
              }}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors whitespace-nowrap relative ${
                activeTab === tab.key
                  ? 'text-[var(--brand)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0 rounded-full text-[0.625rem] font-bold ${
                    tab.key === 'urgent'
                      ? 'bg-[var(--red)] text-white'
                      : activeTab === tab.key
                      ? 'text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                  }`}
                  style={activeTab === tab.key && tab.key !== 'urgent' ? { background: 'var(--brand)' } : {}}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div
          ref={sliderRef}
          className="absolute bottom-0 h-[2px] bg-[var(--brand)] transition-all duration-200 rounded-full"
          style={{ zIndex: 1 }}
        />
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={bn ? 'শিরোনাম, বিষয়বস্তু বা লেখক খুঁজুন...' : 'Search title, content, or author...'}
            className="w-full pl-9 pr-8 py-2 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer"
          >
            <option value="">{bn ? 'সকল ক্যাটাগরি' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
        </div>

        {/* Target Audience Filter */}
        <div className="relative">
          <select
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer"
          >
            <option value="">{bn ? 'সকল প্রাপক' : 'All Targets'}</option>
            {Object.entries(TARGET_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>
                {bn ? val.labelBn : val.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer"
          >
            <option value="">{bn ? 'সকল অগ্রাধিকার' : 'All Priorities'}</option>
            {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>
                {bn ? val.labelBn : val.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            title={bn ? 'ফিল্টার মুছুন' : 'Clear filters'}
          >
            <X size={15} />
          </button>
        )}

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-[var(--bg-primary)] text-[var(--brand)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={bn ? 'গ্রিড ভিউ' : 'Grid view'}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-[var(--bg-primary)] text-[var(--brand)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={bn ? 'লিস্ট ভিউ' : 'List view'}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Notice List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/30">
          <Megaphone size={48} className="mb-3 opacity-25" />
          <p className="text-[0.9375rem] font-medium text-[var(--text-primary)]">
            {bn ? 'কোনো নোটিশ পাওয়া যায়নি' : 'No notices found'}
          </p>
          <p className="text-[0.75rem] mt-1 text-[var(--text-muted)] max-w-sm text-center">
            {hasActiveFilters
              ? bn
                ? 'ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন'
                : 'Try adjusting your filters or search query'
              : bn
              ? 'নতুন নোটিশ তৈরি করতে উপরের "নোটিশ তৈরি" বোতামে ক্লিক করুন'
              : 'Click the "Create Notice" button above to publish your first announcement'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-3.5 py-1.5 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--brand)] transition-colors"
            >
              {bn ? 'সব ফিল্টার মুছুন' : 'Clear all filters'}
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-2'
          }
        >
          {filtered.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              schoolName={schoolName}
              logo={logo}
              canEdit={canEdit('notice')}
              canDelete={canDelete('notice')}
              bn={bn}
              viewMode={viewMode}
              onClick={() => setViewNotice(notice)}
              onTogglePin={(id) => {
                togglePin(id).catch((err) => reportError(err, 'পিন পরিবর্তন ব্যর্থ', 'Could not toggle pin'))
              }}
              onEdit={(n) => {
                setEditItem(n)
                setShowModal(true)
              }}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <NoticeModal
          item={editItem}
          categories={categories}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditItem(null)
          }}
          bn={bn}
        />
      )}

      {/* Categories Management Modal */}
      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onAdd={async (name) => {
            try {
              await addCategory(name)
            } catch (err) {
              reportError(err, 'ক্যাটাগরি যোগ ব্যর্থ', 'Adding category failed')
            }
          }}
          onRemove={async (cat) => {
            try {
              await removeCategory(cat)
            } catch (err) {
              reportError(err, 'ক্যাটাগরি মুছে ফেলা যায়নি', 'Could not delete category')
            }
          }}
          onClose={() => setShowCategoryModal(false)}
          bn={bn}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          onConfirm={() => {
            remove(deleteTarget).catch((err) => reportError(err, 'মুছে ফেলা যায়নি', 'Could not delete'))
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
          title={bn ? 'নোটিশ মুছুন' : 'Delete Notice'}
          message={
            bn
              ? 'আপনি কি নিশ্চিত এই নোটিশটি মুছে ফেলতে চান? এটি স্থানীয় ফাইল ও সার্ভার থেকে মুছে যাবে।'
              : 'Are you sure you want to delete this notice? It will be removed from local files and the server.'
          }
          isBn={bn}
        />
      )}
    </div>
  )
}
