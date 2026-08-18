import { useState } from 'react'
import { Save, BookOpen, DollarSign, Monitor, RotateCcw, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
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
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${
        value ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'
      }`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
        value ? 'translate-x-[22px]' : 'translate-x-0.5'
      }`} />
    </button>
  )

  const NumberInput = ({ value, onChange, min = 0, max = 999, prefix }: {
    value: number; onChange: (v: number) => void; min?: number; max?: number; prefix?: string
  }) => (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[0.8125rem] text-[var(--text-secondary)]">{prefix}</span>}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
        className={`w-full py-2.5 ${prefix ? 'pl-7' : 'pl-3.5'} pr-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-[0.875rem] font-medium outline-none transition-all focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10`}
      />
    </div>
  )

  return (
    <div className="max-w-[56rem] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{bn ? 'লাইব্রেরি সেটিংস' : 'Library Settings'}</h2>
          <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'আপনার লাইব্রেরি পরিচালনার নিয়ম কাস্টমাইজ করুন' : 'Customize your library management rules'}</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] font-semibold transition-all duration-200 ${
            saved
              ? 'bg-[var(--green)] text-white shadow-lg shadow-[var(--green)]/25'
              : 'bg-[var(--brand)] text-white hover:shadow-lg hover:shadow-[var(--brand)]/25'
          }`}
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? (bn ? 'সংরক্ষিত!' : 'Saved!') : (bn ? 'সংরক্ষণ করুন' : 'Save Settings')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Borrowing Rules */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-[var(--brand)]/5 to-purple-500/5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[0.9375rem] text-[var(--text-primary)]">{bn ? 'ধারের নিয়ম' : 'Borrowing Rules'}</h3>
                <p className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? 'বই ধার ও ফেরত দেওয়ার নিয়মাবলী' : 'Rules for borrowing and returning books'}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">{bn ? 'সর্বোচ্চ বই' : 'Max Books per Student'}</label>
              <NumberInput value={local.maxBooksPerStudent} onChange={(v) => setLocal({ ...local, maxBooksPerStudent: v })} min={1} max={10} />
              <p className="text-[0.625rem] text-[var(--text-secondary)] mt-1">{bn ? 'একজন ছাত্র সর্বোচ্চ কতটি বই ধার করতে পারবে' : 'Maximum books a student can borrow at once'}</p>
            </div>

            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">{bn ? 'ধারের মেয়াদ' : 'Borrowing Duration'}</label>
              <div className="flex items-center gap-2">
                <NumberInput value={local.borrowingDurationDays} onChange={(v) => setLocal({ ...local, borrowingDurationDays: v })} min={1} max={90} />
                <span className="text-[0.75rem] text-[var(--text-secondary)] whitespace-nowrap">{bn ? 'দিন' : 'days'}</span>
              </div>
              <p className="text-[0.625rem] text-[var(--text-secondary)] mt-1">{bn ? 'বই ফেরত দেওয়ার সময়সীমা' : 'Time limit to return borrowed books'}</p>
            </div>

            <div className="h-px bg-[var(--border)]" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? 'পুনর্নবীকরণ অনুমতি' : 'Allow Renewal'}</p>
                <p className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? 'বই ফেরত না দিয়ে পুনর্নবীকরণ করতে দেওয়া হবে' : 'Allow students to renew borrowed books'}</p>
              </div>
              <Toggle value={local.allowRenewal} onChange={(v) => setLocal({ ...local, allowRenewal: v })} />
            </div>

            {local.allowRenewal && (
              <div className="pl-4 border-l-2 border-[var(--brand)]/20">
                <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">{bn ? 'পুনর্নবীকরণ সীমা' : 'Renewal Limit'}</label>
                <div className="flex items-center gap-2">
                  <NumberInput value={local.renewalLimit} onChange={(v) => setLocal({ ...local, renewalLimit: v })} min={0} max={10} />
                  <span className="text-[0.75rem] text-[var(--text-secondary)] whitespace-nowrap">{bn ? 'বার' : 'times'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fine Rules */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <DollarSign size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[0.9375rem] text-[var(--text-primary)]">{bn ? 'জরিমানার নিয়ম' : 'Fine Rules'}</h3>
                <p className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? 'বিলম্ব ও ক্ষতির জরিমানা নির্ধারণ' : 'Set late fees and damage penalties'}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">{bn ? 'প্রতি দিন জরিমানা' : 'Fine per Day'}</label>
              <NumberInput value={local.finePerDay} onChange={(v) => setLocal({ ...local, finePerDay: v })} min={0} max={100} prefix="৳" />
              <p className="text-[0.625rem] text-[var(--text-secondary)] mt-1">{bn ? 'প্রতি দিন বিলম্বের জন্য জরিমানা' : 'Penalty per day for late returns'}</p>
            </div>

            <div className="h-px bg-[var(--border)]" />

            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">{bn ? 'হারানো বই ফি' : 'Lost Book Fee'}</label>
              <NumberInput value={local.lostBookFee} onChange={(v) => setLocal({ ...local, lostBookFee: v })} min={0} max={5000} prefix="৳" />
              <p className="text-[0.625rem] text-[var(--text-secondary)] mt-1">{bn ? 'হারানো বইয়ের জন্য এককালীন ফি' : 'One-time fee for lost books'}</p>
            </div>

            <div>
              <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">{bn ? 'ক্ষতিগ্রস্ত বই ফি' : 'Damaged Book Fee'}</label>
              <NumberInput value={local.damagedBookFee} onChange={(v) => setLocal({ ...local, damagedBookFee: v })} min={0} max={2000} prefix="৳" />
              <p className="text-[0.625rem] text-[var(--text-secondary)] mt-1">{bn ? 'ক্ষতিগ্রস্ত বইয়ের জন্য ফি' : 'Fee for damaged books'}</p>
            </div>
          </div>
        </div>

        {/* Digital Settings */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Monitor size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[0.9375rem] text-[var(--text-primary)]">{bn ? 'ডিজিটাল সেটিংস' : 'Digital Settings'}</h3>
                <p className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? 'ডিজিটাল বই ও অনলাইন অ্যাক্সেস' : 'Digital books and online access'}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? 'ডিজিটাল অ্যাক্সেস' : 'Digital Access'}</p>
                <p className="text-[0.625rem] text-[var(--text-secondary)]">{bn ? 'ছাত্রদের ডিজিটাল বই পড়তে দেওয়া হবে' : 'Allow students to read digital books'}</p>
              </div>
              <Toggle value={local.digitalAccessEnabled} onChange={(v) => setLocal({ ...local, digitalAccessEnabled: v })} />
            </div>

            {local.digitalAccessEnabled && (
              <div className="pl-4 border-l-2 border-purple-500/20">
                <label className="text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2 block">{bn ? 'সর্বোচ্চ ডিজিটাল পাঠক' : 'Max Digital Readers'}</label>
                <NumberInput value={local.maxDigitalReaders} onChange={(v) => setLocal({ ...local, maxDigitalReaders: v })} min={1} max={500} />
                <p className="text-[0.625rem] text-[var(--text-secondary)] mt-1">{bn ? 'একই সময়ে সর্বোচ্চ পাঠক সংখ্যা' : 'Maximum concurrent digital readers'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="font-bold text-[0.9375rem] text-[var(--text-primary)]">{bn ? 'সারসংক্ষেপ' : 'Summary'}</h3>
                <p className="text-[0.6875rem] text-[var(--text-secondary)]">{bn ? 'বর্তমান সেটিংসের সারসংক্ষেপ' : 'Overview of current settings'}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {[
                { icon: <BookOpen size={14} />, label: bn ? 'সর্বোচ্চ বই' : 'Max Books', value: local.maxBooksPerStudent, color: 'var(--brand)' },
                { icon: <Clock size={14} />, label: bn ? 'মেয়াদ' : 'Duration', value: `${local.borrowingDurationDays} ${bn ? 'দিন' : 'days'}`, color: 'var(--amber)' },
                { icon: <RotateCcw size={14} />, label: bn ? 'পুনর্নবীকরণ' : 'Renewal', value: local.allowRenewal ? `${local.renewalLimit} ${bn ? 'বার' : 'times'}` : (bn ? 'বন্ধ' : 'Off'), color: 'var(--green)' },
                { icon: <DollarSign size={14} />, label: bn ? 'দৈনিক জরিমানা' : 'Daily Fine', value: `৳${local.finePerDay}`, color: 'var(--red, #ef4444)' },
                { icon: <Monitor size={14} />, label: bn ? 'ডিজিটাল' : 'Digital', value: local.digitalAccessEnabled ? (bn ? 'চালু' : 'On') : (bn ? 'বন্ধ' : 'Off'), color: 'var(--brand)' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15`, color: item.color }}>
                    {item.icon}
                  </div>
                  <span className="flex-1 text-[0.75rem] text-[var(--text-secondary)]">{item.label}</span>
                  <span className="text-[0.8125rem] font-bold text-[var(--text-primary)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
