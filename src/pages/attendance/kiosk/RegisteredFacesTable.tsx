import { useMemo } from 'react'
import { CheckCircle, Search, User } from 'lucide-react'
import type { RegisteredFace } from '@/hooks/useFaceApi'

interface RegisteredFacesTableProps {
  isBn: boolean
  faces: RegisteredFace[]
  date: string
  attendance: Record<string, Record<string, { status: string; punches: Array<{ time: string; type: string }> }>>
  search: string
  onSearchChange: (val: string) => void
  onDelete: (staffId: string) => void
}

export default function RegisteredFacesTable({
  isBn,
  faces,
  date,
  attendance,
  search,
  onSearchChange,
  onDelete,
}: RegisteredFacesTableProps) {
  const filteredFaces = useMemo(() => {
    if (!search) return faces
    const q = search.toLowerCase()
    return faces.filter(
      (f) => f.staffName.toLowerCase().includes(q) || f.staffId.toLowerCase().includes(q)
    )
  }, [faces, search])

  const stats = useMemo(() => {
    const todayCheckin = faces.filter((f) => attendance[date]?.[f.staffId]?.punches?.length).length
    const active = faces.filter((f) => attendance[date]?.[f.staffId]?.status === 'present').length
    return { todayCheckin, active }
  }, [faces, attendance, date])

  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
            {isBn ? `নিবন্ধিত (${faces.length})` : `Registered (${faces.length})`}
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle size={11} className="text-[var(--teal)]" />
            <span className="text-[0.625rem] text-[var(--text-muted)]">{stats.todayCheckin} {isBn ? 'আজ' : 'Today'}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle size={11} className="text-[var(--brand)]" />
            <span className="text-[0.625rem] text-[var(--text-muted)]">{stats.active} {isBn ? 'সক্রিয়' : 'Active'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-[0.3125rem]">
          <Search size={12} className="text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
            className="flex-1 border-none bg-transparent outline-none text-[0.6875rem] text-[var(--text-primary)] w-[6.25rem]"
          />
        </div>
      </div>
      <div className="overflow-auto max-h-[35vh]">
        <table className="w-full border-collapse text-[0.8125rem]">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <th className="px-4 py-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] w-[2.5rem] uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isBn ? 'নাম' : 'Name'}</th>
              <th className="px-4 py-3 text-left text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isBn ? 'আইডি' : 'ID'}</th>
              <th className="px-4 py-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isBn ? 'মান' : 'Quality'}</th>
              <th className="px-4 py-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
              <th className="px-4 py-3 text-center text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{isBn ? 'অ্যাকশন' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredFaces.map((f, i) => {
              const isCheckedIn = attendance[date]?.[f.staffId]?.status === 'present'
              return (
                <tr key={f.staffId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <td className="px-4 py-3 text-center text-[var(--text-muted)] font-medium">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]">
                        {f.photo ? (
                          <img src={f.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User size={14} className="text-[var(--text-muted)]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{f.staffName}</div>
                        <div className="text-[0.625rem] text-[var(--text-muted)] font-mono">{f.staffId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[0.75rem] text-[var(--text-secondary)]">{f.staffId}</td>
                  <td className="px-4 py-3 text-center">
                    {f.qualityScore != null ? (
                      <span className={`inline-flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full font-semibold ${
                        f.qualityScore >= 80 ? 'bg-[var(--green-light)] text-[var(--green)]'
                          : f.qualityScore >= 50 ? 'bg-[var(--amber-light)] text-[var(--amber)]'
                            : 'bg-[var(--red-light)] text-[var(--red)]'
                      }`}>
                        {f.qualityScore}
                      </span>
                    ) : (
                      <span className="text-[0.625rem] text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[0.625rem] px-2.5 py-1 rounded-full font-semibold ${
                      isCheckedIn
                        ? 'bg-[var(--green-light)] text-[var(--green)]'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isCheckedIn ? 'bg-[var(--green)]' : 'bg-[var(--text-muted)]'}`} />
                      {isCheckedIn ? (isBn ? 'চেক-ইন' : 'Checked In') : (isBn ? 'নিবন্ধিত' : 'Registered')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onDelete(f.staffId)}
                      className="px-3 py-1.5 rounded-lg text-[0.625rem] font-semibold bg-[var(--red-light)] text-[var(--red)] border border-transparent hover:bg-[var(--red)] hover:text-white cursor-pointer transition-all"
                    >
                      {isBn ? 'মুছুন' : 'Delete'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredFaces.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  {isBn ? 'কোনো নিবন্ধিত ব্যক্তি নেই' : 'No registered people'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
