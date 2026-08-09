import React, { useState, useRef, useCallback } from 'react'
import {
  Building2,
  Phone,
  Globe,
  MapPin,
  Edit2,
  X,
  Save,
  Check,
  Clock,
  Plus,
  CalendarDays,
  Camera,
  Move,
  Image,
} from 'lucide-react'
import ColorSettings from '@/components/shared/ColorSettings'
import { defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'
import { applyThemeColors } from '@/hooks/useThemeColors'

interface InstitutionTabProps {
  institution: any
  instForm: any
  setInstForm: (fn: (p: any) => any) => void
  editingInst: boolean
  setEditingInst: (v: boolean) => void
  saved: boolean
  expandedMode: 'light' | 'dark' | null
  setExpandedMode: (v: 'light' | 'dark' | null) => void
  newSessionInput: string
  setNewSessionInput: (v: string) => void
  handleSaveInstitution: () => void
  isBn: boolean
}

interface BannerPositionEditorProps {
  banner: string
  position: { x: number; y: number }
  onPositionChange: (pos: { x: number; y: number }) => void
  onUpload: (dataUrl: string) => void
  onRemove: () => void
  isBn: boolean
}

function BannerPositionEditor({ banner, position, onPositionChange, onUpload, onRemove, isBn }: BannerPositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [posStart, setPosStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!banner) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setPosStart({ ...position })
  }, [banner, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100
    const newX = Math.max(-50, Math.min(50, posStart.x + deltaX))
    const newY = Math.max(-50, Math.min(50, posStart.y + deltaY))
    onPositionChange({ x: Math.round(newX), y: Math.round(newY) })
  }, [isDragging, dragStart, posStart, onPositionChange])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!banner) return
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX, y: touch.clientY })
    setPosStart({ ...position })
  }, [banner, position])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return
    const touch = e.touches[0]
    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = ((touch.clientX - dragStart.x) / rect.width) * 100
    const deltaY = ((touch.clientY - dragStart.y) / rect.height) * 100
    const newX = Math.max(-50, Math.min(50, posStart.x + deltaX))
    const newY = Math.max(-50, Math.min(50, posStart.y + deltaY))
    onPositionChange({ x: Math.round(newX), y: Math.round(newY) })
  }, [isDragging, dragStart, posStart, onPositionChange])

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="relative h-40 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        style={{ cursor: banner ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {banner && (
          <img 
            src={banner} 
            alt="Banner" 
            className="w-full h-full object-cover pointer-events-none select-none"
            style={{
              objectPosition: `${50 + position.x}% ${50 + position.y}%`,
              transform: isDragging ? 'scale(1.02)' : 'scale(1)',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
            draggable={false}
          />
        )}
        
        {/* Upload button overlay */}
        {!banner && (
          <div className="absolute inset-0 flex items-center justify-center">
            <label className="flex items-center gap-2 py-2 px-4 rounded-lg bg-black/40 text-white text-sm cursor-pointer hover:bg-black/60 transition-colors">
              <Camera size={16} />
              {isBn ? 'ব্যানার আপলোড করুন' : 'Upload Banner'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) {
                    alert(isBn ? 'ব্যানারের সাইজ সর্বোচ্চ ৫ MB' : 'Banner must be under 5MB')
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = (ev) => onUpload(ev.target?.result as string)
                  reader.readAsDataURL(file)
                }}
              />
            </label>
          </div>
        )}

        {/* Drag indicator */}
        {banner && !isDragging && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 text-white text-[0.625rem] pointer-events-none">
            <Move size={10} />
            {isBn ? 'টেনে সরান' : 'Drag to reposition'}
          </div>
        )}

        {/* Position indicator */}
        {banner && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/50 text-white text-[0.5625rem] pointer-events-none">
            {position.x}, {position.y}
          </div>
        )}
      </div>

      {/* Banner controls */}
      {banner && (
        <div className="absolute top-2 right-2 flex gap-1.5">
          <label className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer">
            <Camera size={12} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 5 * 1024 * 1024) {
                  alert(isBn ? 'ব্যানারের সাইজ সর্বোচ্চ ৫ MB' : 'Banner must be under 5MB')
                  return
                }
                const reader = new FileReader()
                reader.onload = (ev) => onUpload(ev.target?.result as string)
                reader.readAsDataURL(file)
              }}
            />
          </label>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Position reset button */}
      {banner && (position.x !== 0 || position.y !== 0) && (
        <button
          type="button"
          onClick={() => onPositionChange({ x: 0, y: 0 })}
          className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[0.5625rem] bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          {isBn ? 'রিসেট' : 'Reset'}
        </button>
      )}
    </div>
  )
}

