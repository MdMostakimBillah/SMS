import React, { useMemo } from 'react'
import {
  Check,
  X,
  Sparkles,
  Building2,
  ShieldCheck,
  Edit3,
  Trash2,
} from 'lucide-react'
import type { InstitutionPackage } from '@/store/superAdminStore'

export interface PricingPackageCardProps {
  pkg: InstitutionPackage
  isBn: boolean

  // Role / display mode
  mode?: 'institution' | 'superadmin'

  // Current institution & selection status
  isCurrent?: boolean
  isSelected?: boolean
  onSelect?: () => void

  // Billing duration and discount calculation
  billingMonths?: number
  discountPercent?: number

  // Visual Theme variant: 'auto' (popular = dark, others = light), 'dark', or 'light'
  variant?: 'auto' | 'dark' | 'light'

  // Super Admin specific props
  enrolledCount?: number
  isDefault?: boolean
  onEdit?: (pkg: InstitutionPackage) => void
  onDelete?: (pkg: InstitutionPackage) => void
  onToggleActive?: (pkg: InstitutionPackage) => void
  onSetDefault?: (pkg: InstitutionPackage) => void
}

/**
 * Standard feature definitions for School Management System tiers.
 * Used to render the green checkmarks (✓) and grey crosses (✕) across package tiers.
 */
interface TierFeatureDefinition {
  id: string
  labelEn: string
  labelBn: string
  isIncluded: (pkg: InstitutionPackage) => boolean
}

const TIER_FEATURES: TierFeatureDefinition[] = [
  {
    id: 'students_quota',
    labelEn: 'Student limit',
    labelBn: 'শিক্ষার্থী কোটা',
    isIncluded: () => true, // Customized label inside renderer
  },
  {
    id: 'teachers_quota',
    labelEn: 'Teacher limit',
    labelBn: 'শিক্ষক কোটা',
    isIncluded: () => true,
  },
  {
    id: 'core_sms',
    labelEn: 'Student & Guardian bio-profile portal',
    labelBn: 'শিক্ষার্থী ও অভিভাবক প্রোফাইল পোর্টাল',
    isIncluded: () => true,
  },
  {
    id: 'attendance',
    labelEn: 'Daily attendance & biometric tracking',
    labelBn: 'দৈনিক হাজিরা ও বায়োমেট্রিক ট্র্যাকিং',
    isIncluded: () => true,
  },
  {
    id: 'exams_results',
    labelEn: 'Exam, grading & marksheet generator',
    labelBn: 'পরীক্ষা, গ্রেডিং ও মার্কশিট জেনারেটর',
    isIncluded: () => true,
  },
  {
    id: 'fees_accounting',
    labelEn: 'Fees collection & money receipts',
    labelBn: 'ফি আদায় ও মানি রিসিট প্রিন্টিং',
    isIncluded: () => true,
  },
  {
    id: 'sms_notifications',
    labelEn: 'Automated SMS notification system',
    labelBn: 'স্বয়ংক্রিয় এসএমএস ও নোটিফিকেশন',
    isIncluded: (p) => {
      const name = (p.name || '').toLowerCase()
      if (name.includes('basic') && !name.includes('local pc')) return false
      return true
    },
  },
  {
    id: 'cloud_backups',
    labelEn: 'Daily automated cloud backups',
    labelBn: 'দৈনিক স্বয়ংক্রিয় ক্লাউড ব্যাকআপ',
    isIncluded: (p) => {
      const name = (p.name || '').toLowerCase()
      if (name.includes('basic') && !name.includes('local pc')) return false
      return true
    },
  },
  {
    id: 'custom_domain',
    labelEn: 'Custom subdomain & brand identity',
    labelBn: 'কাস্টম সাবডোমেইন ও ব্র্যান্ড পরিচয়',
    isIncluded: (p) => {
      const name = (p.name || '').toLowerCase()
      return Boolean(
        name.includes('premium') ||
        name.includes('enterprise') ||
        name.includes('vps') ||
        name.includes('lifetime') ||
        (p.maxStudents && p.maxStudents >= 800)
      )
    },
  },
  {
    id: 'dedicated_support',
    labelEn: 'Dedicated server & 24/7 VIP support',
    labelBn: 'ডেডিকেটেড সার্ভার ও ২৪/৭ ভিআইপি সাপোর্ট',
    isIncluded: (p) => {
      const name = (p.name || '').toLowerCase()
      return Boolean(
        name.includes('enterprise') ||
        name.includes('lifetime') ||
        (p.maxStudents && p.maxStudents >= 5000)
      )
    },
  },
]

