import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Tag, Users, Coins, Search } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useOthersIncomeStore, pruneExpiredOthersIncomeAssignments } from '@/store/othersIncomeStore'
import { useTabSlider } from '@/hooks/useTabSlider'
import { toBnNum } from '@/lib/i18n'
import { TypesTab } from './tabs/TypesTab'
import { AssignmentsTab } from './tabs/AssignmentsTab'
import { usePermission } from '@/hooks/usePermission'

type View = 'types' | 'assignments'

function StatCards({ stats, bn }: { stats: { totalCategories: number; activeCategories: number; assignedStudents: number; totalMonthlyIncome: number }; bn: boolean }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { labelBn: 'মোট ক্যাটাগরি', labelEn: 'Total Categories', value: stats.totalCategories, icon: <Tag size={14} />, color: 'var(--brand)' },
        { labelBn: 'সক্রিয় ক্যাটাগরি', labelEn: 'Active Categories', value: stats.activeCategories, icon: <Tag size={14} />, color: 'var(--teal)' },
        { labelBn: 'বরাদ্দ ছাত্র', labelEn: 'Assigned Students', value: stats.assignedStudents, icon: <Users size={14} />, color: 'var(--amber)' },
        { labelBn: 'মাসিক আয়', labelEn: 'Monthly Income', value: stats.totalMonthlyIncome, icon: <Coins size={14} />, color: 'var(--green)' },
      ].map((s) => (
        <div key={s.labelEn} className="flex items-center gap-3 p-3 rounded-[0.625rem] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-xs)]">
          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18`, color: s.color }}>
            {s.icon}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[1.125rem] text-[var(--text-primary)] leading-tight">
              {s.value === stats.totalMonthlyIncome
                ? `${bn ? '৳' : '৳'}${bn ? toBnNum(s.value) : s.value.toLocaleString()}`
                : (bn ? toBnNum(s.value) : s.value)}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{bn ? s.labelBn : s.labelEn}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function OthersIncomePage() {
  const bn = useBn()
  const { canRead } = usePermission()
  const categories = useOthersIncomeStore((s) => s.categories)
  const assignments = useOthersIncomeStore((s) => s.assignments)

  const [activeTab, setActiveTab] = useState<View>('types')
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
    pruneExpiredOthersIncomeAssignments()
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const stats = useMemo(() => {
    const totalCategories = categories.length
    const activeCategories = categories.filter((c) => c.isActive).length
    const assignedStudents = assignments.filter((a) => a.isActive).length
    const totalMonthlyIncome = assignments
      .filter((a) => a.isActive)
      .reduce((sum, a) => {
        const cat = categories.find((c) => c.id === a.categoryId)
        if (cat && cat.type === 'monthly') return sum + cat.amount
        return sum
      }, 0)
    return { totalCategories, activeCategories, assignedStudents, totalMonthlyIncome }
  }, [categories, assignments])

  const allTabs = useMemo(() => [
    { id: 'types' as View, icon: Tag, label: bn ? 'ক্যাটাগরি' : 'Categories' },
    { id: 'assignments' as View, icon: Users, label: bn ? 'ছাত্র নির্বাচন' : 'Assignments' },
  ], [bn])
  const tabs = useMemo(() => allTabs.filter(() => canRead('finance.others_income')), [allTabs, canRead])

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
          {bn ? 'অন্যান্য আয়' : 'Others Income'}
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

      {activeTab === 'types' && <TypesTab searchQuery={searchQuery} />}
      {activeTab === 'assignments' && <AssignmentsTab searchQuery={searchQuery} />}
    </div>
  )
}
