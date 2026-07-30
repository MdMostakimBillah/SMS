import { useState } from 'react'
import { Fingerprint, CheckCircle, Clock, Search } from 'lucide-react'
import type { FpEntry } from '../types'
import { StatsRow } from './StatsRow'

interface FingerprintTabProps {
  isBn: boolean
  fpEntries: FpEntry[]
  setFpEntries: React.Dispatch<React.SetStateAction<FpEntry[]>>
}

export function FingerprintTab({ isBn, fpEntries, setFpEntries }: FingerprintTabProps) {
  const [fpSearch, setFpSearch] = useState('')

  return (
    <>
      <StatsRow
        stats={[
          {
            label: isBn ? 'মোট' : 'Total',
            value: fpEntries.length,
            icon: <Fingerprint size={15} />,
            color: 'var(--amber)',
          },
          {
            label: isBn ? 'এনরোলড' : 'Enrolled',
            value: fpEntries.filter((e) => e.status === 'enrolled').length,
            icon: <CheckCircle size={15} />,
            color: 'var(--green)',
          },
          {
            label: isBn ? 'বকেয়' : 'Pending',
            value: fpEntries.filter((e) => e.status === 'pending').length,
            icon: <Clock size={15} />,
            color: 'var(--amber)',
          },
        ]}
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[0.375rem] flex-1 max-w-[18.75rem]">
          <Search size={13} className="text-[var(--text-muted)]" />
          <input
            value={fpSearch}
            onChange={(e) => setFpSearch(e.target.value)}
            placeholder={isBn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
            className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
          />
        </div>
        <span className="text-[0.6875rem] text-[var(--text-muted)]">
          {fpEntries.filter((e) => !fpSearch || e.staffName.toLowerCase().includes(fpSearch.toLowerCase())).length}{' '}
          {isBn ? 'টি ফলাফল' : 'results'}
        </span>
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-auto max-h-[55vh]">
          <table className="w-full border-collapse text-[0.6875rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.1875rem]">#</th>
                <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'স্টাফ আইডি' : 'Staff ID'}</th>
                <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'FP আইডি' : 'FP ID'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'টেমপ্লেট' : 'Templates'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {fpEntries
                .filter((e) => !fpSearch || e.staffName.toLowerCase().includes(fpSearch.toLowerCase()))
                .map((e, i) => (
                  <tr
                    key={e.staffId}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                    <td className="p-2.5 font-mono font-semibold text-[var(--brand)]">{e.staffId}</td>
                    <td className="p-2.5 text-[var(--text-primary)] font-medium">{e.staffName}</td>
                    <td className="p-2.5 text-center font-mono text-[var(--text-primary)]">{e.fpId}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex gap-1 justify-center">
                        {Array.from({ length: 2 }).map((_, si) => (
                          <span
                            key={si}
                            className={`w-3.5 h-3.5 rounded-md ${si < e.templates ? 'bg-[var(--green)] shadow-sm' : 'bg-[var(--border)]'}`}
                          ></span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`text-[0.5625rem] px-2.5 py-1 rounded-full font-semibold ${
                          e.status === 'enrolled'
                            ? 'bg-[var(--green-light)] text-[var(--green)]'
                            : e.status === 'pending'
                              ? 'bg-[var(--amber-light)] text-[var(--amber)]'
                              : 'bg-[var(--red-light)] text-[var(--red)]'
                        }`}
                      >
                        {e.status === 'enrolled'
                          ? isBn ? 'এনরোলড' : 'Enrolled'
                          : e.status === 'pending'
                            ? isBn ? 'বকেয়' : 'Pending'
                            : isBn ? 'ব্যর্থ' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => {
                            setFpEntries((prev) =>
                              prev.map((x) =>
                                x.staffId === e.staffId
                                  ? { ...x, status: 'pending' as const, templates: 0 }
                                  : x
                              )
                            )
                            setTimeout(
                              () =>
                                setFpEntries((prev) =>
                                  prev.map((x) =>
                                    x.staffId === e.staffId
                                      ? { ...x, status: 'enrolled' as const, templates: Math.floor(Math.random() * 2) + 1 }
                                      : x
                                  )
                                ),
                              2000
                            )
                          }}
                          disabled={e.status === 'pending'}
                          className={`px-2.5 py-1 rounded-md text-[0.5625rem] font-semibold cursor-pointer border transition-all duration-200 ${
                            e.status === 'pending'
                              ? 'bg-[var(--amber-light)] border-[var(--amber)] text-[var(--amber)] animate-pulse cursor-wait'
                              : 'bg-[var(--amber-light)] border-[var(--amber)] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-white hover:shadow-md'
                          }`}
                        >
                          {e.status === 'pending' ? (isBn ? 'এনরোল হচ্ছে...' : 'Enrolling...') : isBn ? 'রি-এনরোল' : 'Re-enroll'}
                        </button>
                        <button
                          onClick={() => setFpEntries((prev) => prev.filter((x) => x.staffId !== e.staffId))}
                          className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                        >
                          {isBn ? 'মুছুন' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {fpEntries.filter((e) => !fpSearch || e.staffName.toLowerCase().includes(fpSearch.toLowerCase())).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] text-[0.75rem]">
                    {isBn ? 'কোনো এনরোলমেন্ট পাওয়া যায়নি' : 'No enrollments found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
