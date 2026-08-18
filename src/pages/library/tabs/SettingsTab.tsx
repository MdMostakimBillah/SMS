import { useState } from 'react'
import { Save, CheckCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'

export function SettingsTab() {
  const bn = useBn()
  const settings = useLibraryStore((s) => s.settings)
  const updateSettings = useLibraryStore((s) => s.updateSettings)

  const [local, setLocal] = useState({ ...settings })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} className={`relative w-10 h-[22px] rounded-full transition-colors ${value ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'}`}>
      <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
    </button>
  )

  const Field = ({ label, labelBn, desc, descBn, children }: { label: string; labelBn: string; desc?: string; descBn?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? labelBn : label}</p>
        {(desc || descBn) && <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? descBn : desc}</p>}
      </div>
      {children}
    </div>
  )

  const Input = ({ value, onChange, min = 0, max = 999, suffix }: {
    value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string
  }) => (
    <div className="flex items-center gap-2">
      <input
        type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
        className="w-20 py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.8125rem] font-medium text-center outline-none focus:border-[var(--brand)] transition-colors"
      />
      {suffix && <span className="text-[0.75rem] text-[var(--text-secondary)]">{suffix}</span>}
    </div>
  )

  return (
    <div className="max-w-[36rem] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{bn ? 'সেটিংস' : 'Settings'}</h2>
        <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[0.8125rem] font-medium transition-all ${saved ? 'bg-[var(--green)] text-white' : 'bg-[var(--brand)] text-white hover:opacity-90'}`}>
          {saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? (bn ? 'সংরক্ষিত' : 'Saved') : (bn ? 'সংরক্ষণ' : 'Save')}
        </button>
      </div>

      {/* Borrowing */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
        <div className="px-4 py-2.5">
          <p className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'ধার' : 'Borrowing'}</p>
        </div>
        <div className="px-4">
          <Field label="Max Books" labelBn="সর্বোচ্চ বই" desc="Per student at once" descBn="একজন ছাত্র একসাথে">
            <Input value={local.maxBooksPerStudent} onChange={(v) => setLocal({ ...local, maxBooksPerStudent: v })} min={1} max={10} />
          </Field>
          <Field label="Duration" labelBn="মেয়াদ" desc="Days to return" descBn="ফেরত দেওয়ার দিন">
            <Input value={local.borrowingDurationDays} onChange={(v) => setLocal({ ...local, borrowingDurationDays: v })} min={1} max={90} suffix={bn ? 'দিন' : 'days'} />
          </Field>
          <Field label="Allow Renewal" labelBn="পুনর্নবীকরণ">
            <Toggle value={local.allowRenewal} onChange={(v) => setLocal({ ...local, allowRenewal: v })} />
          </Field>
          {local.allowRenewal && (
            <Field label="Renewal Limit" labelBn="পুনর্নবীকরণ সীমা" desc="Times allowed" descBn="কতবার অনুমোদিত">
              <Input value={local.renewalLimit} onChange={(v) => setLocal({ ...local, renewalLimit: v })} min={0} max={10} suffix={bn ? 'বার' : 'times'} />
            </Field>
          )}
        </div>
      </div>

      {/* Fines */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
        <div className="px-4 py-2.5">
          <p className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'জরিমানা' : 'Fines'}</p>
        </div>
        <div className="px-4">
          <Field label="Per Day" labelBn="প্রতি দিন" desc="Late return fee" descBn="বিলম্ব ফি">
            <Input value={local.finePerDay} onChange={(v) => setLocal({ ...local, finePerDay: v })} min={0} max={100} suffix="৳" />
          </Field>
          <Field label="Lost Book" labelBn="হারানো বই" desc="Replacement fee" descBn="প্রতিস্থাপন ফি">
            <Input value={local.lostBookFee} onChange={(v) => setLocal({ ...local, lostBookFee: v })} min={0} max={5000} suffix="৳" />
          </Field>
          <Field label="Damaged Book" labelBn="ক্ষতিগ্রস্ত বই" desc="Repair fee" descBn="মেরামত ফি">
            <Input value={local.damagedBookFee} onChange={(v) => setLocal({ ...local, damagedBookFee: v })} min={0} max={2000} suffix="৳" />
          </Field>
        </div>
      </div>

      {/* Digital */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
        <div className="px-4 py-2.5">
          <p className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{bn ? 'ডিজিটাল' : 'Digital'}</p>
        </div>
        <div className="px-4">
          <Field label="Digital Access" labelBn="ডিজিটাল অ্যাক্সেস" desc="Enable e-books" descBn="ই-বই চালু করুন">
            <Toggle value={local.digitalAccessEnabled} onChange={(v) => setLocal({ ...local, digitalAccessEnabled: v })} />
          </Field>
          {local.digitalAccessEnabled && (
            <Field label="Max Readers" labelBn="সর্বোচ্চ পাঠক" desc="Concurrent limit" descBn="একই সময়ে সীমা">
              <Input value={local.maxDigitalReaders} onChange={(v) => setLocal({ ...local, maxDigitalReaders: v })} min={1} max={500} />
            </Field>
          )}
        </div>
      </div>
    </div>
  )
}
