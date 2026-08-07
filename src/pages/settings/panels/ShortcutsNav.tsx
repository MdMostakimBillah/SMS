import { useState, useEffect, useCallback } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { Pencil, RotateCcw } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

const defaultShortcuts = [
  { id: 'commandPalette', keys: ['Ctrl', 'K'], action: 'Command Palette', actionBn: 'কমান্ড প্যালেট' },
  { id: 'toggleSidebar', keys: ['Ctrl', 'B'], action: 'Toggle Sidebar', actionBn: 'সাইডবার টগল' },
  { id: 'quickSearch', keys: ['Ctrl', '/'], action: 'Quick Search', actionBn: 'দ্রুত অনুসন্ধান' },
  { id: 'saveChanges', keys: ['Ctrl', 'S'], action: 'Save Changes', actionBn: 'পরিবর্তন সংরক্ষণ' },
  { id: 'closeModal', keys: ['Esc'], action: 'Close Modal', actionBn: 'মডাল বন্ধ' },
]

function formatKey(key: string): string {
  if (key === ' ') return 'Space'
  if (key === 'Control') return 'Ctrl'
  return key.length === 1 ? key.toUpperCase() : key
}

export function ShortcutsNavPanel({ isBn, onBack }: Props) {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [editingId, setEditingId] = useState<string | null>(null)

  const getShortcutKeys = useCallback((id: string, defaultKeys: string[]) => {
    return settings.customShortcuts[id] || defaultKeys
  }, [settings.customShortcuts])

  const handleKeyDown = useCallback((e: KeyboardEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.key === 'Escape') {
      setEditingId(null)
      return
    }

    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
      return
    }

    const keys: string[] = []
    if (e.ctrlKey || e.metaKey) keys.push('Ctrl')
    if (e.shiftKey) keys.push('Shift')
    if (e.altKey) keys.push('Alt')
    keys.push(formatKey(e.key))

    const newShortcuts = { ...settings.customShortcuts, [id]: keys }
    updateSettings({ customShortcuts: newShortcuts })
    setEditingId(null)
  }, [settings.customShortcuts, updateSettings])

  useEffect(() => {
    if (!editingId) return

    const handler = (e: KeyboardEvent) => handleKeyDown(e, editingId)
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [editingId, handleKeyDown])

  const handleReset = (id: string) => {
    const newShortcuts = { ...settings.customShortcuts }
    delete newShortcuts[id]
    updateSettings({ customShortcuts: newShortcuts })
  }

  const isCustom = (id: string) => id in settings.customShortcuts

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
            onClick={() => updateSettings({ keyboardShortcuts: !settings.keyboardShortcuts })}
            className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer border-none ${
              settings.keyboardShortcuts ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out ${
                settings.keyboardShortcuts ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">
            {isBn ? 'শর্টকাট কাস্টমাইজ করুন' : 'Customize Shortcuts'}
          </label>
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {defaultShortcuts.map((s) => {
              const keys = getShortcutKeys(s.id, s.keys)
              const editing = editingId === s.id
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[0.8125rem] text-[var(--text-primary)]">
                    {isBn ? s.actionBn : s.action}
                  </span>
                  <div className="flex items-center gap-2">
                    {editing ? (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--brand-light)] border border-[var(--brand)] animate-pulse">
                        <span className="text-[0.75rem] font-medium text-[var(--brand)]">
                          {isBn ? 'কী চাপুন...' : 'Press keys...'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[0.6875rem] font-mono text-[var(--text-secondary)] shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(editing ? null : s.id)
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border-none transition-colors ${
                          editing
                            ? 'bg-[var(--red)]/10 text-[var(--red)]'
                            : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)]'
                        }`}
                        title={isBn ? 'সম্পাদনা' : 'Edit'}
                      >
                        <Pencil size={12} />
                      </button>
                      {isCustom(s.id) && (
                        <button
                          onClick={() => handleReset(s.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-muted)] cursor-pointer border-none hover:bg-[var(--brand-light)] hover:text-[var(--brand)] transition-colors"
                          title={isBn ? 'রিসেট' : 'Reset'}
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}
