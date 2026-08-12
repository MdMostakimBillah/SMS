import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { UserPlus, X, AlertCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTransportStore, type TransportAssignment } from '@/store/transportStore'
import { useSessionStudents } from '@/store/admissionStore'
import { labelCls } from '@/pages/hr/utils'

const inputFieldCls =
  'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30'
const selectFieldCls = `${inputFieldCls} appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")] bg-no-repeat bg-[position:right_0.75rem_center] bg-[size:12px]`

interface Props {
  existing?: TransportAssignment | null
  onSaved: () => void
  onClose: () => void
}

export function AssignmentModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { vehicles, routes, assignments, addAssignment, updateAssignment } = useTransportStore()
  const students = useSessionStudents()

  const activeVehicles = useMemo(() => vehicles.filter((v) => v.isActive), [vehicles])

  const [studentId, setStudentId] = useState(existing?.studentId || '')
  const [vehicleId, setVehicleId] = useState(existing?.vehicleId || '')
  const [routeId, setRouteId] = useState(existing?.routeId || '')
  const [pickupStop, setPickupStop] = useState(existing?.pickupStop || '')
  const [monthlyFare, setMonthlyFare] = useState(existing?.monthlyFare?.toString() || '')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const selectedVehicle = useMemo(() => activeVehicles.find((v) => v.id === vehicleId), [activeVehicles, vehicleId])

  const vehicleRoutes = useMemo(() => {
    if (!selectedVehicle) return []
    return routes.filter((r) => selectedVehicle.routeIds.includes(r.id) && r.isActive)
  }, [selectedVehicle, routes])

  const assignedStudentIds = useMemo(
    () => assignments.filter((a) => a.isActive && a.id !== existing?.id).map((a) => a.studentId),
    [assignments, existing?.id]
  )

  const availableStudents = useMemo(
    () => students.filter((s) => s.status === 'approved' && s.active !== false && !assignedStudentIds.includes(s.id)),
    [students, assignedStudentIds]
  )

  const assignedStudent = useMemo(() => students.find((s) => s.id === studentId), [students, studentId])

  const selectedRoute = useMemo(() => vehicleRoutes.find((r) => r.id === routeId), [vehicleRoutes, routeId])

  const handleVehicleChange = (id: string) => {
    setVehicleId(id)
    setRouteId('')
    setPickupStop('')
    setErrors((p) => ({ ...p, vehicle: false }))
  }

  const handleRouteChange = (id: string) => {
    setRouteId(id)
    const route = vehicleRoutes.find((r) => r.id === id)
    if (route) setMonthlyFare(route.fare.toString())
    setErrors((p) => ({ ...p, route: false }))
  }

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!studentId) e.student = true
    if (!vehicleId) e.vehicle = true
    if (!routeId) e.route = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString().split('T')[0]
    const data: TransportAssignment = {
      id: existing?.id || `TA-${Date.now()}`,
      studentId,
      vehicleId,
      routeId,
      pickupStop: pickupStop.trim(),
      monthlyFare: Number(monthlyFare) || 0,
      assignedDate: existing?.assignedDate || now,
      isActive: existing?.isActive ?? true,
    }
    if (existing) {
      updateAssignment(existing.id, data)
    } else {
      addAssignment(data)
    }
    onSaved()
  }

  const stopOptions = useMemo(() => {
    if (!selectedRoute) return []
    const stops = bn ? selectedRoute.stopsBn : selectedRoute.stops
    return stops.split(',').map((s) => s.trim()).filter(Boolean)
  }, [selectedRoute, bn])

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-[50rem] max-h-[92vh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden [animation:modalPopIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/25">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {existing ? (bn ? 'ছাত্র আপডেট' : 'Update Assignment') : (bn ? 'নতুন ছাত্র যোগ করুন' : 'Assign Student to Transport')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                {existing ? (bn ? 'বরাদ্দ তথ্য আপডেট করুন' : 'Update assignment details') : (bn ? 'ছাত্রকে যানবাহনে যুক্ত করুন' : 'Assign a student to a vehicle and route')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(92vh-8rem)]">
          {/* Student */}
          <div>
            <label className={labelCls}>{bn ? 'ছাত্র নির্বাচন' : 'Select Student'}<span className="text-red-400 ml-0.5">*</span></label>
            <select
              value={studentId}
              onChange={(e) => { setStudentId(e.target.value); setErrors((p) => ({ ...p, student: false })) }}
              className={`${selectFieldCls} ${errors.student ? 'border-red-400' : ''}`}
            >
              <option value="">{bn ? 'ছাত্র নির্বাচন করুন' : 'Select a student'}</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>{bn ? s.nameBn : s.nameEn} ({s.class} - {s.section})</option>
              ))}
            </select>
            {errors.student && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'ছাত্র নির্বাচন করুন' : 'Select a student'}</p>}
            {availableStudents.length === 0 && !existing && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] mt-1">{bn ? 'সকল ছাত্র ইতিমধ্যে বরাদ্দ করা হয়েছে' : 'All students are already assigned'}</p>
            )}
          </div>

          {/* Vehicle */}
          <div>
            <label className={labelCls}>{bn ? 'যানবাহন' : 'Vehicle'}<span className="text-red-400 ml-0.5">*</span></label>
            <select
              value={vehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className={`${selectFieldCls} ${errors.vehicle ? 'border-red-400' : ''}`}
            >
              <option value="">{bn ? 'যানবাহন নির্বাচন করুন' : 'Select a vehicle'}</option>
              {activeVehicles.map((v) => (
                <option key={v.id} value={v.id}>{bn ? v.nameBn : v.name} ({v.registrationNo})</option>
              ))}
            </select>
            {errors.vehicle && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'যানবাহন নির্বাচন করুন' : 'Select a vehicle'}</p>}
          </div>

          {/* Route */}
          <div>
            <label className={labelCls}>{bn ? 'রুট' : 'Route'}<span className="text-red-400 ml-0.5">*</span></label>
            <select
              value={routeId}
              onChange={(e) => handleRouteChange(e.target.value)}
              className={`${selectFieldCls} ${errors.route ? 'border-red-400' : ''}`}
              disabled={!vehicleId}
            >
              <option value="">{bn ? 'রুট নির্বাচন করুন' : 'Select a route'}</option>
              {vehicleRoutes.map((r) => (
                <option key={r.id} value={r.id}>{bn ? r.nameBn : r.name} (৳{r.fare})</option>
              ))}
            </select>
            {errors.route && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'রুট নির্বাচন করুন' : 'Select a route'}</p>}
            {vehicleId && vehicleRoutes.length === 0 && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] mt-1">{bn ? 'এই যানবাহনে কোনো রুট নেই' : 'No routes assigned to this vehicle'}</p>
            )}
          </div>

          {/* Pickup Stop */}
          <div>
            <label className={labelCls}>{bn ? 'বোর্ডিং স্টপ' : 'Pickup Stop'}</label>
            {stopOptions.length > 0 ? (
              <select
                value={pickupStop}
                onChange={(e) => setPickupStop(e.target.value)}
                className={selectFieldCls}
              >
                <option value="">{bn ? 'স্টপ নির্বাচন করুন' : 'Select a stop'}</option>
                {stopOptions.map((stop) => (
                  <option key={stop} value={stop}>{stop}</option>
                ))}
              </select>
            ) : (
              <input
                value={pickupStop}
                onChange={(e) => setPickupStop(e.target.value)}
                className={inputFieldCls}
                placeholder={bn ? 'বোর্ডিং স্টপের নাম' : 'Pickup stop name'}
              />
            )}
          </div>

          {/* Monthly Fare */}
          <div>
            <label className={labelCls}>{bn ? 'মাসিক ভাড়া (৳)' : 'Monthly Fare (৳)'}</label>
            <input
              type="number"
              value={monthlyFare}
              onChange={(e) => setMonthlyFare(e.target.value)}
              className={inputFieldCls}
              min="0"
              placeholder="0"
            />
            {selectedRoute && (
              <p className="text-[0.6875rem] text-[var(--text-muted)] mt-1">
                {bn ? 'রুটের ভাড়া: ৳' : 'Route fare: ৳'}{selectedRoute.fare}
              </p>
            )}
          </div>

          {/* Preview */}
          {assignedStudent && selectedVehicle && (
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
              <div className="text-[0.6875rem] font-semibold text-[var(--text-muted)] uppercase mb-2">{bn ? 'বরাদ্দ পূর্বরূপ' : 'Assignment Preview'}</div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] text-[0.75rem] font-bold">
                  {(assignedStudent.nameEn || '?')[0]}
                </div>
                <div>
                  <div className="text-[0.8125rem] font-medium text-[var(--text-primary)]">{bn ? assignedStudent.nameBn : assignedStudent.nameEn}</div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)]">{assignedStudent.class} - {assignedStudent.section}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-[0.8125rem] font-semibold text-[var(--brand)]">{bn ? selectedVehicle.nameBn : selectedVehicle.name}</div>
                  <div className="text-[0.6875rem] text-[var(--text-secondary)]">{pickupStop || '—'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!studentId || !vehicleId || !routeId}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]"
          >
            <UserPlus size={15} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update') : (bn ? 'বরাদ্দ করুন' : 'Assign Student')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
