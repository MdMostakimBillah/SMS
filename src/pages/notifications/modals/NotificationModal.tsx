import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Link as LinkIcon,
  Send,
  Sparkles,
  CreditCard,
  GraduationCap,
  Megaphone,
  Globe,
  Building2,
  Search,
  Check,
} from 'lucide-react'
import { useNotificationStore, notificationId, type Notification, type NotificationType, type NotificationCategory } from '@/store/notificationStore'
import { useSuperAdminStore, PACKAGES, type Institution, type InstitutionStatus } from '@/store/superAdminStore'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'

const inputCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10'
const textareaCls = 'w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.8125rem] font-[inherit] outline-none transition-all duration-200 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/10 resize-none'
const labelCls = 'block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.03em] mb-[5px]'

const CATEGORY_OPTIONS: { value: NotificationCategory; label: string; labelBn: string; icon: typeof Sparkles }[] = [
  { value: 'system', label: 'System & Software Update', labelBn: 'সফটওয়্যার ও সিস্টেম আপডেট', icon: Sparkles },
  { value: 'billing', label: 'Payment & Billing', labelBn: 'পেমেন্ট ও বিলিং', icon: CreditCard },
  { value: 'academic', label: 'Academic & Operations', labelBn: 'একাডেমিক ও কার্যক্রম', icon: GraduationCap },
  { value: 'general', label: 'General Announcement', labelBn: 'সাধারণ ঘোষণা', icon: Megaphone },
]

const TYPE_OPTIONS: { value: NotificationType; label: string; labelBn: string; icon: typeof Info; color: string; bg: string }[] = [
  { value: 'info', label: 'Info', labelBn: 'তথ্য', icon: Info, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)' },
  { value: 'success', label: 'Success', labelBn: 'সফল', icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-light)' },
  { value: 'warning', label: 'Warning', labelBn: 'সতর্কতা', icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-light)' },
  { value: 'error', label: 'Alert / Error', labelBn: 'জরুরি / ত্রুটি', icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)' },
]

