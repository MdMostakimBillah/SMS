import React from 'react'
import { Cloud, Laptop, Server, Lock, ShieldAlert } from 'lucide-react'

interface Props {
  isBn: boolean
  mode: 'cloud' | 'local_computer' | 'local_server'
  isSuperAdminAccount?: boolean
  onModeChange: (mode: 'cloud' | 'local_computer' | 'local_server') => void
}

export const StorageModeSection: React.FC<Props> = ({ isBn, mode, isSuperAdminAccount = false, onModeChange }) => {
  const cards = [
    {
      id: 'cloud' as const,
      icon: Cloud,
      title: isBn ? 'প্রোভাইডার ক্লাউড' : 'Provider Cloud',
      desc: isBn
        ? 'এডুটেক ক্লাউড সার্ভারে সংরক্ষিত, কোনো জটিল কনফিগারেশন নেই।'
        : 'Hosted on EduTech servers, with nothing to configure.',
      checklist: [
        { label: isBn ? 'স্বয়ংক্রিয় ক্লাউড ব্যাকআপ' : 'Automatic backups', enabled: true },
        { label: isBn ? 'জিরো সেটআপ' : 'Zero setup', enabled: true },
        { label: isBn ? 'অফলাইনে চলে' : 'Works offline', enabled: false },
      ],
    },
    {
      id: 'local_computer' as const,
      icon: Laptop,
      title: isBn ? 'লোকাল কম্পিউটার' : 'Local Computer',
      desc: isBn
        ? 'সকল রেকর্ড কেবল এই ডিভাইসে থাকবে। প্রোভাইডার শুধু বেসিক মেটাডাটা দেখবে।'
        : 'Records stay on this device. The provider only sees basic metadata.',
      checklist: [
        { label: isBn ? 'সম্পূর্ণ অফলাইনে কাজ করে' : 'Works fully offline', enabled: true },
        { label: isBn ? 'ডিফল্টভাবে গোপনীয়' : 'Private by default', enabled: true },
        { label: isBn ? 'কেবল লগইনের জন্য নেট' : 'Internet only for login', enabled: true },
      ],
    },
    {
      id: 'local_server' as const,
      icon: Server,
      title: isBn ? 'নিজস্ব সার্ভার (VPS)' : 'Own Server (VPS)',
      desc: isBn
        ? 'প্রতিষ্ঠানের নিজস্ব ভিপিএস বা প্রাইভেট ক্লাউড ডেটাবেসে সেলফ-হোস্টেড।'
        : 'Self-hosted on your institution’s VPS or private cloud database.',
      checklist: [
        { label: isBn ? 'সম্পূর্ণ ডেটা কন্ট্রোল' : 'Full data control', enabled: true },
        { label: isBn ? 'মাল্টি-ক্যাম্পাস অ্যাক্সেস' : 'Multi-campus access', enabled: true },
        { label: isBn ? 'আইটি সেটআপ প্রয়োজন' : 'Needs IT setup', enabled: false },
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {isSuperAdminAccount && (
        <div className="md:col-span-3 p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[0.75rem] flex items-center gap-2.5 shadow-sm">
          <ShieldAlert size={16} className="shrink-0" />
          <span>
            {isBn
              ? 'সুপার অ্যাডমিন অ্যাকাউন্ট প্রোভাইডার ক্লাউড ইনফ্রাস্ট্রাকচারে স্থায়ীভাবে লক করা। সুপার অ্যাডমিনকে লোকাল কম্পিউটার বা নিজস্ব ভিপিএস সার্ভারে পরিবর্তন করা যাবে না।'
              : 'Super Admin accounts are strictly locked to Provider Cloud. Super Admin accounts can never be switched to Local Computer or Own VPS.'}
          </span>
        </div>
      )}

      {cards.map((c) => {
        const Icon = c.icon
        const isSelected = mode === c.id
        const isLockedForSuperAdmin = isSuperAdminAccount && c.id !== 'cloud'

        return (
          <div
            key={c.id}
            onClick={() => {
              if (!isLockedForSuperAdmin) {
                onModeChange(c.id)
              }
            }}
            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between select-none ${
              isLockedForSuperAdmin
                ? 'border-[var(--border)] bg-[var(--bg-secondary)]/50 opacity-50 cursor-not-allowed'
                : isSelected
                ? 'border-[var(--brand)] bg-[var(--brand-light)] shadow-sm ring-1 ring-[var(--brand)]/40 cursor-pointer'
                : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] cursor-pointer'
            }`}
          >
            <div>
              {/* Top row: Icon + Action / Badge */}
              <div className="flex items-center justify-between mb-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[var(--brand)] text-white shadow-sm'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  <Icon size={18} />
                </div>

                {isLockedForSuperAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[0.625rem] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Lock size={10} />
                    {isBn ? 'লকড' : 'LOCKED'}
                  </span>
                ) : isSelected ? (
                  <span className="text-[0.6875rem] font-bold text-[var(--brand)] tracking-wider uppercase">
                    {isBn ? 'বাছাইকৃত' : 'SELECTED'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onModeChange(c.id)
                    }}
                    className="text-[0.6875rem] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    {isBn ? 'নির্বাচন' : 'SELECT'}
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <h4 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] tracking-tight mb-1">
                {c.title}
              </h4>
              <p className="text-[0.75rem] text-[var(--text-secondary)] leading-relaxed mb-4 min-h-[2.4rem]">
                {c.desc}
              </p>
            </div>

            {/* Checklist */}
            <div className="pt-3 border-t border-[var(--border)] space-y-1.5">
              {c.checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[0.75rem]">
                  {item.enabled ? (
                    <span className="text-[var(--brand)] font-bold text-[0.8125rem]">✓</span>
                  ) : (
                    <span className="text-[var(--text-muted)] font-bold text-[0.8125rem]">–</span>
                  )}
                  <span className={item.enabled ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
