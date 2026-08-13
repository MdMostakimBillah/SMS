import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Home, X, AlertCircle } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useHostelStore, type HostelRoom } from '@/store/hostelStore'
import { labelCls } from '@/pages/hr/utils'

const inputFieldCls =
  'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 hover:border-[var(--brand)]/30'

interface Props {
  existing?: HostelRoom | null
  onSaved: () => void
  onClose: () => void
}

export function RoomModal({ existing, onSaved, onClose }: Props) {
  const bn = useBn()
  const { addRoom, updateRoom } = useHostelStore()

  const [roomNumber, setRoomNumber] = useState(existing?.roomNumber || '')
  const [floor, setFloor] = useState(existing?.floor || '')
  const [capacity, setCapacity] = useState(existing?.capacity?.toString() || '')
  const [monthlyRent, setMonthlyRent] = useState(existing?.monthlyRent?.toString() || '')
  const [amenities, setAmenities] = useState(existing?.amenities || '')
  const [amenitiesBn, setAmenitiesBn] = useState(existing?.amenitiesBn || '')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!roomNumber.trim()) e.roomNumber = true
    if (!capacity || Number(capacity) < 1) e.capacity = true
    if (!monthlyRent || Number(monthlyRent) < 0) e.monthlyRent = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString().split('T')[0]
    const data: HostelRoom = {
      id: existing?.id || `HR-${Date.now()}`,
      name: `Room ${roomNumber.trim()}`,
      nameBn: `রুম ${roomNumber.trim()}`,
      roomNumber: roomNumber.trim(),
      floor: floor.trim(),
      capacity: Number(capacity),
      monthlyRent: Number(monthlyRent) || 0,
      amenities: amenities.trim(),
      amenitiesBn: amenitiesBn.trim() || amenities.trim(),
      isActive: existing?.isActive ?? true,
      createdAt: existing?.createdAt || now,
    }
    if (existing) {
      updateRoom(existing.id, data)
    } else {
      addRoom(data)
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-[32rem] max-h-[92vh] bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden [animation:modalPopIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[var(--brand)]/5 to-[var(--brand)]/10 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/25">
              <Home size={18} />
            </div>
            <div>
              <h3 className="text-[1rem] font-bold text-[var(--text-primary)]">
                {existing ? (bn ? 'রুম আপডেট' : 'Update Room') : (bn ? 'নতুন রুম যোগ করুন' : 'Add New Room')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-0.5">
                {existing ? (bn ? 'রুমের তথ্য আপডেট করুন' : 'Update room details') : (bn ? 'হোস্টেলে নতুন রুম যোগ করুন' : 'Add a new room to the hostel')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[calc(92vh-8rem)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{bn ? 'রুম নম্বর' : 'Room Number'}<span className="text-red-400 ml-0.5">*</span></label>
              <input
                value={roomNumber}
                onChange={(e) => { setRoomNumber(e.target.value); setErrors((p) => ({ ...p, roomNumber: false })) }}
                className={`${inputFieldCls} ${errors.roomNumber ? 'border-red-400' : ''}`}
                placeholder={bn ? 'যেমন: A-101' : 'e.g. A-101'}
              />
              {errors.roomNumber && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'রুম নম্বর দিন' : 'Enter room number'}</p>}
            </div>
            <div>
              <label className={labelCls}>{bn ? 'তলা' : 'Floor'}</label>
              <input
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className={inputFieldCls}
                placeholder={bn ? 'যেমন: ১ম তলা' : 'e.g. 1st Floor'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{bn ? 'আসন সংখ্যা' : 'Bed Capacity'}<span className="text-red-400 ml-0.5">*</span></label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => { setCapacity(e.target.value); setErrors((p) => ({ ...p, capacity: false })) }}
                className={`${inputFieldCls} ${errors.capacity ? 'border-red-400' : ''}`}
                min="1"
                placeholder="0"
              />
              {errors.capacity && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'আসন সংখ্যা দিন' : 'Enter bed capacity'}</p>}
            </div>
            <div>
              <label className={labelCls}>{bn ? 'মাসিক ভাড়া (৳)' : 'Monthly Rent (৳)'}<span className="text-red-400 ml-0.5">*</span></label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => { setMonthlyRent(e.target.value); setErrors((p) => ({ ...p, monthlyRent: false })) }}
                className={`${inputFieldCls} ${errors.monthlyRent ? 'border-red-400' : ''}`}
                min="0"
                placeholder="0"
              />
              {errors.monthlyRent && <p className="text-[0.6875rem] text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={10} />{bn ? 'ভাড়া দিন' : 'Enter rent amount'}</p>}
            </div>
          </div>

          <div>
            <label className={labelCls}>{bn ? 'সুবিধা (ইংরেজি)' : 'Amenities (English)'}</label>
            <input
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              className={inputFieldCls}
              placeholder={bn ? 'যেমন: Fan, Wardrobe, Study Table' : 'e.g. Fan, Wardrobe, Study Table'}
            />
          </div>
          <div>
            <label className={labelCls}>{bn ? 'সুবিধা (বাংলা)' : 'Amenities (Bengali)'}</label>
            <input
              value={amenitiesBn}
              onChange={(e) => setAmenitiesBn(e.target.value)}
              className={inputFieldCls}
              placeholder={bn ? 'যেমন: পাখা, আলমারি, পড়ার টেবিল' : 'e.g. পাখা, আলমারি, পড়ার টেবিল'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center gap-3 px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border)]">
          <button onClick={onClose} className="flex-1 py-3 px-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[0.8125rem] font-semibold cursor-pointer font-[inherit] hover:bg-[var(--bg-tertiary)] transition-colors">
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!roomNumber.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--brand)] text-white text-[0.8125rem] font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--brand)]/25 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Home size={15} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update') : (bn ? 'রুম যোগ করুন' : 'Add Room')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
