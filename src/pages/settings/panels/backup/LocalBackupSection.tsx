import React, { useRef, useState, useEffect } from 'react'
import { Download, Upload, HardDrive, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { collectLocalStores, downloadLocalBackup, parseAndValidateBackup, restoreLocalStores, type BackupSummary } from '@/lib/backup'
import { backupApi } from '@/lib/api'

interface Props {
  isBn: boolean
  schoolSlug: string
  schoolName: string
}

export const LocalBackupSection: React.FC<Props> = ({ isBn, schoolSlug, schoolName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localStats, setLocalStats] = useState<{ classes: number; teachers: number; students: number; exams: number }>({
    classes: 0,
    teachers: 0,
    students: 0,
    exams: 0,
  })
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [pendingSummary, setPendingSummary] = useState<BackupSummary | null>(null)
  const [pendingBundle, setPendingBundle] = useState<any>(null)

  const refreshStats = () => {
    const bundle = collectLocalStores(schoolSlug)
    setLocalStats({
      classes: bundle.metadata.counts.classes,
      teachers: bundle.metadata.counts.teachers,
      students: bundle.metadata.counts.students,
      exams: bundle.metadata.counts.exams,
    })
  }

  useEffect(() => {
    refreshStats()
  }, [schoolSlug])

  const handleDownload = () => {
    try {
      downloadLocalBackup(schoolSlug, schoolName)
      setStatusMessage({
        type: 'success',
        text: isBn ? 'লোকাল কম্পিউটার ব্যাকআপ ফাইল ডাউনলোড সম্পন্ন হয়েছে!' : 'Local computer backup file downloaded successfully!',
      })
      setTimeout(() => setStatusMessage(null), 4000)
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: isBn ? 'ব্যাকআপ ডাউনলোড ব্যর্থ হয়েছে।' : 'Failed to download backup file.',
      })
    }
  }

  const handleFetchServer = async () => {
    try {
      window.open(backupApi.getExportUrl(), '_blank')
      setStatusMessage({
        type: 'success',
        text: isBn ? 'সার্ভার ডেটা এক্সপোর্ট শুরু হয়েছে!' : 'Server data export initiated!',
      })
      setTimeout(() => setStatusMessage(null), 4000)
    } catch {
      setStatusMessage({
        type: 'error',
        text: isBn ? 'সার্ভার ডেটা এক্সপোর্ট ব্যর্থ হয়েছে।' : 'Server data export failed.',
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const result = parseAndValidateBackup(content)
      if (!result.valid || !result.bundle || !result.summary) {
        setStatusMessage({
          type: 'error',
          text: result.error || (isBn ? 'ব্যাকআপ ফাইলের ফরম্যাট অবৈধ।' : 'Invalid backup file format.'),
        })
        return
      }

      setPendingSummary(result.summary)
      setPendingBundle(result.bundle)
    }
    reader.readAsText(file)
  }

  const handleConfirmRestore = () => {
    if (!pendingBundle) return
    setIsRestoring(true)
    try {
      restoreLocalStores(pendingBundle, schoolSlug)
      setStatusMessage({
        type: 'success',
        text: isBn ? 'ডেটা সফলভাবে পুনরুদ্ধার করা হয়েছে! পেজ রিফ্রেশ হচ্ছে...' : 'Data restored successfully! Refreshing page...',
      })
      setTimeout(() => {
        window.location.reload()
      }, 1200)
    } catch (err) {
      setIsRestoring(false)
      setStatusMessage({
        type: 'error',
        text: isBn ? 'পুনরুদ্ধার ব্যর্থ হয়েছে।' : 'Failed to restore data.',
      })
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(14,165,233,0.12)] text-[var(--brand)] flex items-center justify-center">
            <HardDrive size={18} />
          </div>
          <div>
            <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'লোকাল কম্পিউটার ব্যাকআপ ও ফেচার' : 'Local Computer Backup & Fetcher'}
            </h3>
            <p className="text-[0.75rem] text-[var(--text-muted)]">
              {isBn ? 'কম্পিউটারে লোকাল স্টোরেজ ও সার্ভার ডেটা সংরক্ষণ ও রিস্টোর' : 'Save and restore local device & server data'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={refreshStats}
          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          title={isBn ? 'রিফ্রেশ' : 'Refresh'}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Record statistics banner */}
      <div className="grid grid-cols-4 gap-2 py-2 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-center">
        <div>
          <div className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{localStats.classes}</div>
          <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'শ্রেণি' : 'Classes'}</div>
        </div>
        <div>
          <div className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{localStats.teachers}</div>
          <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'শিক্ষক' : 'Teachers'}</div>
        </div>
        <div>
          <div className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{localStats.students}</div>
          <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'শিক্ষার্থী' : 'Students'}</div>
        </div>
        <div>
          <div className="text-[0.9375rem] font-bold text-[var(--text-primary)]">{localStats.exams}</div>
          <div className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'পরীক্ষা' : 'Exams'}</div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 text-[0.8125rem] ${
            statusMessage.type === 'success'
              ? 'bg-[rgba(16,185,129,0.1)] text-[var(--green)] border border-[rgba(16,185,129,0.2)]'
              : 'bg-[rgba(239,68,68,0.1)] text-[var(--red)] border border-[rgba(239,68,68,0.2)]'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 h-10 px-3 rounded-xl bg-[var(--brand)] text-white font-medium text-[0.8125rem] flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 transition-all"
        >
          <Download size={15} />
          {isBn ? 'কম্পিউটারে ব্যাকআপ ডাউনলোড' : 'Download to Computer'}
        </button>

        <button
          type="button"
          onClick={handleFetchServer}
          className="h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-medium text-[0.8125rem] flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-secondary)] transition-all"
        >
          <Download size={15} />
          {isBn ? 'সার্ভার ডেটা এক্সপোর্ট' : 'Fetch Server Data'}
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-medium text-[0.8125rem] flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-secondary)] transition-all"
        >
          <Upload size={15} />
          {isBn ? 'ফাইল থেকে রিস্টোর' : 'Restore from File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Pending Restore Modal / Confirmation */}
      {pendingSummary && (
        <div className="p-3.5 rounded-xl border border-[var(--amber)] bg-[rgba(245,158,11,0.08)] space-y-3">
          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <AlertCircle size={15} className="text-[var(--amber)]" />
            {isBn ? 'ব্যাকআপ ফাইল যাচাই সম্পন্ন' : 'Backup File Validated'}
          </div>
          <div className="text-[0.75rem] text-[var(--text-secondary)] space-y-1">
            <div><strong>{isBn ? 'প্রতিষ্ঠান:' : 'Slug:'}</strong> {pendingSummary.slug}</div>
            <div><strong>{isBn ? 'মোট কি:' : 'Stores:'}</strong> {pendingSummary.totalKeys}</div>
            <div>
              <strong>{isBn ? 'রেকর্ড:' : 'Records:'}</strong> {pendingSummary.classes} {isBn ? 'শ্রেণি' : 'classes'}, {pendingSummary.teachers} {isBn ? 'শিক্ষক' : 'teachers'}, {pendingSummary.students} {isBn ? 'শিক্ষার্থী' : 'students'}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              disabled={isRestoring}
              onClick={() => { setPendingSummary(null); setPendingBundle(null) }}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[0.75rem] text-[var(--text-muted)] cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isRestoring}
              onClick={handleConfirmRestore}
              className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.75rem] font-medium cursor-pointer"
            >
              {isRestoring ? (isBn ? 'পুনরুদ্ধার হচ্ছে...' : 'Restoring...') : (isBn ? 'পুনরুদ্ধার নিশ্চিত করুন' : 'Confirm & Restore')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