export const PricingPackageCard: React.FC<PricingPackageCardProps> = ({
  pkg,
  isBn,
  mode = 'institution',
  isCurrent = false,
  isSelected = false,
  onSelect,
  billingMonths = 1,
  discountPercent = 0,
  variant = 'auto',
  enrolledCount = 0,
  isDefault = false,
  onEdit,
  onDelete,
  onToggleActive,
  onSetDefault,
}) => {
  // Determine if this card uses the dark contrast theme (matching Card 2 "Talent Pro" in reference)
  const isDarkCard =
    variant === 'dark' || (variant === 'auto' && pkg.isPopular && !isCurrent)

  const isLifetime = pkg.duration === 0 || pkg.hostingType === 'system_only'

  // Pricing calculations
  const baseMonthlyPrice = pkg.price || 0
  const effectiveDiscount = isLifetime ? 0 : discountPercent
  const hasDiscount = effectiveDiscount > 0
  const effectiveMonthlyPrice = hasDiscount
    ? Math.round(baseMonthlyPrice * (1 - effectiveDiscount / 100))
    : baseMonthlyPrice

  // Total billed note
  const billingNote = useMemo(() => {
    if (isLifetime) {
      return isBn ? 'আজীবন ব্যবহারের জন্য' : 'one-time payment'
    }
    if (billingMonths === 1) {
      return hasDiscount
        ? isBn
          ? `৳${effectiveMonthlyPrice.toLocaleString()} প্রতি মাসে বিল`
          : `৳${effectiveMonthlyPrice.toLocaleString()} billed monthly`
        : isBn
        ? 'মাসিক বিলিং'
        : 'billed monthly'
    }
    const totalAmount = effectiveMonthlyPrice * billingMonths
    if (billingMonths === 12) {
      return isBn
        ? `৳${totalAmount.toLocaleString()} বাৎসরিক বিল (${effectiveDiscount}% ছাড়)`
        : `৳${totalAmount.toLocaleString()} billed yearly (${effectiveDiscount}% off)`
    }
    return isBn
      ? `৳${totalAmount.toLocaleString()} (${billingMonths} মাসের বিল)`
      : `৳${totalAmount.toLocaleString()} billed for ${billingMonths} mo`
  }, [isLifetime, billingMonths, hasDiscount, effectiveMonthlyPrice, effectiveDiscount, isBn])

  // Curated 2-line descriptions
  const descriptionText = useMemo(() => {
    if (isBn && pkg.descriptionBn) return pkg.descriptionBn
    if (!isBn && pkg.description) return pkg.description

    const lower = (pkg.name || '').toLowerCase()
    if (lower.includes('basic')) {
      return isBn
        ? 'ছোট প্রতিষ্ঠানের শিক্ষার্থী ও দৈনিক কার্যক্রম সহজে পরিচালনার জন্য প্রয়োজনীয় বেসিক সুবিধা।'
        : 'Get started with essential tools to manage your school efficiently. Ideal for small institutions.'
    }
    if (lower.includes('standard')) {
      return isBn
        ? 'ক্রমবর্ধমান প্রতিষ্ঠানের জন্য সম্পূর্ণ সমাধান — স্বয়ংক্রিয় এসএমএস ও আধুনিক ডিজিটাল ফিচার সহ।'
        : 'A comprehensive solution for growing institutions, offering enhanced tools to streamline processes.'
    }
    if (lower.includes('premium')) {
      return isBn
        ? 'উচ্চ ধারণক্ষমতা, কাস্টম ডোমেইন ও অগ্রাধিকার ২৪/৭ সহায়তা সহ প্রতিষ্ঠিত স্কুলের জন্য সেরা প্যাকেজ।'
        : 'Maximize school performance with premium tools, custom domain and priority support for larger schools.'
    }
    if (lower.includes('enterprise')) {
      return isBn
        ? 'অসীম শিক্ষার্থী ও শিক্ষক কোটা, ডেডিকেটেড সার্ভার ক্লাস্টার এবং পূর্ণাঙ্গ কাস্টমাইজেশন সুবিধা।'
        : 'Dedicated cloud server, unlimited students and custom API access built for large educational networks.'
    }
    if (lower.includes('local pc')) {
      return isBn
        ? 'প্রোভাইডার ক্লাউড খরচ ছাড়া নিজস্ব লোকাল পিসিতে অফলাইন ব্যবহারের জন্য আজীবন লাইসেন্স।'
        : 'Offline software installation for single PC vault with zero recurring cloud fees and full data privacy.'
    }
    if (lower.includes('vps')) {
      return isBn
        ? 'প্রতিষ্ঠানের নিজস্ব প্রাইভেট ভিপিএস সার্ভারে হোস্ট করার জন্য পূর্ণ ডাটাবেজ নিয়ন্ত্রণ ও লাইসেন্স।'
        : 'Self-hosted private VPS deployment with dedicated database control and institutional backups.'
    }
    return isBn
      ? 'আপনার প্রতিষ্ঠানের চাহিদা অনুযায়ী তৈরি নির্ভরযোগ্য স্কুল ম্যানেজমেন্ট প্যাকেজ।'
      : 'Tailored school management package designed to fit your operational requirements perfectly.'
  }, [pkg, isBn])

  // Build the checklist items
  const featureList = useMemo(() => {
    const list: Array<{ label: string; isIncluded: boolean }> = []

    // 1. Quota features
    const maxStudents = pkg.maxStudents ?? 999
    const studentLabel =
      maxStudents >= 9999
        ? isBn
          ? 'অসীম শিক্ষার্থী ডাটাবেজ'
          : 'Unlimited student capacity'
        : isBn
        ? `${maxStudents.toLocaleString()} শিক্ষার্থী পর্যন্ত কোটা`
        : `Manage up to ${maxStudents.toLocaleString()} students`
    list.push({ label: studentLabel, isIncluded: true })

    const maxTeachers = pkg.maxTeachers ?? 99
    const teacherLabel =
      maxTeachers >= 9999
        ? isBn
          ? 'অসীম শিক্ষক ও স্টাফ কোটা'
          : 'Unlimited teachers & staff'
        : isBn
        ? `${maxTeachers.toLocaleString()} শিক্ষক ও স্টাফ কোটা`
        : `Up to ${maxTeachers.toLocaleString()} teachers & staff`
    list.push({ label: teacherLabel, isIncluded: true })

    // 2. Standard TIER features
    TIER_FEATURES.slice(2).forEach((tf) => {
      const inc = tf.isIncluded(pkg)
      list.push({
        label: isBn ? tf.labelBn : tf.labelEn,
        isIncluded: inc,
      })
    })

    // 3. Custom features if any
    if (pkg.features && pkg.features.length > 0) {
      pkg.features.forEach((cf, idx) => {
        const text = isBn && pkg.featuresBn && pkg.featuresBn[idx] ? pkg.featuresBn[idx] : cf
        // Avoid duplicate labels
        if (!list.some((it) => it.label.toLowerCase() === text.toLowerCase())) {
          list.push({ label: text, isIncluded: true })
        }
      })
    }

    return list
  }, [pkg, isBn])

  return (
    <div
      onClick={() => {
        if (mode === 'institution' && onSelect) {
          onSelect()
        }
      }}
      className={`group relative rounded-[28px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 ${
        mode === 'institution' ? 'cursor-pointer' : ''
      } ${
        // Dark contrast theme card (Card 2 "Talent Pro" style)
        isDarkCard
          ? 'bg-[#181a20] text-white shadow-xl shadow-black/20 border-2 border-yellow-500/30 ring-1 ring-yellow-500/20 hover:border-yellow-400'
          : // Light / theme surface card (Card 1 & 3 style)
          isCurrent
          ? 'bg-[var(--surface)] text-[var(--text-primary)] border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/10'
          : isSelected
          ? 'bg-[var(--surface)] text-[var(--text-primary)] border-2 border-[var(--brand)] shadow-lg shadow-[var(--brand)]/15 ring-4 ring-[var(--brand)]/10'
          : 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--brand)]/40 hover:shadow-md'
      }`}
    >
      {/* ─── Top Right Corner Notch / Badge (Reference Style) ─── */}
      {isCurrent ? (
        <div className="absolute top-0 right-0 z-10">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-bl-2xl rounded-tr-[26px] text-[0.6875rem] font-extrabold uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{isBn ? 'সক্রিয় প্ল্যান' : 'Active'}</span>
          </div>
        </div>
      ) : effectiveDiscount > 0 ? (
        <div className="absolute top-0 right-0 z-10">
          <div className="flex items-center gap-1 px-3.5 py-1.5 rounded-bl-2xl rounded-tr-[26px] text-[0.6875rem] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm">
            <Sparkles size={11} className="fill-current" />
            <span>
              {isBn ? `${effectiveDiscount}% ছাড়` : `Save ${effectiveDiscount}%`}
            </span>
          </div>
        </div>
      ) : pkg.isPopular ? (
        <div className="absolute top-0 right-0 z-10">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-bl-2xl rounded-tr-[26px] text-[0.6875rem] font-bold tracking-wide shadow-sm ${
              isDarkCard
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-b border-l border-emerald-500/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{isBn ? 'জনপ্রিয়' : 'Popular'}</span>
          </div>
        </div>
      ) : null}

      <div>
        {/* ─── Plan Title (Centered Bold Sans-serif) ─── */}
        <div className="text-center pt-1 mb-2">
          <h3
            className={`text-[1.1875rem] sm:text-[1.25rem] font-extrabold tracking-tight m-0 ${
              isDarkCard ? 'text-white' : 'text-[var(--text-primary)]'
            }`}
          >
            {isBn ? pkg.nameBn || pkg.name : pkg.name}
          </h3>
          {/* Subtitle tag for deployment type if applicable */}
          <span
            className={`text-[0.6875rem] font-semibold uppercase tracking-wider block mt-1 ${
              isDarkCard ? 'text-zinc-400' : 'text-[var(--text-muted)]'
            }`}
          >
            {pkg.hostingType === 'system_only' || isLifetime
              ? isBn
                ? 'আজীবন লাইসেন্স'
                : 'Lifetime System'
              : pkg.hostingType === 'local_pc'
              ? isBn
                ? 'লোকাল পিসি (ভল্ট)'
                : 'Local PC'
              : pkg.hostingType === 'personal_vps'
              ? isBn
                ? 'পার্সোনাল ভিপিএস'
                : 'Personal VPS'
              : isBn
              ? 'প্রোভাইডার ক্লাউড'
              : 'Cloud Hosted'}
          </span>
        </div>

        {/* ─── Centered Price Block (With Strikethrough & Subtitle) ─── */}
        <div className="my-3 text-center">
          <div className="inline-flex items-baseline justify-center gap-2">
            {hasDiscount && (
              <span
                className={`line-through text-lg sm:text-xl font-bold ${
                  isDarkCard ? 'text-zinc-500' : 'text-[var(--text-muted)] opacity-60'
                }`}
              >
                ৳{baseMonthlyPrice.toLocaleString()}
              </span>
            )}
            <span
              className={`text-3xl sm:text-[2.25rem] font-black tracking-tight leading-none ${
                isDarkCard
                  ? 'text-amber-400'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              ৳{effectiveMonthlyPrice.toLocaleString()}
            </span>
            <div
              className={`text-left text-xs leading-tight ${
                isDarkCard ? 'text-zinc-300' : 'text-[var(--text-muted)]'
              }`}
            >
              <div className="font-semibold">
                / {isLifetime ? (isBn ? 'এককালীন' : 'lifetime') : (isBn ? 'মাস' : 'month')}
              </div>
              <div
                className={`text-[0.625rem] font-medium ${
                  isDarkCard ? 'text-zinc-400' : 'text-[var(--text-secondary)]'
                }`}
              >
                {billingNote}
              </div>
            </div>
          </div>

          {pkg.pricePerStudent > 0 && (
            <div
              className={`text-[0.6875rem] font-semibold mt-1.5 ${
                isDarkCard ? 'text-amber-300/90' : 'text-[var(--brand)]'
              }`}
            >
              + ৳{pkg.pricePerStudent} {isBn ? 'প্রতি শিক্ষার্থী / মাস' : 'per student / month'}
            </div>
          )}
        </div>

        {/* ─── 2-Line Centered Description ─── */}
        <p
          className={`text-[0.8125rem] text-center leading-relaxed mb-4 min-h-[2.5rem] px-2 ${
            isDarkCard ? 'text-zinc-300' : 'text-[var(--text-muted)]'
          }`}
        >
          {descriptionText}
        </p>

        {/* ─── Dotted / Dashed Divider Line ─── */}
        <div
          className={`my-4 border-t border-dotted ${
            isDarkCard ? 'border-zinc-700/80' : 'border-[var(--border)]'
          }`}
        />

        {/* ─── Feature Checklist (Green Checks & Grey Crosses) ─── */}
        <div className="space-y-2.5 mb-6">
          {featureList.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-[0.8125rem]">
              {item.isIncluded ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check size={11} strokeWidth={3} />
                </div>
              ) : (
                <div
                  className={`w-4 h-4 flex items-center justify-center shrink-0 ${
                    isDarkCard ? 'text-zinc-600' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <X size={13} strokeWidth={2.5} />
                </div>
              )}
              <span
                className={`truncate ${
                  item.isIncluded
                    ? isDarkCard
                      ? 'text-zinc-100 font-medium'
                      : 'text-[var(--text-secondary)] font-medium'
                    : isDarkCard
                    ? 'text-zinc-500 line-through opacity-75'
                    : 'text-gray-400 dark:text-gray-500 line-through opacity-75'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bottom Actions / Pill Button ─── */}
      <div className="pt-2">
        {mode === 'institution' ? (
          // Institution Checkout View
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (onSelect) onSelect()
            }}
            className={`w-full py-2.5 px-6 rounded-full text-xs sm:text-[0.8125rem] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 ${
              isCurrent
                ? isDarkCard
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface)]'
                : isSelected
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                : isDarkCard
                ? 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-md font-extrabold'
                : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 shadow-sm'
            }`}
          >
            {isCurrent ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {isSelected
                    ? isBn
                      ? 'বর্তমান প্ল্যান (নির্বাচিত)'
                      : 'Current Plan (Selected)'
                    : isBn
                    ? 'বর্তমান প্ল্যান'
                    : 'Current Plan'}
                </span>
              </>
            ) : isSelected ? (
              <>
                <Check size={14} strokeWidth={3} />
                <span>{isBn ? 'নির্বাচিত প্ল্যান' : 'Selected Plan'}</span>
              </>
            ) : (
              <span>{isBn ? 'প্ল্যান নির্বাচন করুন' : 'Select Plan'}</span>
            )}
          </button>
        ) : (
          // Super Admin View (Manage Package)
          <div className="space-y-2.5">
            {/* Meta Row: Enrolled count + Active status toggle */}
            <div className="flex items-center justify-between text-xs px-1">
              <span
                className={`flex items-center gap-1.5 text-[0.6875rem] font-medium ${
                  isDarkCard ? 'text-zinc-400' : 'text-[var(--text-muted)]'
                }`}
              >
                <Building2 size={12} />
                <span>{isBn ? 'যুক্ত প্রতিষ্ঠান:' : 'Subscribed:'}</span>
                <strong
                  className={`font-bold ${
                    isDarkCard ? 'text-white' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {enrolledCount} {isBn ? 'টি' : 'schools'}
                </strong>
              </span>

              {onToggleActive && (
                <button
                  type="button"
                  onClick={() => onToggleActive(pkg)}
                  className={`flex items-center gap-1.5 text-[0.6875rem] font-semibold cursor-pointer bg-transparent border-none p-0 transition-colors ${
                    isDarkCard
                      ? 'text-zinc-300 hover:text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                  title={
                    pkg.isActive !== false
                      ? isBn
                        ? 'নিষ্ক্রিয় করতে ক্লিক করুন'
                        : 'Click to deactivate'
                      : isBn
                      ? 'সক্রিয় করতে ক্লিক করুন'
                      : 'Click to activate'
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      pkg.isActive !== false ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  <span>
                    {pkg.isActive !== false
                      ? isBn
                        ? 'সক্রিয়'
                        : 'Active'
                      : isBn
                      ? 'নিষ্ক্রিয়'
                      : 'Inactive'}
                  </span>
                </button>
              )}
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(pkg)}
                  className={`flex-1 py-2 px-3 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs ${
                    isDarkCard
                      ? 'bg-white text-zinc-950 hover:bg-zinc-100'
                      : 'bg-[var(--brand)] text-white hover:opacity-95'
                  }`}
                >
                  <Edit3 size={13} />
                  <span>{isBn ? 'সম্পাদনা' : 'Edit'}</span>
                </button>
              )}

              {onSetDefault && (
                <button
                  type="button"
                  onClick={() => onSetDefault(pkg)}
                  className={`py-2 px-3 rounded-full text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    isDefault
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-500 cursor-default'
                      : isDarkCard
                      ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] bg-transparent'
                  }`}
                  title={
                    isBn
                      ? 'এই ক্যাটাগরির ডিফল্ট হিসেবে সেট করুন'
                      : 'Set as default for this category'
                  }
                >
                  <ShieldCheck size={13} />
                  <span>{isBn ? 'ডিফল্ট করুন' : 'Make Default'}</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(pkg)}
                  aria-label={isBn ? 'মুছুন' : 'Delete'}
                  className="py-2 px-3 rounded-full text-xs font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-1"
                  title={isBn ? 'মুছুন' : 'Delete'}
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">{isBn ? 'মুছুন' : 'Delete'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
