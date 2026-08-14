import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Library, BookOpen, HandCoins, RotateCcw, Clock, AlertTriangle, Search, Monitor, BookMarked, Users, History, FileText, BarChart3, Settings } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'
import { useTabSlider } from '@/hooks/useTabSlider'
import { toBnNum } from '@/lib/i18n'
import { DashboardTab } from './tabs/DashboardTab'
import { BooksTab } from './tabs/BooksTab'
import { IssueTab } from './tabs/IssueTab'
import { ReturnTab } from './tabs/ReturnTab'
import { BorrowedTab } from './tabs/BorrowedTab'
import { OverdueTab } from './tabs/OverdueTab'
import { DigitalLibraryTab } from './tabs/DigitalLibraryTab'
import { ReadingActivityTab } from './tabs/ReadingActivityTab'
import { StudentProfilesTab } from './tabs/StudentProfilesTab'
import { HistoryTab } from './tabs/HistoryTab'
import { TransactionsTab } from './tabs/TransactionsTab'
import { ReportsTab } from './tabs/ReportsTab'
import { SettingsTab } from './tabs/SettingsTab'

type View = 'dashboard' | 'books' | 'issue' | 'return' | 'borrowed' | 'overdue'
  | 'digital' | 'reading' | 'profiles' | 'history' | 'transactions' | 'reports' | 'settings'

function StatCards({ stats, bn }: { stats: { totalBooks: number; available: number; issued: number; overdue: number }; bn: boolean }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { labelBn: 'মোট বই', labelEn: 'Total Books', value: stats.totalBooks, icon: <Library size={14} />, color: 'var(--brand)' },
        { labelBn: 'উপলব্ধ', labelEn: 'Available', value: stats.available, icon: <BookOpen size={14} />, color: 'var(--green)' },
        { labelBn: 'প্রদত্ত', labelEn: 'Issued', value: stats.issued, icon: <HandCoins size={14} />, color: 'var(--amber)' },
        { labelBn: 'বিলম্বিত', labelEn: 'Overdue', value: stats.overdue, icon: <AlertTriangle size={14} />, color: 'var(--red, #ef4444)' },
      ].map((s) => (
        <div key={s.labelEn} className="flex items-center gap-3 p-3 rounded-[0.625rem] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[1.125rem] text-[var(--text-primary)] leading-tight">
              {bn ? toBnNum(s.value) : s.value}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{bn ? s.labelBn : s.labelEn}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LibraryPage() {
  const bn = useBn()
  const books = useLibraryStore((s) => s.books)
  const copies = useLibraryStore((s) => s.copies)
  const borrowings = useLibraryStore((s) => s.borrowings)

  const [activeTab, setActiveTab] = useState<View>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({ activeTab, tabRefs, sliderRef, getContainer: (slider) => slider.parentElement })

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const stats = useMemo(() => {
    const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0)
    const available = copies.filter((c) => c.status === 'available' && c.isActive).length
    const issued = borrowings.filter((b) => b.status === 'borrowed').length
    const overdue = borrowings.filter((b) => b.status === 'overdue').length
    return { totalBooks, available, issued, overdue }
  }, [books, copies, borrowings])

  const tabs = useMemo(() => [
    { id: 'dashboard' as View, icon: Library, label: bn ? 'ড্যাশবোর্ড' : 'Dashboard' },
    { id: 'books' as View, icon: BookOpen, label: bn ? 'বই' : 'Books' },
    { id: 'issue' as View, icon: HandCoins, label: bn ? 'ইস্যু' : 'Issue' },
    { id: 'return' as View, icon: RotateCcw, label: bn ? 'ফেরত' : 'Return' },
    { id: 'borrowed' as View, icon: Clock, label: bn ? 'ধারে' : 'Borrowed' },
    { id: 'overdue' as View, icon: AlertTriangle, label: bn ? 'বিলম্বিত' : 'Overdue' },
    { id: 'digital' as View, icon: Monitor, label: bn ? 'ডিজিটাল' : 'Digital' },
    { id: 'reading' as View, icon: BookMarked, label: bn ? 'পড়াশোনা' : 'Reading' },
    { id: 'profiles' as View, icon: Users, label: bn ? 'প্রোফাইল' : 'Profiles' },
    { id: 'history' as View, icon: History, label: bn ? 'ইতিহাস' : 'History' },
    { id: 'transactions' as View, icon: FileText, label: bn ? 'লেনদেন' : 'Transactions' },
    { id: 'reports' as View, icon: BarChart3, label: bn ? 'রিপোর্ট' : 'Reports' },
    { id: 'settings' as View, icon: Settings, label: bn ? 'সেটিংস' : 'Settings' },
  ], [bn])

  const handleTabChange = useCallback((v: View) => { setActiveTab(v); setSearchQuery('') }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-7 w-48 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[3.25rem] rounded-[0.625rem]" />)}
        </div>
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="skeleton h-64 w-full rounded-[0.625rem]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          {bn ? 'লাইব্রেরি ব্যবস্থাপনা' : 'Library Management'}
        </h1>
      </div>

      <StatCards stats={stats} bn={bn} />

      {/* Tab Bar */}
      <div className="relative flex gap-[0.375rem] glass rounded-xl p-[0.3125rem] w-full overflow-x-auto scrollbar-hide">
        <div
          ref={sliderRef}
          className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
          style={{ background: 'var(--brand)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', zIndex: 0 }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { if (el) tabRefs.current.set(tab.id, el) }}
            onClick={() => handleTabChange(tab.id)}
            className={`relative z-10 flex-shrink-0 flex items-center justify-center gap-[0.375rem] py-2 px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${
              activeTab === tab.id ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ background: 'transparent' }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== 'settings' && (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-[inherit] outline-none box-border"
            placeholder={bn ? 'খুঁজুন...' : 'Search...'}
          />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'dashboard' && <DashboardTab searchQuery={searchQuery} />}
      {activeTab === 'books' && <BooksTab searchQuery={searchQuery} />}
      {activeTab === 'issue' && <IssueTab searchQuery={searchQuery} />}
      {activeTab === 'return' && <ReturnTab searchQuery={searchQuery} />}
      {activeTab === 'borrowed' && <BorrowedTab searchQuery={searchQuery} />}
      {activeTab === 'overdue' && <OverdueTab searchQuery={searchQuery} />}
      {activeTab === 'digital' && <DigitalLibraryTab searchQuery={searchQuery} />}
      {activeTab === 'reading' && <ReadingActivityTab searchQuery={searchQuery} />}
      {activeTab === 'profiles' && <StudentProfilesTab searchQuery={searchQuery} />}
      {activeTab === 'history' && <HistoryTab searchQuery={searchQuery} />}
      {activeTab === 'transactions' && <TransactionsTab searchQuery={searchQuery} />}
      {activeTab === 'reports' && <ReportsTab searchQuery={searchQuery} />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  )
}
