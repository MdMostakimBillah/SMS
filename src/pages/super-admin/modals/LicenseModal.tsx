import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Clock, Shield, HardDrive, RefreshCw, Check, Calendar } from 'lucide-react'
import { useSuperAdminStore, PACKAGES, type Institution, type InstitutionStatus } from '@/store/superAdminStore'
import { authApi } from '@/lib/api'

interface LicenseModalProps {
  isOpen: boolean
  onClose: () => void
  inst: Institution
  isBn: boolean
  onSaved: (updated: Partial<Institution>) => void
}

export function LicenseModal({ isOpen, onClose, inst, isBn, onSaved }: LicenseModalProps) {
  if (!isOpen) return null

  const storePackages = useSuperAdminStore((s) => s.packages)
  const packages = (storePackages && storePackages.length > 0) ? storePackages : PACKAGES

  const [status, setStatus] = useState<InstitutionStatus>(inst.status)
  const [packageName, setPackageName] = useState<string>(inst.package.name)
  const [storageMode, setStorageMode] = useState<string>(inst.storageMode || 'cloud')
  const [serverUrl, setServerUrl] = useState<string>(inst.serverUrl || '')
  const [folderName, setFolderName] = useState<string>(inst.folderName || '')
  
  // Calculate default expiration or parse existing
  const initialDate = inst.expiresAt ? inst.expiresAt.split('T')[0] : ''
  const [expiresAt, setExpiresAt] = useState<string>(initialDate)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddDays = (days: number) => {
    const base = expiresAt ? new Date(expiresAt) : new Date()
    // If base date is in the past, start from today
    const start = base.getTime() < Date.now() ? new Date() : base
    start.setDate(start.getDate() + days)
    setExpiresAt(start.toISOString().split('T')[0])
  }

  const handleLifetime = () => {
    // 10 years in the future
    const future = new Date()
    future.setFullYear(future.getFullYear() + 10)
    setExpiresAt(future.toISOString().split('T')[0])
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const selectedPkg = packages.find((p) => p.name.toLowerCase() === packageName.toLowerCase()) || inst.package
      
      const payload = {
        status,
        plan: packageName.toLowerCase(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        storageMode,
        serverUrl,
        folderName,
        maxStudents: selectedPkg.maxStudents,
        maxTeachers: selectedPkg.maxTeachers,
      }

      await authApi.updateSchool(inst.id, payload)

      onSaved({
        status,
        package: selectedPkg,
        expiresAt,
        storageMode,
        serverUrl,
        folderName,
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 700)
    } catch (err: any) {
      setError(err?.message || (isBn ? 'সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to update license'))
    } finally {
      setSaving(false)
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--brand)]/15 text-[var(--brand)]">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {isBn ? 'লাইসেন্স ও সাবস্ক্রিপশন নিয়ন্ত্রণ' : 'License & Subscription Control'}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)] truncate max-w-[280px]">
                {isBn ? inst.nameBn : inst.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] cursor-pointer border-none bg-transparent transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {error}
            </div>
          )}

          {/* Status Selection */}
          <div>
            <label className="block text-[0.75rem] font-semibold text-[var(--text-primary)] mb-2">
              {isBn ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'active', labelEn: 'Active', labelBn: 'সক্রিয়', color: 'text-green-500 border-green-500/30 bg-green-500/5' },
                { key: 'trial', labelEn: 'Trial', labelBn: 'ট্রায়াল', color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
                { key: 'suspended', labelEn: 'Suspended', labelBn: 'বন্ধ', color: 'text-red-500 border-red-500/30 bg-red-500/5' },
                { key: 'inactive', labelEn: 'Inactive', labelBn: 'নিষ্ক্রিয়', color: 'text-gray-400 border-gray-400/30 bg-gray-400/5' },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key as InstitutionStatus)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    status === s.key
                      ? `${s.color} ring-2 ring-[var(--brand)]`
                      : 'border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface)] hover:border-[var(--border-2)]'
                  }`}
                >
                  {isBn ? s.labelBn : s.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Package Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[0.75rem] font-semibold text-[var(--text-primary)]">
                {isBn ? 'প্যাকেজ / প্ল্যান' : 'Package / Plan'}
              </label>
              {(storageMode === 'local_computer' || storageMode === 'local_server') && (
                <span className="text-[0.625rem] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {isBn ? 'সিস্টেম ব্যবহারের প্যাকেজ সাজেস্টেড' : 'System-Use Package Suggested'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {packages.map((pkg) => {
                const isSystem = pkg.hostingType === 'system_only' || pkg.hostingType === 'local_pc' || pkg.hostingType === 'personal_vps'
                const isSelected = packageName.toLowerCase() === pkg.name.toLowerCase()
                return (
                  <button
                    key={pkg.id || pkg.name}
                    type="button"
                    onClick={() => setPackageName(pkg.name)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] ring-1 ring-[var(--brand)]'
                        : isSystem && (storageMode === 'local_computer' || storageMode === 'local_server')
                          ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500'
                          : 'border-[var(--border)] text-[var(--text-secondary)] bg-[var(--surface)] hover:border-[var(--border-2)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold truncate">{isBn ? pkg.nameBn : pkg.name}</span>
                      {isSystem ? (
                        <span className="px-1.5 py-0.2 rounded text-[0.5625rem] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                          {isBn ? 'সিস্টেম' : 'System'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[0.5625rem] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                          {isBn ? 'ক্লাউড' : 'Cloud'}
                        </span>
                      )}
                    </div>
                    <div className="text-[0.6875rem] font-extrabold text-[var(--text-primary)]">
                      {pkg.price === 0 ? (isBn ? 'ফ্রি' : 'Free') : `৳${pkg.price.toLocaleString()}`}
                      <span className="text-[0.5625rem] font-normal text-[var(--text-muted)] ml-0.5">
                        {pkg.duration === 0 ? (isBn ? '/আজীবন' : '/life') : (isBn ? '/মাস' : '/mo')}
                      </span>
                    </div>
                    <div className="text-[0.5625rem] text-[var(--text-muted)] mt-0.5">
                      {pkg.maxStudents >= 9999 ? (isBn ? 'অসীমিত ছাত্র' : 'Unlimited') : `${pkg.maxStudents} ${isBn ? 'ছাত্র' : 'students'}`}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Expiration & Extension */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[0.75rem] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <Clock size={13} className="text-[var(--brand)]" />
                {isBn ? 'মেয়াদ উত্তীর্ণের তারিখ' : 'Expiration Date'}
              </label>
              {expiresAt && (
                <span className={`text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full ${
                  new Date(expiresAt).getTime() < Date.now()
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-green-500/10 text-green-500'
                }`}>
                  {new Date(expiresAt).getTime() < Date.now()
                    ? (isBn ? 'মেয়াদ শেষ' : 'Expired')
                    : `${Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ${isBn ? 'দিন বাকি' : 'days left'}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2.5">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[0.8125rem] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
                />
              </div>
              {expiresAt && (
                <button
                  type="button"
                  onClick={() => setExpiresAt('')}
                  className="px-2.5 py-2 rounded-xl border border-[var(--border)] text-[0.6875rem] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 cursor-pointer bg-transparent"
                  title={isBn ? 'মেয়াদ বাতিল' : 'Clear expiry'}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Quick Extension Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleAddDays(30)}
                className="px-2.5 py-1.5 rounded-lg text-[0.6875rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] cursor-pointer transition-colors"
              >
                +30 {isBn ? 'দিন' : 'Days'}
              </button>
              <button
                type="button"
                onClick={() => handleAddDays(90)}
                className="px-2.5 py-1.5 rounded-lg text-[0.6875rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] cursor-pointer transition-colors"
              >
                +90 {isBn ? 'দিন' : 'Days'}
              </button>
              <button
                type="button"
                onClick={() => handleAddDays(365)}
                className="px-2.5 py-1.5 rounded-lg text-[0.6875rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] cursor-pointer transition-colors"
              >
                +1 {isBn ? 'বছর' : 'Year'}
              </button>
              <button
                type="button"
                onClick={handleLifetime}
                className="px-2.5 py-1.5 rounded-lg text-[0.6875rem] font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] cursor-pointer transition-colors"
              >
                {isBn ? 'লাইফটাইম (১০ বছর)' : 'Lifetime (10y)'}
              </button>
            </div>
          </div>

          {/* Storage Architecture Mode */}
          <div>
            <label className="block text-[0.75rem] font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
              <HardDrive size={13} className="text-[var(--brand)]" />
              {isBn ? 'স্টোরেজ মডেল (ইনফ্রাস্ট্রাকচার)' : 'Storage Architecture'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              {[
                { key: 'cloud', labelEn: 'EduTech Cloud', labelBn: 'ক্লাউড (সুপাবেস + R2)', desc: 'Managed provider' },
                { key: 'local_computer', labelEn: 'Local Computer', labelBn: 'লোকাল কম্পিউটার (অবসিডিয়ান স্টাইল)', desc: 'JSON files on PC' },
                { key: 'local_server', labelEn: 'Custom VPS/Server', labelBn: 'নিজস্ব সার্ভার / ভিপিএস', desc: 'Self-hosted API' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setStorageMode(m.key)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    storageMode === m.key
                      ? 'border-[var(--brand)] bg-[var(--brand)]/10 ring-1 ring-[var(--brand)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-2)]'
                  }`}
                >
                  <div className={`text-xs font-bold ${storageMode === m.key ? 'text-[var(--brand)]' : 'text-[var(--text-primary)]'}`}>
                    {isBn ? m.labelBn : m.labelEn}
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>

            {storageMode === 'local_server' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="https://api.school-server.com"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
                />
              </div>
            )}

            {storageMode === 'local_computer' && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Folder name (e.g. EduTech_Files)"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] cursor-pointer border-none bg-transparent transition-colors"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={saving || success}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-all cursor-pointer border-none disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                {isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
              </>
            ) : success ? (
              <>
                <Check size={13} className="text-white" />
                {isBn ? 'সফল হয়েছে' : 'Saved!'}
              </>
            ) : (
              <>
                <Calendar size={13} />
                {isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  return modalContent
}
