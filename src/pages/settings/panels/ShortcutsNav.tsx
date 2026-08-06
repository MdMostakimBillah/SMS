import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'

interface Props {
  isBn: boolean
  onBack: () => void
}

const shortcuts = [
  { keys: ['Ctrl', 'K'], action: 'Command Palette', actionBn: 'কমান্ড প্যালেট' },
  { keys: ['Ctrl', 'B'], action: 'Toggle Sidebar', actionBn: 'সাইডবার টগল' },
  { keys: ['Ctrl', '/'], action: 'Quick Search', actionBn: 'দ্রুত অনুসন্ধান' },
  { keys: ['Ctrl', 'S'], action: 'Save Changes', actionBn: 'পরিবর্তন সংরক্ষণ' },
  { keys: ['Esc'], action: 'Close Modal', actionBn: 'মডাল বন্ধ' },
]

export function ShortcutsNavPanel({ isBn, onBack }: Props) {
  const [enabled, setEnabled] = useState(true)

  return (
    <SettingsPanel title="Shortcuts & Navigation" titleBn="শর্টকাট ও নেভিগেশন" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
          <div>
            <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
              {isBn ? 'কীবোর্ড শর্টকাট' : 'Keyboard Shortcuts'}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-muted)]">
              {isBn ? 'কীবোর্ড শর্টকাট সক্রিয় করুন' : 'Enable keyboard shortcuts'}
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer border-none ${
              enabled ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                enabled ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">
            {isBn ? 'উপলব্ধ শর্টকাট' : 'Available Shortcuts'}
          </label>
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <span className="text-[0.8125rem] text-[var(--text-primary)]">
                  {isBn ? s.actionBn : s.action}
                </span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[0.6875rem] font-mono text-[var(--text-secondary)] shadow-sm"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}
