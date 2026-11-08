import React, { useState } from 'react'
import {
  FolderSync,
  HardDrive,
  Database,
  RefreshCw,
  FolderOpen,
  Link2,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import { vaultConnectFolder, vaultReconnect, vaultSyncNow } from '@/lib/vault/vault'
import { useDeviceStorage } from '@/hooks/useDeviceStorage'
import { downloadLocalBackup } from '@/lib/backup'

interface Props {
  isBn: boolean
  isMobile: boolean
  storageMode: 'cloud' | 'local_computer' | 'local_server'
  schoolSlug: string
  schoolName: string
  totalRecordsCount: number
  isRefreshing: boolean
  onSyncDatabase: () => void
}

export const LocalPCControlCard: React.FC<Props> = ({
  isBn,
  isMobile,
  storageMode,
  schoolSlug,
  schoolName,
  totalRecordsCount,
  isRefreshing,
  onSyncDatabase,
}) => {
  const vault = useVault()
  const { stats: deviceStorage } = useDeviceStorage()
  const [isExpanded, setIsExpanded] = useState(true)
  const [vaultActionMsg, setVaultActionMsg] = useState<string | null>(null)

  const handleVaultSync = async () => {
    try {
      await vaultSyncNow()
      setVaultActionMsg(isBn ? 'লোকাল পিসি ফোল্ডার সিঙ্ক সম্পন্ন!' : 'Local PC folder sync complete!')
      setTimeout(() => setVaultActionMsg(null), 3500)
    } catch {
      setVaultActionMsg(isBn ? 'ফোল্ডার সিঙ্ক ব্যর্থ হয়েছে।' : 'Folder sync failed.')
      setTimeout(() => setVaultActionMsg(null), 3500)
    }
  }

  const handleVaultReconnect = async () => {
    try {
      await vaultReconnect()
    } catch {
      /* handled inside vault */
    }
  }

  const handleVaultConnect = async () => {
    try {
      await vaultConnectFolder()
    } catch {
      /* handled inside vault */
    }
  }

  const handleDownloadBackup = async () => {
    try {
      await downloadLocalBackup(schoolSlug, schoolName)
      setVaultActionMsg(isBn ? 'লোকাল ব্যাকআপ (.zip) সংরক্ষিত হয়েছে!' : 'Local backup (.zip) saved!')
      setTimeout(() => setVaultActionMsg(null), 3500)
    } catch {
      setVaultActionMsg(isBn ? 'ব্যাকআপ তৈরিতে ত্রুটি।' : 'Error creating backup.')
      setTimeout(() => setVaultActionMsg(null), 3500)
    }
  }

  return (
    <div
      className="card--premium gsap-fade-up"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: isMobile ? '0.75rem' : '0.875rem 1rem',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Header bar with toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Cpu size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isBn ? 'লোকাল পিসি ও ডাটাবেজ ইন্টিগ্রেশন' : 'Local PC & Database Hub'}
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  background:
                    storageMode === 'local_computer'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'rgba(34, 197, 94, 0.12)',
                  color: storageMode === 'local_computer' ? 'var(--amber)' : 'var(--green)',
                  border: `1px solid ${
                    storageMode === 'local_computer'
                      ? 'rgba(245, 158, 11, 0.3)'
                      : 'rgba(34, 197, 94, 0.3)'
                  }`,
                }}
              >
                {storageMode === 'local_computer'
                  ? isBn
                    ? 'লোকাল পিসি মোড'
                    : 'Local PC Mode'
                  : isBn
                    ? 'ডাটাবেজ সংযুক্ত'
                    : 'Database Connected'}
              </span>
            </div>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: 0 }}>
              {isBn
                ? 'রিয়েল-টাইম ডাটাবেস সিঙ্ক, কম্পিউটারের লোকাল JSON ভল্ট ও ব্যাকআপ স্থিতি'
                : 'Real-time database sync, local PC JSON vault, and machine storage status'}
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {vaultActionMsg && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.375rem 0.625rem',
            borderRadius: '0.375rem',
            background: 'rgba(99, 102, 241, 0.1)',
            color: 'var(--brand)',
            fontSize: '0.6875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <ShieldCheck size={13} />
          {vaultActionMsg}
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div
          style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '0.75rem',
          }}
        >
          {/* Card 1: Backend Database Status */}
          <div
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                <Database size={13} style={{ color: 'var(--brand)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isBn ? 'ডাটাবেজ ও ব্যাকএন্ড' : 'Database & Backend'}
                </span>
              </div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: 0 }}>
                {storageMode === 'local_computer'
                  ? isBn
                    ? 'সার্ভার ডাটাবেজ বিচ্ছিন্ন — সম্পূর্ণ ডেটা লোকাল মেমোরি ও পিসিতে সংরক্ষিত।'
                    : 'Server database bypassed — all operations run 100% locally on this PC.'
                  : isBn
                    ? 'PostgreSQL ব্যাকএন্ড লাইভ সিঙ্ক সক্রিয়। ক্লাউড ডাটাবেজ নিয়মিত আপডেট হচ্ছে।'
                    : 'PostgreSQL backend live sync active. Cloud database continuously updated.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onSyncDatabase}
              disabled={isRefreshing}
              className="btn-minimal"
              style={{
                alignSelf: 'flex-start',
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3125rem',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing
                ? isBn
                  ? 'সিঙ্ক হচ্ছে...'
                  : 'Syncing...'
                : isBn
                  ? 'ডাটাবেজ রিফ্রেশ'
                  : 'Sync DB Now'}
            </button>
          </div>

          {/* Card 2: Local PC Folder (Vault) */}
          <div
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                <FolderSync size={13} style={{ color: '#a855f7' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {isBn ? 'লোকাল পিসি ফোল্ডার (JSON)' : 'Local PC Folder Vault'}
                </span>
              </div>
              <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', margin: 0 }}>
                {vault.connected
                  ? isBn
                    ? `ফোল্ডার "${vault.folderName}" এ ফাইল অটো-সিঙ্ক হচ্ছে।`
                    : `Folder "${vault.folderName}" connected with real-time JSON sync.`
                  : vault.needsReconnect
                    ? isBn
                      ? `সংরক্ষিত ফোল্ডার "${vault.folderName}" এর এক্সেস অনুমতি দিন।`
                      : `Permission needed to reconnect folder "${vault.folderName}".`
                    : isBn
                      ? 'কম্পিউটারের নির্দিষ্ট ফোল্ডারে পেজের ডেটা JSON ফাইল হিসেবে সংরক্ষণ করুন।'
                      : 'Sync all store data to a folder on your hard drive as JSON files.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {vault.connected && (
                <button
                  type="button"
                  onClick={handleVaultSync}
                  disabled={vault.busy}
                  className="btn-minimal"
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.25rem 0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3125rem',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={11} className={vault.busy ? 'animate-spin' : ''} />
                  {isBn ? 'ফোল্ডার সিঙ্ক' : 'Sync Folder'}
                </button>
              )}

              {vault.needsReconnect && (
                <button
                  type="button"
                  onClick={handleVaultReconnect}
                  disabled={vault.busy}
                  className="btn-minimal btn-brand"
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.25rem 0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3125rem',
                    cursor: 'pointer',
                  }}
                >
                  <Link2 size={11} />
                  {isBn ? 'অনুমতি দিন' : 'Grant Access'}
                </button>
              )}

              {!vault.connected && !vault.needsReconnect && (
                <button
                  type="button"
                  onClick={handleVaultConnect}
                  disabled={vault.busy}
                  className="btn-minimal"
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.25rem 0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3125rem',
                    cursor: 'pointer',
                  }}
                >
                  <FolderOpen size={11} />
                  {isBn ? 'ফোল্ডার যুক্ত করুন' : 'Connect Folder'}
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Local Storage & Backup Bundle */}
          <div
            style={{
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <HardDrive size={13} style={{ color: 'var(--teal)' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isBn ? 'লোকাল পিসি স্টোরেজ' : 'Local PC Storage'}
                  </span>
                </div>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  {totalRecordsCount} {isBn ? 'টি রেকর্ড' : 'records'}
                </span>
              </div>

              {/* Storage Meter */}
              <div style={{ marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '0.1875rem' }}>
                  <span>{isBn ? 'ব্যবহৃত:' : 'Used:'} {deviceStorage.usedFormatted}</span>
                  <span>{deviceStorage.percentUsed}%</span>
                </div>
                <div
                  style={{
                    height: '0.25rem',
                    background: 'var(--border)',
                    borderRadius: '0.125rem',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(deviceStorage.percentUsed, 100)}%`,
                      background: 'var(--teal)',
                      borderRadius: '0.125rem',
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadBackup}
              className="btn-minimal"
              style={{
                alignSelf: 'flex-start',
                fontSize: '0.6875rem',
                padding: '0.25rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3125rem',
                cursor: 'pointer',
              }}
            >
              <Download size={11} />
              {isBn ? 'লোকাল ব্যাকআপ (.zip)' : 'Download Backup'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
