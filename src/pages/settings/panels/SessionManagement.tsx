import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useClassStore } from '@/store/classStore'
import { Calendar, Check, Plus } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

export function SessionManagementPanel({ isBn, onBack }: Props) {
  const institution = useClassStore((s) => s.institution)
  const switchSession = useClassStore((s) => s.switchSession)
  const addSession = useClassStore((s) => s.addSession)
  const [newSession, setNewSession] = useState('')

  const handleAdd = () => {
    const trimmed = newSession.trim()
    if (!trimmed || institution.sessions.includes(trimmed)) return
    addSession(trimmed)
    switchSession(trimmed)
    setNewSession('')
  }

  return (
    <SettingsPanel title="Session Management" titleBn="সেশন ব্যবস্থাপনা" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'আপনার প্রতিষ্ঠানের সেশন পরিচালনা করুন।'
            : 'Manage your institution\'s academic sessions.'}
        </p>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">
            {isBn ? 'সক্রিয় সেশন' : 'Active Session'}
          </label>
          <div className="px-4 py-3 rounded-xl bg-[var(--brand-light)] border border-[var(--brand)]/20 flex items-center gap-2">
            <Calendar size={16} className="text-[var(--brand)]" />
            <span className="text-[0.875rem] font-bold text-[var(--brand)]">
              {institution.currentSession || 'No Session'}
            </span>
          </div>
        </div>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">
            {isBn ? 'সকল সেশন' : 'All Sessions'}
          </label>
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {institution.sessions.map((s) => (
              <button
                key={s}
                onClick={() => switchSession(s)}
                className={`w-full flex items-center justify-between px-4 py-3 cursor-pointer bg-transparent border-none text-left transition-colors hover:bg-[var(--bg-primary)] ${
                  s === institution.currentSession ? 'text-[var(--brand)]' : 'text-[var(--text-primary)]'
                }`}
              >
                <span className="text-[0.8125rem] font-medium">{s}</span>
                {s === institution.currentSession && <Check size={16} className="text-[var(--brand)]" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">
            {isBn ? 'নতুন সেশন যোগ করুন' : 'Add New Session'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSession}
              onChange={(e) => setNewSession(e.target.value)}
              placeholder="e.g. 2026-27"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
            />
            <button
              onClick={handleAdd}
              disabled={!newSession.trim() || institution.sessions.includes(newSession.trim())}
              className="h-10 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold border-none cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus size={14} />
              {isBn ? 'যোগ' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </SettingsPanel>
  )
}
