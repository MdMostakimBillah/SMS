import React, { useState } from 'react'
import {
  FolderSync,
  Link2,
  RefreshCw,
  Unplug,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  FileJson,
  History,
} from 'lucide-react'
import { useVault } from '@/hooks/useVault'
import { vaultConnectFolder, vaultReconnect, vaultSyncNow, vaultDisconnect } from '@/lib/vault/vault'

interface Props {
  isBn: boolean
}

function formatSyncTime(ts: number | null, isBn: boolean): string {
  if (!ts) return isBn ? 'কখনো না' : 'Never'
  const diffMin = Math.floor((Date.now() - ts) / 60000)
  if (diffMin < 1) return isBn ? 'এইমাত্র' : 'Just now'
  if (diffMin < 60) return isBn ? `${diffMin} মিনিট আগে` : `${diffMin}m ago`
  return new Date(ts).toLocaleString()
}

/**
 * Local Data Vault — connect a folder; every store becomes a JSON file that
 * updates live from browser edits, and hand-edits to the files update the app.
 */
export const LocalVaultSection: React.FC<Props> = ({ isBn }) => {
  const vault = useVault()
  const [actionError, setActionError] = useState<string | null>(null)

  const runAction = async (action: () => Promise<void>) => {
    setActionError(null)
    await action()
  }

  if (!vault.supported) {
    return (
      <div className="rounded-2xl border border-[var(--amber)] bg-[rgba(245,158,11,0.08)] p-4 space-y-2">
        <div className="flex items-center gap-2.5 text-[0.875rem] font-semibold text-[var(--text-primary)]">
          <AlertTriangle size={16} className="text-[var(--amber)]" />
          {isBn ? 'ব্রাউজার সাপোর্ট করে না' : 'Browser Not Supported'}
        </div>
        <p className="text-[0.75rem] text-[var(--text-muted)]">
          {isBn
            ? 'লোকাল ফোল্ডার সিঙ্কের জন্য Chrome, Edge বা অন্য Chromium ব্রাউজার প্রয়োজন। Firefox ও Safari এই ফিচার সাপোর্ট করে না।'
            : 'Local folder sync requires Chrome, Edge, or another Chromium browser. Firefox and Safari do not support this feature.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[rgba(168,85,247,0.12)] text-[#a855f7] flex items-center justify-center">
            <FolderSync size={18} />
          </div>
          <div>
            <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'লোকাল ডেটা ভল্ট (JSON ফাইল)' : 'Local Data Vault (JSON Files)'}
            </h3>
            <p className="text-[0.75rem] text-[var(--text-muted)]">
              {isBn
                ? 'প্রতিটি পেজের ডেটা আলাদা JSON ফাইল হিসেবে ফোল্ডারে সংরক্ষিত হবে'
                : 'Each page\'s data is saved as a separate JSON file in your folder'}
            </p>
          </div>
        </div>

        {vault.connected && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6875rem] font-medium bg-[rgba(16,185,129,0.1)] text-[var(--green)] border border-[rgba(16,185,129,0.2)]">
            <ShieldCheck size={12} />
            {isBn ? 'সংযুক্ত' : 'Connected'}
          </span>
        )}
      </div>

      {/* Reconnect banner */}
      {vault.needsReconnect && (
        <div className="p-3 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.25)] flex items-center justify-between gap-2">
          <span className="text-[0.8125rem] text-[var(--amber)] flex items-center gap-2">
            <AlertTriangle size={15} />
            {isBn
              ? `ফোল্ডার "${vault.folderName}" এর অনুমতি নবায়ন প্রয়োজন`
              : `Permission needed for folder "${vault.folderName}"`}
          </span>
          <button
            type="button"
            disabled={vault.busy}
            onClick={() => runAction(vaultReconnect)}
            className="h-8 px-3 rounded-lg bg-[var(--amber)] text-white text-[0.75rem] font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {vault.busy ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
            {isBn ? 'পুনঃসংযোগ' : 'Reconnect'}
          </button>
        </div>
      )}

      {/* Connected status */}
      {vault.connected && !vault.needsReconnect && (
        <div className="grid grid-cols-2 gap-2 py-2.5 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
          <div className="flex items-center gap-2 min-w-0">
            <FileJson size={15} className="text-[var(--green)] shrink-0" />
            <div className="min-w-0">
              <div className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">
                {vault.folderName}
              </div>
              <div className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'সংযুক্ত ফোল্ডার' : 'Connected folder'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <History size={15} className="text-[var(--text-muted)] shrink-0" />
            <div className="text-right">
              <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">
                {formatSyncTime(vault.lastSyncAt, isBn)}
              </div>
              <div className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn ? 'সর্বশেষ সিঙ্ক' : 'Last sync'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How it works */}
      <p className="text-[0.75rem] text-[var(--text-muted)] leading-relaxed">
        {isBn
          ? 'ব্রাউজারে যেকোনো পরিবর্তন সরাসরি ফাইলে লিখিত হবে, এবং ফাইলে হাতে করে পরিবর্তন করলে সেটি সফটওয়্যারে অটো-আপডেট হবে। ফোল্ডার ডিলিট হলে ডেটা হারায় — তাই টেলিগ্রাম ব্যাকআপ নিশ্চিত করুন।'
          : 'Every change in the browser is written straight to the files, and editing the files by hand updates the software automatically. If the folder is deleted the data is gone — so keep the Telegram backup enabled.'}
      </p>

      {/* Errors */}
      {(vault.error || actionError) && (
        <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[0.8125rem] text-[var(--red)] flex items-center gap-2">
          <AlertTriangle size={15} />
          {actionError || vault.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2.5">
        {!vault.connected && !vault.needsReconnect && (
          <button
            type="button"
            disabled={vault.busy}
            onClick={() => runAction(vaultConnectFolder)}
            className="flex-1 h-10 px-3 rounded-xl bg-[var(--brand)] text-white font-medium text-[0.8125rem] flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {vault.busy ? <Loader2 size={15} className="animate-spin" /> : <FolderSync size={15} />}
            {isBn ? 'ফোল্ডার নির্বাচন করুন' : 'Choose Folder'}
          </button>
        )}

        {vault.connected && (
          <>
            <button
              type="button"
              disabled={vault.busy}
              onClick={() => runAction(vaultSyncNow)}
              className="h-10 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-medium text-[0.8125rem] flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-secondary)] disabled:opacity-50 transition-all"
            >
              <RefreshCw size={15} />
              {isBn ? 'এখনই সিঙ্ক করুন' : 'Sync Now'}
            </button>
            <button
              type="button"
              disabled={vault.busy}
              onClick={() => runAction(vaultDisconnect)}
              className="h-10 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--red)] font-medium text-[0.8125rem] flex items-center justify-center gap-2 cursor-pointer hover:bg-[var(--bg-secondary)] disabled:opacity-50 transition-all"
            >
              <Unplug size={15} />
              {isBn ? 'ডিসকনেক্ট' : 'Disconnect'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
