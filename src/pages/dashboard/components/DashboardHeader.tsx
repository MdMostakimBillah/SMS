import React, { useState, useRef, useEffect } from 'react'
import {
  Download,
  Plus,
  RefreshCw,
  ChevronDown,
  Cloud,
  HardDrive,
  Server,
  FileArchive,
  Database,
  CheckCircle2,
} from 'lucide-react'
import { downloadLocalBackup } from '@/lib/backup'
import { backupApi } from '@/lib/api'

interface Props {
  isBn: boolean
  isMobile: boolean
  userName: string
  storageMode: 'cloud' | 'local_computer' | 'local_server'
  isRefreshing: boolean
  lastSyncAt: number | null
  syncError: string | null
  schoolSlug: string
  schoolName: string
  onRefresh: () => void
  onAddNewTask: () => void
}

export const DashboardHeader: React.FC<Props> = ({
  isBn,
  isMobile,
  userName,
  storageMode,
  isRefreshing,
  lastSyncAt,
  syncError,
  schoolSlug,
  schoolName,
  onRefresh,
  onAddNewTask,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
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

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return isBn ? 'সুপ্রভাত' : 'Good morning'
    if (hour < 17) return isBn ? 'শুভ অপরাহ্ন' : 'Good afternoon'
    if (hour < 21) return isBn ? 'শুভ সন্ধ্যা' : 'Good evening'
    return isBn ? 'শুভ রাত্রি' : 'Good night'
  })()

  const formattedDate = new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formatSyncTime = (ts: number | null): string => {
    if (!ts) return isBn ? 'কখনো না' : 'Never'
    const diffSec = Math.floor((Date.now() - ts) / 1000)
    if (diffSec < 45) return isBn ? 'এইমাত্র' : 'Just now'
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return isBn ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`
    return new Date(ts).toLocaleTimeString()
  }

  const handleDownloadLocalBackup = async () => {
    setShowExportMenu(false)
    try {
      await downloadLocalBackup(schoolSlug, schoolName)
      setExportNotice(
        isBn
          ? 'লোকাল পিসি ব্যাকআপ (.zip) ডাউনলোড শুরু হয়েছে!'
          : 'Local PC backup (.zip) download initiated!'
      )
      setTimeout(() => setExportNotice(null), 3500)
    } catch {
      setExportNotice(isBn ? 'ব্যাকআপ ডাউনলোড ব্যর্থ হয়েছে।' : 'Failed to download backup.')
      setTimeout(() => setExportNotice(null), 3500)
    }
  }

  const handleServerExport = () => {
    setShowExportMenu(false)
    try {
      window.open(backupApi.getExportUrl(), '_blank')
      setExportNotice(
        isBn ? 'সার্ভার ডাটাবেজ ব্যাকআপ শুরু হয়েছে!' : 'Server database backup export initiated!'
      )
      setTimeout(() => setExportNotice(null), 3500)
    } catch {
      setExportNotice(isBn ? 'এক্সপোর্ট ব্যর্থ হয়েছে।' : 'Export failed.')
      setTimeout(() => setExportNotice(null), 3500)
    }
  }

  return (
    <div
      className="gsap-fade-up"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.625rem',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02rem',
              margin: 0,
            }}
          >
            {`${greeting}, ${userName || (isBn ? 'ব্যবহারকারী' : 'User')}`}
          </h1>

          {/* Storage & Database Mode Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3125rem',
              padding: '0.1875rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: 500,
              background:
                storageMode === 'local_computer'
                  ? 'rgba(245, 158, 11, 0.12)'
                  : storageMode === 'local_server'
                    ? 'rgba(99, 102, 241, 0.12)'
                    : 'rgba(34, 197, 94, 0.12)',
              border: `1px solid ${
                storageMode === 'local_computer'
                  ? 'rgba(245, 158, 11, 0.35)'
                  : storageMode === 'local_server'
                    ? 'rgba(99, 102, 241, 0.35)'
                    : 'rgba(34, 197, 94, 0.35)'
              }`,
              color:
                storageMode === 'local_computer'
                  ? '#d97706'
                  : storageMode === 'local_server'
                    ? '#6366f1'
                    : '#16a34a',
            }}
            title={
              storageMode === 'local_computer'
                ? isBn
                  ? 'লোকাল পিসি মোড সক্রিয় (ফাইল ও লোকাল স্টোরেজ)'
                  : 'Local PC Mode Active (Files & Local Storage)'
                : storageMode === 'local_server'
                  ? isBn
                    ? 'কাস্টম সার্ভার সংযুক্ত'
                    : 'Custom Server Connected'
                  : isBn
                    ? 'প্রোভাইডার ক্লাউড ডাটাবেজ সংযুক্ত'
                    : 'Provider Cloud Database Connected'
            }
          >
            {storageMode === 'local_computer' ? (
              <HardDrive size={11} />
            ) : storageMode === 'local_server' ? (
              <Server size={11} />
            ) : (
              <Cloud size={11} />
            )}
            <span>
              {storageMode === 'local_computer'
                ? isBn
                  ? 'লোকাল পিসি মোড'
                  : 'Local PC Mode'
                : storageMode === 'local_server'
                  ? isBn
                    ? 'লোকাল সার্ভার'
                    : 'Local Server'
                : isBn
                  ? 'ক্লাউড ডাটাবেজ'
                  : 'Cloud Database'}
            </span>
          </div>
        </div>

        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: '0.1875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span>{formattedDate}</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ fontSize: '0.6875rem', color: syncError ? 'var(--red)' : 'var(--text-muted)' }}>
            {syncError
              ? isBn
                ? 'সিঙ্ক সতর্কতা (অফলাইন লোকাল ক্যাশ ব্যবহৃত)'
                : 'Sync note (using offline local cache)'
              : `${isBn ? 'সর্বশেষ সিঙ্ক' : 'Last synced'}: ${formatSyncTime(lastSyncAt)}`}
          </span>
        </p>

        {exportNotice && (
          <div
            style={{
              marginTop: '0.375rem',
              fontSize: '0.6875rem',
              color: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <CheckCircle2 size={12} />
            {exportNotice}
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Refresh / Sync Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn-minimal"
          title={
            storageMode === 'local_computer'
              ? isBn
                ? 'লোকাল ডেটা রিফ্রেশ করুন'
                : 'Refresh Local PC Data'
              : isBn
                ? 'ডাটাবেস ও ব্যাকএন্ড থেকে ডেটা সিঙ্ক করুন'
                : 'Sync data from Database & Backend'
          }
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
          {!isMobile && (
            <span>
              {isRefreshing
                ? isBn
                  ? 'সিঙ্ক হচ্ছে...'
                  : 'Syncing...'
                : isBn
                  ? 'ডাটাবেজ সিঙ্ক'
                  : 'DB Sync'}
            </span>
          )}
        </button>

        {/* Export Dropdown */}
        <div ref={exportMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn-minimal"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}
          >
            <Download size={13} />
            {!isMobile && <span>{isBn ? 'এক্সপোর্ট' : 'Export'}</span>}
            <ChevronDown size={11} />
          </button>

          {showExportMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.375rem',
                zIndex: 40,
                minWidth: '13.5rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.625rem',
                boxShadow: 'var(--shadow-md)',
                padding: '0.375rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <button
                type="button"
                onClick={handleDownloadLocalBackup}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.625rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <FileArchive size={14} style={{ color: 'var(--brand)' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {isBn ? 'লোকাল পিসি ব্যাকআপ (.zip)' : 'Local PC Backup (.zip)'}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    {isBn ? 'কম্পিউটারে সম্পূর্ণ ব্যাকআপ ফাইল সেভ করুন' : 'Save full local bundle to your PC'}
                  </div>
                </div>
              </button>

              {storageMode !== 'local_computer' && (
                <button
                  type="button"
                  onClick={handleServerExport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.625rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Database size={14} style={{ color: 'var(--green)' }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {isBn ? 'সার্ভার ডাটাবেজ ব্যাকআপ' : 'Server Database Backup'}
                    </div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                      {isBn ? 'ক্লাউড ডাটাবেজ থেকে সম্পূর্ণ এক্সপোর্ট' : 'Full export from cloud server'}
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add New Task Button */}
        <button
          type="button"
          className="btn-minimal btn-brand"
          onClick={onAddNewTask}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}
        >
          <Plus size={14} />
          <span>{isBn ? 'নতুন কাজ' : 'Add Task'}</span>
        </button>
      </div>
    </div>
  )
}
