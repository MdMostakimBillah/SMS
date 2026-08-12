import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, X, AlertCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useTransportStore, type TransportRoute } from '@/store/transportStore'
import { modalStyleCls, labelCls } from '@/pages/hr/utils'

const inputFieldCls =
  'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30'

interface Props {
  existing?: TransportRoute | null
  onSaved: () => void
  onClose: () => void
}

export function RouteModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { addRoute, updateRoute } = useTransportStore()

  const [name, setName] = useState(existing?.name || '')
  const [nameBn, setNameBn] = useState(existing?.nameBn || '')
  const [stops, setStops] = useState(existing?.stops || '')
  const [stopsBn, setStopsBn] = useState(existing?.stopsBn || '')
  const [distance, setDistance] = useState(existing?.distance || '')
  const [fare, setFare] = useState(existing?.fare?.toString() || '')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!name.trim()) e.name = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString().split('T')[0]
    const data: TransportRoute = {
      id: existing?.id || `TR-${Date.now()}`,
      name: name.trim(),
      nameBn: nameBn.trim() || name.trim(),
      stops: stops.trim(),
      stopsBn: stopsBn.trim() || stops.trim(),
      distance: distance.trim(),
      fare: Number(fare) || 0,
      isActive: existing?.isActive ?? true,
      createdAt: existing?.createdAt || now,
    }
    if (existing) {
      updateRoute(existing.id, data)
    } else {
      addRoute(data)
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative w-full max-w-[32rem] max-h-[92vh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden ${modalStyleCls}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/25">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {existing ? (bn ? 'রুট সম্পাদনা' : 'Edit Route') : (bn ? 'নতুন রুট যোগ করুন' : 'Add New Route')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                {existing ? (bn ? 'রুটের তথ্য আপডেট করুন' : 'Update route information') : (bn ? 'নতুন রুটের তথ্য যোগ করুন' : 'Fill in the route details')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(92vh-8rem)]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'নাম (ইংরেজি)' : 'Name (English)'}<span className="text-red-400 ml-0.5">*</span></label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: false })) }}
                className={`${inputFieldCls} ${errors.name ? 'border-red-400' : ''}`}
                placeholder={bn ? 'যেমন: Mirpur to School' : 'e.g., Mirpur to School'}
              />
              {errors.name && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'নাম আবশ্যক' : 'Name is required'}</p>}
            </div>
            <div>
              <label className={labelCls}>{bn ? 'নাম (বাংলা)' : 'Name (Bengali)'}</label>
              <input value={nameBn} onChange={(e) => setNameBn(e.target.value)} className={inputFieldCls} placeholder={bn ? 'যেমন: মিরপুর থেকে স্কুল' : 'e.g., মিরপুর থেকে স্কুল'} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{bn ? 'স্টপ/গন্তব্য (ইংরেজি)' : 'Stops/Destinations (English)'}</label>
            <textarea
              value={stops}
              onChange={(e) => setStops(e.target.value)}
              className={`${inputFieldCls} resize-none h-20`}
              placeholder={bn ? 'কমা দিয়ে আলাদা করুন: Stop 1, Stop 2, Stop 3' : 'Comma separated: Stop 1, Stop 2, Stop 3'}
            />
          </div>

          <div>
            <label className={labelCls}>{bn ? 'স্টপ/গন্তব্য (বাংলা)' : 'Stops/Destinations (Bengali)'}</label>
            <textarea
              value={stopsBn}
              onChange={(e) => setStopsBn(e.target.value)}
              className={`${inputFieldCls} resize-none h-20`}
              placeholder={bn ? 'কমা দিয়ে আলাদা করুন: স্টপ ১, স্টপ ২, স্টপ ৩' : 'Comma separated: স্টপ ১, স্টপ ২, স্টপ ৩'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{bn ? 'দূরত্ব' : 'Distance'}</label>
              <input value={distance} onChange={(e) => setDistance(e.target.value)} className={inputFieldCls} placeholder={bn ? 'যেমন: 5 km' : 'e.g., 5 km'} />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'মাসিক ভাড়া (৳)' : 'Monthly Fare (৳)'}</label>
              <input type="number" value={fare} onChange={(e) => setFare(e.target.value)} className={inputFieldCls} min="0" placeholder="0" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]"
          >
            <MapPin size={15} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update Route') : (bn ? 'রুট যোগ করুন' : 'Add Route')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
