/**
 * License panel — activate a signed license key and view enforcement status.
 *
 * Read-only enforcement (after the grace period) is applied at the storage
 * layer (src/lib/storage.ts, src/lib/vault/vault.ts) so all 21 stores are
 * covered without modifying any store. This panel only displays status and
 * lets an admin activate a key.
 */

import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Clock, Key, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { SettingsPanel } from '../components/SettingsPanel'
import type { LicenseStatus } from '@/lib/license'
import { graceDaysLeft } from '@/lib/license'

interface Props {
  isBn: boolean
  onBack: () => void
}

function statusLabel(status: LicenseStatus, isBn: boolean): string {
  const map: Record<LicenseStatus, { en: string; bn: string }> = {
    unlicensed: { en: 'Unlicensed', bn: 'লাইসেন্স নেই' },
    valid: { en: 'Active', bn: 'সক্রিয়' },
    grace: { en: 'In grace period', bn: 'গ্রেস পিরিয়ডে' },
    expired: { en: 'Expired', bn: 'মেয়াদোত্তীর্ণ' },
  }
  return isBn ? map[status].bn : map[status].en
}

export const LicensePanel: React.FC<Props> = ({ isBn, onBack }) => {
  const { settings, setLicenseKey, validateLicense } = useAppStore((s) => ({
    settings: s.settings,
    setLicenseKey: s.setLicenseKey,
    validateLicense: s.validateLicense,
  }))

  const readOnly = settings.readOnly
  const status = settings.licenseStatus
  const isExpired = status === 'expired'
  const inGrace = status === 'grace'
  const daysLeft =
    settings.graceEndsAt
      ? Math.max(0, Math.ceil((new Date(settings.graceEndsAt).getTime() - Date.now()) / 86400000))
      : graceDaysLeft({ expiresAt: new Date(settings.licenseExpiresAt || 0).getTime() } as never)

  const [key, setKey] = useState(settings.licenseKey || '')
  const [activating, setActivating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleActivate = async () => {
    if (!key.trim()) {
      setMessage({ type: 'error', text: isBn ? 'লাইসেন্স কী প্রয়োজন।' : 'License key is required.' })
      return
    }
    setActivating(true)
    setMessage(null)
    try {
      setLicenseKey(key.trim())
      await validateLicense()
      const next = useAppStore.getState().settings.licenseStatus
      setMessage({
        type: next === 'expired' ? 'error' : 'success',
        text: next === 'expired'
          ? isBn
            ? 'কী গ্রহণ করা হলো, কিন্তু লাইসেন্স মেয়াদোত্তীর্ণ। অ্যাপ শুধু পাঠময় হবে।'
            : 'Key accepted, but the license is expired. App is read-only.'
          : isBn
            ? 'লাইসেন্স সক্রিয় করা হয়েছে।'
            : 'License activated.',
      })
    } catch {
      setMessage({
        type: 'error',
        text: isBn ? 'লাইসেন্স সক্রিয় করতে পারিনি।' : 'Failed to activate license.',
      })
    } finally {
      setActivating(false)
    }
  }

  return (
    <SettingsPanel title="License" titleBn="লাইসেন্স" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(168,85,247,0.12)] text-[#a855f7] flex items-center justify-center">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
                {isBn ? 'লাইসেন্স' : 'License'}
              </h3>
              <p className="text-[0.75rem] text-[var(--text-muted)]">
                {isBn
                  ? 'সাইন করা লাইসেন্স কী দিয়ে এডুকটেক সক্রিয় করুন। মেয়াদ শেষ হয়ে গ্রেস পিরিয়্ড শেষ হলে সফটওয়্যার শুধু পাঠময় হবে।'
                  : 'Activate EduTech with a signed license key. After expiry plus the grace period, the app becomes read-only.'}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-medium border ${
              status === 'valid'
                ? 'bg-[rgba(16,185,129,0.1)] text-[var(--green)] border-[rgba(16,185,129,0.2)]'
                : status === 'grace'
                  ? 'bg-[rgba(245,158,11,0.1)] text-[var(--amber)] border-[rgba(245,158,11,0.2)]'
                  : 'bg-[rgba(239,68,68,0.1)] text-[var(--red)] border-[rgba(239,68,68,0.2)]'
            }`}
          >
            {status === 'valid' ? <ShieldCheck size={12} /> : status === 'expired' ? <ShieldAlert size={12} /> : <Clock size={12} />}
            {statusLabel(status, isBn)}
          </span>
        </div>

        {/* Key input */}
        <div className="space-y-3">
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
            <Key size={13} />
            {isBn ? 'লাইসেন্স কী (License Key)' : 'License Key'}
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={readOnly || activating}
            placeholder="v1.<payload>.<signature>"
            className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] font-mono disabled:opacity-60"
          />
          <button
            type="button"
            disabled={!key.trim() || readOnly || activating}
            onClick={handleActivate}
            className="w-full h-10 rounded-xl bg-[var(--brand)] text-white font-medium text-[0.8125rem] flex items-center justify-center gap-2 cursor-pointer hover:opacity-95 disabled:opacity-50 transition-all disabled:cursor-not-allowed"
          >
            <svg
              className={`w-4 h-4 ${activating ? 'animate-spin' : ''} shrink-0`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="21" x2="21" y1="12" y2="12" />
              <path d="M4.93 4.93l9.14 9.14M19.07 19.07l-9.14-9.14M14.93 4.93l-9.14 9.14M9.07 9.07l9.14 9.14" />
            </svg>
            {isBn ? (activating ? 'সক্রিয় করা হচ্ছে...' : 'লাইসেন্স সক্রিয় করুন') : activating ? 'Activating...' : 'Activate License'}
          </button>
        </div>

        {/* Status */}
        {settings.licenseKey && (
          <div className="grid grid-cols-2 gap-2 py-2.5 px-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'অবস্থা' : 'Status'}</span>
              <span className="text-[0.8125rem] font-medium text-[var(--text-primary)] truncate">
                {statusLabel(status, isBn)}
              </span>
            </div>
            {settings.licenseExpiresAt && (
              <div className="flex items-center gap-2 justify-end min-w-0">
                <span className="text-[0.6875rem] text-[var(--text-muted)]">{isBn ? 'মেয়াদোত্তীর্ণ' : 'Expires'}</span>
                <span className="text-[0.8125rem] font-medium text-[var(--text-primary)] text-right truncate">
                  {new Date(settings.licenseExpiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
            )}
            {inGrace && (
              <div className="flex items-center gap-2 justify-end min-w-0 col-span-2">
                <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                  {isBn ? `গ্রেস পিরিয়্ড: ${daysLeft} দিন বাকি` : `Grace period: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Read-only enforcement banner */}
        {isExpired && (
          <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] flex items-center gap-2">
            <AlertCircle size={16} className="text-[var(--red)]" />
            <div>
              <div className="text-[0.8125rem] font-medium text-[var(--red)]">
                {isBn ? 'লাইসেন্স মেয়াদোত্তীর্ণ — শুধু পাঠময়' : 'License expired — read-only'}
              </div>
              <div className="text-[0.75rem] text-[var(--text-muted)]">
                {isBn
                  ? 'গ্রেস পিরিয়্ড শেষ হয়েছে। ডেটা পড়তে পারবেন কিন্তু পরিবর্তন সেভ করা যাবে না। নতুন লাইসেন্স কী সক্রিয় করুন।'
                  : 'Grace period has ended. You can read data but cannot save changes. Activate a new license key.'}
              </div>
            </div>
          </div>
        )}

        {/* Heartbeat info */}
        {settings.lastHeartbeatAt && (
          <div className="flex items-center gap-2 text-[0.75rem] text-[var(--text-muted)]">
            <ShieldCheck size={14} className="shrink-0" />
            <span>
              {isBn
                ? `শেষ হার্টবিট: ${new Date(settings.lastHeartbeatAt).toLocaleTimeString()}`
                : `Last heartbeat: ${new Date(settings.lastHeartbeatAt).toLocaleTimeString()}`}
            </span>
          </div>
        )}

        {message && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 text-[0.8125rem] ${
              message.type === 'success'
                ? 'bg-[rgba(16,185,129,0.1)] text-[var(--green)] border border-[rgba(16,185,129,0.2)]'
                : 'bg-[rgba(239,68,68,0.1)] text-[var(--red)] border border-[rgba(239,68,68,0.2)]'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </SettingsPanel>
  )
}
