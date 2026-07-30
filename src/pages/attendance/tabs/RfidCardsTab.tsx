import { useState } from 'react'
import { CreditCard, CheckCircle, XCircle, Search } from 'lucide-react'
import type { RfidEntry } from '../types'
import { StatsRow } from './StatsRow'

interface RfidCardsTabProps {
  isBn: boolean
  rfidEntries: RfidEntry[]
  setRfidEntries: React.Dispatch<React.SetStateAction<RfidEntry[]>>
}

export function RfidCardsTab({ isBn, rfidEntries, setRfidEntries }: RfidCardsTabProps) {
  const [rfidSearch, setRfidSearch] = useState('')

  return (
    <>
      <StatsRow
        stats={[
          {
            label: isBn ? 'মোট কার্ড' : 'Total Cards',
            value: rfidEntries.length,
            icon: <CreditCard size={15} />,
            color: 'var(--brand)',
          },
          {
            label: isBn ? 'বরাদ্ধ' : 'Assigned',
            value: rfidEntries.filter((e) => e.assigned).length,
            icon: <CheckCircle size={15} />,
            color: 'var(--green)',
          },
          {
            label: isBn ? 'অবরাদ্ধ' : 'Unassigned',
            value: rfidEntries.filter((e) => !e.assigned).length,
            icon: <XCircle size={15} />,
            color: 'var(--red)',
          },
        ]}
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[0.375rem] flex-1 max-w-[18.75rem]">
          <Search size={13} className="text-[var(--text-muted)]" />
          <input
            value={rfidSearch}
            onChange={(e) => setRfidSearch(e.target.value)}
            placeholder={isBn ? 'নাম বা কার্ড নম্বর দিয়ে খুঁজুন...' : 'Search by name or card number...'}
            className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
          />
        </div>
        <span className="text-[0.6875rem] text-[var(--text-muted)]">
          {
            rfidEntries.filter(
              (e) => !rfidSearch || e.staffName.toLowerCase().includes(rfidSearch.toLowerCase()) || e.rfidCard.includes(rfidSearch)
            ).length
          }{' '}
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
                <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'কার্ড নম্বর' : 'Card Number'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'টাইপ' : 'Type'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {rfidEntries
                .filter(
                  (e) =>
                    !rfidSearch || e.staffName.toLowerCase().includes(rfidSearch.toLowerCase()) || e.rfidCard.includes(rfidSearch)
                )
                .map((e, i) => (
                  <tr
                    key={e.rfidCard}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                    <td className="p-2.5 font-mono font-semibold text-[var(--brand)]">{e.staffId}</td>
                    <td className="p-2.5 text-[var(--text-primary)] font-medium">{e.staffName}</td>
                    <td className="p-2.5 font-mono text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded mx-1">
                      {e.rfidCard}
                    </td>
                    <td className="p-2.5 text-center">
                      <select
                        value={e.type}
                        onChange={(ev) =>
                          setRfidEntries((prev) =>
                            prev.map((x) => (x.rfidCard === e.rfidCard ? { ...x, type: ev.target.value } : x))
                          )
                        }
                        className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.625rem] text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--brand)]"
                      >
                        <option>Admin</option>
                        <option>Faculty</option>
                        <option>Staff</option>
                      </select>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() =>
                          setRfidEntries((prev) =>
                            prev.map((x) => (x.rfidCard === e.rfidCard ? { ...x, assigned: !x.assigned } : x))
                          )
                        }
                        className={`text-[0.5625rem] px-2.5 py-1 rounded-full font-semibold cursor-pointer border transition-all duration-200 ${
                          e.assigned
                            ? 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white'
                            : 'bg-[var(--red-light)] border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white'
                        }`}
                      >
                        {e.assigned ? (isBn ? 'বরাদ্ধ' : 'Assigned') : isBn ? 'অবরাদ্ধ' : 'Unassigned'}
                      </button>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() =>
                            setRfidEntries((prev) =>
                              prev.map((x) =>
                                x.rfidCard === e.rfidCard
                                  ? {
                                      ...x,
                                      rfidCard: `CARD-${String(Math.floor(Math.random() * 9000) + 1000)}`,
                                    }
                                  : x
                              )
                            )
                          }
                          className="px-2.5 py-1 rounded-md bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--brand)] hover:text-white transition-all"
                        >
                          {isBn ? 'রি-অ্যাসাইন' : 'Re-assign'}
                        </button>
                        <button
                          onClick={() => setRfidEntries((prev) => prev.filter((x) => x.rfidCard !== e.rfidCard))}
                          className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                        >
                          {isBn ? 'মুছুন' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {rfidEntries.filter(
                (e) =>
                  !rfidSearch || e.staffName.toLowerCase().includes(rfidSearch.toLowerCase()) || e.rfidCard.includes(rfidSearch)
              ).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] text-[0.75rem]">
                    {isBn ? 'কোনো কার্ড পাওয়া যায়নি' : 'No cards found'}
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
