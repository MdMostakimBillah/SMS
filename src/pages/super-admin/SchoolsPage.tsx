import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Search, Filter, ChevronDown, ChevronUp,
  Users, GraduationCap, Calendar, Mail, Phone, Globe,
  MapPin, CheckCircle, XCircle, Pause, Clock,
  CreditCard, Shield, Trash2, ExternalLink, Lock, Copy, Check, Plus, HardDrive,
  Cloud, Laptop, Server, Database,
} from 'lucide-react'
import { useSuperAdminStore, PACKAGES, type Institution, type InstitutionStatus } from '@/store/superAdminStore'
import { useClassStore, generateLightColors, generateDarkColors } from '@/store/classStore'
import { useAuth } from '@/contexts/AuthContext'
import { setSlug } from '@/lib/storage'
import { authApi, resolveMediaUrl } from '@/lib/api'
import { LicenseModal } from './modals/LicenseModal'

function statusConfig(status: InstitutionStatus, isBn: boolean) {
  const map: Record<InstitutionStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    active: { label: isBn ? 'সক্রিয়' : 'Active', color: '#22c55e', bg: '#22c55e12', icon: <CheckCircle size={13} /> },
    trial: { label: isBn ? 'ট্রায়াল' : 'Trial', color: '#f59e0b', bg: '#f59e0b12', icon: <Clock size={13} /> },
    suspended: { label: isBn ? 'বন্ধ' : 'Suspended', color: '#ef4444', bg: '#ef444412', icon: <Pause size={13} /> },
    inactive: { label: isBn ? 'নিষ্ক্রিয়' : 'Inactive', color: '#6b7280', bg: '#6b728012', icon: <XCircle size={13} /> },
  }
  return map[status]
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function InstitutionLogo({ logo, name, brandColor }: { logo?: string; name: string; brandColor: string }) {
  const [loaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  if (!logo || hasError) {
    return (
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden font-bold text-white text-[0.875rem] shadow-sm select-none"
        style={{ background: brandColor || '#6366f1' }}
      >
        {name.charAt(0)}
      </div>
    )
  }

  return (
    <div
      className="w-11 h-11 rounded-xl relative flex items-center justify-center shrink-0 overflow-hidden shadow-sm"
      style={{ background: brandColor || 'var(--bg-secondary)' }}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-[var(--border)] animate-pulse flex items-center justify-center">
          <Building2 size={16} className="text-[var(--text-muted)] opacity-40 animate-pulse" />
        </div>
      )}
      <img
        src={resolveMediaUrl(logo)}
        alt={name}
        loading="eager"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}

function InstitutionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 flex items-center gap-3 animate-pulse">
      <div className="w-11 h-11 rounded-xl bg-[var(--bg-secondary)] shrink-0 flex items-center justify-center">
        <Building2 size={18} className="text-[var(--text-muted)] opacity-30" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-4 w-36 bg-[var(--bg-secondary)] rounded" />
          <div className="h-4 w-16 bg-[var(--bg-secondary)] rounded-full" />
          <div className="h-4 w-20 bg-[var(--bg-secondary)] rounded-full" />
          <div className="h-4 w-16 bg-[var(--bg-secondary)] rounded-full" />
        </div>
        <div className="h-3 w-44 bg-[var(--bg-secondary)] rounded" />
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
        <div className="h-3 w-20 bg-[var(--bg-secondary)] rounded" />
        <div className="h-2.5 w-14 bg-[var(--bg-secondary)] rounded" />
      </div>
    </div>
  )
}

