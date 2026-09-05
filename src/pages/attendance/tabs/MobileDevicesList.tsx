import { CheckCircle, Clock, Search } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import type { MobileDevice } from '../types'

interface MobileDevicesListProps {
  isBn: boolean
  date: string
  mobileDevices: MobileDevice[]
  mobileSearch: string
  setMobileSearch: (v: string) => void
  removeMobileDevice: (id: string) => void
}

export function MobileDevicesList({ isBn, date, mobileDevices, mobileSearch, setMobileSearch, removeMobileDevice }: MobileDevicesListProps) {
  const { canDelete } = usePermission()
  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--bg-primary)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-4">
          <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
            {isBn ? 'নিবন্ধিত ডিভাইস' : 'Registered Devices'} ({mobileDevices.length})
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle size={11} className="text-[var(--green)]" />
            <span className="text-[0.625rem] text-[var(--text-muted)]">{mobileDevices.filter((d) => d.lastAuth?.startsWith(date)).length} {isBn ? 'আজ' : 'Today'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={11} className="text-[var(--brand)]" />
            <span className="text-[0.625rem] text-[var(--text-muted)]">{mobileDevices.filter((d) => d.lastAuth).length} {isBn ? 'সক্রিয়' : 'Active'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-[0.3125rem]">
          <Search size={12} className="text-[var(--text-muted)]" />
          <input
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            placeholder={isBn ? 'খুঁজুন...' : 'Search...'}
            className="flex-1 border-none bg-transparent outline-none text-[0.6875rem] text-[var(--text-primary)] w-[6.25rem]"
          />
        </div>
      </div>
      <div className="overflow-auto max-h-[35vh]">
        <table className="w-full border-collapse text-[0.6875rem]">
          <thead>
            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
              <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)] w-[2.1875rem]">#</th>
              <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'স্টাফ' : 'Staff'}</th>
              <th className="p-2.5 text-left text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'ডিভাইস' : 'Device'}</th>
              <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'শেষ ব্যবহার' : 'Last Used'}</th>
              <th className="p-2.5 text-center text-[0.625rem] font-semibold text-[var(--text-muted)]">{isBn ? 'অ্যাকশন' : 'Action'}</th>
            </tr>
          </thead>
          <tbody>
            {mobileDevices
              .filter(
                (d) =>
                  !mobileSearch ||
                  d.staffName.toLowerCase().includes(mobileSearch.toLowerCase()) ||
                  d.staffId.toLowerCase().includes(mobileSearch.toLowerCase())
              )
              .map((d, i) => (
                <tr key={d.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="p-2.5 text-center text-[var(--text-muted)]">{i + 1}</td>
                  <td className="p-2.5">
                    <div className="font-medium text-[var(--text-primary)]">{d.staffName}</div>
                    <div className="text-[0.625rem] text-[var(--text-muted)]">{d.staffId}</div>
                  </td>
                  <td className="p-2.5">
                    <span className="text-[0.625rem] px-2 py-0.5 rounded-full bg-[var(--teal-light)] text-[var(--teal)] font-medium">{d.deviceName}</span>
                  </td>
                  <td className="p-2.5 text-center text-[0.625rem] text-[var(--text-muted)]">
                    {d.lastAuth ? new Date(d.lastAuth).toLocaleString() : <span className="text-[var(--amber)]">{isBn ? 'নতুন' : 'New'}</span>}
                  </td>
                  <td className="p-2.5 text-center">
                    {canDelete('attendance.device.delete') && (
                    <button
                      onClick={() => removeMobileDevice(d.id)}
                      className="px-2.5 py-1 rounded-md bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.5625rem] font-semibold cursor-pointer hover:bg-[var(--red)] hover:text-white transition-all"
                    >
                      {isBn ? 'মুছুন' : 'Remove'}
                    </button>
                    )}
                  </td>
                </tr>
              ))}
            {mobileDevices.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--text-muted)] text-[0.75rem]">
                  {isBn ? 'কোনো ডিভাইস নিবন্ধিত নেই' : 'No devices registered'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
