import { useState, useMemo } from 'react'
import { Fingerprint, CheckCircle, Search, Zap, GraduationCap, UserCheck } from 'lucide-react'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { FpEntry } from '../types'
import { StatsRow } from './StatsRow'

interface FingerprintTabProps {
  isBn: boolean
  fpEntries: FpEntry[]
  setFpEntries: React.Dispatch<React.SetStateAction<FpEntry[]>> | ((entries: FpEntry[] | ((prev: FpEntry[]) => FpEntry[])) => void)
  onSimulatePunch?: (personId: string, method?: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile', deviceId?: string) => Promise<any>
}

export function FingerprintTab({ isBn, fpEntries, setFpEntries, onSimulatePunch }: FingerprintTabProps) {
  const [fpSearch, setFpSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'staff'>('all')
  const debouncedSearch = useDebouncedValue(fpSearch, 200)

  const filteredEntries = useMemo(() => {
    return fpEntries.filter((e) => {
      const isStudent = e.staffId.startsWith('STU')
      if (roleFilter === 'student' && !isStudent) return false
      if (roleFilter === 'staff' && isStudent) return false
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return e.staffName.toLowerCase().includes(q) || e.staffId.toLowerCase().includes(q)
    })
  }, [fpEntries, debouncedSearch, roleFilter])

  const studentCount = useMemo(() => fpEntries.filter((e) => e.staffId.startsWith('STU')).length, [fpEntries])
  const staffCount = useMemo(() => fpEntries.filter((e) => !e.staffId.startsWith('STU')).length, [fpEntries])

  const stats = useMemo(
    () => [
      {
        label: isBn ? 'মোট ফিঙ্গারপ্রিন্ট' : 'Total Fingerprints',
        value: fpEntries.length,
        icon: <Fingerprint size={15} />,
        color: 'var(--amber)',
      },
      {
        label: isBn ? 'শিক্ষার্থী' : 'Students',
        value: studentCount,
        icon: <GraduationCap size={15} />,
        color: 'var(--brand)',
      },
      {
        label: isBn ? 'এনরোলড' : 'Enrolled',
        value: fpEntries.filter((e) => e.status === 'enrolled').length,
        icon: <CheckCircle size={15} />,
        color: 'var(--green)',
      },
      {
        label: isBn ? 'দ্বৈত টেমপ্লেট' : 'Dual Template',
        value: fpEntries.filter((e) => e.templates >= 2).length,
        icon: <Fingerprint size={15} />,
        color: 'var(--teal)',
      },
    ],
    [isBn, fpEntries, studentCount]
  )

  return (
    <>
      <StatsRow stats={stats} />

      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[16rem]">
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
                ? 'bg-[var(--amber)] text-white shadow-xs'
                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isBn ? `সব (${fpEntries.length})` : `All (${fpEntries.length})`}
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('student')}
            className={`px-2.5 py-1 rounded-md text-[0.625rem] font-semibold cursor-pointer border-0 transition-all ${
              roleFilter === 'student'
                ? 'bg-[var(--amber)] text-white shadow-xs'
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
                ? 'bg-[var(--amber)] text-white shadow-xs'
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
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'টাইপ' : 'Type'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'FP আইডি' : 'FP ID'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'টেমপ্লেট' : 'Templates'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((e, i) => {
                const isStudent = e.staffId.startsWith('STU')
                return (
                  <tr
                    key={e.staffId}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                    <td className="p-2.5 font-mono font-semibold text-[var(--brand)]">{e.staffId}</td>
                    <td className="p-2.5 text-[var(--text-primary)] font-medium">{e.staffName}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`text-[0.5625rem] px-2 py-0.5 rounded-full font-semibold ${
                          isStudent
                            ? 'bg-[var(--green-light)] text-[var(--green)]'
                            : 'bg-[var(--brand-light)] text-[var(--brand)]'
                        }`}
                      >
                        {isStudent ? (isBn ? 'শিক্ষার্থী' : 'Student') : (isBn ? 'স্টাফ' : 'Staff')}
                      </span>
                    </td>
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
                            ? isBn ? 'বকেয়া' : 'Pending'
                            : isBn ? 'ব্যর্থ' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex gap-1.5 justify-center">
                        {onSimulatePunch && e.status === 'enrolled' && (
                          <button
                            onClick={() => onSimulatePunch(e.staffId, 'fingerprint', 'FP-DESK')}
                            title={isBn ? 'ফিঙ্গারপ্রিন্ট পাঞ্চ টেস্ট' : 'Test FP Scan Punch'}
                            className="px-2.5 py-1 rounded-md bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--green)] hover:text-white transition-all flex items-center gap-1"
                          >
                            <Zap size={9} />
                            {isBn ? 'পাঞ্চ' : 'Punch'}
                          </button>
                        )}
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
                                      ? { ...x, status: 'enrolled' as const, templates: 2 }
                                      : x
                                  )
                                ),
                              1500
                            )
                          }}
                          disabled={e.status === 'pending'}
                          className={`px-2.5 py-1 rounded-md text-[0.5625rem] font-semibold cursor-pointer border transition-all duration-200 ${
                            e.status === 'pending'
                              ? 'bg-[var(--amber-light)] border-[var(--amber)] text-[var(--amber)] animate-pulse cursor-wait'
                              : 'bg-[var(--amber-light)] border-[var(--amber)] text-[var(--amber)] hover:bg-[var(--amber)] hover:text-white hover:shadow-md'
                          }`}
                        >
                          {e.status === 'enrolled'
                            ? isBn ? 'রি-এনরোল' : 'Re-enroll'
                            : isBn ? 'এনরোল হচ্ছে...' : 'Enrolling...'}
                        </button>
                        <button
                          onClick={() => setFpEntries((prev) => prev.filter((x) => x.staffId !== e.staffId))}
                          className="px-2.5 py-1 rounded-md bg-transparent border border-[var(--border)] text-[var(--text-muted)] text-[0.5625rem] font-semibold cursor-pointer hover:border-[var(--red)] hover:text-[var(--red)] transition-all"
                        >
                          {isBn ? 'মুছুন' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">
                    <Fingerprint size={32} className="mx-auto mb-2 opacity-30 text-[var(--amber)]" />
                    <p className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                      {isBn ? 'কোনো ফিঙ্গারপ্রিন্ট রেকর্ড পাওয়া যায়নি' : 'No Fingerprint Records Found'}
                    </p>
                    <p className="text-[0.625rem] text-[var(--text-muted)] mt-1 mb-3">
                      {isBn ? 'উপরে "+ ফিঙ্গারপ্রিন্ট যোগ করুন" ক্লিক করুন অথবা ডেমো ডাটা লোড করুন।' : 'Click "+ Enroll Fingerprint" above or load demo entries.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => useAttendanceStore.getState().loadSampleDevices()}
                      className="px-3.5 py-1.5 rounded-lg bg-[var(--amber)] text-white text-[0.6875rem] font-medium cursor-pointer border-0 hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <UserCheck size={12} />
                      {isBn ? 'ডেমো ডাটা লোড করুন' : 'Load Demo Fingerprints'}
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
