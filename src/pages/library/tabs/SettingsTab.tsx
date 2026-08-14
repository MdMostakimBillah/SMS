import { useState } from 'react'
import { Save, BookOpen, DollarSign, Monitor } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'

import { labelCls } from '@/pages/hr/utils'

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

  const inputCls = 'w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10'

  return (
    <div className="space-y-4 max-w-[40rem]">
      {/* Borrowing Rules */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen size={14} />
          {bn ? 'ধারের নিয়ম' : 'Borrowing Rules'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{bn ? 'সর্বোচ্চ বই' : 'Max Books per Student'}</label>
            <input type="number" min={1} max={10} value={local.maxBooksPerStudent} onChange={(e) => setLocal({ ...local, maxBooksPerStudent: Math.max(1, parseInt(e.target.value) || 1) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'ধারের মেয়াদ (দিন)' : 'Borrowing Duration (days)'}</label>
            <input type="number" min={1} max={90} value={local.borrowingDurationDays} onChange={(e) => setLocal({ ...local, borrowingDurationDays: Math.max(1, parseInt(e.target.value) || 1) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'পুনর্নবীকরণ সীমা' : 'Renewal Limit'}</label>
            <input type="number" min={0} max={10} value={local.renewalLimit} onChange={(e) => setLocal({ ...local, renewalLimit: Math.max(0, parseInt(e.target.value) || 0) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'পুনর্নবীকরণ অনুমতি' : 'Allow Renewal'}</label>
            <select value={local.allowRenewal ? 'yes' : 'no'} onChange={(e) => setLocal({ ...local, allowRenewal: e.target.value === 'yes' })} className={inputCls}>
              <option value="yes">{bn ? 'হ্যাঁ' : 'Yes'}</option>
              <option value="no">{bn ? 'না' : 'No'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fine Rules */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <DollarSign size={14} />
          {bn ? 'জরিমানার নিয়ম' : 'Fine Rules'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{bn ? 'প্রতি দিন জরিমানা (৳)' : 'Fine per Day (৳)'}</label>
            <input type="number" min={0} value={local.finePerDay} onChange={(e) => setLocal({ ...local, finePerDay: Math.max(0, parseInt(e.target.value) || 0) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'হারানো বই ফি (৳)' : 'Lost Book Fee (৳)'}</label>
            <input type="number" min={0} value={local.lostBookFee} onChange={(e) => setLocal({ ...local, lostBookFee: Math.max(0, parseInt(e.target.value) || 0) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'ক্ষতিগ্রস্ত বই ফি (৳)' : 'Damaged Book Fee (৳)'}</label>
            <input type="number" min={0} value={local.damagedBookFee} onChange={(e) => setLocal({ ...local, damagedBookFee: Math.max(0, parseInt(e.target.value) || 0) })} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Digital Settings */}
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Monitor size={14} />
          {bn ? 'ডিজিটাল সেটিংস' : 'Digital Settings'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{bn ? 'ডিজিটাল অ্যাক্সেস' : 'Digital Access'}</label>
            <select value={local.digitalAccessEnabled ? 'yes' : 'no'} onChange={(e) => setLocal({ ...local, digitalAccessEnabled: e.target.value === 'yes' })} className={inputCls}>
              <option value="yes">{bn ? 'চালু' : 'Enabled'}</option>
              <option value="no">{bn ? 'বন্ধ' : 'Disabled'}</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>{bn ? 'সর্বোচ্চ ডিজিটাল পাঠক' : 'Max Digital Readers'}</label>
            <input type="number" min={1} value={local.maxDigitalReaders} onChange={(e) => setLocal({ ...local, maxDigitalReaders: Math.max(1, parseInt(e.target.value) || 1) })} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-medium hover:opacity-90 transition-opacity">
        <Save size={14} />
        {saved ? (bn ? 'সংরক্ষিত হয়েছে!' : 'Saved!') : (bn ? 'সংরক্ষণ করুন' : 'Save Settings')}
      </button>
    </div>
  )
}
