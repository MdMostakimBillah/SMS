import React, { useState } from 'react'
import { Download, Cloud, Laptop, Server, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useClassStore, type ClassInfo, type ClassRoutine } from '@/store/classStore'
import { getActiveStorageMode, getActiveServerUrl, type StorageMode } from '@/lib/storageMode'

export interface StorageArchitectureBannerProps {
  storageMode?: StorageMode
  serverUrl?: string
  currentSession?: string
  isBn: boolean
  classes?: ClassInfo[]
  routines?: ClassRoutine[]
  onExportJson?: () => void
  onManualSync?: () => void
}

export const StorageArchitectureBanner: React.FC<StorageArchitectureBannerProps> = ({
  storageMode: propMode,
  serverUrl: propServerUrl,
  currentSession: propSession,
  isBn,
  classes: propClasses,
  routines: propRoutines,
  onExportJson,
  onManualSync,
}) => {
  const [syncingState, setSyncingState] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)

  const activeMode: StorageMode = propMode || getActiveStorageMode()
  const activeUrl = propServerUrl || getActiveServerUrl()
  const activeSession = propSession || useClassStore.getState().institution.currentSession || '2025-26'

  const handleManualSync = async () => {
    if (onManualSync) {
      onManualSync()
      return
    }
    setSyncingState(true)
    try {
      await useClassStore.getState().syncToServer()
      setSyncSuccess(true)
      setTimeout(() => setSyncSuccess(false), 2500)
    } finally {
      setSyncingState(false)
    }
  }

  const handleExportJson = () => {
    if (onExportJson) {
      onExportJson()
      return
    }
    const storeState = useClassStore.getState()
    const classes = propClasses || storeState.classes || []
    const routines = propRoutines || storeState.routines || []

    const payload = {
      session: activeSession,
      storageMode: activeMode,
      classes,
      routines,
      exportedAt: new Date().toISOString(),
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    const dlAnchorElem = document.createElement('a')
    dlAnchorElem.setAttribute('href', dataStr)
    dlAnchorElem.setAttribute('download', `classes_and_routines_${activeSession}.json`)
    dlAnchorElem.click()
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-3 py-2 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex-wrap text-[0.75rem]">
      <div className="flex items-center gap-2">
        {activeMode === 'local_computer' ? (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold text-[0.6875rem]">
            <Laptop size={12} />
            {isBn ? 'লোকাল পিসি স্টোরেজ' : 'Local PC Storage'}
          </span>
        ) : activeMode === 'local_server' ? (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-semibold text-[0.6875rem]">
            <Server size={12} />
            {isBn ? 'নিজস্ব ভিপিএস সার্ভার' : 'Custom VPS Server'}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-[0.6875rem]">
            <Cloud size={12} />
            {isBn ? 'প্রোভাইডার ক্লাউড ডাটাবেজ' : 'Provider Cloud Database'}
          </span>
        )}

        <span className="text-[var(--text-muted)] text-[0.6875rem] hidden sm:inline">
          {activeMode === 'local_computer'
            ? (isBn ? 'অফলাইন প্রথম — ডেটা সরাসরি কম্পিউটারে জমা থাকে' : 'Offline first — data stored locally on your device')
            : activeMode === 'local_server'
            ? (isBn ? `সার্ভার API: ${activeUrl || 'Connected'}` : `VPS API: ${activeUrl || 'Connected'}`)
            : (isBn ? 'সুপাবেস + পোস্টগ্রেস ডাটাবেজে স্বয়ংক্রিয় সিঙ্ক সক্রিয়' : 'PostgreSQL database connected & auto-synced')}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {syncSuccess && (
          <span className="flex items-center gap-1 text-[var(--green)] text-[0.6875rem] font-semibold">
            <CheckCircle2 size={13} />
            {isBn ? 'সিঙ্ক সম্পন্ন' : 'Synced'}
          </span>
        )}

        {activeMode === 'local_computer' ? (
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)] text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors cursor-pointer text-[0.6875rem] font-medium"
            title={isBn ? 'পিসিতে ব্যাকআপ ফাইল ডাউনলোড করুন' : 'Export classes & routines JSON to PC'}
          >
            <Download size={11} />
            {isBn ? 'পিসি ব্যাকআপ (JSON)' : 'Export JSON to PC'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncingState}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)] text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors cursor-pointer text-[0.6875rem] font-medium disabled:opacity-50"
            title={activeMode === 'local_server' ? (isBn ? 'ভিপিএস সার্ভারে সিঙ্ক করুন' : 'Sync with VPS Server') : (isBn ? 'ক্লাউড ডাটাবেজে সিঙ্ক করুন' : 'Sync with Cloud Database')}
          >
            <RefreshCw size={11} className={syncingState ? 'animate-spin' : ''} />
            {syncingState
              ? (isBn ? 'সিঙ্ক হচ্ছে...' : 'Syncing...')
              : activeMode === 'local_server'
              ? (isBn ? 'ভিপিএস সিঙ্ক' : 'Sync VPS')
              : (isBn ? 'ডাটাবেজ সিঙ্ক' : 'Sync Database')}
          </button>
        )}
      </div>
    </div>
  )
}

export default StorageArchitectureBanner