const QUICK_LINKS = [
  { label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', path: '/dashboard' },
  { label: 'Exams', labelBn: 'পরীক্ষা', path: '/exams' },
  { label: 'Finance', labelBn: 'অর্থ', path: '/finance' },
  { label: 'Settings', labelBn: 'সেটিংস', path: '/settings' },
  { label: 'Attendance', labelBn: 'উপস্থিতি', path: '/attendance' },
  { label: 'Notice Board', labelBn: 'নোটিশ', path: '/notice' },
]

interface Props {
  existing?: Notification | null
  onSaved: () => void
  onClose: () => void
  bn: boolean
}

export function NotificationModal({ existing, onSaved, onClose, bn }: Props) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const updateNotification = useNotificationStore((s) => s.updateNotification)
  const broadcastNotification = useNotificationStore((s) => s.broadcastNotification)
  const storeInstitutions = useSuperAdminStore((s) => s.institutions) ?? []

  // Target audience state
  const [targetType, setTargetType] = useState<'all' | 'specific'>(
    existing?.targetType || (existing?.broadcastToAll === false && existing?.targetInstitutions?.length ? 'specific' : 'all')
  )
  const [selectedInstIds, setSelectedInstIds] = useState<string[]>(
    existing?.targetInstitutions || []
  )
  const [instSearch, setInstSearch] = useState('')

  const [category, setCategory] = useState<NotificationCategory>(existing?.category || 'system')
  const [type, setType] = useState<NotificationType>(existing?.type || 'info')
  const [title, setTitle] = useState(existing?.title || '')
  const [titleBn, setTitleBn] = useState(existing?.titleBn || '')
  const [message, setMessage] = useState(existing?.message || '')
  const [messageBn, setMessageBn] = useState(existing?.messageBn || '')
  const [link, setLink] = useState(existing?.link || '')
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true
    if (isSuperAdmin) {
      authApi.getSchools().then((dbSchools) => {
        if (!active || !Array.isArray(dbSchools) || dbSchools.length === 0) return
        const currentInsts = useSuperAdminStore.getState().institutions || []
        const mapped: Institution[] = dbSchools.map((item) => {
          const existing = currentInsts.find(
            (i) => i.id === item.id || i.slug === item.slug || i.subdomain === item.domain
          )
          const sName = item.name || 'School'
          const sSlug = item.slug || item.domain || sName.toLowerCase().replace(/[^a-z0-9]/g, '-')
          const pkg = existing?.package || PACKAGES[0]
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
      }).catch(() => {})
    }
    return () => {
      active = false
    }
  }, [isSuperAdmin])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Discover all registered and local institutions
  const availableInstitutions = useMemo(() => {
    const list = [...storeInstitutions]
    const idSet = new Set(list.map((i) => i.id))
    const slugSet = new Set(list.map((i) => i.slug))

    try {
      const raw = localStorage.getItem('edutech_super_admin')
      if (raw) {
        const parsed = JSON.parse(raw)
        const persistedInsts = parsed.state?.institutions || []
        for (const inst of persistedInsts) {
          if (inst && !idSet.has(inst.id) && !slugSet.has(inst.slug)) {
            list.push(inst)
            idSet.add(inst.id)
            slugSet.add(inst.slug)
          }
        }
      }
    } catch { /* ignore */ }

    try {
      const raw = localStorage.getItem('edutech-institutions')
      if (raw) {
        const parsed = JSON.parse(raw)
        const arr = Array.isArray(parsed) ? parsed : (parsed.state?.institutions || [])
        for (const inst of arr) {
          if (inst && !idSet.has(inst.id) && !slugSet.has(inst.slug)) {
            list.push(inst)
            idSet.add(inst.id)
            slugSet.add(inst.slug)
          }
        }
      }
    } catch { /* ignore */ }

    // Scan any edutech-classes_<slug> namespaces in localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith('edutech-classes_')) {
            const s = k.replace('edutech-classes_', '')
            if (s && s !== 'super-admin' && s !== 'edutech' && !slugSet.has(s)) {
              try {
                const rawCls = localStorage.getItem(k)
                if (rawCls) {
                  const p = JSON.parse(rawCls)
                  const cInst = p.state?.institution
                  if (cInst && !idSet.has(cInst.id) && !slugSet.has(cInst.slug || s)) {
                    list.push({
                      id: cInst.id || `inst-${s}`,
                      name: cInst.name || s,
                      nameBn: cInst.nameBn || cInst.name || s,
                      slug: cInst.slug || s,
                      subdomain: cInst.subdomain || s,
                      eiin: cInst.eiin || '',
                      brandColor: cInst.brandColor || '#6366f1',
                    } as any)
                    idSet.add(cInst.id || `inst-${s}`)
                    slugSet.add(cInst.slug || s)
                  }
                }
              } catch { /* ignore */ }
            }
          }
        }
      } catch { /* ignore */ }
    }

    // Fallback default institution if empty
    if (list.length === 0) {
      list.push({
        id: 'inst-daffodil',
        name: 'Daffodil Model High School',
        nameBn: 'ড্যাফোডিল মডেল হাই স্কুল',
        slug: 'daffodil',
        subdomain: 'daffodil',
        eiin: '134567',
        brandColor: '#6366f1',
      } as any)
    }

    return list
  }, [storeInstitutions])

  // Filtered institutions for search
  const filteredInstitutions = useMemo(() => {
    if (!instSearch.trim()) return availableInstitutions
    const q = instSearch.toLowerCase().trim()
    return availableInstitutions.filter(
      (i) =>
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.nameBn && i.nameBn.includes(q)) ||
        (i.eiin && i.eiin.includes(q)) ||
        (i.slug && i.slug.toLowerCase().includes(q)) ||
        (i.subdomain && i.subdomain.toLowerCase().includes(q))
    )
  }, [availableInstitutions, instSearch])

  const toggleInstitution = (idOrSlug: string) => {
    setSelectedInstIds((prev) => {
      const exists = prev.includes(idOrSlug)
      if (exists) {
        return prev.filter((id) => id !== idOrSlug)
      } else {
        return [...prev, idOrSlug]
      }
    })
    setErrors((prev) => ({ ...prev, target: false }))
  }

  const selectAllInstitutions = () => {
    const allIds = availableInstitutions.map((i) => i.id)
    setSelectedInstIds(allIds)
    setErrors((prev) => ({ ...prev, target: false }))
  }

  const clearSelectedInstitutions = () => {
    setSelectedInstIds([])
  }

  if (!isSuperAdmin) {
    return null
  }

  const validate = () => {
    const errs: Record<string, boolean> = {}
    if (!title.trim() && !titleBn.trim()) errs.title = true
    if (!message.trim() && !messageBn.trim()) errs.message = true
    if (targetType === 'specific' && selectedInstIds.length === 0) errs.target = true
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    const primaryTitle = title.trim() || titleBn.trim()
    const primaryTitleBn = titleBn.trim() || primaryTitle
    const primaryMessage = message.trim() || messageBn.trim()
    const primaryMessageBn = messageBn.trim() || primaryMessage
    const cleanLink = link.trim() || undefined
    const senderName = 'Super Admin (EduTech)'
    const senderRole = 'super_admin'

    // Resolve target institutions
    const targetedInstitutions = targetType === 'specific'
      ? availableInstitutions.filter(
          (i) =>
            selectedInstIds.includes(i.id) ||
            (i.slug && selectedInstIds.includes(i.slug)) ||
            (i.subdomain && selectedInstIds.includes(i.subdomain))
        )
      : []

    const targetIds = targetType === 'specific'
      ? Array.from(
          new Set([
            ...selectedInstIds,
            ...targetedInstitutions.flatMap((i) => [
              i.id,
              i.slug,
              i.subdomain,
              (i as any).eiin,
              i.name,
              i.name ? i.name.toLowerCase().trim() : '',
              i.nameBn,
              i.id ? String(i.id).replace('inst-', '') : '',
              i.id ? String(i.id).replace('sch_', '') : '',
              (i as any).domain,
            ].filter(Boolean)),
          ])
        )
      : []

    const targetNames = targetType === 'specific'
      ? Array.from(
          new Set(
            targetedInstitutions.flatMap((i) => [
              i.name,
              i.nameBn,
              bn ? i.nameBn || i.name : i.name,
            ].filter(Boolean) as string[])
          )
        )
      : []

    const isBroadcast = targetType === 'all'

    if (existing) {
      const updatedNotif: Notification = {
        ...existing,
        title: primaryTitle,
        titleBn: primaryTitleBn,
        message: primaryMessage,
        messageBn: primaryMessageBn,
        type,
        category,
        link: cleanLink,
        targetType: isBroadcast ? 'all' : 'specific',
        targetInstitutions: isBroadcast ? [] : targetIds,
        targetInstitutionNames: isBroadcast ? [] : targetNames,
        broadcastToAll: isBroadcast,
      }
      updateNotification(existing.id, updatedNotif)
      await broadcastNotification(updatedNotif)
    } else {
      const newNotif: Notification = {
        id: notificationId(),
        title: primaryTitle,
        titleBn: primaryTitleBn,
        message: primaryMessage,
        messageBn: primaryMessageBn,
        type,
        category,
        read: false,
        link: cleanLink,
        sender: senderName,
        senderRole,
        broadcastToAll: isBroadcast,
        targetType: isBroadcast ? 'all' : 'specific',
        targetInstitutions: isBroadcast ? [] : targetIds,
        targetInstitutionNames: isBroadcast ? [] : targetNames,
        createdAt: new Date().toISOString(),
      }

      await broadcastNotification(newNotif)
    }
    onSaved()
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-[var(--bg-primary)] rounded-2xl w-[36rem] max-w-[95vw] max-h-[90vh] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)]">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="text-[0.9375rem] font-bold text-[var(--text-primary)] m-0">
                {existing
                  ? (bn ? 'নোটিফিকেশন সম্পাদনা' : 'Edit Notification')
                  : (bn ? 'নতুন নোটিফিকেশন প্রেরণ' : 'Compose Notification')}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)] m-0">
                {bn ? 'সকল অথবা নির্দিষ্ট প্রতিষ্ঠানে সফটওয়্যার ও সিস্টেম আপডেট পাঠান' : 'Broadcast to all or target specific institutions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] cursor-pointer flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Target Audience Selector */}
          <div>
            <label className={labelCls}>
              {bn ? 'প্রাপক প্রতিষ্ঠান' : 'Target Audience'}
              <span className="text-[var(--red)] ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setTargetType('all')
                  setErrors((prev) => ({ ...prev, target: false }))
                }}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  targetType === 'all'
                    ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] font-semibold shadow-xs'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${targetType === 'all' ? 'bg-[var(--brand)] text-white' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>
                  <Globe size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[0.75rem] font-bold truncate">
                    {bn ? 'সকল প্রতিষ্ঠানে সম্প্রচার' : 'All Institutions'}
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-muted)] leading-tight mt-0.5">
                    {bn ? 'সব স্কুলের নোটিফিকেশন বোর্ডে যাবে' : 'Broadcast to all registered schools'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('specific')}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                  targetType === 'specific'
                    ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] font-semibold shadow-xs'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${targetType === 'specific' ? 'bg-[var(--brand)] text-white' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>
                  <Building2 size={15} />
                </div>
                <div className="min-w-0">
                  <div className="text-[0.75rem] font-bold truncate">
                    {bn ? 'নির্দিষ্ট প্রতিষ্ঠান' : 'Targeted Institution(s)'}
                  </div>
                  <div className="text-[0.625rem] text-[var(--text-muted)] leading-tight mt-0.5">
                    {bn ? 'শুধু বাছাইকৃত প্রতিষ্ঠানে প্রদর্শিত হবে' : 'Send only to selected school(s)'}
                  </div>
                </div>
              </button>
            </div>

            {/* Target Audience Summary & Specific Picker */}
            {targetType === 'all' ? (
              <div className="p-3 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Globe size={16} className="text-[var(--brand)] shrink-0" />
                  <div>
                    <div className="text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                      {bn ? 'সকল প্রতিষ্ঠানে সম্প্রচার' : 'Broadcast to all institutions'}
                    </div>
                    <div className="text-[0.6875rem] text-[var(--text-muted)]">
                      {bn ? 'সিস্টেম বা সফটওয়্যার আপডেট নোটিফিকেশন সব স্কুলের ড্যাশবোর্ডে যাবে' : 'Every active school will receive this notification immediately'}
                    </div>
                  </div>
                </div>
                <span className="text-[0.6875rem] font-bold px-2 py-0.5 rounded-full bg-[var(--brand)] text-white shrink-0">
                  {bn ? 'সকল প্রতিষ্ঠান' : 'All Institutes'}
                </span>
              </div>
            ) : (
              <div className={`p-3 rounded-xl border bg-[var(--bg-secondary)]/50 space-y-2.5 ${errors.target ? 'border-[var(--red)] ring-1 ring-[var(--red)]/20' : 'border-[var(--border)]'}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[140px]">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={instSearch}
                      onChange={(e) => setInstSearch(e.target.value)}
                      placeholder={bn ? 'প্রতিষ্ঠান খুঁজুন (নাম, EIIN)...' : 'Search school (name, EIIN)...'}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-[0.75rem] outline-none focus:border-[var(--brand)]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[0.6875rem]">
                    <button
                      type="button"
                      onClick={selectAllInstitutions}
                      className="px-2 py-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-colors cursor-pointer"
                    >
                      {bn ? 'সবগুলো নির্বাচন' : 'Select All'}
                    </button>
                    <button
                      type="button"
                      onClick={clearSelectedInstitutions}
                      className="px-2 py-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--red)] hover:border-[var(--red)] transition-colors cursor-pointer"
                    >
                      {bn ? 'মুছুন' : 'Clear'}
                    </button>
                  </div>
                </div>

                {/* Selected Chips */}
                {selectedInstIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]">
                    {selectedInstIds.map((id) => {
                      const inst = availableInstitutions.find((i) => i.id === id || i.slug === id || i.subdomain === id)
                      const name = inst ? (bn ? inst.nameBn || inst.name : inst.name) : id
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.6875rem] bg-[var(--brand)]/10 text-[var(--brand)] font-medium border border-[var(--brand)]/20"
                        >
                          <span className="truncate max-w-[12rem]">{name}</span>
                          <button
                            type="button"
                            onClick={() => toggleInstitution(id)}
                            className="hover:text-[var(--red)] cursor-pointer border-none bg-transparent p-0 flex items-center"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Institutions Checkbox List */}
                <div className="max-h-36 overflow-y-auto space-y-1 border border-[var(--border)] rounded-lg bg-[var(--bg-primary)] p-1">
                  {filteredInstitutions.length === 0 ? (
                    <div className="text-center py-3 text-[0.75rem] text-[var(--text-muted)]">
                      {bn ? 'কোনো প্রতিষ্ঠান পাওয়া যায়নি' : 'No institutions found'}
                    </div>
                  ) : (
                    filteredInstitutions.map((inst) => {
                      const isChecked = selectedInstIds.includes(inst.id) || (inst.slug && selectedInstIds.includes(inst.slug))
                      return (
                        <div
                          key={inst.id}
                          onClick={() => toggleInstitution(inst.id)}
                          className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer select-none text-[0.75rem] ${
                            isChecked
                              ? 'bg-[var(--brand)]/10 text-[var(--text-primary)] font-medium'
                              : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                              isChecked
                                ? 'bg-[var(--brand)] border-[var(--brand)] text-white'
                                : 'border-[var(--border)] bg-[var(--bg-primary)]'
                            }`}
                          >
                            {isChecked && <Check size={11} strokeWidth={3} />}
                          </div>

                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-[0.625rem] font-bold text-white shrink-0"
                            style={{ background: inst.brandColor || '#6366f1' }}
                          >
                            {(inst.name || 'S').charAt(0)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="truncate font-medium text-[var(--text-primary)]">
                              {bn ? inst.nameBn || inst.name : inst.name}
                            </div>
                            <div className="text-[0.625rem] text-[var(--text-muted)] truncate flex items-center gap-1.5">
                              {inst.eiin && <span>EIIN: {inst.eiin}</span>}
                              {inst.subdomain && <span>• {inst.subdomain}</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {errors.target && (
                  <div className="text-[0.6875rem] text-[var(--red)] flex items-center gap-1 pt-0.5 font-medium">
                    <AlertTriangle size={12} />
                    {bn ? 'অনুগ্রহ করে অন্তত একটি প্রতিষ্ঠান নির্বাচন করুন' : 'Please select at least one institution'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className={labelCls}>{bn ? 'বিভাগ / ক্যাটাগরি' : 'Notification Category'}</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((c) => {
                const Icon = c.icon
                const isSelected = category === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--brand)] font-semibold'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--brand)]/40'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="text-[0.75rem] truncate">{bn ? c.labelBn : c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notification Type Selector */}
          <div>
            <label className={labelCls}>{bn ? 'ধরন' : 'Alert Level'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = type === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-[var(--brand)] shadow-sm bg-[var(--brand)]/5'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--brand)]/40'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: opt.bg, color: opt.color }}>
                      <Icon size={12} />
                    </div>
                    <span className={`text-[0.75rem] ${isSelected ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] font-medium'}`}>
                      {bn ? opt.labelBn : opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                {bn ? 'শিরোনাম (ইংরেজি)' : 'Title (English)'}
                <span className="text-[var(--red)] ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. System Update / Payment Reminder"
                className={`${inputCls} ${errors.title ? 'border-[var(--red)] ring-1 ring-[var(--red)]/20' : ''}`}
              />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'শিরোনাম (বাংলা)' : 'Title (Bengali)'}</label>
              <input
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="যেমন: সফটওয়্যার আপডেট / পেমেন্ট তাগিদ"
                className={inputCls}
              />
            </div>
          </div>

          {/* Message Textareas */}
          <div className="space-y-3">
            <div>
              <label className={labelCls}>
                {bn ? 'বার্তা (ইংরেজি)' : 'Message (English)'}
                <span className="text-[var(--red)] ml-0.5">*</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter detailed notification content..."
                className={`${textareaCls} ${errors.message ? 'border-[var(--red)] ring-1 ring-[var(--red)]/20' : ''}`}
              />
            </div>
            <div>
              <label className={labelCls}>{bn ? 'বার্তা (বাংলা)' : 'Message (Bengali)'}</label>
              <textarea
                rows={3}
                value={messageBn}
                onChange={(e) => setMessageBn(e.target.value)}
                placeholder="বিস্তারিত বার্তা লিখুন..."
                className={textareaCls}
              />
            </div>
          </div>

          {/* Optional Action Link */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls}>{bn ? 'নেভিগেশন লিংক (ঐচ্ছিক)' : 'Action Link (Optional)'}</label>
              <span className="text-[0.625rem] text-[var(--text-muted)] flex items-center gap-1">
                <LinkIcon size={10} /> {bn ? 'ক্লিক করলে পেজে নিয়ে যাবে' : 'Directs user on click'}
              </span>
            </div>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /dashboard, /settings, /finance"
              className={inputCls}
            />
            {/* Quick Suggestions */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-[0.6875rem] text-[var(--text-muted)] mr-1">{bn ? 'দ্রুত লিংক:' : 'Quick:'}</span>
              {QUICK_LINKS.map((ql) => (
                <button
                  key={ql.path}
                  type="button"
                  onClick={() => setLink(ql.path)}
                  className={`text-[0.6875rem] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                    link === ql.path
                      ? 'bg-[var(--brand)] text-white border-[var(--brand)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--brand)]/50'
                  }`}
                >
                  {bn ? ql.labelBn : ql.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[0.75rem] font-medium text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors cursor-pointer border-none bg-transparent"
          >
            {bn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[var(--brand)] text-white text-[0.75rem] font-semibold hover:opacity-90 transition-opacity cursor-pointer border-none shadow-sm"
          >
            <Send size={13} />
            {existing ? (bn ? 'আপডেট করুন' : 'Update Notification') : (bn ? 'নোটিফিকেশন পাঠান' : 'Send Notification')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
