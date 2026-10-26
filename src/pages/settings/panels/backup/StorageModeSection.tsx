import React from 'react'
import { Cloud, Laptop, Server, Check } from 'lucide-react'

interface Props {
  isBn: boolean
  mode: 'cloud' | 'local_computer' | 'local_server'
  serverUrl: string
  folderName: string
  onModeChange: (mode: 'cloud' | 'local_computer' | 'local_server') => void
  onServerUrlChange: (url: string) => void
  onFolderNameChange: (folder: string) => void
}

export const StorageModeSection: React.FC<Props> = ({
  isBn,
  mode,
  serverUrl,
  folderName,
  onModeChange,
  onServerUrlChange,
  onFolderNameChange,
}) => {
  const modes = [
    {
      id: 'cloud' as const,
      title: isBn ? 'ক্লাউড ডেটাবেস' : 'Cloud Database',
      desc: isBn ? 'ক্লাউড পোস্টগ্রেস সার্ভারে সঞ্চয়' : 'Store on central cloud PostgreSQL',
      icon: Cloud,
      color: 'var(--brand)',
    },
    {
      id: 'local_computer' as const,
      title: isBn ? 'লোকাল কম্পিউটার' : 'Local Computer',
      desc: isBn ? 'ব্রাউজার ও লোকাল ড্রাইভে ফাইল ব্যাকআপ' : 'Store locally with offline files',
      icon: Laptop,
      color: 'var(--amber)',
    },
    {
      id: 'local_server' as const,
      title: isBn ? 'লোকাল সার্ভার' : 'Local Server',
      desc: isBn ? 'অন-প্রেমিসেস লোকাল নেটওয়ার্ক সার্ভার' : 'Connect to on-premise local server',
      icon: Server,
      color: 'var(--green)',
    },
  ]

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'স্টোরেজ মোড নির্বাচন' : 'Storage Mode'}
          </h3>
          <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5">
            {isBn ? 'তথ্য সংরক্ষণের প্রধান অবস্থান নির্ধারণ করুন' : 'Select primary destination for institutional data'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {modes.map((m) => {
          const Icon = m.icon
          const active = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModeChange(m.id)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                active
                  ? 'border-[var(--brand)] bg-[rgba(99,102,241,0.08)] shadow-sm'
                  : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${m.color}18`, color: m.color }}
                >
                  <Icon size={16} />
                </div>
                {active && (
                  <div className="w-5 h-5 rounded-full bg-[var(--brand)] text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div>
                <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">{m.title}</div>
                <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">{m.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {mode === 'local_server' && (
        <div className="pt-2 border-t border-[var(--border)] space-y-3">
          <div>
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'লোকাল সার্ভার URL' : 'Local Server URL'}
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => onServerUrlChange(e.target.value)}
              placeholder="http://192.168.1.100:3001"
              className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
            />
          </div>
          <div>
            <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1 block">
              {isBn ? 'সংরক্ষণ ফোল্ডারের নাম' : 'Storage Folder Name'}
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => onFolderNameChange(e.target.value)}
              placeholder="edutech_data"
              className="w-full h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
