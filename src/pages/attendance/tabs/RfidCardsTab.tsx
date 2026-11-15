import { useState, useMemo } from 'react'
import { CreditCard, CheckCircle, XCircle, Search, Zap, GraduationCap, UserCheck } from 'lucide-react'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { RfidEntry } from '../types'
import { StatsRow } from './StatsRow'

interface RfidCardsTabProps {
  isBn: boolean
  rfidEntries: RfidEntry[]
  setRfidEntries: React.Dispatch<React.SetStateAction<RfidEntry[]>> | ((entries: RfidEntry[] | ((prev: RfidEntry[]) => RfidEntry[])) => void)
  onSimulatePunch?: (personId: string, method?: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile', deviceId?: string) => Promise<any>
}

export function RfidCardsTab({ isBn, rfidEntries, setRfidEntries, onSimulatePunch }: RfidCardsTabProps) {
  const [rfidSearch, setRfidSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'staff'>('all')
  const debouncedSearch = useDebouncedValue(rfidSearch, 200)

  const filteredEntries = useMemo(() => {
    return rfidEntries.filter((e) => {
      const isStudent = e.type === 'Student' || e.staffId.startsWith('STU')
      if (roleFilter === 'student' && !isStudent) return false
      if (roleFilter === 'staff' && isStudent) return false
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return (
        e.staffName.toLowerCase().includes(q) ||
        e.staffId.toLowerCase().includes(q) ||
        e.rfidCard.toLowerCase().includes(q)
      )
    })
  }, [rfidEntries, debouncedSearch, roleFilter])

  const studentCount = useMemo(
    () => rfidEntries.filter((e) => e.type === 'Student' || e.staffId.startsWith('STU')).length,
    [rfidEntries]
  )
  const staffCount = useMemo(
    () => rfidEntries.filter((e) => e.type !== 'Student' && !e.staffId.startsWith('STU')).length,
    [rfidEntries]
  )

  const stats = useMemo(
    () => [
      {
        label: isBn ? 'মোট কার্ড' : 'Total Cards',
        value: rfidEntries.length,
        icon: <CreditCard size={15} />,
        color: 'var(--brand)',
      },
      {
        label: isBn ? 'শিক্ষার্থী কার্ড' : 'Student Cards',
        value: studentCount,
        icon: <GraduationCap size={15} />,
        color: 'var(--green)',
      },
      {
        label: isBn ? 'বরাদ্দকৃত' : 'Assigned',
        value: rfidEntries.filter((e) => e.assigned).length,
        icon: <CheckCircle size={15} />,
        color: 'var(--teal)',
      },
      {
        label: isBn ? 'অবরাদ্দকৃত' : 'Unassigned',
        value: rfidEntries.filter((e) => !e.assigned).length,
        icon: <XCircle size={15} />,
        color: 'var(--amber)',
      },
    ],
    [isBn, rfidEntries, studentCount]
  )

  return (
    <>
      <StatsRow stats={stats} />

      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[16rem]">
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-3 py-[0.375rem] flex-1 max-w-[18.75rem]">
            <Search size={13} className="text-[var(--text-muted)]" />
            <input
              value={rfidSearch}
              onChange={(e) => setRfidSearch(e.target.value)}
              placeholder={isBn ? 'নাম, আইডি বা কার্ড নম্বর দিয়ে খুঁজুন...' : 'Search by name, ID or card...'}
              className="flex-1 border-none bg-transparent outline-none text-[0.75rem] text-[var(--text-primary)]"
            />
          </div>
          <span className="text-[0.6875rem] text-[var(--text-muted)]">
            {filteredEntries.length} {isBn ? 'টি ফলাফল' : 'results'}
          </span>
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-lg p-0.5 border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[0.625rem] font-semibold cursor-pointer border-0 transition-all ${
              roleFilter === 'all'
                ? 'bg-[var(--brand)] text-white shadow-xs'
                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isBn ? `সব (${rfidEntries.length})` : `All (${rfidEntries.length})`}
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('student')}
            className={`px-2.5 py-1 rounded-md text-[0.625rem] font-semibold cursor-pointer border-0 transition-all ${
              roleFilter === 'student'
                ? 'bg-[var(--brand)] text-white shadow-xs'
                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isBn ? `শিক্ষার্থী (${studentCount})` : `Students (${studentCount})`}
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('staff')}
            className={`px-2.5 py-1 rounded-md text-[0.625rem] font-semibold cursor-pointer border-0 transition-all ${
              roleFilter === 'staff'
                ? 'bg-[var(--brand)] text-white shadow-xs'
                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isBn ? `স্টাফ (${staffCount})` : `Staff (${staffCount})`}
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-auto max-h-[55vh]">
          <table className="w-full border-collapse text-[0.6875rem]">
            <thead>
              <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.1875rem]">#</th>
                <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'আইডি' : 'ID'}</th>
                <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'নাম' : 'Name'}</th>
                <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'কার্ড নম্বর' : 'Card Number'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'টাইপ' : 'Type'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((e, i) => (
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
                        className="px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[0.625rem] text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--brand)] font-medium"
                      >
                        <option value="Student">{isBn ? 'শিক্ষার্থী (Student)' : 'Student'}</option>
                        <option value="Faculty">{isBn ? 'শিক্ষক (Faculty)' : 'Faculty'}</option>
                        <option value="Admin">{isBn ? 'এডমিন (Admin)' : 'Admin'}</option>
                        <option value="Staff">{isBn ? 'স্টাফ (Staff)' : 'Staff'}</option>
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
                        {e.assigned ? (isBn ? 'বরাদ্দ' : 'Assigned') : isBn ? 'অবরাদ্দ' : 'Unassigned'}
                      </button>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex gap-1.5 justify-center">
                        {onSimulatePunch && e.assigned && (
                          <button
                            onClick={() => onSimulatePunch(e.staffId, 'rfid', 'RFID-DESK')}
                            title={isBn ? 'কার্ড সোয়াইপ টেস্ট' : 'Test Card Swipe'}
                            className="px-2.5 py-1 rounded-md bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--green)] hover:text-white transition-all flex items-center gap-1"
                          >
                            <Zap size={9} />
                            {isBn ? 'পাঞ্চ' : 'Punch'}
                          </button>
                        )}
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
                          {isBn ? 'রি-ইস্যু' : 'Re-issue'}
                        </button>
                        <button
                          onClick={() => setRfidEntries((prev) => prev.filter((x) => x.rfidCard !== e.rfidCard))}
                          className="px-2.5 py-1 rounded-md bg-transparent border border-[var(--border)] text-[var(--text-muted)] text-[0.5625rem] font-semibold cursor-pointer hover:border-[var(--red)] hover:text-[var(--red)] transition-all"
                        >
                          {isBn ? 'মুছুন' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                    <CreditCard size={32} className="mx-auto mb-2 opacity-30 text-[var(--brand)]" />
                    <p className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                      {isBn ? 'কোনো RFID কার্ড পাওয়া যায়নি' : 'No RFID Cards Found'}
                    </p>
                    <p className="text-[0.625rem] text-[var(--text-muted)] mt-1 mb-3">
                      {isBn ? 'উপরে "+ RFID কার্ড যোগ করুন" ক্লিক করুন অথবা ডেমো কার্ড লোড করুন।' : 'Click "+ Assign RFID" above or load demo entries.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => useAttendanceStore.getState().loadSampleDevices()}
                      className="px-3.5 py-1.5 rounded-lg bg-[var(--brand)] text-white text-[0.6875rem] font-medium cursor-pointer border-0 hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <UserCheck size={12} />
                      {isBn ? 'ডেমো কার্ড লোড করুন' : 'Load Demo Cards'}
                    </button>
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
