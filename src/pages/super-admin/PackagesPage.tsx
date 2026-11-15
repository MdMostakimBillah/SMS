import { useState, useMemo } from 'react'
import {
  CreditCard, Plus, Search, Edit3, Trash2, X,
  Cloud, Laptop, Server, Cpu, CheckCircle2,
  Users, GraduationCap, Building2, Star, RefreshCcw,
  ShieldCheck, Globe
} from 'lucide-react'
import { useSuperAdminStore, type InstitutionPackage, type PackageHostingType } from '@/store/superAdminStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

interface Props {
  isBn: boolean
}

export default function PackagesPage({ isBn }: Props) {
  const packages = useSuperAdminStore((s) => s.packages)
  const institutions = useSuperAdminStore((s) => s.institutions)
  const addPackage = useSuperAdminStore((s) => s.addPackage)
  const updatePackage = useSuperAdminStore((s) => s.updatePackage)
  const deletePackage = useSuperAdminStore((s) => s.deletePackage)
  const setDefaultPackage = useSuperAdminStore((s) => s.setDefaultPackage)
  const resetPackagesToDefault = useSuperAdminStore((s) => s.resetPackagesToDefault)

  const [activeTab, setActiveTab] = useState<'all' | 'cloud' | 'system_only'>('all')
  const [search, setSearch] = useState('')
  const [editingPackage, setEditingPackage] = useState<InstitutionPackage | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Calculate enrolled institutions count per package
  const packageUsage = useMemo(() => {
    const counts: Record<string, number> = {}
    institutions.forEach((inst) => {
      const name = (inst.package?.name || '').toLowerCase()
      counts[name] = (counts[name] || 0) + 1
    })
    return counts
  }, [institutions])

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Tab filter
      if (activeTab === 'cloud') {
        if (pkg.hostingType && pkg.hostingType !== 'cloud' && pkg.hostingType !== 'all') return false
      } else if (activeTab === 'system_only') {
        const isSystem = pkg.hostingType === 'system_only' || pkg.hostingType === 'local_pc' || pkg.hostingType === 'personal_vps'
        if (!isSystem && pkg.hostingType !== 'all') return false
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchName = (pkg.name || '').toLowerCase().includes(q)
        const matchNameBn = (pkg.nameBn || '').includes(search)
        const matchDesc = (pkg.description || '').toLowerCase().includes(q)
        const matchFeatures = (pkg.features || []).some((f) => f.toLowerCase().includes(q))
        if (!matchName && !matchNameBn && !matchDesc && !matchFeatures) return false
      }

      return true
    })
  }, [packages, activeTab, search])

  // Count stats
  const totalPackages = packages.length
  const cloudPackages = packages.filter((p) => !p.hostingType || p.hostingType === 'cloud' || p.hostingType === 'all').length
  const systemPackages = packages.filter((p) => p.hostingType === 'system_only' || p.hostingType === 'local_pc' || p.hostingType === 'personal_vps').length

  const getHostingBadge = (type?: PackageHostingType) => {
    switch (type) {
      case 'local_pc':
        return {
          icon: <Laptop size={12} />,
          labelEn: 'Local PC (Vault)',
          labelBn: 'লোকাল পিসি (ভল্ট)',
          style: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          descEn: 'Runs completely offline on local PC computer',
          descBn: 'লোকাল পিসিতে সম্পূর্ণ অফলাইনে পরিচালিত',
        }
      case 'personal_vps':
        return {
          icon: <Server size={12} />,
          labelEn: 'Personal VPS',
          labelBn: 'নিজস্ব ভিপিএস',
          style: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
          descEn: 'Institution self-hosted private VPS server',
          descBn: 'প্রতিষ্ঠানের নিজস্ব প্রাইভেট ভিপিএস সার্ভার',
        }
      case 'system_only':
        return {
          icon: <Cpu size={12} />,
          labelEn: 'System Use Only',
          labelBn: 'শুধুমাত্র সিস্টেম ব্যবহার',
          style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          descEn: 'Software license without provider cloud fees',
          descBn: 'প্রোভাইডার ক্লাউড খরচ ছাড়া শুধু সিস্টেম সফটওয়্যার লাইসেন্স',
        }
      case 'all':
        return {
          icon: <Globe size={12} />,
          labelEn: 'Universal (All)',
          labelBn: 'সর্বজনীন (সকল)',
          style: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
          descEn: 'Applicable to any deployment architecture',
          descBn: 'যে কোনো ধরনের আর্কিটেকচারে প্রযোজ্য',
        }
      case 'cloud':
      default:
        return {
          icon: <Cloud size={12} />,
          labelEn: 'Provider Cloud',
          labelBn: 'প্রোভাইডার ক্লাউড',
          style: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          descEn: 'Hosted on central managed cloud cluster',
          descBn: 'সেন্ট্রাল প্রোভাইডার ক্লাউড ক্লাস্টারে হোস্ট করা',
        }
    }
  }

  const handleDelete = (name: string) => {
    deletePackage(name)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-pink-500/15 text-pink-500 flex items-center justify-center font-bold">
              <CreditCard size={20} />
            </div>
            <div>
              <h1 className="text-[1.25rem] font-bold text-[var(--text-primary)]">
                {isBn ? 'প্যাকেজ ও সাবস্ক্রিপশন নিয়ন্ত্রণ' : 'Packages & Subscriptions'}
              </h1>
              <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5">
                {isBn
                  ? 'প্রোভাইডার ক্লাউড এবং লোকাল পিসি/নিজস্ব ভিপিএস সিস্টেম ব্যবহারের প্যাকেজ নিয়ন্ত্রণ করুন।'
                  : 'Manage pricing, capacity limits, and configure Cloud vs Local PC/Personal VPS System packages.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer bg-transparent"
            title={isBn ? 'ডিফল্ট প্যাকেজে রিসেট করুন' : 'Reset to default packages'}
          >
            <RefreshCcw size={14} />
            <span className="hidden sm:inline">{isBn ? 'ডিফল্ট রিস্টোর' : 'Reset Defaults'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-semibold text-white transition-all cursor-pointer shadow-sm hover:opacity-95 active:scale-95 border-none"
            style={{ background: 'var(--brand)' }}
          >
            <Plus size={16} />
            <span>{isBn ? 'নতুন প্যাকেজ যোগ' : 'New Package'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
            {isBn ? 'মোট প্যাকেজ' : 'Total Packages'}
          </div>
          <div className="text-[1.375rem] font-bold text-[var(--text-primary)] mt-1">
            {totalPackages}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
            {isBn ? 'সক্রিয় ও কনফিগার করা' : 'Active & configured'}
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-blue-500/20 bg-blue-500/5">
          <div className="text-[0.6875rem] font-medium text-blue-500 flex items-center gap-1">
            <Cloud size={13} />
            {isBn ? 'প্রোভাইডার ক্লাউড প্যাকেজ' : 'Provider Cloud'}
          </div>
          <div className="text-[1.375rem] font-bold text-blue-600 dark:text-blue-400 mt-1">
            {cloudPackages}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
            {isBn ? 'সেন্ট্রাল হোস্টিং অন্তর্ভুক্ত' : 'Central hosting included'}
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[0.6875rem] font-medium text-emerald-500 flex items-center gap-1">
            <Cpu size={13} />
            {isBn ? 'সিস্টেম ব্যবহার (পিসি / ভিপিএস)' : 'System Use (PC/VPS)'}
          </div>
          <div className="text-[1.375rem] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {systemPackages}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
            {isBn ? 'জিরো ক্লাউড খরচ, নিজস্ব স্টোরেজ' : 'Zero cloud cost, self-hosted'}
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="text-[0.6875rem] font-medium text-[var(--text-muted)]">
            {isBn ? 'মোট নিবন্ধিত প্রতিষ্ঠান' : 'Enrolled Institutions'}
          </div>
          <div className="text-[1.375rem] font-bold text-[var(--text-primary)] mt-1">
            {institutions.length}
          </div>
          <div className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5">
            {isBn ? 'বিভিন্ন প্যাকেজে যুক্ত' : 'Active subscribers'}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Architecture Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
              activeTab === 'all'
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            {isBn ? 'সকল প্যাকেজ' : 'All Packages'} ({totalPackages})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
              activeTab === 'cloud'
                ? 'bg-[var(--bg-primary)] text-blue-500 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            <Cloud size={13} />
            <span>{isBn ? 'প্রোভাইডার ক্লাউড' : 'Provider Cloud'}</span>
            <span className="text-[0.625rem] opacity-75">({cloudPackages})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system_only')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none ${
              activeTab === 'system_only'
                ? 'bg-[var(--bg-primary)] text-emerald-500 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            <Cpu size={13} />
            <span>{isBn ? 'সিস্টেম ব্যবহার (লোকাল পিসি ও ভিপিএস)' : 'System Use (Local PC & VPS)'}</span>
            <span className="text-[0.625rem] opacity-75">({systemPackages})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder={isBn ? 'প্যাকেজের নাম বা সুবিধা খুঁজুন...' : 'Search package name or features...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors"
          />
        </div>
      </div>

      {/* Explanatory Banner for System-Use packages */}
      {activeTab === 'system_only' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
            <Cpu size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold mb-1">
              {isBn ? 'সিস্টেম ব্যবহারের বিশেষ প্যাকেজ (জিরো ক্লাউড হোস্টিং চার্জ)' : 'Dedicated System-Use Packages (Zero Cloud Hosting Fees)'}
            </h4>
            <p className="text-[0.6875rem] leading-relaxed text-emerald-700/80 dark:text-emerald-300/80">
              {isBn
                ? 'যখন কোনো স্কুল বা প্রতিষ্ঠান আপনার প্রোভাইডার ক্লাউড সার্ভার ব্যবহার করে না এবং তাদের নিজস্ব লোকাল পিসি (ভল্ট) অথবা নিজস্ব প্রাইভেট ভিপিএস সার্ভার ব্যবহার করে, তখন তারা শুধুমাত্র সফটওয়্যার/সিস্টেম ব্যবহারের এই প্যাকেজগুলো গ্রহণ করতে পারবে।'
                : 'When an institution chooses not to use provider cloud hosting and instead deploys the software on their own Local PC (Vault) or private VPS, they subscribe strictly to these system-use packages without cloud hosting surcharges.'}
            </p>
          </div>
        </div>
      )}

      {/* Packages Grid */}
      {filteredPackages.length === 0 ? (
        <div className="text-center py-16 glass rounded-2xl border border-[var(--border)]">
          <CreditCard size={44} className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {isBn ? 'কোনো প্যাকেজ পাওয়া যায়নি' : 'No packages found'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {isBn ? 'অনুগ্রহ করে ফিল্টার পরিবর্তন করুন বা নতুন প্যাকেজ তৈরি করুন।' : 'Try adjusting your filters or create a new package.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => {
            const enrolled = packageUsage[pkg.name.toLowerCase()] || 0
            const badge = getHostingBadge(pkg.hostingType)
            const isSystemType = pkg.hostingType === 'system_only' || pkg.hostingType === 'local_pc' || pkg.hostingType === 'personal_vps'
            const isLifetime = pkg.duration === 0

            return (
              <div
                key={pkg.id || pkg.name}
                className={`group relative rounded-2xl border p-5 flex flex-col justify-between transition-all bg-[var(--bg-primary)] ${
                  pkg.isPopular
                    ? 'border-[var(--brand)] ring-1 ring-[var(--brand)]/30 shadow-md'
                    : 'border-[var(--border)] hover:border-[var(--brand)]/50'
                }`}
              >
                {/* Top Badges */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.625rem] font-semibold border ${badge.style}`}
                      title={isBn ? badge.descBn : badge.descEn}
                    >
                      {badge.icon}
                      <span>{isBn ? badge.labelBn : badge.labelEn}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {pkg.isDefaultCloud && (
                        <span className="px-2 py-0.5 rounded-md text-[0.625rem] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          {isBn ? 'ডিফল্ট ক্লাউড' : 'Default Cloud'}
                        </span>
                      )}
                      {pkg.isDefaultSystemUse && (
                        <span className="px-2 py-0.5 rounded-md text-[0.625rem] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {isBn ? 'ডিফল্ট সিস্টেম' : 'Default System'}
                        </span>
                      )}
                      {pkg.isPopular && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.625rem] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Star size={10} className="fill-current" />
                          <span>{isBn ? 'জনপ্রিয়' : 'Popular'}</span>
                        </span>
                      )}
                      <span className={`w-2 h-2 rounded-full ${pkg.isActive !== false ? 'bg-green-500' : 'bg-gray-400'}`} title={pkg.isActive !== false ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')} />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mb-3">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-base font-bold text-[var(--text-primary)]">
                        {isBn ? pkg.nameBn : pkg.name}
                      </h3>
                      {isBn && pkg.nameBn !== pkg.name && (
                        <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                          {pkg.name}
                        </span>
                      )}
                    </div>
                    {(pkg.description || pkg.descriptionBn) && (
                      <p className="text-[0.6875rem] text-[var(--text-muted)] mt-1 line-clamp-2">
                        {isBn ? pkg.descriptionBn || pkg.description : pkg.description || pkg.descriptionBn}
                      </p>
                    )}
                  </div>

                  {/* Price Banner */}
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[1.375rem] font-black text-[var(--text-primary)]">
                        ৳{pkg.price.toLocaleString()}
                      </span>
                      <span className="text-[0.6875rem] text-[var(--text-muted)] font-medium">
                        {isLifetime
                          ? (isBn ? '/ এককালীন লাইফটাইম' : '/ Lifetime')
                          : (pkg.duration === 365
                              ? (isBn ? '/ বছর' : '/ year')
                              : (isBn ? '/ মাস' : '/ month'))}
                      </span>
                    </div>
                    {pkg.pricePerStudent > 0 && (
                      <div className="text-[0.625rem] text-[var(--brand)] font-semibold mt-0.5">
                        + ৳{pkg.pricePerStudent} {isBn ? 'প্রতি শিক্ষার্থী' : 'per student'}
                      </div>
                    )}
                  </div>

                  {/* Quotas */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--border)]/60 text-center mb-4">
                    <div>
                      <div className="text-[0.625rem] text-[var(--text-muted)] flex items-center justify-center gap-1 mb-0.5">
                        <GraduationCap size={11} />
                        <span>{isBn ? 'শিক্ষার্থী' : 'Students'}</span>
                      </div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        {pkg.maxStudents >= 9999 ? (isBn ? 'অসীমিত' : 'Unlimited') : pkg.maxStudents.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[0.625rem] text-[var(--text-muted)] flex items-center justify-center gap-1 mb-0.5">
                        <Users size={11} />
                        <span>{isBn ? 'শিক্ষক' : 'Teachers'}</span>
                      </div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        {pkg.maxTeachers >= 9999 ? (isBn ? 'অসীমিত' : 'Unlimited') : pkg.maxTeachers.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-[0.625rem] text-[var(--text-muted)] flex items-center justify-center gap-1 mb-0.5">
                        <Building2 size={11} />
                        <span>{isBn ? 'শ্রেণি' : 'Classes'}</span>
                      </div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        {pkg.maxClasses >= 999 ? (isBn ? 'অসীমিত' : 'Unlimited') : pkg.maxClasses}
                      </div>
                    </div>
                  </div>

                  {/* Features List */}
                  {pkg.features && pkg.features.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                      {pkg.features.slice(0, 4).map((f, idx) => {
                        const label = isBn && pkg.featuresBn && pkg.featuresBn[idx] ? pkg.featuresBn[idx] : f
                        return (
                          <div key={idx} className="flex items-center gap-2 text-[0.6875rem] text-[var(--text-secondary)]">
                            <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                            <span className="truncate">{label}</span>
                          </div>
                        )
                      })}
                      {pkg.features.length > 4 && (
                        <div className="text-[0.625rem] text-[var(--text-muted)] font-medium pl-5">
                          +{pkg.features.length - 4} {isBn ? 'টি আরো সুবিধা' : 'more features'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer & Controls */}
                <div className="pt-3 border-t border-[var(--border)]/60">
                  <div className="flex items-center justify-between mb-3 text-[0.6875rem]">
                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                      <Building2 size={12} />
                      <span>{isBn ? 'যুক্ত প্রতিষ্ঠান:' : 'Subscribed:'}</span>
                    </span>
                    <span className="font-bold text-[var(--text-primary)] px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)]">
                      {enrolled} {isBn ? 'টি' : 'schools'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPackage(pkg)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>{isBn ? 'সম্পাদনা' : 'Edit'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const targetType = isSystemType ? 'system_only' : 'cloud'
                        setDefaultPackage(pkg.id || pkg.name, targetType)
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-[0.6875rem] font-medium border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer bg-transparent"
                      title={isBn ? 'এই ক্যাটাগরির ডিফল্ট হিসেবে সেট করুন' : 'Set as default for this category'}
                    >
                      <ShieldCheck size={12} />
                      <span>{isBn ? 'ডিফল্ট করুন' : 'Make Default'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]/40 text-[0.625rem]">
                    <button
                      type="button"
                      onClick={() => updatePackage(pkg.id || pkg.name, { isActive: pkg.isActive === false ? true : false })}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer bg-transparent border-none p-0"
                    >
                      {pkg.isActive !== false ? (isBn ? 'নিষ্ক্রিয় করুন' : 'Deactivate') : (isBn ? 'সক্রিয় করুন' : 'Activate')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(pkg.id || pkg.name)}
                      className="text-red-500 hover:text-red-600 hover:underline cursor-pointer bg-transparent border-none p-0 flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      <span>{isBn ? 'মুছুন' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Package Form Modal (Create / Edit) */}
      {(isCreating || editingPackage) && (
        <PackageModal
          isOpen={true}
          onClose={() => {
            setIsCreating(false)
            setEditingPackage(null)
          }}
          packageData={editingPackage}
          isBn={isBn}
          onSave={(data) => {
            if (editingPackage) {
              updatePackage(editingPackage.id || editingPackage.name, data)
            } else {
              addPackage(data)
            }
            setIsCreating(false)
            setEditingPackage(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmDialog
          title={isBn ? 'প্যাকেজ মুছে ফেলুন' : 'Delete Package'}
          message={
            isBn
              ? `আপনি কি নিশ্চিতভাবে "${deleteTarget}" প্যাকেজটি মুছে ফেলতে চান? যে সকল প্রতিষ্ঠান বর্তমানে এটি ব্যবহার করছে তারা প্রভাবিত হতে পারে।`
              : `Are you sure you want to delete package "${deleteTarget}"? Institutions currently assigned to this package may be affected.`
          }
          isBn={isBn}
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Reset Defaults Confirmation */}
      {showResetConfirm && (
        <DeleteConfirmDialog
          title={isBn ? 'ডিফল্ট প্যাকেজ রিস্টোর' : 'Reset to Default Packages'}
          message={
            isBn
              ? 'এটি সকল প্যাকেজকে সিস্টেমের প্রারম্ভিক ডিফল্ট কনফিগারেশনে রিস্টোর করবে। আপনি কি এগিয়ে যেতে চান?'
              : 'This will reset all packages to their initial system default configuration. Do you wish to proceed?'
          }
          isBn={isBn}
          onConfirm={() => {
            resetPackagesToDefault()
            setShowResetConfirm(false)
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}

/* ─── Package Create / Edit Modal ─── */
interface PackageModalProps {
  isOpen: boolean
  onClose: () => void
  packageData: InstitutionPackage | null
  isBn: boolean
  onSave: (pkg: InstitutionPackage) => void
}

function PackageModal({ isOpen, onClose, packageData, isBn, onSave }: PackageModalProps) {
  if (!isOpen) return null

  const [name, setName] = useState(packageData?.name || '')
  const [nameBn, setNameBn] = useState(packageData?.nameBn || '')
  const [description, setDescription] = useState(packageData?.description || '')
  const [descriptionBn, setDescriptionBn] = useState(packageData?.descriptionBn || '')
  const [hostingType, setHostingType] = useState<PackageHostingType>(packageData?.hostingType || 'cloud')
  
  const [maxStudents, setMaxStudents] = useState<number>(packageData?.maxStudents ?? 200)
  const [unlimitedStudents, setUnlimitedStudents] = useState<boolean>((packageData?.maxStudents ?? 200) >= 9999)
  
  const [maxTeachers, setMaxTeachers] = useState<number>(packageData?.maxTeachers ?? 25)
  const [unlimitedTeachers, setUnlimitedTeachers] = useState<boolean>((packageData?.maxTeachers ?? 25) >= 9999)
  
  const [maxClasses, setMaxClasses] = useState<number>(packageData?.maxClasses ?? 999)
  const [unlimitedClasses, setUnlimitedClasses] = useState<boolean>((packageData?.maxClasses ?? 999) >= 999)
  
  const [price, setPrice] = useState<number>(packageData?.price ?? 1500)
  const [pricePerStudent, setPricePerStudent] = useState<number>(packageData?.pricePerStudent ?? 0)
  const [duration, setDuration] = useState<number>(packageData?.duration ?? 30)
  
  const [featuresText, setFeaturesText] = useState((packageData?.features || []).join('\n'))
  const [featuresBnText, setFeaturesBnText] = useState((packageData?.featuresBn || []).join('\n'))
  
  const [isPopular, setIsPopular] = useState<boolean>(packageData?.isPopular || false)
  const [isActive, setIsActive] = useState<boolean>(packageData?.isActive ?? true)
  const [isDefaultCloud, setIsDefaultCloud] = useState<boolean>(packageData?.isDefaultCloud || false)
  const [isDefaultSystemUse, setIsDefaultSystemUse] = useState<boolean>(packageData?.isDefaultSystemUse || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const parsedFeatures = featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const parsedFeaturesBn = featuresBnText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    const result: InstitutionPackage = {
      ...(packageData || {}),
      id: packageData?.id || `pkg-${Date.now()}`,
      name: name.trim(),
      nameBn: nameBn.trim() || name.trim(),
      description: description.trim() || undefined,
      descriptionBn: descriptionBn.trim() || undefined,
      hostingType,
      maxStudents: unlimitedStudents ? 9999 : Number(maxStudents),
      maxTeachers: unlimitedTeachers ? 9999 : Number(maxTeachers),
      maxClasses: unlimitedClasses ? 999 : Number(maxClasses),
      price: Number(price),
      pricePerStudent: Number(pricePerStudent),
      duration: Number(duration),
      features: parsedFeatures.length > 0 ? parsedFeatures : undefined,
      featuresBn: parsedFeaturesBn.length > 0 ? parsedFeaturesBn : undefined,
      isPopular,
      isActive,
      isDefaultCloud,
      isDefaultSystemUse,
    }

    onSave(result)
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--brand)]/15 text-[var(--brand)]">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {packageData
                  ? (isBn ? 'প্যাকেজ সম্পাদনা' : 'Edit Package')
                  : (isBn ? 'নতুন প্যাকেজ তৈরি' : 'Create New Package')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {isBn
                  ? 'হোস্টিং মডেল, কোটা এবং মূল্য নির্ধারণ করুন।'
                  : 'Define hosting architecture, capacity quotas, and subscription pricing.'}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Hosting Architecture Mode Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
              <Cpu size={14} className="text-[var(--brand)]" />
              <span>{isBn ? 'হোস্টিং আর্কিটেকচার / ব্যবহারের ধরন' : 'Hosting Architecture / Deployment Target'}</span>
              <span className="text-red-500">*</span>
            </label>
            <p className="text-[0.6875rem] text-[var(--text-muted)] mb-2.5">
              {isBn
                ? 'ইউজার প্রোভাইডার ক্লাউড ব্যবহার করবে নাকি নিজস্ব লোকাল পিসি/ভিপিএস সার্ভার ব্যবহার করবে?'
                : 'Does this package use Provider Cloud, or is it a System-Use package for Local PC / Personal VPS?'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  key: 'cloud',
                  icon: <Cloud size={16} />,
                  labelEn: 'Provider Cloud',
                  labelBn: 'প্রোভাইডার ক্লাউড',
                  descEn: 'Cloud hosting + software',
                  descBn: 'সেন্ট্রাল সার্ভার ও ক্লাউড',
                  color: 'text-blue-500 border-blue-500/30',
                },
                {
                  key: 'system_only',
                  icon: <Cpu size={16} />,
                  labelEn: 'System Use (Local PC & VPS)',
                  labelBn: 'সিস্টেম ব্যবহার (পিসি ও ভিপিএস)',
                  descEn: 'Runs on school PC/VPS',
                  descBn: 'জিরো ক্লাউড খরচ, নিজস্ব স্টোরেজ',
                  color: 'text-emerald-500 border-emerald-500/30',
                },
                {
                  key: 'local_pc',
                  icon: <Laptop size={16} />,
                  labelEn: 'Local PC Only',
                  labelBn: 'লোকাল পিসি (ভল্ট)',
                  descEn: 'Offline local computer',
                  descBn: 'শুধুমাত্র লোকাল পিসি',
                  color: 'text-amber-500 border-amber-500/30',
                },
                {
                  key: 'personal_vps',
                  icon: <Server size={16} />,
                  labelEn: 'Personal VPS Only',
                  labelBn: 'নিজস্ব ভিপিএস',
                  descEn: 'Custom VPS server',
                  descBn: 'প্রতিষ্ঠানের নিজস্ব সার্ভার',
                  color: 'text-cyan-500 border-cyan-500/30',
                },
                {
                  key: 'all',
                  icon: <Globe size={16} />,
                  labelEn: 'Universal (All)',
                  labelBn: 'সকল হোস্টিংয়ে প্রযোজ্য',
                  descEn: 'Works on any mode',
                  descBn: 'যে কোনো আর্কিটেকচার',
                  color: 'text-purple-500 border-purple-500/30',
                },
              ].map((item) => {
                const isSelected = hostingType === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setHostingType(item.key as PackageHostingType)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 ring-1 ring-[var(--brand)] shadow-sm'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={isSelected ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}>
                        {item.icon}
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {isBn ? item.labelBn : item.labelEn}
                      </span>
                    </div>
                    <div className="text-[0.625rem] text-[var(--text-muted)] leading-tight">
                      {isBn ? item.descBn : item.descEn}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Package Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                {isBn ? 'প্যাকেজের নাম (English)' : 'Package Name (English)'}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard Cloud or Local PC Pro"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                {isBn ? 'প্যাকেজের নাম (বাংলা)' : 'Package Name (Bangla)'}
              </label>
              <input
                type="text"
                value={nameBn}
                onChange={(e) => setNameBn(e.target.value)}
                placeholder="যেমন: স্ট্যান্ডার্ড বা লোকাল পিসি প্রো"
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                {isBn ? 'বিবরণ (English)' : 'Description (English)'}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description of this package..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                {isBn ? 'বিবরণ (বাংলা)' : 'Description (Bangla)'}
              </label>
              <textarea
                rows={2}
                value={descriptionBn}
                onChange={(e) => setDescriptionBn(e.target.value)}
                placeholder="প্যাকেজের সংক্ষিপ্ত বিবরণ..."
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Pricing & Duration */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <CreditCard size={13} className="text-[var(--brand)]" />
              <span>{isBn ? 'মূল্য ও বিলিং মেয়াদ' : 'Pricing & Billing Duration'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[0.6875rem] font-semibold text-[var(--text-muted)] mb-1">
                  {isBn ? 'মূল্য (টাকা / ৳)' : 'Base Price (BDT / ৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[0.6875rem] font-semibold text-[var(--text-muted)] mb-1">
                  {isBn ? 'প্রতি শিক্ষার্থী ফি (৳)' : 'Per-Student Fee (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pricePerStudent}
                  onChange={(e) => setPricePerStudent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[0.6875rem] font-semibold text-[var(--text-muted)] mb-1">
                  {isBn ? 'মেয়াদ (দিন)' : 'Duration (Days)'}
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none cursor-pointer"
                >
                  <option value={30}>{isBn ? '১ মাস (৩০ দিন)' : '1 Month (30 days)'}</option>
                  <option value={90}>{isBn ? '৩ মাস (৯০ দিন)' : '3 Months (90 days)'}</option>
                  <option value={180}>{isBn ? '৬ মাস (১৮০ দিন)' : '6 Months (180 days)'}</option>
                  <option value={365}>{isBn ? '১ বছর (৩৬৫ দিন)' : '1 Year (365 days)'}</option>
                  <option value={0}>{isBn ? 'লাইফটাইম (এককালীন)' : 'Lifetime (One-Time)'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quotas & Limits */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
            <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[var(--brand)]" />
              <span>{isBn ? 'কোটা ও ধারণক্ষমতার সীমা' : 'Capacity Quotas & Limits'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Max Students */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[0.6875rem] font-semibold text-[var(--text-muted)]">
                    {isBn ? 'সর্বোচ্চ শিক্ষার্থী' : 'Max Students'}
                  </label>
                  <label className="text-[0.625rem] text-[var(--brand)] flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unlimitedStudents}
                      onChange={(e) => setUnlimitedStudents(e.target.checked)}
                      className="rounded"
                    />
                    <span>{isBn ? 'অসীমিত' : 'Unlimited'}</span>
                  </label>
                </div>
                <input
                  type="number"
                  min="10"
                  disabled={unlimitedStudents}
                  value={unlimitedStudents ? 9999 : maxStudents}
                  onChange={(e) => setMaxStudents(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Max Teachers */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[0.6875rem] font-semibold text-[var(--text-muted)]">
                    {isBn ? 'সর্বোচ্চ শিক্ষক' : 'Max Teachers'}
                  </label>
                  <label className="text-[0.625rem] text-[var(--brand)] flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unlimitedTeachers}
                      onChange={(e) => setUnlimitedTeachers(e.target.checked)}
                      className="rounded"
                    />
                    <span>{isBn ? 'অসীমিত' : 'Unlimited'}</span>
                  </label>
                </div>
                <input
                  type="number"
                  min="5"
                  disabled={unlimitedTeachers}
                  value={unlimitedTeachers ? 9999 : maxTeachers}
                  onChange={(e) => setMaxTeachers(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none disabled:opacity-50"
                />
              </div>

              {/* Max Classes */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[0.6875rem] font-semibold text-[var(--text-muted)]">
                    {isBn ? 'সর্বোচ্চ শ্রেণি' : 'Max Classes'}
                  </label>
                  <label className="text-[0.625rem] text-[var(--brand)] flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unlimitedClasses}
                      onChange={(e) => setUnlimitedClasses(e.target.checked)}
                      className="rounded"
                    />
                    <span>{isBn ? 'অসীমিত' : 'Unlimited'}</span>
                  </label>
                </div>
                <input
                  type="number"
                  min="1"
                  disabled={unlimitedClasses}
                  value={unlimitedClasses ? 999 : maxClasses}
                  onChange={(e) => setMaxClasses(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Features (One per line) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                {isBn ? 'ফিচার বা সুবিধাসমূহ (English - প্রতি লাইনে একটি)' : 'Key Features (English - one per line)'}
              </label>
              <textarea
                rows={4}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                placeholder={'Cloud Hosting\nDaily Automated Backups\nSMS Notifications\n24/7 Support'}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none font-mono text-[0.75rem]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                {isBn ? 'ফিচার বা সুবিধাসমূহ (বাংলা - প্রতি লাইনে একটি)' : 'Key Features (Bangla - one per line)'}
              </label>
              <textarea
                rows={4}
                value={featuresBnText}
                onChange={(e) => setFeaturesBnText(e.target.value)}
                placeholder={'ক্লাউড হোস্টিং\nদৈনিক ব্যাকআপ\nএসএমএস নোটিফিকেশন\n২৪/৭ সহায়তা'}
                className="w-full px-3.5 py-2 rounded-xl text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--brand)] focus:outline-none font-mono text-[0.75rem]"
              />
            </div>
          </div>

          {/* Flags & Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="rounded"
              />
              <span>{isBn ? 'জনপ্রিয় প্যাকেজ হিসেবে চিহ্নিত করুন' : 'Mark as Popular Package (Highlight)'}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              <span>{isBn ? 'প্যাকেজটি সক্রিয় রাখুন' : 'Keep package active for registration'}</span>
            </label>

            {hostingType === 'cloud' && (
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={isDefaultCloud}
                  onChange={(e) => setIsDefaultCloud(e.target.checked)}
                  className="rounded"
                />
                <span>{isBn ? 'প্রোভাইডার ক্লাউডের ডিফল্ট প্যাকেজ হিসেবে সেট করুন' : 'Set as default package for Provider Cloud registration'}</span>
              </label>
            )}

            {(hostingType === 'system_only' || hostingType === 'local_pc' || hostingType === 'personal_vps') && (
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={isDefaultSystemUse}
                  onChange={(e) => setIsDefaultSystemUse(e.target.checked)}
                  className="rounded"
                />
                <span>{isBn ? 'লোকাল পিসি ও ভিপিএস সিস্টেমের ডিফল্ট প্যাকেজ হিসেবে সেট করুন' : 'Set as default package for Local PC & VPS System-Use registration'}</span>
              </label>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] cursor-pointer bg-transparent"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer border-none shadow-sm hover:opacity-90 active:scale-95"
              style={{ background: 'var(--brand)' }}
            >
              {packageData ? (isBn ? 'সংরক্ষণ করুন' : 'Save Changes') : (isBn ? 'প্যাকেজ তৈরি করুন' : 'Create Package')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
