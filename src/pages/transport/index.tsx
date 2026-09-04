import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Bus, MapPin, Users, Search } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useTransportStore, pruneExpiredAssignments } from '@/store/transportStore'
import { useTabSlider } from '@/hooks/useTabSlider'
import { toBnNum } from '@/lib/i18n'
import { VehiclesTab } from './tabs/VehiclesTab'
import { RoutesTab } from './tabs/RoutesTab'
import { StudentsTab } from './tabs/StudentsTab'

type View = 'vehicles' | 'routes' | 'students'

function StatCards({ stats, bn }: { stats: { totalVehicles: number; activeRoutes: number; assignedStudents: number; totalCapacity: number }; bn: boolean }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { labelBn: 'মোট যানবাহন', labelEn: 'Total Vehicles', value: stats.totalVehicles, icon: <Bus size={14} />, color: 'var(--brand)' },
        { labelBn: 'সক্রিয় রুট', labelEn: 'Active Routes', value: stats.activeRoutes, icon: <MapPin size={14} />, color: 'var(--teal)' },
        { labelBn: 'বরাদ্দ ছাত্র', labelEn: 'Assigned Students', value: stats.assignedStudents, icon: <Users size={14} />, color: 'var(--amber)' },
        { labelBn: 'মোট আসন', labelEn: 'Total Capacity', value: stats.totalCapacity, icon: <Bus size={14} />, color: 'var(--green)' },
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

export default function TransportPage() {
  const bn = useBn()
  const { canRead } = usePermission()
  const vehicles = useTransportStore((s) => s.vehicles)
  const routes = useTransportStore((s) => s.routes)
  const assignments = useTransportStore((s) => s.assignments)

  const [activeTab, setActiveTab] = useState<View>('vehicles')
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
    pruneExpiredAssignments()
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const stats = useMemo(() => {
    const totalVehicles = vehicles.length
    const activeRoutes = routes.filter((r) => r.isActive).length
    const assignedStudents = assignments.filter((a) => a.isActive).length
    const totalCapacity = vehicles.filter((v) => v.isActive).reduce((sum, v) => sum + v.capacity, 0)
    return { totalVehicles, activeRoutes, assignedStudents, totalCapacity }
  }, [vehicles, routes, assignments])

  const tabs = useMemo(() => [
    { id: 'vehicles' as View, icon: Bus, label: bn ? 'যানবাহন' : 'Vehicles' },
    { id: 'routes' as View, icon: MapPin, label: bn ? 'রুট' : 'Routes' },
    { id: 'students' as View, icon: Users, label: bn ? 'ছাত্র' : 'Students' },
  ].filter((t) => canRead('transport', t.id)), [bn, canRead])

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
          {bn ? 'পরিবহন ব্যবস্থাপনা' : 'Transport Management'}
        </h1>
      </div>

      <StatCards stats={stats} bn={bn} />

      {/* Tab Bar */}
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

      {/* Search */}
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

      {/* Tab Content */}
      {activeTab === 'vehicles' && <VehiclesTab searchQuery={searchQuery} />}
      {activeTab === 'routes' && <RoutesTab searchQuery={searchQuery} />}
      {activeTab === 'students' && <StudentsTab searchQuery={searchQuery} />}
    </div>
  )
}
