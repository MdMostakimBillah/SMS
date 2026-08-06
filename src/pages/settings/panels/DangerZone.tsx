import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

export function DangerZonePanel({ isBn, onBack }: Props) {
  const [confirmText, setConfirmText] = useState('')

  return (
    <SettingsPanel title="Danger Zone" titleBn="বিপজ্জনক অঞ্চল" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-[var(--red)]" />
            <h3 className="text-[0.875rem] font-bold text-[var(--red)]">
              {isBn ? 'সতর্কতা' : 'Warning'}
            </h3>
          </div>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mb-4">
            {isBn
              ? 'এই কাজটি অপরিবর্তনীয়। আপনার সকল তথ্য মুছে ফেলা হবে এবং এই অ্যাকাউন্টে আর প্রবেশ করা যাবে না।'
              : 'This action is irreversible. All your data will be deleted and this account will no longer be accessible.'}
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
                {isBn ? 'নিশ্চিত করতে "DELETE" টাইপ করুন' : 'Type "DELETE" to confirm'}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full h-10 px-3 rounded-xl border border-red-500/30 bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--red)] placeholder:text-[var(--text-muted)] font-mono"
              />
            </div>

            <button
              disabled={confirmText !== 'DELETE'}
              className="w-full h-10 rounded-xl bg-[var(--red)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Trash2 size={14} />
              {isBn ? 'অ্যাকাউন্ট মুছুন' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}
