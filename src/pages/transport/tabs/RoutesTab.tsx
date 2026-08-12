import { useState, useMemo } from 'react'
import { MapPin, Pencil, Trash2, Plus, Users } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTransportStore, type TransportRoute } from '@/store/transportStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { RouteModal } from '../modals/RouteModal'
import { toBnNum } from '@/lib/i18n'

interface Props {
  searchQuery: string
}

export const RoutesTab = ({ searchQuery }: Props) => {
  const bn = useBn()
  const routes = useTransportStore((s) => s.routes)
  const assignments = useTransportStore((s) => s.assignments)
  const deleteRoute = useTransportStore((s) => s.deleteRoute)

  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<TransportRoute | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = [...routes]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.nameBn.includes(q) ||
          r.stops.toLowerCase().includes(q) ||
          r.stopsBn.includes(q)
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [routes, searchQuery])

  const getStudentCount = (routeId: string) => {
    return assignments.filter((a) => a.routeId === routeId && a.isActive).length
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteRoute(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[0.8125rem] text-[var(--text-secondary)]">
          {bn ? `${filtered.length} টি রুট` : `${filtered.length} routes`}
        </div>
        <button
          onClick={() => { setEditItem(null); setShowModal(true) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-[0.8125rem] font-medium cursor-pointer hover:opacity-90"
        >
          <Plus size={15} />
          {bn ? 'রুট' : 'Route'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <MapPin size={32} className="mx-auto text-[var(--text-secondary)] mb-2" />
          <p className="text-[0.875rem] text-[var(--text-secondary)]">{bn ? 'কোনো রুট পাওয়া যায়নি' : 'No routes found'}</p>
          <button onClick={() => setShowModal(true)} className="mt-2 text-[0.8125rem] text-[var(--brand)] cursor-pointer hover:underline">
            {bn ? '+ প্রথম রুট যোগ করুন' : '+ Add your first route'}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[0.625rem] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">#</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'রুটের নাম' : 'Route Name'}</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'স্টপ/গন্তব্য' : 'Stops'}</th>
                <th className="text-left py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'দূরত্ব' : 'Distance'}</th>
                <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ভাড়া' : 'Fare'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'ছাত্র' : 'Students'}</th>
                <th className="text-center py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'অবস্থা' : 'Status'}</th>
                <th className="text-right py-2.5 px-4 text-[0.6875rem] font-semibold text-[var(--text-secondary)] uppercase">{bn ? 'কার্যক্রম' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id}
                  className="border-b border-[var(--border)] last:border-0 transition-colors hover:!bg-[var(--brand)]/5"
                  style={{ backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)' }}>
                  <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] text-center">{i + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--teal)]/10 text-[var(--teal)]">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? r.nameBn : r.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="text-[0.75rem] text-[var(--text-secondary)] max-w-[250px] truncate mx-auto">
                      {bn ? r.stopsBn : r.stops || '—'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[0.8125rem] text-[var(--text-secondary)] text-center">
                    {r.distance || '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[1rem] font-bold text-[var(--text-primary)]">
                      ৳{bn ? toBnNum(r.fare) : r.fare}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users size={12} className="text-[var(--text-muted)]" />
                      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-md bg-[var(--brand)]/8 text-[var(--brand)] text-[0.75rem] font-semibold">
                        {getStudentCount(r.id)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-medium ${r.isActive ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                      {r.isActive ? (bn ? 'সক্রিয়' : 'Active') : (bn ? 'নিষ্ক্রিয়' : 'Inactive')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => { setEditItem(r); setShowModal(true) }}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--brand)] cursor-pointer transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteId(r.id)}
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

      {showModal && <RouteModal existing={editItem} onSaved={() => { setShowModal(false); setEditItem(null) }} onClose={() => { setShowModal(false); setEditItem(null) }} />}

      {deleteId && (
        <DeleteConfirmDialog
          title={bn ? 'রুট মুছে ফেলুন?' : 'Delete Route?'}
          message={bn ? 'এই রুটের সব বরাদ্দ ও যানবাহন সম্পর্ক মুছে যাবে।' : 'All assignments and vehicle associations for this route will be removed.'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          isBn={bn}
        />
      )}
    </div>
  )
}
