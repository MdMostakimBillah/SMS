import { useState } from 'react'
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

  const Row = ({ label, labelBn, desc, descBn, right }: {
    label: string; labelBn: string; desc?: string; descBn?: string; right: React.ReactNode
  }) => (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-[0.875rem] text-[var(--text-primary)]">{bn ? labelBn : label}</p>
        {(desc || descBn) && <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5">{bn ? descBn : desc}</p>}
      </div>
      {right}
    </div>
  )

  return (
    <div className="max-w-[40rem] mx-auto space-y-8">
      {/* Borrowing Rules */}
      <div>
        <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">{bn ? 'ধারের নিয়ম' : 'Borrowing Rules'}</h3>
        <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-1">{bn ? 'বই ধার ও ফেরত দেওয়ার নিয়মাবলী কাস্টমাইজ করুন' : 'Customize how books are borrowed and returned'}</p>

        <div className="mt-4 bg-[var(--surface)] rounded-xl overflow-hidden">
          <Row
            label="Max Books per Student"
            labelBn="সর্বোচ্চ বই"
            desc="Maximum books a student can borrow at once"
            descBn="একজন ছাত্র একসাথে সর্বোচ্চ কতটি বই ধার করতে পারবে"
            right={
              <select value={local.maxBooksPerStudent} onChange={(e) => handleUpdate({ maxBooksPerStudent: Number(e.target.value) })}
                className="py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            }
          />
          <div className="h-px bg-[var(--border)] mx-4" />
          <Row
            label="Borrowing Duration"
            labelBn="ধারের মেয়াদ"
            desc="Days allowed to return borrowed books"
            descBn="বই ফেরত দেওয়ার সময়সীমা"
            right={
              <div className="flex items-center gap-2">
                <select value={local.borrowingDurationDays} onChange={(e) => handleUpdate({ borrowingDurationDays: Number(e.target.value) })}
                  className="py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                  {[7,14,21,30,45,60,90].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'দিন' : 'days'}</span>
              </div>
            }
          />
          <div className="h-px bg-[var(--border)] mx-4" />
          <Row
            label="Allow Renewal"
            labelBn="পুনর্নবীকরণ অনুমতি"
            desc="Allow students to renew borrowed books"
            descBn="বই ফেরত না দিয়ে পুনর্নবীকরণ করতে দেওয়া হবে"
            right={
              <button onClick={() => handleUpdate({ allowRenewal: !local.allowRenewal })}
                className={`relative w-10 h-[22px] rounded-full transition-colors ${local.allowRenewal ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'}`}>
                <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${local.allowRenewal ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
              </button>
            }
          />
          {local.allowRenewal && (
            <>
              <div className="h-px bg-[var(--border)] mx-4" />
              <Row
                label="Renewal Limit"
                labelBn="পুনর্নবীকরণ সীমা"
                desc="How many times a book can be renewed"
                descBn="একটি বই কতবার পুনর্নবীকরণ করা যাবে"
                right={
                  <div className="flex items-center gap-2">
                    <select value={local.renewalLimit} onChange={(e) => handleUpdate({ renewalLimit: Number(e.target.value) })}
                      className="py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                      {[0,1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span className="text-[0.75rem] text-[var(--text-secondary)]">{bn ? 'বার' : 'times'}</span>
                  </div>
                }
              />
            </>
          )}
        </div>
      </div>

      {/* Fine Rules */}
      <div>
        <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">{bn ? 'জরিমানার নিয়ম' : 'Fine Rules'}</h3>
        <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-1">{bn ? 'বিলম্ব ও ক্ষতির জরিমানা নির্ধারণ' : 'Set late fees and damage penalties'}</p>

        <div className="mt-4 bg-[var(--surface)] rounded-xl overflow-hidden">
          <Row
            label="Fine per Day"
            labelBn="প্রতি দিন জরিমানা"
            desc="Penalty for each day past due date"
            descBn="নির্ধারিত তারিখ পরে প্রতি দিনের জরিমানা"
            right={
              <div className="flex items-center gap-1">
                <span className="text-[0.8125rem] text-[var(--text-secondary)]">৳</span>
                <select value={local.finePerDay} onChange={(e) => handleUpdate({ finePerDay: Number(e.target.value) })}
                  className="py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                  {[0,1,2,5,10,15,20,25,50].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            }
          />
          <div className="h-px bg-[var(--border)] mx-4" />
          <Row
            label="Lost Book Fee"
            labelBn="হারানো বই ফি"
            desc="One-time fee for lost books"
            descBn="হারানো বইয়ের জন্য এককালীন ফি"
            right={
              <div className="flex items-center gap-1">
                <span className="text-[0.8125rem] text-[var(--text-secondary)]">৳</span>
                <select value={local.lostBookFee} onChange={(e) => handleUpdate({ lostBookFee: Number(e.target.value) })}
                  className="py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                  {[0,100,200,300,500,750,1000,1500,2000].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            }
          />
          <div className="h-px bg-[var(--border)] mx-4" />
          <Row
            label="Damaged Book Fee"
            labelBn="ক্ষতিগ্রস্ত বই ফি"
            desc="Fee for books returned damaged"
            descBn="ক্ষতিগ্রস্ত অবস্থায় ফেরত দেওয়া বইয়ের ফি"
            right={
              <div className="flex items-center gap-1">
                <span className="text-[0.8125rem] text-[var(--text-secondary)]">৳</span>
                <select value={local.damagedBookFee} onChange={(e) => handleUpdate({ damagedBookFee: Number(e.target.value) })}
                  className="py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                  {[0,50,100,150,200,300,500].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            }
          />
        </div>
      </div>

      {/* Digital Access */}
      <div>
        <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">{bn ? 'ডিজিটাল অ্যাক্সেস' : 'Digital Access'}</h3>
        <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-1">{bn ? 'ডিজিটাল বই ও অনলাইন পড়াশোনার সেটিংস' : 'Settings for digital books and online reading'}</p>

        <div className="mt-4 bg-[var(--surface)] rounded-xl overflow-hidden">
          <Row
            label="Enable Digital Access"
            labelBn="ডিজিটাল অ্যাক্সেস চালু করুন"
            desc="Allow students to read e-books"
            descBn="ছাত্রদের ই-বই পড়তে দেওয়া হবে"
            right={
              <button onClick={() => handleUpdate({ digitalAccessEnabled: !local.digitalAccessEnabled })}
                className={`relative w-10 h-[22px] rounded-full transition-colors ${local.digitalAccessEnabled ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'}`}>
                <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${local.digitalAccessEnabled ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
              </button>
            }
          />
          {local.digitalAccessEnabled && (
            <>
              <div className="h-px bg-[var(--border)] mx-4" />
              <Row
                label="Max Concurrent Readers"
                labelBn="সর্বোচ্চ একই সময়ের পাঠক"
                desc="Maximum students reading digital books simultaneously"
                descBn="একই সময়ে সর্বোচ্চ কতজন ছাত্র ডিজিটাল বই পড়তে পারবে"
                right={
                  <select value={local.maxDigitalReaders} onChange={(e) => handleUpdate({ maxDigitalReaders: Number(e.target.value) })}
                    className="py-1.5 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] outline-none focus:border-[var(--brand)]">
                    {[10,25,50,100,150,200,300,500].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
