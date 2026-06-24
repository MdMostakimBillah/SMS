import React from 'react'
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
  BookOpen,
  Camera,
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
  isMobile: boolean
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
  isMobile,
}: InstitutionTabProps) {
  const inputClass =
    'w-full py-[0.5625rem] px-[0.6875rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none'
  const labelClass = 'text-[0.6875rem] font-medium text-[var(--text-secondary)] mb-[0.3125rem] block'

  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 mb-[0.875rem]">
      <div className="flex items-center justify-between mb-[0.875rem] pb-2 border-b border-[var(--border)]">
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

      {/* View mode */}
      {!editingInst && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ padding: '0.625rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
            <div
              style={{
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Building2 size={11} />
              {isBn ? 'প্রতিষ্ঠানের নাম' : 'Institution Name'}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{institution.name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{institution.nameBn}</div>
            {institution.brandName && (
              <div style={{ fontSize: '0.625rem', color: 'var(--brand)', fontWeight: 600, marginTop: '0.25rem' }}>
                {isBn ? 'ব্র্যান্ড' : 'Brand'}: {institution.brandName}
              </div>
            )}
            {institution.motto && (
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                "{institution.motto}"{institution.mottoBn ? ` / "${institution.mottoBn}"` : ''}
              </div>
            )}
          </div>
          {institution.logo && (
            <div style={{ padding: '0.625rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={institution.logo} alt="Logo" className="w-20 h-20 rounded-lg object-cover" />
            </div>
          )}
          <div style={{ padding: '0.625rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
            <div
              style={{
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Phone size={11} />
              {isBn ? 'ফোন' : 'Phone'}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{institution.phone}</div>
            {institution.eiin && (
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>EIIN: {institution.eiin}</div>
            )}
          </div>
          <div style={{ padding: '0.625rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
            <div
              style={{
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Globe size={11} />
              Email / {isBn ? 'ওয়েবসাইট' : 'Website'}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{institution.email}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{institution.website}</div>
          </div>
          <div style={{ padding: '0.625rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
            <div
              style={{
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <MapPin size={11} />
              {isBn ? 'ঠিকানা' : 'Address'}
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{institution.address}</div>
          </div>
          {(institution.subjects || []).length > 0 && (
            <div style={{ padding: '0.625rem', borderRadius: '0.5rem', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <BookOpen size={11} />
                {isBn ? 'প্রধান বিষয়' : 'Main Subjects'}
              </div>
              <div className="flex flex-wrap gap-1">
                {institution.subjects.map((s: string, i: number) => (
                  <span key={i} className="text-[0.625rem] px-2 py-0.5 rounded-full bg-[var(--brand-light)] text-[var(--brand)] font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
          <div
            style={{
              padding: '0.625rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              gridColumn: isMobile ? 'auto' : '1 / -1',
            }}
          >
            <div
              style={{
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                marginBottom: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Clock size={11} />
              {isBn ? 'সময়সূচি' : 'Schedule'}
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{isBn ? 'শুরু' : 'Start'}:</span>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--brand)',
                    background: 'var(--brand-light)',
                    padding: '3px 8px',
                    borderRadius: '0.3125rem',
                  }}
                >
                  {institution.startTime}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{isBn ? 'শেষ' : 'End'}:</span>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--brand)',
                    background: 'var(--brand-light)',
                    padding: '3px 8px',
                    borderRadius: '0.3125rem',
                  }}
                >
                  {institution.endTime}
                </span>
              </div>
              {(institution.breaks || []).map((brk: any) => (
                <div key={brk.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{brk.label}:</span>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--amber)',
                      background: 'var(--amber-light)',
                      padding: '3px 8px',
                      borderRadius: '0.3125rem',
                    }}
                  >
                    {brk.start} - {brk.end}
                  </span>
                </div>
              ))}
              {(institution.breaks || []).length === 0 && (
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {isBn ? 'কোনো বিরতি নেই' : 'No breaks'}
                </span>
              )}
            </div>
          </div>
          {/* Session/Year */}
          <div
            style={{
              padding: '0.625rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-secondary)',
              gridColumn: isMobile ? 'auto' : '1 / -1',
            }}
          >
            <div
              style={{
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                marginBottom: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <CalendarDays size={11} />
              {isBn ? 'একাডেমিক সেশন' : 'Academic Session'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--brand)',
                  background: 'var(--brand-light)',
                  padding: '4px 12px',
                  borderRadius: '0.375rem',
                }}
              >
                {institution.currentSession}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{isBn ? 'বর্তমান সেশন' : 'Current Session'}</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>·</span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {institution.sessions.length} {isBn ? 'টি সেশন সংরক্ষিত' : 'sessions saved'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit mode */}
      {editingInst && (
        <>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.625rem' }}>
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
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
            <label className={labelClass}>{isBn ? 'প্রধান বিষয়সমূহ (কমা দিয়ে আলাদা করুন)' : 'Main Subjects (comma separated)'}</label>
            <input
              value={(instForm.subjects || []).join(', ')}
              onChange={(e) => setInstForm((p: any) => ({ ...p, subjects: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }))}
              className={inputClass}
              placeholder={isBn ? 'বাংলা, ইংরেজি, গণিত' : 'Bangla, English, Mathematics'}
            />
          </div>
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
            <label className={labelClass}>{isBn ? 'লোগো' : 'Logo'}</label>
            <div className="flex items-center gap-3">
              {instForm.logo && (
                <img src={instForm.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-[var(--border)]" />
              )}
              <label className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--bg-secondary)] cursor-pointer hover:border-[var(--brand)] transition-colors">
                <Camera size={16} className="text-[var(--text-muted)]" />
                <span className="text-[0.75rem] text-[var(--text-muted)]">{instForm.logo ? (isBn ? 'লোগো পরিবর্তন করুন' : 'Change Logo') : (isBn ? 'লোগো আপলোড করুন' : 'Upload Logo')}</span>
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
              {instForm.logo && (
                <button
                  type="button"
                  onClick={() => setInstForm((p: any) => ({ ...p, logo: '' }))}
                  className="py-2 px-3 rounded-lg bg-[var(--red-light)] border border-[var(--red)] text-[var(--red)] text-[0.75rem] font-medium cursor-pointer font-[inherit]"
                >
                  {isBn ? 'মুছুন' : 'Remove'}
                </button>
              )}
            </div>
          </div>
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
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
          {/* Session/Year */}
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
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
                    <option key={s} value={s}>
                      {s}
                    </option>
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

          {/* Break Times - Redesigned */}
          <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-[1.75rem] h-[1.75rem] rounded-[0.4375rem] bg-[var(--amber-light)] flex items-center justify-center">
                  <Clock size={14} className="text-[var(--amber)]" />
                </div>
                <div>
                  <label className="text-[0.8125rem] font-semibold text-[var(--text-primary)] m-0">
                    {isBn ? 'বিরতির সময়' : 'Break Times'}
                  </label>
                  <p className="text-[0.625rem] text-[var(--text-muted)] m-0">
                    {instForm.breaks.length} {isBn ? 'টি বিরতি সেট করা আছে' : 'breaks configured'}
                  </p>
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
                className="flex items-center gap-[0.3125rem] py-[0.375rem] px-3 rounded-[0.4375rem] bg-[var(--green-light)] border border-[var(--green)] text-[var(--green)] text-[0.6875rem] font-medium cursor-pointer font-[inherit] transition-all duration-150 hover:shadow-sm"
              >
                <Plus size={12} />
                {isBn ? 'বিরতি যোগ' : 'Add Break'}
              </button>
            </div>

            {instForm.breaks.length === 0 ? (
              <div className="p-4 text-center rounded-[0.625rem] border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]">
                <Clock size={24} className="mx-auto mb-2 text-[var(--text-muted)] opacity-40" />
                <p className="text-[0.75rem] text-[var(--text-muted)] m-0">
                  {isBn
                    ? 'কোনো বিরতি সেট করা হয়নি। "বিরতি যোগ" বাটনে ক্লিক করুন।'
                    : 'No breaks configured. Click "Add Break" to get started.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[0.5rem]">
                {instForm.breaks.map((brk: any, i: number) => (
                  <div
                    key={brk.id}
                    className="flex items-center gap-[0.5rem] p-[0.625rem] rounded-[0.625rem] bg-[var(--bg-secondary)] border border-[var(--border)] transition-all duration-150 hover:border-[var(--amber)] hover:shadow-sm group"
                  >
                    <div className="w-[2rem] h-[2rem] rounded-[0.5rem] bg-[var(--amber-light)] flex items-center justify-center flex-shrink-0">
                      <span className="text-[0.6875rem] font-bold text-[var(--amber)]">B{i + 1}</span>
                    </div>
                    <input
                      value={brk.label}
                      onChange={(e) => {
                        const breaks = [...instForm.breaks]
                        breaks[i] = { ...brk, label: e.target.value }
                        setInstForm((p: any) => ({ ...p, breaks }))
                      }}
                      className="w-[5.625rem] py-[0.375rem] px-[0.5rem] rounded-[0.375rem] border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] font-medium font-[inherit] outline-none focus:border-[var(--amber)] transition-colors"
                      placeholder={isBn ? 'নাম' : 'Label'}
                    />
                    <div className="flex items-center gap-[0.25rem]">
                      <input
                        type="time"
                        value={brk.start}
                        onChange={(e) => {
                          const breaks = [...instForm.breaks]
                          breaks[i] = { ...brk, start: e.target.value }
                          setInstForm((p: any) => ({ ...p, breaks }))
                        }}
                        className="py-[0.375rem] px-[0.5rem] rounded-[0.375rem] border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none focus:border-[var(--amber)] transition-colors"
                      />
                      <span className="text-[0.6875rem] font-medium text-[var(--text-muted)]">→</span>
                      <input
                        type="time"
                        value={brk.end}
                        onChange={(e) => {
                          const breaks = [...instForm.breaks]
                          breaks[i] = { ...brk, end: e.target.value }
                          setInstForm((p: any) => ({ ...p, breaks }))
                        }}
                        className="py-[0.375rem] px-[0.5rem] rounded-[0.375rem] border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] font-[inherit] outline-none focus:border-[var(--amber)] transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-[0.25rem] ml-auto opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="text-[0.625rem] text-[var(--amber)] font-medium bg-[var(--amber-light)] py-[0.125rem] px-[0.375rem] rounded-[0.25rem]">
                        {(() => {
                          const [sh, sm] = brk.start.split(':').map(Number)
                          const [eh, em] = brk.end.split(':').map(Number)
                          return eh * 60 + em - (sh * 60 + sm)
                        })()}{' '}
                        {isBn ? 'মিনিট' : 'min'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInstForm((p: any) => ({ ...p, breaks: p.breaks.filter((b: any) => b.id !== brk.id) }))}
                        className="p-[0.3125rem] rounded-[0.375rem] bg-[var(--red-light)] border border-[var(--red)] cursor-pointer text-[var(--red)] transition-all duration-150 hover:bg-[var(--red)] hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Color Settings */}
        <div className="mt-4 border border-[var(--border)] rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              {isBn ? 'থিম রঙ' : 'Theme Colors'}
            </div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
              {isBn ? 'লাইট ও ডার্ক মোডের জন্য আলাদাভাবে রঙ সেট করুন' : 'Set colors separately for Light and Dark mode'}
            </div>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {/* Light Mode */}
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
            {/* Dark Mode */}
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
        </>
      )}
    </div>
  )
})
