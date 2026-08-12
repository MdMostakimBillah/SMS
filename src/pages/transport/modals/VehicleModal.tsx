import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Bus, X, AlertCircle, Check } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTransportStore, type TransportVehicle } from '@/store/transportStore'
import { modalStyleCls, labelCls } from '@/pages/hr/utils'

const inputFieldCls =
  'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30'

interface Props {
  existing?: TransportVehicle | null
  onSaved: () => void
  onClose: () => void
}

export function VehicleModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { addVehicle, updateVehicle, routes } = useTransportStore()

  const [name, setName] = useState(existing?.name || '')
  const [nameBn, setNameBn] = useState(existing?.nameBn || '')
  const [regNo, setRegNo] = useState(existing?.registrationNo || '')
  const [capacity, setCapacity] = useState(existing?.capacity?.toString() || '')
  const [driverName, setDriverName] = useState(existing?.driverName || '')
  const [driverNameBn, setDriverNameBn] = useState(existing?.driverNameBn || '')
  const [driverPhone, setDriverPhone] = useState(existing?.driverPhone || '')
  const [driverDetails, setDriverDetails] = useState(existing?.driverDetails || '')
  const [vehicleDetails, setVehicleDetails] = useState(existing?.vehicleDetails || '')
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>(existing?.routeIds || [])
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const activeRoutes = useMemo(() => routes.filter((r) => r.isActive), [routes])

  const toggleRoute = (id: string) => {
    setSelectedRouteIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))
  }

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!name.trim()) e.name = true
    if (!regNo.trim()) e.regNo = true
    if (!capacity || Number(capacity) <= 0) e.capacity = true
    if (!driverName.trim()) e.driverName = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString().split('T')[0]
    const data: TransportVehicle = {
      id: existing?.id || `TV-${Date.now()}`,
      name: name.trim(),
      nameBn: nameBn.trim() || name.trim(),
      registrationNo: regNo.trim(),
      capacity: Number(capacity) || 0,
      driverName: driverName.trim(),
      driverNameBn: driverNameBn.trim() || driverName.trim(),
      driverPhone: driverPhone.trim(),
      driverDetails: driverDetails.trim(),
      vehicleDetails: vehicleDetails.trim(),
      routeIds: selectedRouteIds,
      isActive: existing?.isActive ?? true,
      createdAt: existing?.createdAt || now,
    }
    if (existing) {
      updateVehicle(existing.id, data)
    } else {
      addVehicle(data)
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative w-full max-w-[38rem] max-h-[92vh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden ${modalStyleCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/25">
              <Bus size={18} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {existing ? (bn ? 'যানবাহন সম্পাদনা' : 'Edit Vehicle') : (bn ? 'নতুন যানবাহন যোগ করুন' : 'Add New Vehicle')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                {existing ? (bn ? 'যানবাহনের তথ্য আপডেট করুন' : 'Update vehicle information') : (bn ? 'যানবাহন ও চালকের তথ্য যোগ করুন' : 'Fill in vehicle and driver details')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[calc(92vh-8rem)]">
          {/* Vehicle Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                <Bus size={12} />
              </div>
              <span className="text-[0.75rem] font-bold text-[var(--text-primary)] uppercase tracking-wider">{bn ? 'যানবাহনের তথ্য' : 'Vehicle Information'}</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{bn ? 'নাম (ইংরেজি)' : 'Name (English)'}<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })) }}
                    className={`${inputFieldCls} ${errors.name ? 'border-red-400' : ''}`}
                    placeholder={bn ? 'যেমন: Bus-01' : 'e.g., Bus-01'}
                  />
                  {errors.name && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'নাম আবশ্যক' : 'Name is required'}</p>}
                </div>
                <div>
                  <label className={labelCls}>{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
                  <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={inputFieldCls} placeholder={bn ? 'যেমন: বাস-০১' : 'e.g., বাস-০১'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{bn ? 'রেজিস্ট্রেশন নম্বর' : 'Registration No'}<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    value={regNo}
                    onChange={(e) => { setRegNo(e.target.value); setErrors((p) => ({ ...p, regNo: false })) }}
                    className={`${inputFieldCls} ${errors.regNo ? 'border-red-400' : ''}`}
                    placeholder={bn ? 'যেমন: ঢাকা মেট্রো গ-১২-৩৪৫৬' : 'e.g., Dhaka Metro Ka-12-3456'}
                  />
                  {errors.regNo && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'রেজিস্ট্রেশন আবশ্যক' : 'Registration is required'}</p>}
                </div>
                <div>
                  <label className={labelCls}>{bn ? 'আসন সংখ্যা' : 'Capacity'}<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => { setCapacity(e.target.value); setErrors((p) => ({ ...p, capacity: false })) }}
                    className={`${inputFieldCls} ${errors.capacity ? 'border-red-400' : ''}`}
                    min="1"
                    placeholder="40"
                  />
                  {errors.capacity && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'আসন সংখ্যা আবশ্যক' : 'Capacity is required'}</p>}
                </div>
              </div>
              <div>
                <label className={labelCls}>{bn ? 'যানবাহনের বিবরণ' : 'Vehicle Details'}</label>
                <textarea
                  value={vehicleDetails}
                  onChange={(e) => setVehicleDetails(e.target.value)}
                  className={`${inputFieldCls} resize-none h-16`}
                  placeholder={bn ? 'মোডেল, বছর, রঙ ইত্যাদি...' : 'Model, year, color, etc...'}
                />
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <span className="text-[0.75rem] font-bold text-[var(--text-primary)] uppercase tracking-wider">{bn ? 'চালকের তথ্য' : 'Driver Information'}</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{bn ? 'চালকের নাম (ইংরেজি)' : 'Driver Name (English)'}<span className="text-red-400 ml-0.5">*</span></label>
                  <input
                    value={driverName}
                    onChange={(e) => { setDriverName(e.target.value); setErrors((p) => ({ ...p, driverName: false })) }}
                    className={`${inputFieldCls} ${errors.driverName ? 'border-red-400' : ''}`}
                    placeholder={bn ? 'চালকের নাম' : 'Driver name'}
                  />
                  {errors.driverName && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'চালকের নাম আবশ্যক' : 'Driver name is required'}</p>}
                </div>
                <div>
                  <label className={labelCls}>{bn ? 'চালকের নাম (বাংলা)' : 'Driver Name (Bengali)'}</label>
                  <input value={driverNameBn} onChange={(e) => setDriverNameBn(e.target.value)} className={inputFieldCls} placeholder={bn ? 'চালকের বাংলা নাম' : 'Driver Bengali name'} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{bn ? 'চালকের ফোন' : 'Driver Phone'}</label>
                <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} className={inputFieldCls} placeholder={bn ? '01XXXXXXXXX' : '01XXXXXXXXX'} />
              </div>
              <div>
                <label className={labelCls}>{bn ? 'চালকের অন্যান্য তথ্য' : 'Driver Other Details'}</label>
                <textarea
                  value={driverDetails}
                  onChange={(e) => setDriverDetails(e.target.value)}
                  className={`${inputFieldCls} resize-none h-16`}
                  placeholder={bn ? 'লাইসেন্স, অভিজ্ঞতা ইত্যাদি...' : 'License, experience, etc...'}
                />
              </div>
            </div>
          </div>

          {/* Routes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <span className="text-[0.75rem] font-bold text-[var(--text-primary)] uppercase tracking-wider">{bn ? 'নির্ধারিত রুট' : 'Assigned Routes'}</span>
              </div>
              {selectedRouteIds.length > 0 && (
                <span className="text-[0.6875rem] text-[var(--brand)] font-medium">{selectedRouteIds.length} {bn ? 'নির্বাচিত' : 'selected'}</span>
              )}
            </div>
            {activeRoutes.length === 0 ? (
              <p className="text-[0.8125rem] text-[var(--text-muted)] py-2">{bn ? 'কোনো রুট তৈরি হয়নি। প্রথমে রুট যোগ করুন।' : 'No routes created yet. Add routes first.'}</p>
            ) : (
              <div className="space-y-2">
                {activeRoutes.map((route) => {
                  const selected = selectedRouteIds.includes(route.id)
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => toggleRoute(route.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left cursor-pointer transition-all duration-200 ${
                        selected
                          ? 'bg-[var(--brand)]/5 border-[var(--brand)]/30 text-[var(--text-primary)]'
                          : 'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand)]/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        selected ? 'bg-[var(--brand)] border-[var(--brand)] text-white' : 'border-[var(--border)] bg-[var(--bg-primary)]'
                      }`}>
                        {selected && <Check size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.8125rem] font-medium">{bn ? route.nameBn : route.name}</div>
                        <div className="text-[0.6875rem] text-[var(--text-muted)] truncate">{bn ? route.stopsBn : route.stops}</div>
                      </div>
                      <div className="text-[0.75rem] font-semibold text-[var(--brand)] shrink-0">৳{route.fare}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !regNo.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Bus size={15} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update Vehicle') : (bn ? 'যানবাহন যোগ করুন' : 'Add Vehicle')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
