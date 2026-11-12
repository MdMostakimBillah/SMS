import React, { useState, useRef, useEffect } from 'react'
import {
  Plus,
  RefreshCw,
  Database,
  Laptop,
  FolderSync,
  Download,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react'
import type { ClassInfo as ClassItem } from '@/store/classStore'
import type { Subject } from '@/pages/teachers/types'

const selectCls =
  'px-3 py-1.5 rounded-xl text-[0.8125rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors cursor-pointer'

export interface AssignmentHeaderProps {
  isBn: boolean
  isMobile: boolean
  isLocalComputer: boolean
  isVaultConnected: boolean
  vaultFolderName?: string | null
  serverSynced: boolean
  syncing: boolean
  refreshing: boolean
  canCreate: boolean
  canExport: boolean
  classes: ClassItem[]
  subjects: Subject[]
  filterClassId: string
  filterSectionId: string
  filterSubjectId: string
  availableSections: { id: string; name: string }[]
  availableSubjects: Subject[]
  onFilterClassChange: (id: string) => void
  onFilterSectionChange: (id: string) => void
  onFilterSubjectChange: (id: string) => void
  onRefresh: () => void
  onOpenCreate: () => void
  onExportJson: () => void
  onExportCsv: () => void
}

export const AssignmentHeader = React.memo(function AssignmentHeader({
  isBn,
  isMobile,
  isLocalComputer,
  isVaultConnected,
  vaultFolderName,
  serverSynced: _serverSynced,
  syncing,
  refreshing,
  canCreate,
  canExport,
  classes,
  filterClassId,
  filterSectionId,
  filterSubjectId,
  availableSections,
  availableSubjects,
  onFilterClassChange,
  onFilterSectionChange,
  onFilterSubjectChange,
  onRefresh,
  onOpenCreate,
  onExportJson,
  onExportCsv,
}: AssignmentHeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showExportMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  return (
    <div className="gsap-fade-up" style={{ marginBottom: isMobile ? '12px' : '1rem' }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
              {isBn ? 'অ্যাসাইনমেন্ট' : 'Assignments'}
            </h1>

            {/* Storage Mode Badges */}
            {isLocalComputer ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--border)]">
                <Laptop size={12} />
                {isBn ? 'লোকাল পিসি স্টোরেজ' : 'Local PC Storage'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Database size={12} />
                {isBn ? 'ডাটাবেজ কানেক্টেড' : 'Database Connected'}
              </span>
            )}

            {isVaultConnected && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                title={vaultFolderName ? `Local Folder: ${vaultFolderName}` : undefined}
              >
                <FolderSync size={12} />
                {isBn ? 'লোকাল ভল্ট সিঙ্ক' : 'Local Vault Synced'}
              </span>
            )}

            {syncing && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border)] animate-pulse">
                <RefreshCw size={10} className="animate-spin text-[var(--brand)]" />
                {isBn ? 'সিঙ্ক হচ্ছে...' : 'Syncing...'}
              </span>
            )}
          </div>
          <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-[0.125rem]">
            {isBn ? 'তারিখ ক্লিক করে অ্যাসাইনমেন্ট তৈরি করুন' : 'Click a date to create assignment'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing || syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] text-[0.75rem] font-medium hover:text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer disabled:opacity-50"
            title={isBn ? 'ডাটাবেস ও লোকাল স্টোরেজ রিফ্রেশ করুন' : 'Refresh from Database & Local Storage'}
          >
            <RefreshCw size={13} className={refreshing || syncing ? 'animate-spin text-[var(--brand)]' : ''} />
            <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
          </button>

          {/* Export to Local PC Menu */}
          {canExport && (
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] text-[0.75rem] font-medium hover:text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors cursor-pointer"
                title={isBn ? 'লোকাল পিসিতে ডাউনলোড / ব্যাকআপ' : 'Download to Local PC'}
              >
                <Download size={13} />
                <span className="hidden sm:inline">{isBn ? 'ব্যাকআপ / এক্সপোর্ট' : 'Export'}</span>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-48 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-lg z-50 overflow-hidden py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false)
                      onExportJson()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] text-left transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <FileJson size={14} className="text-amber-500" />
                    {isBn ? 'JSON ব্যাকআপ (লোকাল পিসি)' : 'JSON Backup (Local PC)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExportMenu(false)
                      onExportCsv()
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] text-left transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <FileSpreadsheet size={14} className="text-emerald-500" />
                    {isBn ? 'CSV তালিকা এক্সপোর্ট' : 'Export CSV List'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* New Assignment Button */}
          {canCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brand)] text-white border-none cursor-pointer hover:shadow-md transition-all"
              title={isBn ? 'নতুন অ্যাসাইনমেন্ট' : 'New Assignment'}
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <select
          value={filterClassId}
          onChange={(e) => onFilterClassChange(e.target.value)}
          className={selectCls}
        >
          <option value="">{isBn ? 'সব শ্রেণি' : 'All Classes'}</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {isBn ? c.nameBn : c.name}
            </option>
          ))}
        </select>

        {filterClassId && availableSections.length > 0 && (
          <select
            value={filterSectionId}
            onChange={(e) => onFilterSectionChange(e.target.value)}
            className={selectCls}
          >
            <option value="">{isBn ? 'সব শাখা' : 'All Sections'}</option>
            {availableSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>
        )}

        {availableSubjects.length > 0 && (
          <select
            value={filterSubjectId}
            onChange={(e) => onFilterSubjectChange(e.target.value)}
            className={selectCls}
          >
            <option value="">{isBn ? 'সব বিষয়' : 'All Subjects'}</option>
            {availableSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {isBn ? s.nameBn : s.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
})
