import { useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  CreditCard, Plus, Search, RefreshCcw,
  Cloud, Cpu, Building2, X, Laptop, Server, Globe, ShieldCheck, Sparkles
} from 'lucide-react'
import { useSuperAdminStore, type InstitutionPackage, type PackageHostingType } from '@/store/superAdminStore'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { useTabSlider } from '@/hooks/useTabSlider'
import { PricingPackageCard } from '@/components/shared/PricingPackageCard'

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

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  useTabSlider({ activeTab, tabRefs, sliderRef })

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

      {/* Top Stat Cards (Dashboard Cards Design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Packages */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--brand)' }}
          >
            <CreditCard size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[1.125rem] font-bold text-[var(--text-primary)] leading-tight truncate">
              {totalPackages}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap mt-0.5 font-medium">
              {isBn ? 'মোট প্যাকেজ' : 'Total Packages'}
            </div>
          </div>
        </div>

        {/* Card 2: Provider Cloud */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500"
          >
            <Cloud size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[1.125rem] font-bold text-blue-600 dark:text-blue-400 leading-tight truncate">
              {cloudPackages}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap mt-0.5 font-medium">
              {isBn ? 'প্রোভাইডার ক্লাউড' : 'Provider Cloud'}
            </div>
          </div>
        </div>

        {/* Card 3: System Use Only */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500"
          >
            <Cpu size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[1.125rem] font-bold text-emerald-600 dark:text-emerald-400 leading-tight truncate">
              {systemPackages}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap mt-0.5 font-medium">
              {isBn ? 'সিস্টেম ব্যবহার (লোকাল/ভিপিএস)' : 'System Use Only'}
            </div>
          </div>
        </div>

        {/* Card 4: Enrolled Institutions */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-purple-500/10 text-purple-500"
          >
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-[1.125rem] font-bold text-[var(--text-primary)] leading-tight truncate">
              {institutions.length}
            </div>
            <div className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap mt-0.5 font-medium">
              {isBn ? 'নিবন্ধিত প্রতিষ্ঠান' : 'Enrolled Schools'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Architecture Mode Tabs with Smooth Slider Animation */}
        <div className="relative flex items-center p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] overflow-x-auto scrollbar-none w-fit max-w-full">
          {/* Smooth Sliding Pill Indicator */}
          <div
            ref={sliderRef}
            className="absolute top-1 bottom-1 rounded-lg bg-[var(--surface)] shadow-sm [transition:width_250ms_cubic-bezier(0.4,0,0.2,1),transform_250ms_cubic-bezier(0.4,0,0.2,1)] z-0 pointer-events-none border border-[var(--border)]/70"
          />

          <button
            type="button"
            ref={(el) => {
              if (el) tabRefs.current.set('all', el)
              else tabRefs.current.delete('all')
            }}
            onClick={() => setActiveTab('all')}
            className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer border-none shrink-0 ${
              activeTab === 'all'
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            <span>{isBn ? 'সকল প্যাকেজ' : 'All Packages'}</span>
            <span className={`text-[0.625rem] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'all' ? 'bg-[var(--brand)]/15 text-[var(--brand)]' : 'bg-[var(--border)] text-[var(--text-muted)]'
            }`}>
              {totalPackages}
            </span>
          </button>

          <button
            type="button"
            ref={(el) => {
              if (el) tabRefs.current.set('cloud', el)
              else tabRefs.current.delete('cloud')
            }}
            onClick={() => setActiveTab('cloud')}
            className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer border-none shrink-0 ${
              activeTab === 'cloud'
                ? 'text-blue-500'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            <Cloud size={13} />
            <span>{isBn ? 'প্রোভাইডার ক্লাউড' : 'Provider Cloud'}</span>
            <span className={`text-[0.625rem] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'cloud' ? 'bg-blue-500/15 text-blue-500' : 'bg-[var(--border)] text-[var(--text-muted)]'
            }`}>
              {cloudPackages}
            </span>
          </button>

          <button
            type="button"
            ref={(el) => {
              if (el) tabRefs.current.set('system_only', el)
              else tabRefs.current.delete('system_only')
            }}
            onClick={() => setActiveTab('system_only')}
            className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer border-none shrink-0 ${
              activeTab === 'system_only'
                ? 'text-emerald-500'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent'
            }`}
          >
            <Cpu size={13} />
            <span>{isBn ? 'সিস্টেম ব্যবহার (লোকাল পিসি ও ভিপিএস)' : 'System Use (Local PC & VPS)'}</span>
            <span className={`text-[0.625rem] px-1.5 py-0.5 rounded-full font-bold transition-colors ${
              activeTab === 'system_only' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-[var(--border)] text-[var(--text-muted)]'
            }`}>
              {systemPackages}
            </span>
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
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors shadow-2xs"
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            const enrolled = packageUsage[pkg.name.toLowerCase()] || 0
            const isSystemType = pkg.hostingType === 'system_only' || pkg.hostingType === 'local_pc' || pkg.hostingType === 'personal_vps'
            const isDefault = isSystemType ? pkg.isDefaultSystemUse : pkg.isDefaultCloud

            return (
              <PricingPackageCard
                key={pkg.id || pkg.name}
                pkg={pkg}
                isBn={isBn}
                mode="superadmin"
                enrolledCount={enrolled}
                isDefault={Boolean(isDefault)}
                onEdit={(p) => setEditingPackage(p)}
                onDelete={(p) => setDeleteTarget(p.id || p.name)}
                onToggleActive={(p) =>
                  updatePackage(p.id || p.name, {
                    isActive: p.isActive === false ? true : false,
                  })
                }
                onSetDefault={(p) => {
                  const targetType = isSystemType ? 'system_only' : 'cloud'
                  setDefaultPackage(p.id || p.name, targetType)
                }}
              />
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

  // Realtime preview of the package for the live card preview column
  const previewPackage: InstitutionPackage = useMemo(() => {
    const parsedFeatures = featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const parsedFeaturesBn = featuresBnText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    return {
      ...(packageData || {}),
      id: packageData?.id || 'preview-pkg',
      name: name.trim() || 'Package Name',
      nameBn: nameBn.trim() || name.trim() || 'প্যাকেজের নাম',
      description: description.trim() || undefined,
      descriptionBn: descriptionBn.trim() || undefined,
      hostingType,
      maxStudents: unlimitedStudents ? 9999 : Number(maxStudents) || 200,
      maxTeachers: unlimitedTeachers ? 9999 : Number(maxTeachers) || 25,
      maxClasses: unlimitedClasses ? 999 : Number(maxClasses) || 999,
      price: Number(price) || 0,
      pricePerStudent: Number(pricePerStudent) || 0,
      duration: Number(duration) || 30,
      features: parsedFeatures.length > 0 ? parsedFeatures : undefined,
      featuresBn: parsedFeaturesBn.length > 0 ? parsedFeaturesBn : undefined,
      isPopular,
      isActive,
      isDefaultCloud,
      isDefaultSystemUse,
    }
  }, [
    packageData,
    name,
    nameBn,
    description,
    descriptionBn,
    hostingType,
    unlimitedStudents,
    maxStudents,
    unlimitedTeachers,
    maxTeachers,
    unlimitedClasses,
    maxClasses,
    price,
    pricePerStudent,
    duration,
    featuresText,
    featuresBnText,
    isPopular,
    isActive,
    isDefaultCloud,
    isDefaultSystemUse,
  ])

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="relative w-full max-w-[98vw] 2xl:max-w-[1560px] h-[95vh] rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[var(--brand)]/15 text-[var(--brand)] shadow-xs">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-primary)] m-0">
                  {packageData
                    ? (isBn ? 'প্যাকেজ সম্পাদনা' : 'Edit Package')
                    : (isBn ? 'নতুন প্যাকেজ তৈরি' : 'Create New Package')}
                </h3>
                {packageData?.name && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20">
                    {packageData.name}
                  </span>
                )}
              </div>
              <p className="text-[0.6875rem] text-[var(--text-muted)] mt-0.5 mb-0">
                {isBn
                  ? 'হোস্টিং আর্কিটেকচার, কোটা সীমা, লাইভ প্রিভিউ এবং সাবস্ক্রিপশন মূল্য নির্ধারণ করুন।'
                  : 'Define deployment architecture, quotas, live card preview, and subscription pricing.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] cursor-pointer border border-[var(--border)] bg-[var(--surface)] transition-colors shadow-2xs"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
              {/* Left Column: Form Settings (8 cols on XL, 7 cols on LG) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
              </div>

              {/* Right Column: Live Card Preview Sticky Column (4 cols on XL, 5 cols on LG) */}
              <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-0 space-y-3">
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                      <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                      <span>{isBn ? 'রিয়েলটাইম কার্ড প্রিভিউ' : 'Live Card Preview'}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand)]/15 text-[var(--brand)] border border-[var(--brand)]/20">
                      {isBn ? 'ইনস্টিটিউট ভিউ' : 'Institution View'}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] text-[var(--text-muted)] mb-3 leading-relaxed">
                    {isBn
                      ? 'প্রতিষ্ঠানের প্যাকেজ ও বিল পেমেন্ট পেজে এটি যেভাবে প্রদর্শিত হবে:'
                      : 'How this plan looks to schools on their package & billing page:'}
                  </p>
                  
                  {/* Real-time PricingPackageCard */}
                  <div className="scale-95 sm:scale-100 origin-top">
                    <PricingPackageCard
                      pkg={previewPackage}
                      isBn={isBn}
                      mode="institution"
                      variant={isPopular ? 'dark' : 'auto'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between shrink-0">
            <div className="text-[0.6875rem] text-[var(--text-muted)] hidden sm:block font-medium">
              {isBn
                ? 'সংরক্ষণ করার সাথে সাথে সকল সংশ্লিষ্ট প্রতিষ্ঠান ও পেজে তথ্য আপডেট হবে।'
                : 'Changes saved here immediately update the billing and package catalogs.'}
            </div>
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)] cursor-pointer bg-transparent transition-colors"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl text-xs font-bold text-white cursor-pointer border-none shadow-sm hover:opacity-90 active:scale-95 transition-all"
                style={{ background: 'var(--brand)' }}
              >
                {packageData ? (isBn ? 'সংরক্ষণ করুন' : 'Save Changes') : (isBn ? 'প্যাকেজ তৈরি করুন' : 'Create Package')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent
}
