import { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { Copy, CheckCircle, Plus, Trash2, Eye, EyeOff } from 'lucide-react'

interface Props {
  isBn: boolean
  onBack: () => void
}

interface ApiKey {
  id: string
  name: string
  key: string
  created: string
  lastUsed: string
}

const mockKeys: ApiKey[] = [
  { id: '1', name: 'Production API', key: 'sk_live_xxxxxxxxxxxx', created: 'Jan 15, 2024', lastUsed: '2 hours ago' },
  { id: '2', name: 'Development', key: 'sk_test_xxxxxxxxxxxx', created: 'Mar 20, 2024', lastUsed: '5 days ago' },
]

export function ApiKeysPanel({ isBn, onBack }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>(mockKeys)
  const [showNewKey, setShowNewKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [visibleKeys, setVisibleKeys] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCreate = () => {
    if (!newKeyName.trim()) return
    const newKey: ApiKey = {
      id: String(Date.now()),
      name: newKeyName.trim(),
      key: `sk_live_${Array.from({ length: 24 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('')}`,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: isBn ? 'কখনো নয়' : 'Never',
    }
    setKeys((prev) => [...prev, newKey])
    setNewKeyName('')
    setShowNewKey(false)
  }

  const handleDelete = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id))
  }

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    )
  }

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const maskKey = (key: string) => key.slice(0, 8) + '••••••••' + key.slice(-4)

  return (
    <SettingsPanel title="API Keys" titleBn="API কী" isBn={isBn} onBack={onBack}>
      <div className="space-y-4">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'API অ্যাক্সেস কী পরিচালনা করুন।'
            : 'Manage API access keys.'}
        </p>

        <div className="space-y-3">
          {keys.map((apiKey) => (
            <div key={apiKey.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                    {apiKey.name}
                  </div>
                  <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
                    {isBn ? 'তৈরি' : 'Created'}: {apiKey.created} • {isBn ? 'শেষ ব্যবহার' : 'Last used'}: {apiKey.lastUsed}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(apiKey.id)}
                  className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 cursor-pointer bg-transparent border-none transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                <code className="flex-1 text-[0.75rem] font-mono text-[var(--text-primary)] truncate">
                  {visibleKeys.includes(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                </code>
                <button
                  onClick={() => toggleVisibility(apiKey.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none p-1"
                >
                  {visibleKeys.includes(apiKey.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button
                  onClick={() => handleCopy(apiKey.key, apiKey.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--brand)] cursor-pointer bg-transparent border-none p-1"
                >
                  {copiedId === apiKey.id ? <CheckCircle size={12} className="text-[var(--green)]" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {showNewKey ? (
          <div className="p-4 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-light)]/30">
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5 block">
              {isBn ? 'কীর নাম' : 'Key Name'}
            </label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder={isBn ? 'যেমন: Production API' : 'e.g., Production API'}
              className="w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] placeholder:text-[var(--text-muted)]"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { setShowNewKey(false); setNewKeyName('') }}
                className="flex-1 h-9 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-medium border border-[var(--border)] cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newKeyName.trim()}
                className="flex-1 h-9 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isBn ? 'তৈরি করুন' : 'Create'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewKey(true)}
            className="w-full h-10 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-muted)] text-[0.8125rem] font-medium cursor-pointer hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors flex items-center justify-center gap-2 bg-transparent"
          >
            <Plus size={16} />
            {isBn ? 'নতুন API কী তৈরি করুন' : 'Create New API Key'}
          </button>
        )}
      </div>
    </SettingsPanel>
  )
}
