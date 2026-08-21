import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Tag, Receipt, RefreshCw, Coins, Search } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useExpenseStore } from '@/store/expenseStore'
import { useTabSlider } from '@/hooks/useTabSlider'
import { toBnNum } from '@/lib/i18n'
import { CategoriesTab } from './tabs/CategoriesTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { RecurringTab } from './tabs/RecurringTab'

type View = 'categories' | 'expenses' | 'recurring'

function StatCards({ stats, bn }: { stats: { totalCategories: number; activeCategories: number; totalExpenses: number; totalRecurring: number }; bn: boolean }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { labelBn: 'মোট ক্যাটাগরি', labelEn: 'Total Categories', value: stats.totalCategories, icon: <Tag size={14} />, color: 'var(--brand)' },
        { labelBn: 'সক্রিয় ক্যাটাগরি', labelEn: 'Active Categories', value: stats.activeCategories, icon: <Tag size={14} />, color: 'var(--teal)' },
        { labelBn: 'মোট খরচ', labelEn: 'Total Expenses', value: stats.totalExpenses, icon: <Receipt size={14} />, color: 'var(--red)' },
        { labelBn: 'পুনরাবৃত্ত খরচ', labelEn: 'Recurring', value: stats.totalRecurring, icon: <RefreshCw size={14} />, color: 'var(--amber)' },
      ].map((s) => (
        <div key={s.labelEn} className="flex items-center gap-3 p-3 rounded-[0.625rem] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[1.125rem] text-[var(--text-primary)] leading-tight">
              {s.value === stats.totalExpenses
                ? `৳${bn ? toBnNum(s.value) : s.value.toLocaleString()}`
                : (bn ? toBnNum(s.value) : s.value)}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{bn ? s.labelBn : s.labelEn}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ExpensesManagementPage() {
  const bn = useBn()
  const categories = useExpenseStore((s) => s.categories)
  const expenses = useExpenseStore((s) => s.expenses)

  const [activeTab, setActiveTab] = useState<View>('categories')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)

  useTabSlider({
    activeTab,
    tabRefs,
    sliderRef,
    getContainer: (slider) => slider?.parentElement ?? null,
  })

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const stats = useMemo(() => {
    const totalCategories = categories.length
    const activeCategories = categories.filter((c) => c.isActive).length
    const activeExpenses = expenses.filter((e) => e.isActive)
    const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalRecurring = activeExpenses.filter((e) => e.isRecurring).reduce((sum, e) => sum + e.amount, 0)
    return { totalCategories, activeCategories, totalExpenses, totalRecurring }
  }, [categories, expenses])

  const tabs = useMemo(() => [
    { id: 'categories' as View, icon: Tag, label: bn ? 'ক্যাটাগরি' : 'Categories' },
    { id: 'expenses' as View, icon: Receipt, label: bn ? 'খরচ' : 'Expenses' },
    { id: 'recurring' as View, icon: RefreshCw, label: bn ? 'পুনরাবৃত্ত' : 'Recurring' },
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
          {bn ? 'খরচ ব্যবস্থাপনা' : 'Expense Management'}
        </h1>
      </div>

      <StatCards stats={stats} bn={bn} />

      <div className="relative flex gap-[0.375rem] glass rounded-xl p-[0.3125rem] w-full">
        <div
          ref={sliderRef}
          className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out]"
          style={{
            background: 'var(--brand)',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            zIndex: 0,
          }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => { if (el) tabRefs.current.set(tab.id, el) }}
            onClick={() => handleTabChange(tab.id)}
            className={`relative z-10 flex-1 flex items-center justify-center gap-[0.375rem] py-2 px-4 rounded-[0.5625rem] border-none cursor-pointer text-[0.8125rem] font-medium font-[inherit] transition-colors duration-200 whitespace-nowrap ${
              activeTab === tab.id ? 'text-white' : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ background: 'transparent' }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

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

      {activeTab === 'categories' && <CategoriesTab searchQuery={searchQuery} />}
      {activeTab === 'expenses' && <ExpensesTab searchQuery={searchQuery} />}
      {activeTab === 'recurring' && <RecurringTab searchQuery={searchQuery} />}
    </div>
  )
}
