import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useLibraryStore } from '@/store/libraryStore'

export function SettingsTab() {
  const bn = useBn()
  const settings = useLibraryStore((s) => s.settings)
  const updateSettings = useLibraryStore((s) => s.updateSettings)

  const [local, setLocal] = useState({ ...settings })

  const handleUpdate = (partial: Partial<typeof local>) => {
    const next = { ...local, ...partial }
    setLocal(next)
    updateSettings(next)
  }

  return (
    <div className="max-w-[40rem] mx-auto space-y-8">
      {/* Borrowing Rules */}
      <div>
        <p className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{bn ? 'ধার' : 'BORROWING'}</p>
        <div className="bg-[var(--surface)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
          {/* Max Books */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'সর্বোচ্চ বই' : 'Max Books per Student'}</p>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'একজন ছাত্র একসাথে সর্বোচ্চ কতটি বই ধার করতে পারবে' : 'Maximum books a student can borrow at once'}</p>
            </div>
            <select value={local.maxBooksPerStudent} onChange={(e) => handleUpdate({ maxBooksPerStudent: Number(e.target.value) })}
              className="py-1 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'ধারের মেয়াদ' : 'Borrowing Duration'}</p>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'বই ফেরত দেওয়ার সময়সীমা' : 'Days allowed to return borrowed books'}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <select value={local.borrowingDurationDays} onChange={(e) => handleUpdate({ borrowingDurationDays: Number(e.target.value) })}
                className="py-1 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                {[7,14,21,30,45,60,90].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'দিন' : 'days'}</span>
            </div>
          </div>

          {/* Allow Renewal */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'পুনর্নবীকরণ অনুমতি' : 'Allow Renewal'}</p>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'বই ফেরত না দিয়ে পুনর্নবীকরণ করতে দেওয়া হবে' : 'Allow students to renew borrowed books'}</p>
            </div>
            <button onClick={() => handleUpdate({ allowRenewal: !local.allowRenewal })}
              className={`relative w-10 h-[22px] rounded-full transition-colors ${local.allowRenewal ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'}`}>
              <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${local.allowRenewal ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
            </button>
          </div>

          {/* Renewal Limit */}
          {local.allowRenewal && (
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'পুনর্নবীকরণ সীমা' : 'Renewal Limit'}</p>
                <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'একটি বই কতবার পুনর্নবীকরণ করা যাবে' : 'How many times a book can be renewed'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <select value={local.renewalLimit} onChange={(e) => handleUpdate({ renewalLimit: Number(e.target.value) })}
                  className="py-1 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                  {[0,1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'বার' : 'times'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fine Rules */}
      <div>
        <p className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{bn ? 'জরিমানা' : 'FINES'}</p>
        <div className="bg-[var(--surface)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
          {/* Fine per Day */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'প্রতি দিন জরিমানা' : 'Fine per Day'}</p>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'নির্ধারিত তারিখ পরে প্রতি দিনের জরিমানা' : 'Penalty for each day past due date'}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[0.8125rem] text-[var(--text-secondary)]">৳</span>
              <select value={local.finePerDay} onChange={(e) => handleUpdate({ finePerDay: Number(e.target.value) })}
                className="py-1 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                {[0,1,2,5,10,15,20,25,50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Lost Book Fee */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'হারানো বই ফি' : 'Lost Book Fee'}</p>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'হারানো বইয়ের জন্য এককালীন ফি' : 'One-time fee for lost books'}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[0.8125rem] text-[var(--text-secondary)]">৳</span>
              <select value={local.lostBookFee} onChange={(e) => handleUpdate({ lostBookFee: Number(e.target.value) })}
                className="py-1 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                {[0,100,200,300,500,750,1000,1500,2000].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Damaged Book Fee */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'ক্ষতিগ্রস্ত বই ফি' : 'Damaged Book Fee'}</p>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'ক্ষতিগ্রস্ত অবস্থায় ফেরত দেওয়া বইয়ের ফি' : 'Fee for books returned damaged'}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[0.8125rem] text-[var(--text-secondary)]">৳</span>
              <select value={local.damagedBookFee} onChange={(e) => handleUpdate({ damagedBookFee: Number(e.target.value) })}
                className="py-1 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                {[0,50,100,150,200,300,500].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Access */}
      <div>
        <p className="text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{bn ? 'ডিজিটাল' : 'DIGITAL ACCESS'}</p>
        <div className="bg-[var(--surface)] rounded-xl overflow-hidden divide-y divide-[var(--border)]">
          {/* Digital Access Toggle */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'ডিজিটাল অ্যাক্সেস' : 'Enable Digital Access'}</p>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'ছাত্রদের ই-বই পড়তে দেওয়া হবে' : 'Allow students to read e-books'}</p>
            </div>
            <button onClick={() => handleUpdate({ digitalAccessEnabled: !local.digitalAccessEnabled })}
              className={`relative w-10 h-[22px] rounded-full transition-colors ${local.digitalAccessEnabled ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'}`}>
              <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${local.digitalAccessEnabled ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
            </button>
          </div>

          {/* Max Readers */}
          {local.digitalAccessEnabled && (
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{bn ? 'সর্বোচ্চ পাঠক' : 'Max Concurrent Readers'}</p>
                <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">{bn ? 'একই সময়ে সর্বোচ্চ কতজন ছাত্র ডিজিটাল বই পড়তে পারবে' : 'Maximum students reading simultaneously'}</p>
              </div>
              <select value={local.maxDigitalReaders} onChange={(e) => handleUpdate({ maxDigitalReaders: Number(e.target.value) })}
                className="py-1 px-2 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                {[10,25,50,100,150,200,300,500].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
