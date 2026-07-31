import { useState } from 'react'
import {
  Building2, Search, Filter, ChevronDown, ChevronUp,
  Users, GraduationCap, HardDrive, Calendar, Mail, Phone, Globe,
  MapPin, CheckCircle, XCircle, Pause, Clock,
  CreditCard, Shield, Trash2, TrendingUp,
} from 'lucide-react'
import { useSuperAdminStore, type Institution, type InstitutionStatus } from '@/store/superAdminStore'

function statusConfig(status: InstitutionStatus, isBn: boolean) {
  const map: Record<InstitutionStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    active: { label: isBn ? 'সক্রিয়' : 'Active', color: '#22c55e', bg: '#22c55e12', icon: <CheckCircle size={13} /> },
    trial: { label: isBn ? 'ট্রায়াল' : 'Trial', color: '#f59e0b', bg: '#f59e0b12', icon: <Clock size={13} /> },
    suspended: { label: isBn ? 'বন্ধ' : 'Suspended', color: '#ef4444', bg: '#ef444412', icon: <Pause size={13} /> },
    inactive: { label: isBn ? 'নিষ্ক্রিয়' : 'Inactive', color: '#6b7280', bg: '#6b728012', icon: <XCircle size={13} /> },
  }
  return map[status]
}

function StorageBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min((used / total) * 100, 100)
  const color = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e'
  return (
    <div className="w-full h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb} MB`
}

function InstitutionCard({ inst, isBn, isSelected, onToggle }: {
  inst: Institution
  isBn: boolean
  isSelected: boolean
  onToggle: () => void
}) {
  const status = statusConfig(inst.status, isBn)
  const pct = Math.min((inst.usedStorageMB / inst.package.storageMB) * 100, 100)

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
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-[0.875rem]"
          style={{ background: inst.brandColor }}
        >
          {inst.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
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
          </div>
          <div className="text-[0.75rem] text-[var(--text-muted)] mt-0.5 truncate">{inst.email}</div>
        </div>
        <div className="shrink-0 text-[var(--text-muted)]">
          {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isSelected && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--border)]">
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox icon={<GraduationCap size={15} />} label={isBn ? 'শিক্ষার্থী' : 'Students'} value={inst.package.maxStudents.toLocaleString()} color="#6366f1" />
            <StatBox icon={<Users size={15} />} label={isBn ? 'শিক্ষক' : 'Teachers'} value={inst.package.maxTeachers.toLocaleString()} color="#3b82f6" />
            <StatBox icon={<Building2 size={15} />} label={isBn ? 'শ্রেণি' : 'Classes'} value={inst.package.maxClasses.toString()} color="#8b5cf6" />
            <StatBox icon={<CreditCard size={15} />} label={isBn ? 'প্যাকেজ' : 'Package'} value={isBn ? inst.package.nameBn : inst.package.name} color="#ec4899" />
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[0.75rem] text-[var(--text-secondary)]">
                <HardDrive size={13} />
                {isBn ? 'স্টোরেজ' : 'Storage'}
              </div>
              <span className="text-[0.6875rem] font-medium text-[var(--text-primary)]">
                {formatMB(inst.usedStorageMB)} / {formatMB(inst.package.storageMB)}
              </span>
            </div>
            <StorageBar used={inst.usedStorageMB} total={inst.package.storageMB} />
            <div className="text-[0.625rem] text-[var(--text-muted)] mt-1.5 text-right">{pct.toFixed(1)}% used</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={<Mail size={13} />} label={isBn ? 'ইমেইল' : 'Email'} value={inst.email} />
            <InfoRow icon={<Phone size={13} />} label={isBn ? 'ফোন' : 'Phone'} value={inst.phone} />
            <InfoRow icon={<MapPin size={13} />} label={isBn ? 'ঠিকানা' : 'Address'} value={isBn ? inst.addressBn : inst.address} />
            <InfoRow icon={<Globe size={13} />} label={isBn? 'ওয়েবসাইট' : 'Website'} value={inst.website} />
            <InfoRow icon={<Shield size={13} />} label="EIIN" value={inst.eiin} />
            <InfoRow icon={<Calendar size={13} />} label={isBn ? 'নিবন্ধন' : 'Created'} value={inst.createdAt} />
            <InfoRow icon={<TrendingUp size={13} />} label={isBn ? 'শেষ লগইন' : 'Last Login'} value={inst.lastLogin} />
            <InfoRow icon={<CreditCard size={13} />} label={isBn ? 'মূল্য' : 'Price'} value={inst.package.price === 0 ? (isBn ? 'ফ্রি' : 'Free') : `৳${inst.package.price}/${isBn ? 'মাস' : 'mo'}`} />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium border transition-colors cursor-pointer ${
                inst.status === 'active'
                  ? 'border-red-500/20 text-red-500 hover:bg-red-500/5 bg-transparent'
                  : 'border-green-500/20 text-green-500 hover:bg-green-500/5 bg-transparent'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                useSuperAdminStore.getState().toggleStatus(inst.id)
              }}
            >
              {inst.status === 'active' ? <><Pause size={13} /> {isBn ? 'বন্ধ করুন' : 'Suspend'}</> : <><CheckCircle size={13} /> {isBn ? 'সক্রিয় করুন' : 'Activate'}</>}
            </button>
            <button
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/20 transition-colors cursor-pointer bg-transparent"
              onClick={(e) => {
                e.stopPropagation()
                useSuperAdminStore.getState().deleteInstitution(inst.id)
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)]">
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-[0.625rem] font-medium text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="text-[0.8125rem] font-bold text-[var(--text-primary)]">{value}</div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[0.75rem]">
      <span className="text-[var(--text-muted)]">{icon}</span>
      <span className="text-[var(--text-muted)] shrink-0">{label}:</span>
      <span className="text-[var(--text-primary)] truncate font-medium">{value}</span>
    </div>
  )
}

export default function SchoolsPage({ isBn }: { isBn: boolean }) {
  const {
    institutions, selectedId, searchQuery, statusFilter, packageFilter,
    setSelectedId, setSearchQuery, setStatusFilter, setPackageFilter,
  } = useSuperAdminStore()

  const [showFilters, setShowFilters] = useState(false)

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
  const totalStorage = institutions.reduce((sum, i) => sum + i.package.storageMB, 0)
  const usedStorage = institutions.reduce((sum, i) => sum + i.usedStorageMB, 0)

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
          icon={<HardDrive size={18} />}
          label={isBn ? 'স্টোরেজ' : 'Storage'}
          value={`${formatMB(usedStorage)} / ${formatMB(totalStorage)}`}
          color="#f59e0b"
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
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[0.8125rem] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand-light)] focus:outline-none transition-all"
          />
        </div>
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
        {filtered.length === 0 ? (
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
            />
          ))
        )}
      </div>
    </div>
  )
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)]">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[1rem] font-bold text-[var(--text-primary)] leading-tight">{value}</div>
        <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">{label}</div>
      </div>
    </div>
  )
}
