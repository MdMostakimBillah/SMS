import { useState, useMemo, useRef } from 'react'
import { ArrowLeft, Plus, Radio, PlayCircle, Search } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useClassStore } from '@/store/classStore'
import { useOnlineStore, type OnlineClass } from '@/store/onlineStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useTabSlider } from '@/hooks/useTabSlider'
import { LiveNowTab } from './tabs/LiveNowTab'
import { RecordingsTab } from './tabs/RecordingsTab'
import { CreateClassModal } from './modals/CreateClassModal'
import { VideoPlayerModal } from './modals/VideoPlayerModal'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'

const inputCls = 'px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'
const selectCls = inputCls + ' cursor-pointer appearance-none pr-7 bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75rem] bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")]'

export default function OnlineClassesPage() {
  const isBn = useBn()
  const { isMobile } = useWindowSize()
  const { classes: allClasses } = useClassStore()
  const { subjects } = useTeacherStore()
  const allOnlineClasses = useOnlineStore((s) => s.classes)
  const deleteClass = useOnlineStore((s) => s.deleteClass)

  const [activeTab, setActiveTab] = useState<'live' | 'recordings'>('live')
  const [filterClassId, setFilterClassId] = useState('')
  const [filterSectionId, setFilterSectionId] = useState('')
  const [filterSubjectId, setFilterSubjectId] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editItem, setEditItem] = useState<OnlineClass | null>(null)
  const [playItem, setPlayItem] = useState<OnlineClass | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useState(() => {
    const t = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(t)
  })

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  useTabSlider({ activeTab, tabRefs, sliderRef })

  const selectedClass = allClasses.find((c) => c.id === filterClassId)
  const sections = selectedClass?.sections || []
  const selectedSection = sections.find((s) => s.id === filterSectionId)
  const sectionSubjectIds = selectedSection?.subjectIds || selectedClass?.subjectIds || []
  const filteredSubjects = subjects.filter((s) => sectionSubjectIds.includes(s.id))

  const liveCount = useMemo(() => allOnlineClasses.filter((c) => c.status === 'live').length, [allOnlineClasses])

  const tabs = [
    { key: 'live' as const, label: isBn ? 'লাইভ' : 'Live Now', icon: Radio, color: 'var(--red)', count: liveCount },
    { key: 'recordings' as const, label: isBn ? 'রেকর্ডিং' : 'Recordings', icon: PlayCircle, color: 'var(--brand)', count: 0 },
  ]

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-[0.625rem] mb-4 flex-wrap">
        <button onClick={() => window.history.back()} className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5625rem] bg-[var(--bg-primary)] border border-[var(--border)] cursor-pointer text-[0.8125rem] text-[var(--text-secondary)] font-[inherit]">
          <ArrowLeft size={14} />
          {isBn ? 'ফিরে যান' : 'Back'}
        </button>
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
            {isBn ? 'অনলাইন ক্লাস' : 'Online Classes'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.1875rem]">
            {liveCount > 0
              ? isBn ? `${liveCount} টি লাইভ ক্লাস চলছে` : `${liveCount} live now`
              : isBn ? 'লাইভ ক্লাস শেয়ার করুন' : 'Share live class links'}
          </p>
        </div>
        <button onClick={() => { setEditItem(null); setShowCreate(true) }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.8125rem] font-medium bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all">
          <Plus size={15} />
          {isBn ? 'নতুন ক্লাস' : 'New Class'}
        </button>
      </div>

      {/* Tabs */}
      <div className="relative mb-4">
        <div ref={sliderRef} className="absolute top-[0.3125rem] bottom-[0.3125rem] rounded-[0.5625rem] [transition:width_300ms_ease-out,transform_300ms_ease-out,background-color_300ms_ease-out] z-0" style={{ background: tabs.find((t) => t.key === activeTab)?.color || 'var(--brand)', width: '0px', transform: 'translateX(0px)' }} />
        <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-[0.625rem] overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => { if (el) tabRefs.current.set(tab.key, el) }}
              onClick={() => setActiveTab(tab.key)}
              className="relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-[0.5rem] text-[0.8125rem] font-medium cursor-pointer transition-colors duration-200 whitespace-nowrap"
              style={{ color: activeTab === tab.key ? '#fff' : 'var(--text-muted)' }}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[0.5625rem] font-bold" style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : tab.color + '20', color: activeTab === tab.key ? '#fff' : tab.color }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className={inputCls + ' w-full pl-8'}
            placeholder={isBn ? 'অনুসন্ধান...' : 'Search...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={selectCls} value={filterClassId} onChange={(e) => { setFilterClassId(e.target.value); setFilterSectionId(''); setFilterSubjectId('') }}>
          <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
          {allClasses.map((c) => <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.name}</option>)}
        </select>
        <select className={selectCls} value={filterSectionId} onChange={(e) => { setFilterSectionId(e.target.value); setFilterSubjectId('') }}>
          <option value="">{isBn ? 'সব শাখা' : 'All Sections'}</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={selectCls} value={filterSubjectId} onChange={(e) => setFilterSubjectId(e.target.value)}>
          <option value="">{isBn ? 'সব বিষয়' : 'All Subjects'}</option>
          {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{isBn ? s.nameBn : s.name}</option>)}
        </select>
      </div>

      {/* Tab content */}
      {activeTab === 'live' ? (
        <LiveNowTab filterClassId={filterClassId} filterSectionId={filterSectionId} filterSubjectId={filterSubjectId} search={search} onPlay={setPlayItem} />
      ) : (
        <RecordingsTab
          filterClassId={filterClassId}
          filterSectionId={filterSectionId}
          filterSubjectId={filterSubjectId}
          search={search}
          onPlay={setPlayItem}
          onEdit={(item) => { setEditItem(item); setShowCreate(true) }}
          onDelete={(id) => setDeleteTarget(id)}
        />
      )}

      {/* Modals */}
      <CreateClassModal open={showCreate} onClose={() => { setShowCreate(false); setEditItem(null) }} editItem={editItem} />
      {playItem && <VideoPlayerModal item={playItem} onClose={() => setPlayItem(null)} />}
      {deleteTarget && (
        <DeleteConfirmDialog
          title={isBn ? 'ক্লাস মুছুন' : 'Delete Class'}
          message={isBn ? 'এই অনলাইন ক্লাস মুছে ফেলতে চান?' : 'Delete this online class?'}
          onConfirm={() => { deleteClass(deleteTarget); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
          isBn={isBn}
        />
      )}
    </div>
  )
}
