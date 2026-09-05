import { Plus, Clock, BookOpen, ListChecks } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import type { ClassInfo } from '@/store/classStore'

interface TopBarProps {
  classes: ClassInfo[]
  bulkMode: boolean
  setBulkMode: React.Dispatch<React.SetStateAction<boolean>>
  selectedClasses: string[]
  setShowBulkTime: React.Dispatch<React.SetStateAction<boolean>>
  setShowBulkSubject: React.Dispatch<React.SetStateAction<boolean>>
  setShowBulkSection: React.Dispatch<React.SetStateAction<boolean>>
  setShowAddClass: React.Dispatch<React.SetStateAction<boolean>>
  setSelectedClasses: React.Dispatch<React.SetStateAction<string[]>>
  isBn: boolean
}

export function TopBar({
  classes,
  bulkMode,
  setBulkMode,
  selectedClasses,
  setShowBulkTime,
  setShowBulkSubject,
  setShowBulkSection,
  setShowAddClass,
  setSelectedClasses,
  isBn,
}: TopBarProps) {
  const { canCreate, canEdit } = usePermission()
  return (
    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div className="text-[0.75rem] text-[var(--text-muted)]">
        {classes.length} {isBn ? 'টি শ্রেণি' : 'classes'} · {classes.reduce((s, c) => s + c.sections.length, 0)}{' '}
        {isBn ? 'টি সেকশন' : 'sections'}
        {bulkMode && selectedClasses.length > 0 && (
          <span className="ml-2 text-[var(--teal)] font-semibold">
            · {selectedClasses.length} {isBn ? 'নির্বাচিত' : 'selected'}
          </span>
        )}
      </div>
      <div className="flex gap-[0.375rem] flex-wrap">
        {bulkMode && selectedClasses.length > 0 && canEdit('classes.classes') && (
          <>
            <button
              onClick={() => setShowBulkTime(true)}
              className="flex items-center gap-[0.25rem] py-[0.3125rem] px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer font-[inherit] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all"
            >
              <Clock size={11} />
              {isBn ? 'সময়' : 'Time'}
            </button>
            <button
              onClick={() => setShowBulkSubject(true)}
              className="flex items-center gap-[0.25rem] py-[0.3125rem] px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer font-[inherit] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-all"
            >
              <BookOpen size={11} />
              {isBn ? 'বিষয়' : 'Subject'}
            </button>
            <button
              onClick={() => setShowBulkSection(true)}
              className="flex items-center gap-[0.25rem] py-[0.3125rem] px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.6875rem] font-medium cursor-pointer font-[inherit] hover:border-[var(--purple)] hover:text-[var(--purple)] transition-all"
            >
              <ListChecks size={11} />
              {isBn ? 'সেকশন' : 'Section'}
            </button>
          </>
        )}
        <button
          onClick={() => {
            setBulkMode(!bulkMode)
            if (bulkMode) setSelectedClasses([])
          }}
          className={`flex items-center gap-[0.25rem] py-[0.3125rem] px-2.5 rounded-md border text-[0.6875rem] font-medium cursor-pointer font-[inherit] transition-all ${bulkMode ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'}`}
        >
          <ListChecks size={11} />
          {bulkMode ? (isBn ? 'বন্ধ' : 'Done') : isBn ? 'বাল্ক' : 'Bulk'}
        </button>
        {canCreate('classes.classes') && (
          <button
            onClick={() => setShowAddClass(true)}
            className="flex items-center gap-[0.3125rem] py-[0.4375rem] px-3 rounded-[0.5rem] bg-[var(--brand)] border-none text-white text-[0.75rem] font-medium cursor-pointer font-[inherit]"
          >
            <Plus size={14} />
            {isBn ? 'নতুন শ্রেণি' : 'Add Class'}
          </button>
        )}
      </div>
    </div>
  )
}
