import { useState, useMemo } from 'react'
import { ScanFace, CheckCircle, Fingerprint, Search, Zap, GraduationCap, UserCheck } from 'lucide-react'
import { useAttendanceStore } from '@/store/attendanceStore'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { FaceEntry } from '../types'
import { StatsRow } from './StatsRow'

interface FaceScanTabProps {
  isBn: boolean
  faceEntries: FaceEntry[]
  setFaceEntries: React.Dispatch<React.SetStateAction<FaceEntry[]>> | ((entries: FaceEntry[] | ((prev: FaceEntry[]) => FaceEntry[])) => void)
  onSimulatePunch?: (personId: string, method?: 'punch' | 'rfid' | 'fingerprint' | 'face' | 'mobile', deviceId?: string) => Promise<any>
}

export function FaceScanTab({ isBn, faceEntries, setFaceEntries, onSimulatePunch }: FaceScanTabProps) {
  const [faceSearch, setFaceSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'staff'>('all')
  const debouncedSearch = useDebouncedValue(faceSearch, 200)

  const filteredEntries = useMemo(() => {
    return faceEntries.filter((e) => {
      const isStudent = e.staffId.startsWith('STU')
      if (roleFilter === 'student' && !isStudent) return false
      if (roleFilter === 'staff' && isStudent) return false
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return e.staffName.toLowerCase().includes(q) || e.staffId.toLowerCase().includes(q)
    })
  }, [faceEntries, debouncedSearch, roleFilter])

  const studentCount = useMemo(() => faceEntries.filter((e) => e.staffId.startsWith('STU')).length, [faceEntries])
  const staffCount = useMemo(() => faceEntries.filter((e) => !e.staffId.startsWith('STU')).length, [faceEntries])

  const stats = useMemo(
    () => [
      {
        label: isBn ? 'মোট ফেস' : 'Total Faces',
        value: faceEntries.length,
        icon: <ScanFace size={15} />,
        color: 'var(--green)',
      },
      {
        label: isBn ? 'শিক্ষার্থী' : 'Students',
        value: studentCount,
        icon: <GraduationCap size={15} />,
        color: 'var(--brand)',
      },
      {
        label: isBn ? 'এনরোলড' : 'Enrolled',
        value: faceEntries.filter((e) => e.status === 'enrolled').length,
        icon: <CheckCircle size={15} />,
        color: 'var(--green)',
      },
      {
        label: isBn ? 'হাই কোয়ালিটি' : 'High Quality',
        value: faceEntries.filter((e) => e.quality >= 80).length,
        icon: <Fingerprint size={15} />,
        color: 'var(--teal)',
      },
    ],
    [isBn, faceEntries, studentCount]
  )

  return (
    <>
      <StatsRow stats={stats} />

      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[16rem]">
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
                ? 'bg-[var(--green)] text-white shadow-xs'
                : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isBn ? `সব (${faceEntries.length})` : `All (${faceEntries.length})`}
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('student')}
            className={`px-2.5 py-1 rounded-md text-[0.625rem] font-semibold cursor-pointer border-0 transition-all ${
              roleFilter === 'student'
                ? 'bg-[var(--green)] text-white shadow-xs'
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
                ? 'bg-[var(--green)] text-white shadow-xs'
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
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'ফেস আইডি' : 'Face ID'}</th>
                <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'কোয়ালিটি' : 'Quality'}</th>
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
                            ? isBn ? 'বকেয়া' : 'Pending'
                            : isBn ? 'ব্যর্থ' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex gap-1.5 justify-center">
                        {onSimulatePunch && e.status === 'enrolled' && (
                          <button
                            onClick={() => onSimulatePunch(e.staffId, 'face', 'FACE-DESK')}
                            title={isBn ? 'ফেস স্ক্যান পাঞ্চ টেস্ট' : 'Test Face Scan Punch'}
                            className="px-2.5 py-1 rounded-md bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--green)] hover:text-white transition-all flex items-center gap-1"
                          >
                            <Zap size={9} />
                            {isBn ? 'পাঞ্চ' : 'Punch'}
                          </button>
                        )}
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
                                      ? { ...x, status: 'enrolled' as const, quality: Math.floor(Math.random() * 15) + 85 }
                                      : x
                                  )
                                ),
                              1500
                            )
                          }}
                          disabled={e.status === 'pending'}
                          className={`px-2.5 py-1 rounded-md text-[0.5625rem] font-semibold cursor-pointer border transition-all duration-200 ${
                            e.status === 'pending'
                              ? 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] animate-pulse cursor-wait'
                              : 'bg-[var(--green-light)] border-[var(--green)] text-[var(--green)] hover:bg-[var(--green)] hover:text-white hover:shadow-md'
                          }`}
                        >
                          {e.status === 'enrolled'
                            ? isBn ? 'রি-স্ক্যান' : 'Re-scan'
                            : isBn ? 'স্ক্যান হচ্ছে...' : 'Scanning...'}
                        </button>
                        <button
                          onClick={() => setFaceEntries((prev) => prev.filter((x) => x.staffId !== e.staffId))}
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
                    <ScanFace size={32} className="mx-auto mb-2 opacity-30 text-[var(--green)]" />
                    <p className="text-[0.75rem] font-medium text-[var(--text-primary)]">
                      {isBn ? 'কোনো ফেস স্ক্যান রেকর্ড পাওয়া যায়নি' : 'No Face Scan Records Found'}
                    </p>
                    <p className="text-[0.625rem] text-[var(--text-muted)] mt-1 mb-3">
                      {isBn ? 'উপরে "+ ফেস স্ক্যান যোগ করুন" ক্লিক করুন অথবা ডেমো ডাটা লোড করুন।' : 'Click "+ Enroll Face" above or load demo entries.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => useAttendanceStore.getState().loadSampleDevices()}
                      className="px-3.5 py-1.5 rounded-lg bg-[var(--green)] text-white text-[0.6875rem] font-medium cursor-pointer border-0 hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <UserCheck size={12} />
                      {isBn ? 'ডেমো ডাটা লোড করুন' : 'Load Demo Faces'}
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