function InstitutionCard({ inst, isBn, isSelected, onToggle, onOpen, onManageLicense }: {
  inst: Institution
  isBn: boolean
  isSelected: boolean
  onToggle: () => void
  onOpen: () => void
  onManageLicense: () => void
}) {
  const status = statusConfig(inst.status, isBn)
  const isExpired = inst.expiresAt ? new Date(inst.expiresAt).getTime() < Date.now() : false
  const daysRemaining = inst.expiresAt ? Math.ceil((new Date(inst.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
  const isSuperAdminSchool = inst.email === 'admin@edutech.local' || inst.slug === 'main' || inst.slug === 'superadmin' || inst.slug === 'edutech' || inst.id === 'b903f56f-2a26-411f-81f4-d7f0122bdc52'

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-[var(--brand)] shadow-lg shadow-[var(--brand)]/10'
          : 'border-[var(--border)] hover:border-[var(--border-2)] hover:shadow-md'
      } bg-[var(--bg-primary)]`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left cursor-pointer bg-transparent border-none"
      >
        <InstitutionLogo logo={inst.logo} name={inst.name} brandColor={inst.brandColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.875rem] font-semibold text-[var(--text-primary)] truncate">
              {isBn ? inst.nameBn : inst.name}
            </span>
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-semibold shrink-0"
              style={{ color: status.color, background: status.bg }}
            >
              {status.icon}
              {status.label}
            </span>
            {inst.expiresAt && (
              <span className={`px-1.5 py-0.5 rounded text-[0.625rem] font-semibold shrink-0 ${
                isExpired
                  ? 'bg-red-500/10 text-red-500'
                  : daysRemaining !== null && daysRemaining <= 15
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-blue-500/10 text-blue-500'
              }`}>
                {isExpired ? (isBn ? 'মেয়াদ শেষ' : 'Expired') : `${daysRemaining}${isBn ? ' দিন বাকি' : 'd left'}`}
              </span>
            )}
            {/* Storage Architecture Mode Badge */}
            {inst.storageMode === 'local_computer' ? (
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0"
                title={isBn ? 'লোকাল কম্পিউটার স্টোরেজ (সার্ভার ডাটাবেস সম্পূর্ণ বন্ধ)' : 'Local Computer Storage (Server Database Stopped)'}
              >
                <Laptop size={11} />
                {isBn ? 'লোকাল পিসি' : 'Local PC'}
              </span>
            ) : inst.storageMode === 'local_server' ? (
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-semibold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shrink-0"
                title={isBn ? 'কাস্টম সার্ভার / ভিপিএস' : 'Custom Server / VPS'}
              >
                <Server size={11} />
                {isBn ? 'কাস্টম সার্ভার' : 'Custom Server'}
              </span>
            ) : (
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0"
                title={isBn ? 'প্রোভাইডার সার্ভার (সুপাবেস + R2 ক্লাউড)' : 'Provider Server (Supabase + R2 Cloud)'}
              >
                <Cloud size={11} />
                {isBn ? 'প্রোভাইডার ক্লাউড' : 'Provider Cloud'}
              </span>
            )}

            {/* Storage Size Badge */}
            <span
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.625rem] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0"
              title={isBn ? `ব্যবহৃত স্টোরেজ: ${formatBytes(inst.storageBytes)} (${inst.mediaCount || 0} টি ফাইল)` : `Used Storage: ${formatBytes(inst.storageBytes)} (${inst.mediaCount || 0} files)`}
            >
              <HardDrive size={11} />
              {inst.storageMode === 'local_computer' ? (isBn ? 'পিসি স্টোরেজ' : 'Local Storage') : formatBytes(inst.storageBytes)}
            </span>
          </div>
          <div className="text-[0.75rem] text-[var(--text-muted)] mt-0.5 truncate">{inst.email}</div>
        </div>
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-[0.6875rem] text-[var(--text-muted)]">
              <CreditCard size={11} />
              {isBn ? inst.package.nameBn : inst.package.name}
            </div>
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-0.5">
              {inst.package.price === 0 ? (isBn ? 'ফ্রি' : 'Free') : `৳${inst.package.price}/${isBn ? 'মাস' : 'mo'}`}
            </div>
          </div>
          <div className="text-[0.625rem] text-[var(--text-muted)] whitespace-nowrap">
            <Clock size={10} className="inline mr-1" />
            {inst.lastLogin}
          </div>
        </div>
        <div className="shrink-0 text-[var(--text-muted)]">
          {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isSelected && (
        <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)]">
          {/* Stats Row */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <MiniStat icon={<GraduationCap size={14} />} label={isBn ? 'শিক্ষার্থী' : 'Students'} value={inst.package.maxStudents >= 9999 ? (isBn ? 'অসীমিত' : 'Unlimited') : inst.package.maxStudents.toLocaleString()} color="#6366f1" />
            <MiniStat icon={<Users size={14} />} label={isBn ? 'শিক্ষক' : 'Teachers'} value={inst.package.maxTeachers >= 9999 ? (isBn ? 'অসীমিত' : 'Unlimited') : inst.package.maxTeachers.toLocaleString()} color="#3b82f6" />
            <MiniStat icon={<Building2 size={14} />} label={isBn ? 'শ্রেণি' : 'Classes'} value={inst.package.maxClasses.toString()} color="#8b5cf6" />
            <MiniStat icon={<HardDrive size={14} />} label={isBn ? 'ব্যবহৃত স্টোরেজ' : 'Storage Used'} value={inst.storageMode === 'local_computer' ? (isBn ? 'লোকাল পিসি' : 'Local PC') : formatBytes(inst.storageBytes)} color="#a855f7" />
            <MiniStat icon={<Clock size={14} />} label={isBn ? 'শেষ লগইন' : 'Last Login'} value={inst.lastLogin} color="#f59e0b" />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 px-1">
            <InfoRow icon={<Mail size={13} />} label={isBn ? 'ইমেইল' : 'Email'} value={inst.email} />
            <PasswordRow label={isBn ? 'পাসওয়ার্ড' : 'Password'} value={inst.password} />
            <InfoRow icon={<Phone size={13} />} label={isBn ? 'ফোন' : 'Phone'} value={inst.phone} />
            <InfoRow icon={<MapPin size={13} />} label={isBn ? 'ঠিকানা' : 'Address'} value={isBn ? inst.addressBn : inst.address} />
            <InfoRow icon={<Globe size={13} />} label={isBn ? 'ওয়েবসাইট' : 'Website'} value={`smsappbd.vercel.app/i/${inst.subdomain}`} />
            <InfoRow icon={<Shield size={13} />} label="EIIN" value={inst.eiin} />
            <InfoRow
              icon={<Clock size={13} />}
              label={isBn ? 'মেয়াদ' : 'Expires'}
              value={inst.expiresAt ? `${inst.expiresAt} (${daysRemaining !== null ? (isExpired ? (isBn ? 'মেয়াদ উত্তীর্ণ' : 'Expired') : `${daysRemaining} ${isBn ? 'দিন' : 'days'}`) : ''})` : (isBn ? 'লাইফটাইম' : 'Lifetime')}
            />
            <InfoRow
              icon={<HardDrive size={13} />}
              label={isBn ? 'স্টোরেজ মডেল' : 'Storage'}
              value={inst.storageMode === 'local_computer' ? (isBn ? 'লোকাল কম্পিউটার (অফলাইন - ডাটাবেস সম্পূর্ণ বন্ধ)' : 'Local Computer (Offline - DB Stopped)') : inst.storageMode === 'local_server' ? (isBn ? `কাস্টম সার্ভার (${inst.serverUrl || 'Not set'})` : `Custom Server (${inst.serverUrl || 'Not set'})`) : (isBn ? 'প্রোভাইডার ক্লাউড (সুপাবেস + R2)' : 'Provider Cloud (Supabase + R2)')}
            />
            <InfoRow
              icon={<Database size={13} />}
              label={isBn ? 'ব্যবহৃত সাইজ' : 'Storage Size'}
              value={inst.storageMode === 'local_computer' ? (isBn ? 'লোকাল পিসি স্টোরেজ' : 'Local Computer Storage') : `${formatBytes(inst.storageBytes)} (${inst.mediaCount || 0} ${isBn ? 'টি ফাইল' : 'files'})`}
            />
            <InfoRow icon={<CreditCard size={13} />} label={isBn ? 'মূল্য' : 'Price'} value={inst.package.price === 0 ? (isBn ? 'ফ্রি' : 'Free') : `৳${inst.package.price}/${isBn ? 'মাস' : 'mo'}`} />
            <InfoRow icon={<Calendar size={13} />} label={isBn ? 'নিবন্ধন' : 'Created'} value={inst.createdAt} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-all cursor-pointer border-none"
              onClick={(e) => {
                e.stopPropagation()
                onOpen()
              }}
            >
              <ExternalLink size={13} />
              {isBn ? 'ওপেন করুন' : 'Open Institution'}
            </button>
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[0.75rem] font-semibold bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border)] transition-all cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onManageLicense()
              }}
              title={isBn ? 'লাইসেন্স ও সাবস্ক্রিপশন নিয়ন্ত্রণ' : 'Manage License'}
            >
              <Shield size={13} className="text-[var(--brand)]" />
              {isBn ? 'লাইসেন্স' : 'License'}
            </button>
            <button
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[0.75rem] font-semibold transition-all cursor-pointer border-none ${
                inst.status === 'active'
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/15'
                  : 'bg-green-500/10 text-green-500 hover:bg-green-500/15'
              }`}
              onClick={async (e) => {
                e.stopPropagation()
                const nextStatus = inst.status === 'active' ? 'suspended' : 'active'
                useSuperAdminStore.getState().toggleStatus(inst.id)
                try {
                  await authApi.updateSchool(inst.id, { status: nextStatus })
                } catch {
                  /* ignore */
                }
              }}
              title={inst.status === 'active' ? (isBn ? 'বন্ধ করুন' : 'Suspend') : (isBn ? 'সক্রিয় করুন' : 'Activate')}
            >
              {inst.status === 'active' ? <><Pause size={13} /></> : <><CheckCircle size={13} /></>}
            </button>
            {isSuperAdminSchool ? (
              <div
                className="flex items-center justify-center px-3 py-2.5 rounded-xl text-[0.75rem] bg-gray-500/10 text-gray-400 cursor-not-allowed"
                title={isBn ? 'সুপার অ্যাডমিন ডিলিট করা সম্ভব নয়' : 'Super Admin institution cannot be deleted'}
              >
                <Lock size={13} />
              </div>
            ) : (
              <button
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[0.75rem] font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/15 transition-all cursor-pointer border-none"
                onClick={async (e) => {
                  e.stopPropagation()
                  if (confirm(isBn ? 'আপনি কি এই প্রতিষ্ঠানটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this institution?')) {
                    useSuperAdminStore.getState().deleteInstitution(inst.id)
                    try {
                      await authApi.deleteSchool(inst.id)
                    } catch {
                      /* ignore backend error */
                    }
                  }
                }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[0.9375rem] font-bold text-[var(--text-primary)] leading-tight truncate">{value}</div>
        <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{label}</div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-[var(--text-muted)] shrink-0">{icon}</span>
      <span className="text-[0.6875rem] text-[var(--text-muted)] shrink-0 w-16">{label}</span>
      <span className="text-[0.75rem] text-[var(--text-primary)] font-medium truncate">{value}</span>
    </div>
  )
}

function PasswordRow({ label, value }: { label: string; value?: string }) {
  const [copied, setCopied] = useState(false)
  // Phase 6 — credentials are never persisted, so after a reload this value is
  // absent and the row shows a placeholder instead of a fake default password.
  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="text-[var(--text-muted)] shrink-0"><Lock size={13} /></span>
      <span className="text-[0.6875rem] text-[var(--text-muted)] shrink-0 w-16">{label}</span>
      <span className={`text-[0.75rem] font-mono font-medium truncate ${value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
        {value || '—'}
      </span>
      {value && (
        <button
          onClick={handleCopy}
          className="ml-1 p-1 rounded-md hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer border-none bg-transparent"
          title={copied ? 'Copied!' : 'Copy password'}
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-[var(--text-muted)]" />}
        </button>
      )}
    </div>
  )
}

export default function SchoolsPage({ isBn }: { isBn: boolean }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    institutions, selectedId, searchQuery, statusFilter, packageFilter,
    setSelectedId, setSearchQuery, setStatusFilter, setPackageFilter,
    startViewing,
  } = useSuperAdminStore()

  const [showFilters, setShowFilters] = useState(false)
  const [managingLicenseInst, setManagingLicenseInst] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(institutions.length === 0)

  useEffect(() => {
    let mounted = true
    const fetchSchools = async () => {
      try {
        const dbSchools = await authApi.getSchools()
        if (!mounted || !Array.isArray(dbSchools)) return
        if (dbSchools.length > 0) {
          const currentInsts = useSuperAdminStore.getState().institutions || []
          const mapped: Institution[] = dbSchools.map((item) => {
            const existing = currentInsts.find(
              (i) => i.id === item.id || i.slug === item.slug || i.subdomain === item.domain
            )
            const pkgName = (item as any).package || 'Basic'
            const pkg =
              PACKAGES.find((p) => p.name.toLowerCase() === pkgName.toLowerCase()) || PACKAGES[0]
            const sName = item.name || 'School'
            const sSlug = item.slug || item.domain || sName.toLowerCase().replace(/[^a-z0-9]/g, '-')
            return {
              id: item.id,
              name: sName,
              nameBn: item.nameBn || existing?.nameBn || sName,
              email: item.email || existing?.email || '',
              phone: item.phone || existing?.phone || '',
              address: item.address || existing?.address || '',
              addressBn: (item as any).addressBn || existing?.addressBn || item.address || '',
              eiin: (item as any).eiin || existing?.eiin || '',
              website: item.website || existing?.website || `smsappbd.vercel.app/i/${sSlug}`,
              subdomain: sSlug,
              slug: sSlug,
              status: ((item as any).status as InstitutionStatus) || existing?.status || 'active',
              package: pkg,
              expiresAt: item.expiresAt ? (item.expiresAt as string).split('T')[0] : existing?.expiresAt || null,
              storageMode: item.storageMode || existing?.storageMode || 'cloud',
              serverUrl: item.serverUrl || existing?.serverUrl || '',
              folderName: item.folderName || existing?.folderName || '',
              storageBytes: (item as any).storageBytes ?? existing?.storageBytes ?? 0,
              mediaCount: (item as any).mediaCount ?? existing?.mediaCount ?? 0,
              createdAt: (item as any).createdAt
                ? (item as any).createdAt.split('T')[0]
                : existing?.createdAt || new Date().toISOString().split('T')[0],
              lastLogin: existing?.lastLogin || '-',
              logo: item.logo || existing?.logo || '',
              banner: item.banner || existing?.banner || '',
              brandColor: (item as any).brandColor || existing?.brandColor || '#6366f1',
              brandName: (item as any).brandName || existing?.brandName || sName,
              motto: (item as any).motto || existing?.motto || '',
              mottoBn: (item as any).mottoBn || existing?.mottoBn || '',
              startTime: item.startTime || existing?.startTime || '07:30',
              endTime: item.endTime || existing?.endTime || '14:30',
              optionalSubjects: existing?.optionalSubjects || [],
              sessions: (item as any).sessions
                ? (typeof (item as any).sessions === 'string' ? JSON.parse((item as any).sessions) : (item as any).sessions)
                : existing?.sessions || ['2025-26'],
              accessModes: existing?.accessModes || {
                pathBased: true,
                subdomainBased: true,
                customDomain: '',
              },
              language: existing?.language || 'en',
              theme: existing?.theme || 'light',
            }
          })
          useSuperAdminStore.getState().setInstitutions(mapped)
        }
      } catch (err) {
        console.error('Failed to load schools from backend:', err)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    fetchSchools()
    return () => {
      mounted = false
    }
  }, [])

  const openInstitution = (inst: Institution) => {
    if (user) {
      localStorage.setItem('edutech_superadmin_user', JSON.stringify({
        email: user.email, role: user.role, name: user.name, loginTimestamp: Date.now(),
      }))
    }
    startViewing(inst.id)
    setSlug(inst.slug)
    const brand = inst.brandColor || '#6366f1'
    useClassStore.getState().updateInstitution({
      name: inst.name,
      nameBn: inst.nameBn,
      brandName: inst.brandName || inst.name,
      logo: inst.logo,
      banner: inst.banner,
      motto: inst.motto,
      mottoBn: inst.mottoBn,
      eiin: inst.eiin,
      phone: inst.phone,
      email: inst.email,
      address: inst.address,
      addressBn: inst.addressBn,
      website: inst.website,
      startTime: inst.startTime || '07:30',
      endTime: inst.endTime || '14:30',
      sessions: inst.sessions?.length ? inst.sessions : ['2025-26'],
      lightColors: generateLightColors(brand),
      darkColors: generateDarkColors(brand),
    })
    navigate('/super-admin/viewing/admin/dashboard')
  }

  const filtered = institutions.filter((i) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !i.name.toLowerCase().includes(q) &&
        !i.nameBn.includes(q) &&
        !i.email.toLowerCase().includes(q) &&
        !i.eiin.includes(q)
      ) return false
    }
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    if (packageFilter !== 'all' && i.package.name !== packageFilter) return false
    return true
  })

  const totalStudents = institutions.reduce((sum, i) => sum + i.package.maxStudents, 0)
  const activeCount = institutions.filter((i) => i.status === 'active').length
  const totalRevenue = institutions.reduce((sum, i) => sum + i.package.price, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={<Building2 size={18} />}
          label={isBn ? 'মোট প্রতিষ্ঠান' : 'Total Institutions'}
          value={institutions.length.toString()}
          color="#6366f1"
        />
        <SummaryCard
          icon={<CheckCircle size={18} />}
          label={isBn ? 'সক্রিয়' : 'Active'}
          value={activeCount.toString()}
          color="#22c55e"
        />
        <SummaryCard
          icon={<GraduationCap size={18} />}
          label={isBn ? 'মোট আসন' : 'Total Seats'}
          value={totalStudents.toLocaleString()}
          color="#3b82f6"
        />
        <SummaryCard
          icon={<CreditCard size={18} />}
          label={isBn ? 'মাসিক আয়' : 'Monthly Revenue'}
          value={`৳${totalRevenue.toLocaleString()}`}
          color="#22c55e"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={isBn ? 'অনুসন্ধান করুন...' : 'Search institutions...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-0 focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => navigate('/super-admin/add-school')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8125rem] font-semibold border-none cursor-pointer transition-all"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: '#fff' }}
        >
          <Plus size={15} />
          {isBn ? 'নতুন প্রতিষ্ঠান' : 'Add Institution'}
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[0.8125rem] font-medium transition-all cursor-pointer ${
            showFilters
              ? 'border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]'
              : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-[var(--border-2)]'
          }`}
        >
          <Filter size={14} />
          {isBn ? 'ফিল্টার' : 'Filters'}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InstitutionStatus | 'all')}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.75rem] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
          >
            <option value="all">{isBn ? 'সব স্ট্যাটাস' : 'All Status'}</option>
            <option value="active">{isBn ? 'সক্রিয়' : 'Active'}</option>
            <option value="trial">{isBn ? 'ট্রায়াল' : 'Trial'}</option>
            <option value="suspended">{isBn ? 'বন্ধ' : 'Suspended'}</option>
            <option value="inactive">{isBn ? 'নিষ্ক্রিয়' : 'Inactive'}</option>
          </select>
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[0.75rem] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
          >
            <option value="all">{isBn ? 'সব প্যাকেজ' : 'All Packages'}</option>
            <option value="Free">{isBn ? 'ফ্রি' : 'Free'}</option>
            <option value="Basic">{isBn ? 'বেসিক' : 'Basic'}</option>
            <option value="Standard">{isBn ? 'স্ট্যান্ডার্ড' : 'Standard'}</option>
            <option value="Premium">{isBn ? 'প্রিমিয়াম' : 'Premium'}</option>
          </select>
        </div>
      )}

      <div className="space-y-3">
        {loading && institutions.length === 0 ? (
          <>
            <InstitutionCardSkeleton />
            <InstitutionCardSkeleton />
            <InstitutionCardSkeleton />
            <InstitutionCardSkeleton />
          </>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <Building2 size={32} className="mx-auto mb-3 opacity-40" />
            <div className="text-[0.875rem]">{isBn ? 'কোনো প্রতিষ্ঠান পাওয়া যায়নি' : 'No institutions found'}</div>
          </div>
        ) : (
          filtered.map((inst) => (
            <InstitutionCard
              key={inst.id}
              inst={inst}
              isBn={isBn}
              isSelected={selectedId === inst.id}
              onToggle={() => setSelectedId(selectedId === inst.id ? null : inst.id)}
              onOpen={() => openInstitution(inst)}
              onManageLicense={() => setManagingLicenseInst(inst)}
            />
          ))
        )}
      </div>

      {managingLicenseInst && (
        <LicenseModal
          isOpen={true}
          onClose={() => setManagingLicenseInst(null)}
          inst={managingLicenseInst}
          isBn={isBn}
          onSaved={(updated) => {
            useSuperAdminStore.getState().updateInstitution(managingLicenseInst.id, updated)
          }}
        />
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div
      className="glass rounded-[0.75rem] flex items-center gap-[0.625rem] p-[0.875rem] cursor-default transition-all duration-200"
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[var(--text-primary)] leading-none font-bold text-lg">{value}</div>
        <div className="text-[0.625rem] text-[var(--text-muted)] mt-[0.125rem] whitespace-nowrap">{label}</div>
      </div>
    </div>
  )
}
