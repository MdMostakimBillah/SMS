import React, { useState, useRef, useEffect } from 'react'
import {
  Plus,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react'

export interface AssignmentHeaderProps {
  isBn: boolean
  isMobile: boolean
  refreshing: boolean
  syncing?: boolean
  canCreate: boolean
  canExport: boolean
  onRefresh: () => void
  onOpenCreate: () => void
  onExportJson: () => void
  onExportCsv: () => void
}

export const AssignmentHeader = React.memo(function AssignmentHeader({
  isBn,
  isMobile,
  refreshing,
  syncing,
  canCreate,
  canExport,
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
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
            {isBn ? 'অ্যাসাইনমেন্ট' : 'Assignments'}
          </h1>
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
    </div>
  )
})
