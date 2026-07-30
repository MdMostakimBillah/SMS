import { useState } from 'react'
import { ScanFace, CheckCircle, Fingerprint, Search } from 'lucide-react'
import type { FaceEntry } from '../types'
import { StatsRow } from './StatsRow'

interface FaceScanTabProps {
  isBn: boolean
  faceEntries: FaceEntry[]
  setFaceEntries: React.Dispatch<React.SetStateAction<FaceEntry[]>>
}

export function FaceScanTab({ isBn, faceEntries, setFaceEntries }: FaceScanTabProps) {
  const [faceSearch, setFaceSearch] = useState('')

  return (
    <>
      <StatsRow
        stats={[
          {
            label: isBn ? 'মোট' : 'Total',
            value: faceEntries.length,
            icon: <ScanFace size={15} />,
            color: 'var(--green)',
          },
          {
            label: isBn ? 'এনরোলড' : 'Enrolled',
            value: faceEntries.filter((e) => e.status === 'enrolled').length,
            icon: <CheckCircle size={15} />,
            color: 'var(--green)',
          },
          {
            label: isBn ? 'গড কোয়ালিটি' : 'Good Quality',
            value: faceEntries.filter((e) => e.quality >= 80).length,
            icon: <Fingerprint size={15} />,
            color: 'var(--brand)',
          },
        ]}
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[0.375rem] flex-1 max-w-[18.75rem]">
          <Search size={13} className="text-[var(--text-muted)]" />
          <input
            value={faceSearch}
            onChange={(e) => setFaceSearch(e.target.value)}
            placeholder={isBn ? 'নাম বা আইডি দিয়ে খুঁজুন...' : 'Search by name or ID...'}
            className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
          />
        </div>
        <span className="text-[0.6875rem] text-[var(--text-muted)]">
          {faceEntries.filter((e) => !faceSearch || e.staffName.toLowerCase().includes(faceSearch.toLowerCase())).length}{' '}
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
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'ফেস আইডি' : 'Face ID'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'কোয়ালিটি' : 'Quality'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {faceEntries
                .filter((e) => !faceSearch || e.staffName.toLowerCase().includes(faceSearch.toLowerCase()))
                .map((e, i) => (
                  <tr
                    key={e.staffId}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                    <td className="p-2.5 font-mono font-semibold text-[var(--brand)]">{e.staffId}</td>
                    <td className="p-2.5 text-[var(--text-primary)] font-medium">{e.staffName}</td>
                    <td className="p-2.5 text-center font-mono text-[var(--text-primary)]">{e.faceId}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <div className="w-20 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${e.quality}%`,
                              background: e.quality >= 80 ? 'var(--green)' : e.quality >= 60 ? 'var(--amber)' : 'var(--red)',
                            }}
                          ></div>
                        </div>
                        <span
                          className="text-[0.5625rem] font-bold tabular-nums"
                          style={{
                            color: e.quality >= 80 ? 'var(--green)' : e.quality >= 60 ? 'var(--amber)' : 'var(--red)',
                          }}
                        >
                          {e.quality}%
                        </span>
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
                            setFaceEntries((prev) =>
                              prev.map((x) =>
                                x.staffId === e.staffId
                                  ? { ...x, status: 'pending' as const, quality: 0 }
                                  : x
                              )
                            )
                            setTimeout(
                              () =>
                                setFaceEntries((prev) =>
                                  prev.map((x) =>
                                    x.staffId === e.staffId
                                      ? { ...x, status: 'enrolled' as const, quality: Math.floor(Math.random() * 30) + 70 }
                                      : x
                                  )
                                ),
                              2000
                            )
                          }}
                          disabled={e.status === 'pending'}
                          className={`px-2.5 py-1 rounded-md text-[0.5625rem] font-semibold cursor-pointer border transition-all duration-200 ${
                            e.status === 'pending'
                              ? 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] animate-pulse cursor-wait'
                              : 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white hover:shadow-md'
                          }`}
                        >
                          {e.status === 'pending' ? (isBn ? 'স্ক্যান হচ্ছে...' : 'Scanning...') : isBn ? 'রি-স্ক্যান' : 'Re-scan'}
                        </button>
                        <button
                          onClick={() => setFaceEntries((prev) => prev.filter((x) => x.staffId !== e.staffId))}
                          className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                        >
                          {isBn ? 'মুছুন' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {faceEntries.filter((e) => !faceSearch || e.staffName.toLowerCase().includes(faceSearch.toLowerCase())).length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] text-[0.75rem]">
                    {isBn ? 'কোনো ফেস ডেটা পাওয়া যায়নি' : 'No face data found'}
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