export default React.memo(function InstitutionTab({
  institution,
  instForm,
  setInstForm,
  editingInst,
  setEditingInst,
  saved,
  expandedMode,
  setExpandedMode,
  newSessionInput,
  setNewSessionInput,
  handleSaveInstitution,
  isBn,
}: InstitutionTabProps) {
  const inputClass =
    'w-full py-[0.5625rem] px-[0.6875rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none'
  const labelClass = 'text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem] block'

  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Building2 size={18} className="text-[var(--brand)]" />
          {isBn ? 'প্রতিষ্ঠানের তথ্য' : 'Institution Information'}
        </div>
        {!editingInst ? (
          <button
            onClick={() => {
              setInstForm(() => ({ ...institution }))
              setEditingInst(true)
            }}
            className="flex items-center gap-[0.3125rem] py-[0.375rem] px-3 rounded-[0.4375rem] bg-[var(--brand-light)] border border-[var(--brand)] text-[var(--brand)] text-xs cursor-pointer font-[inherit]"
          >
            <Edit2 size={13} />
            {isBn ? 'এডিট' : 'Edit'}
          </button>
        ) : (
          <div className="flex gap-[0.375rem]">
            <button
              onClick={() => {
                setEditingInst(false)
                const currentTheme = useAppStore.getState().theme
                const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                applyThemeColors(isDark ? institution.darkColors : institution.lightColors)
              }}
              className="py-[0.375rem] px-3 rounded-[0.4375rem] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs cursor-pointer font-[inherit]"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              onClick={handleSaveInstitution}
              className="flex items-center gap-[0.3125rem] py-[0.375rem] px-3 rounded-[0.4375rem] bg-[var(--brand)] border-none text-white text-xs font-medium cursor-pointer font-[inherit]"
            >
              {saved ? <Check size={13} /> : <Save size={13} />}
              {saved ? (isBn ? 'সেভ হয়েছে' : 'Saved') : isBn ? 'সেভ' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* View Mode - Landing Page Style */}
      {!editingInst && (
        <div>
          {/* Banner */}
          <div className="relative h-48 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] overflow-hidden">
            {institution.banner && (
              <img 
                src={institution.banner} 
                alt="Banner" 
                className="w-full h-full object-cover"
                style={{
                  objectPosition: `${50 + (institution.bannerPosition?.x || 0)}% ${50 + (institution.bannerPosition?.y || 0)}%`
                }}
              />
            )}
            {!institution.banner && (
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Image size={80} className="text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* Profile Section */}
          <div className="relative px-5 pb-6">
            {/* Logo */}
            <div className="absolute -top-14 left-5">
              <div className="w-28 h-28 rounded-2xl border-4 border-[var(--bg-primary)] bg-[var(--bg-secondary)] shadow-xl overflow-hidden">
                {institution.logo ? (
                  <img src={institution.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--brand-light)]">
                    <Building2 size={36} className="text-[var(--brand)]" />
                  </div>
                )}
              </div>
            </div>

            {/* Institution Info */}
            <div className="pt-16">
              <h2 className="text-base font-bold text-[var(--text-primary)] m-0 leading-tight">{institution.name}</h2>
              <p className="text-[0.6875rem] text-[var(--text-muted)] m-0 mt-0.5">{institution.nameBn}</p>
              
              {institution.brandName && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--brand-light)]">
                  <span className="text-[0.6875rem] font-semibold text-[var(--brand)]">{isBn ? 'ব্র্যান্ড' : 'Brand'}: {institution.brandName}</span>
                </div>
              )}
              
              {institution.motto && (
                <p className="text-[0.6875rem] text-[var(--text-muted)] italic m-0 mt-1.5">
                  "{institution.motto}"{institution.mottoBn ? ` / "${institution.mottoBn}"` : ''}
                </p>
              )}

              {/* Contact Info - Full Width */}
              <div className="mt-4 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {institution.phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[var(--brand-light)] flex items-center justify-center shrink-0">
                        <Phone size={14} className="text-[var(--brand)]" />
                      </div>
                      <div>
                        <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ফোন' : 'Phone'}</div>
                        <div className="text-xs font-semibold text-[var(--text-primary)]">{institution.phone}</div>
                        {institution.eiin && <div className="text-[0.625rem] text-[var(--text-muted)]">EIIN: {institution.eiin}</div>}
                      </div>
                    </div>
                  )}
                  {institution.email && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[var(--brand-light)] flex items-center justify-center shrink-0">
                        <Globe size={14} className="text-[var(--brand)]" />
                      </div>
                      <div>
                        <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ইমেইল / ওয়েবসাইট' : 'Email / Website'}</div>
                        <div className="text-xs font-semibold text-[var(--text-primary)]">{institution.email}</div>
                        {institution.website && <div className="text-[0.625rem] text-[var(--text-muted)]">{institution.website}</div>}
                      </div>
                    </div>
                  )}
                  {institution.address && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[var(--brand-light)] flex items-center justify-center shrink-0">
                        <MapPin size={14} className="text-[var(--brand)]" />
                      </div>
                      <div>
                        <div className="text-[0.625rem] text-[var(--text-muted)]">{isBn ? 'ঠিকানা' : 'Address'}</div>
                        <div className="text-xs font-semibold text-[var(--text-primary)]">{institution.address}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Cards - Full Width */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {/* Schedule Card */}
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--brand-light)] flex items-center justify-center">
                      <Clock size={12} className="text-[var(--brand)]" />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{isBn ? 'সময়সূচি' : 'Schedule'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-[var(--bg-primary)]">
                      <div className="text-[0.625rem] text-[var(--text-muted)] mb-0.5">{isBn ? 'শুরু' : 'Start'}</div>
                      <div className="text-sm font-bold text-[var(--brand)]">{institution.startTime}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-primary)]">
                      <div className="text-[0.625rem] text-[var(--text-muted)] mb-0.5">{isBn ? 'শেষ' : 'End'}</div>
                      <div className="text-sm font-bold text-[var(--brand)]">{institution.endTime}</div>
                    </div>
                    {(institution.breaks || []).map((brk: any) => (
                      <div key={brk.id} className="p-2 rounded-lg bg-[var(--bg-primary)]">
                        <div className="text-[0.625rem] text-[var(--text-muted)] mb-0.5">{brk.label}</div>
                        <div className="text-xs font-bold text-[var(--amber)]">{brk.start} - {brk.end}</div>
                      </div>
                    ))}
                    {(institution.breaks || []).length === 0 && (
                      <div className="col-span-2 text-[0.625rem] text-[var(--text-muted)] italic">{isBn ? 'কোনো বিরতি নেই' : 'No breaks'}</div>
                    )}
                  </div>
                </div>

                {/* Session & Subjects Card */}
                <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-[var(--brand-light)] flex items-center justify-center">
                      <CalendarDays size={12} className="text-[var(--brand)]" />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{isBn ? 'একাডেমিক সেশন' : 'Academic Session'}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[var(--brand)]">{institution.currentSession}</span>
                      <span className="text-[0.625rem] text-[var(--text-muted)]">({isBn ? 'বর্তমান' : 'Current'})</span>
                    </div>
                    <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
                      {institution.sessions.length} {isBn ? 'টি সেশন সংরক্ষিত' : 'sessions saved'}
                    </div>
                  </div>
                  {(institution.subjects || []).length > 0 && (
                    <div>
                      <div className="text-[0.625rem] text-[var(--text-muted)] mb-1.5">{isBn ? 'প্রধান বিষয়' : 'Main Subjects'}</div>
                      <div className="flex flex-wrap gap-1">
                        {institution.subjects.map((s: string, i: number) => (
                          <span key={i} className="text-[0.625rem] px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[var(--brand)] font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {editingInst && (
        <>
          {/* Banner Upload with Drag Positioning */}
          <BannerPositionEditor
            banner={instForm.banner}
            position={instForm.bannerPosition || { x: 0, y: 0 }}
            onPositionChange={(pos) => setInstForm((p: any) => ({ ...p, bannerPosition: pos }))}
            onUpload={(dataUrl) => setInstForm((p: any) => ({ ...p, banner: dataUrl, bannerPosition: { x: 0, y: 0 } }))}
            onRemove={() => setInstForm((p: any) => ({ ...p, banner: '', bannerPosition: { x: 0, y: 0 } }))}
            isBn={isBn}
          />

          {/* Logo Upload */}
          <div className="relative px-4">
            <div className="absolute -top-10 left-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-xl border-4 border-[var(--bg-primary)] bg-[var(--bg-secondary)] shadow-lg overflow-hidden">
                  {instForm.logo ? (
                    <img src={instForm.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--brand-light)]">
                      <Building2 size={28} className="text-[var(--brand)]" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[var(--brand)] text-white cursor-pointer hover:scale-110 transition-transform">
                  <Camera size={12} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 2 * 1024 * 1024) {
                        alert(isBn ? 'লোগোর সাইজ সর্বোচ্চ ২ MB' : 'Logo must be under 2MB')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = (ev) => setInstForm((p: any) => ({ ...p, logo: ev.target?.result as string }))
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="px-4 pt-14 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{isBn ? 'প্রতিষ্ঠানের নাম (ইং)' : 'Name (EN)'}</label>
                <input
                  value={instForm.name}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'প্রতিষ্ঠানের নাম (বাং)' : 'Name (BN)'}</label>
                <input
                  value={instForm.nameBn}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, nameBn: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'ব্র্যান্ড নাম' : 'Brand Name'}</label>
                <input
                  value={instForm.brandName || ''}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, brandName: e.target.value }))}
                  className={inputClass}
                  placeholder="EduTech"
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'ফোন' : 'Phone'}</label>
                <input
                  value={instForm.phone}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  value={instForm.email}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'ওয়েবসাইট' : 'Website'}</label>
                <input
                  value={instForm.website}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, website: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'মোটো' : 'Motto'}</label>
                <input
                  value={instForm.motto}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, motto: e.target.value }))}
                  className={inputClass}
                  placeholder={isBn ? 'শিক্ষার আলো ছড়িয়ে দিন' : 'Light of Knowledge'}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'মোটো (বাং)' : 'Motto (BN)'}</label>
                <input
                  value={instForm.mottoBn}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, mottoBn: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>EIIN</label>
                <input
                  value={instForm.eiin}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, eiin: e.target.value }))}
                  className={inputClass}
                  placeholder="123456"
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'প্রধান বিষয়সমূহ (কমা দিয়ে আলাদা করুন)' : 'Main Subjects (comma separated)'}</label>
                <input
                  value={(instForm.subjects || []).join(', ')}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, subjects: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))}
                  className={inputClass}
                  placeholder={isBn ? 'বাংলা, ইংরেজি, গণিত' : 'Bangla, English, Mathematics'}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{isBn ? 'ঠিকানা' : 'Address'}</label>
                <input
                  value={instForm.address}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, address: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'ক্লাস শুরুর সময়' : 'Class Start Time'}</label>
                <input
                  type="time"
                  value={instForm.startTime}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, startTime: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{isBn ? 'ক্লাস শেষের সময়' : 'Class End Time'}</label>
                <input
                  type="time"
                  value={instForm.endTime}
                  onChange={(e) => setInstForm((p: any) => ({ ...p, endTime: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Session/Year */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[0.6875rem] font-medium text-[var(--text-secondary)] m-0">
                  {isBn ? 'একাডেমিক সেশন' : 'Academic Session'}
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={instForm.currentSession}
                    onChange={(e) => setInstForm((p: any) => ({ ...p, currentSession: e.target.value }))}
                    className="flex-1 py-[0.5625rem] px-[0.6875rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none"
                  >
                    {instForm.sessions.map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={newSessionInput}
                    onChange={(e) => setNewSessionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = newSessionInput.trim()
                        if (val && !instForm.sessions.includes(val)) {
                          setInstForm((p: any) => ({ ...p, sessions: [...p.sessions, val].sort(), currentSession: val }))
                          setNewSessionInput('')
                        }
                      }
                    }}
                    className="flex-1 py-[0.5625rem] px-[0.6875rem] rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none focus:border-[var(--brand)]"
                    placeholder={isBn ? 'নতুন সেশন যোগ করুন (Enter চাপুন)' : 'Add new session (press Enter)'}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = newSessionInput.trim()
                      if (val && !instForm.sessions.includes(val)) {
                        setInstForm((p: any) => ({ ...p, sessions: [...p.sessions, val].sort(), currentSession: val }))
                        setNewSessionInput('')
                      }
                    }}
                    className="py-[0.5625rem] px-3 rounded-lg bg-[var(--brand)] border-none text-white text-[0.75rem] font-medium cursor-pointer font-[inherit] shrink-0"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {instForm.sessions.map((s: string) => (
                    <span
                      key={s}
                      className={`inline-flex items-center gap-1 text-[0.6875rem] py-1 px-2.5 rounded-md font-medium transition-all ${instForm.currentSession === s ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'}`}
                    >
                      <span className="cursor-pointer" onClick={() => setInstForm((p: any) => ({ ...p, currentSession: s }))}>
                        {s}
                      </span>
                      {instForm.sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                isBn
                                  ? `"${s}" সেশন মুছে ফেলতে চান? এই সেশনের সব ক্লাস ও রুটিন মুছে যাবে।`
                                  : `Delete session "${s}"? All classes and routines for this session will be removed.`
                              )
                            ) {
                              setInstForm((p: any) => {
                                const newSessions = p.sessions.filter((x: string) => x !== s)
                                const newCurrent = p.currentSession === s ? newSessions[0] || '' : p.currentSession
                                return { ...p, sessions: newSessions, currentSession: newCurrent }
                              })
                            }
                          }}
                          className={`p-0 rounded-full border-none cursor-pointer flex items-center justify-center w-[0.875rem] h-[0.875rem] transition-all ${instForm.currentSession === s ? 'bg-white/30 text-white hover:bg-white/50' : 'bg-[var(--red-light)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white'}`}
                        >
                          <X size={9} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Break Times */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-[1.75rem] h-[1.75rem] rounded-[0.4375rem] bg-[var(--amber-light)] flex items-center justify-center">
                    <Clock size={14} className="text-[var(--amber)]" />
                  </div>
                  <div>
                    <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                      {isBn ? 'বিরতির সময়' : 'Break Times'}
                    </div>
                    <div className="text-[0.625rem] text-[var(--text-muted)]">
                      {instForm.breaks.length} {isBn ? 'টি বিরতি সেট করা আছে' : 'breaks configured'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setInstForm((p: any) => ({
                      ...p,
                      breaks: [
                        ...p.breaks,
                        {
                          id: `BRK-${Date.now()}`,
                          label: `${isBn ? 'বিরতি' : 'Break'} ${p.breaks.length + 1}`,
                          start: '12:00',
                          end: '12:30',
                        },
                      ],
                    }))
                  }
                  className="flex items-center gap-[0.3125rem] py-[0.375rem] px-3 rounded-[0.4375rem] bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.6875rem] font-medium cursor-pointer font-[inherit]"
                >
                  <Plus size={12} />
                  {isBn ? 'বিরতি যোগ' : 'Add Break'}
                </button>
              </div>

              {instForm.breaks.length === 0 ? (
                <div className="p-4 text-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]">
                  <Clock size={24} className="mx-auto mb-2 text-[var(--text-muted)] opacity-40" />
                  <p className="text-[0.75rem] text-[var(--text-muted)] m-0">
                    {isBn ? 'কোনো বিরতি সেট করা হয়নি।' : 'No breaks configured.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {instForm.breaks.map((brk: any, i: number) => (
                    <div
                      key={brk.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
                    >
                      <div className="w-6 h-6 rounded bg-[var(--amber-light)] flex items-center justify-center shrink-0">
                        <span className="text-[0.625rem] font-bold text-[var(--amber)]">B{i + 1}</span>
                      </div>
                      <input
                        value={brk.label}
                        onChange={(e) => {
                          const breaks = [...instForm.breaks]
                          breaks[i] = { ...brk, label: e.target.value }
                          setInstForm((p: any) => ({ ...p, breaks }))
                        }}
                        className="w-20 py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] font-medium outline-none"
                        placeholder={isBn ? 'নাম' : 'Label'}
                      />
                      <input
                        type="time"
                        value={brk.start}
                        onChange={(e) => {
                          const breaks = [...instForm.breaks]
                          breaks[i] = { ...brk, start: e.target.value }
                          setInstForm((p: any) => ({ ...p, breaks }))
                        }}
                        className="py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] outline-none"
                      />
                      <span className="text-xs text-[var(--text-muted)]">→</span>
                      <input
                        type="time"
                        value={brk.end}
                        onChange={(e) => {
                          const breaks = [...instForm.breaks]
                          breaks[i] = { ...brk, end: e.target.value }
                          setInstForm((p: any) => ({ ...p, breaks }))
                        }}
                        className="py-1 px-2 rounded border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] outline-none"
                      />
                      <span className="text-[0.625rem] text-[var(--amber)] font-medium bg-[var(--amber-light)] py-0.5 px-1.5 rounded ml-auto">
                        {(() => {
                          const [sh, sm] = brk.start.split(':').map(Number)
                          const [eh, em] = brk.end.split(':').map(Number)
                          return eh * 60 + em - (sh * 60 + sm)
                        })()} {isBn ? 'মিনিট' : 'min'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInstForm((p: any) => ({ ...p, breaks: p.breaks.filter((b: any) => b.id !== brk.id) }))}
                        className="p-1 rounded bg-[var(--red-light)] border border-[var(--red)] cursor-pointer text-[var(--red)]"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color Settings */}
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  {isBn ? 'থিম রঙ' : 'Theme Colors'}
                </div>
                <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
                  {isBn ? 'লাইট ও ডার্ক মোডের জন্য আলাদাভাবে রঙ সেট করুন' : 'Set colors separately for Light and Dark mode'}
                </div>
              </div>
              <div className="divide-y divide-[var(--border)]">
                <div>
                  <button
                    onClick={() => setExpandedMode(expandedMode === 'light' ? null : 'light')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500"></span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {isBn ? 'লাইট মোড' : 'Light Mode'}
                      </span>
                    </div>
                    <span className="text-[var(--text-muted)] text-xs">
                      {expandedMode === 'light' ? '▾' : '▸'}
                    </span>
                  </button>
                  {expandedMode === 'light' && (
                    <div className="px-3 pb-3">
                      <ColorSettings
                        colors={instForm.lightColors || defaultThemeColors}
                        onChange={(c) => setInstForm((p: any) => ({ ...p, lightColors: c }))}
                        isBn={isBn}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => setExpandedMode(expandedMode === 'dark' ? null : 'dark')}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-gray-800 border border-gray-600"></span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {isBn ? 'ডার্ক মোড' : 'Dark Mode'}
                      </span>
                    </div>
                    <span className="text-[var(--text-muted)] text-xs">
                      {expandedMode === 'dark' ? '▾' : '▸'}
                    </span>
                  </button>
                  {expandedMode === 'dark' && (
                    <div className="px-3 pb-3">
                      <ColorSettings
                        colors={instForm.darkColors || defaultThemeColorsDark}
                        onChange={(c) => setInstForm((p: any) => ({ ...p, darkColors: c }))}
                        isBn={isBn}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
})