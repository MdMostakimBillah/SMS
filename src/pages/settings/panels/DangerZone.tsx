import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'

interface Props {
  isBn: boolean
  onBack: () => void
}

export function DangerZonePanel({ isBn, onBack }: Props) {
  const [confirmText, setConfirmText] = useState('')
  const [showModal, setShowModal] = useState(false)
  const { canManage } = usePermission()

  const handleDelete = () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/login'
  }

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

            {canManage('settings.danger.manage') && (
            <button
              disabled={confirmText !== 'DELETE'}
              onClick={() => setShowModal(true)}
              className="w-full h-10 rounded-xl bg-[var(--red)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Trash2 size={14} />
              {isBn ? 'অ্যাকাউন্ট মুছুন' : 'Delete Account'}
            </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--red)]/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-[var(--red)]" />
              </div>
              <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'অ্যাকাউন্ট মুছুন?' : 'Delete Account?'}
              </h3>
            </div>
            <p className="text-[0.8125rem] text-[var(--text-muted)] mb-6">
              {isBn
                ? 'এই কাজটি অপরিবর্তনীয়। সবকিছু মুছে ফেলা হবে।'
                : 'This cannot be undone. Everything will be permanently deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 h-10 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-semibold border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-10 rounded-xl bg-[var(--red)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
              >
                {isBn ? 'মুছুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsPanel>
  )
}
