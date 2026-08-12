import { useState, useMemo } from 'react'
import { Bus, Pencil, Trash2, Plus, Phone, Route } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTransportStore, type TransportVehicle } from '@/store/transportStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { VehicleModal } from '../modals/VehicleModal'
import { toBnNum } from '@/lib/i18n'

interface Props {
  searchQuery: string
}

export const VehiclesTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const vehicles = useTransportStore((s) => s.vehicles)
  const routes = useTransportStore((s) => s.routes)
  const assignments = useTransportStore((s) => s.assignments)
  const deleteVehicle = useTransportStore((s) => s.deleteVehicle)

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<TransportVehicle | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = [...vehicles]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.nameBn.includes(q) ||
          v.registrationNo.toLowerCase().includes(q) ||
          v.driverName.toLowerCase().includes(q) ||
          v.driverNameBn.includes(q) ||
          v.driverPhone.includes(q)
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [vehicles, searchQuery])

  const getRouteNames = (routeIds: string[]) => {
    return routeIds
      .map((id) => routes.find((r) => r.id === id))
      .filter(Boolean)
      .map((r) => (bn ? r!.nameBn : r!.name))
      .join(', ')
  }

  const getEarned = (vehicleId: string) => {
    return assignments.filter((a) => a.vehicleId === vehicleId && a.isActive).reduce((sum, a) => sum + a.monthlyFare, 0)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteVehicle(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[0.8125rem] text-[var(--text-secondary)]">
          {bn ? `${filtered.length} টি যানবাহন` : `${filtered.length} vehicles`}
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90"
        >
          <Plus size={15} />
          {bn ? 'যানবাহন' : 'Vehicle'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Bus size={32} className="mx-auto text-[var(--text-secondary)] mb-2" />
          <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো যানবাহন পাওয়া যায়নি' : 'No vehicles found'}</p>
          <button onClick={() => setShowModal(true)} className="mt-2 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
            {bn ? '+ প্রথম যানবাহন যোগ করুন' : '+ Add your first vehicle'}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'যানবাহন' : 'Vehicle'}</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'চালক' : 'Driver'}</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ফোন' : 'Phone'}</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'রুট' : 'Routes'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'মোট আয়' : 'Earned'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'অবস্থা' : 'Status'}</th>
                <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id}
                  className="border-b border-[var(--border)] last:border-0 transition-colors hover:!bg-[var(--brand)]/5"
                  style={{ backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                  <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)]">{i + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--brand)]/10 text-[var(--brand)]">
                        <Bus size={14} />
                      </div>
                      <div>
                        <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? v.nameBn : v.name}</div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)] font-mono">{v.registrationNo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[0.8125rem] text-[var(--text-primary)]">{bn ? v.driverNameBn : v.driverName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[0.8125rem] text-[var(--text-secondary)]">
                      <Phone size={12} className="text-[var(--text-muted)]" />
                      {v.driverPhone || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-secondary)] max-w-[200px] truncate">
                      <Route size={12} className="text-[var(--text-muted)] shrink-0" />
                      {getRouteNames(v.routeIds) || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-[var(--green)]/10 text-[var(--green)] text-[0.75rem] font-semibold whitespace-nowrap">
                      ৳{bn ? toBnNum(getEarned(v.id)) : getEarned(v.id).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-medium ${v.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                      {v.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => { setEditItem(v); setShowModal(true) }}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] cursor-pointer transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteId(v.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <VehicleModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}

      {deleteId && (
        <DeleteConfirmDialog
          title={bn ? 'যানবাহন মুছে ফেলুন?' : 'Delete Vehicle?'}
          message={bn ? 'এই যানবাহনের সব বরাদ্দও মুছে যাবে।' : 'All assignments for this vehicle will also be deleted.'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isBn={bn}
        />
      )}
    </div>
  )
}
