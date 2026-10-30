import React, { useState } from 'react'
import { Server, ShieldCheck, Globe, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  isBn: boolean
  serverUrl: string
  folderName: string
  onServerUrlChange: (url: string) => void
  onFolderNameChange: (folder: string) => void
  onSave: () => void
}

export const VPSServerControlPanel: React.FC<Props> = ({
  isBn,
  serverUrl,
  folderName,
  onServerUrlChange,
  onFolderNameChange,
  onSave,
}) => {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleTestConnection = async () => {
    if (!serverUrl.trim()) {
      setTestResult({
        ok: false,
        message: isBn ? 'দয়া করে সার্ভার API URL দিন।' : 'Please enter a server API URL.',
      })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${serverUrl.replace(/\/$/, '')}/api/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })
      if (res.ok) {
        setTestResult({
          ok: true,
          message: isBn ? 'সার্ভার সংযোগ সফল!' : 'Server connection successful!',
        })
      } else {
        setTestResult({
          ok: false,
          message: isBn ? `সার্ভার রেসপন্স কোড: ${res.status}` : `Server returned status: ${res.status}`,
        })
      }
    } catch {
      setTestResult({
        ok: false,
        message: isBn ? 'সার্ভারে সংযোগ ব্যর্থ হয়েছে।' : 'Could not connect to server URL.',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
          <Server size={18} className="text-[var(--brand)]" />
          {isBn ? 'নিজস্ব ভিপিএস সার্ভার কনফিগারেশন' : 'Own Server (VPS) Control Panel'}
        </h3>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.75rem] font-medium bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/20">
          <ShieldCheck size={12} />
          {isBn ? 'সেলফ-হোস্টেড' : 'Self-hosted'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
            {isBn ? 'ভিপিএস সার্ভার API URL' : 'VPS Server API Endpoint'}
          </label>
          <div className="relative">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => onServerUrlChange(e.target.value)}
              placeholder="https://sms.your-institution.edu.bd"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
            {isBn ? 'সংরক্ষণ সাবফোল্ডার নাম' : 'Storage Subfolder Name'}
          </label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => onFolderNameChange(e.target.value)}
            placeholder="edutech_production"
            className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>
      </div>

      {testResult && (
        <div
          className={`p-3 rounded-xl text-[0.75rem] flex items-center gap-2 ${
            testResult.ok
              ? 'bg-[var(--green-light)] border border-[var(--green)]/30 text-[var(--green)]'
              : 'bg-[var(--red-light)] border border-[var(--red)]/30 text-[var(--red)]'
          }`}
        >
          {testResult.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="h-9 px-3.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border)] text-[0.75rem] font-semibold text-[var(--text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
          {isBn ? 'সংযোগ পরীক্ষা করুন' : 'Test connection'}
        </button>

        <button
          type="button"
          onClick={onSave}
          className="h-9 px-4 rounded-xl bg-[var(--brand)] hover:opacity-90 text-white text-[0.75rem] font-bold transition-all shadow-sm cursor-pointer"
        >
          {isBn ? 'সার্ভার সেটিংস সংরক্ষণ' : 'Save server settings'}
        </button>
      </div>
    </div>
  )
}
