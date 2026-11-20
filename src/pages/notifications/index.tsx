import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Bell,
  Search,
  Plus,
  Trash2,
  CheckCheck,
  Clock,
  Sparkles,
  CreditCard,
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Building2,
} from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useNotificationStore, isNotificationForSchool, type Notification, type NotificationType, type NotificationCategory } from '@/store/notificationStore'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSubdomain } from '@/hooks/useSubdomain'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { getNavBase, getSuperAdminViewNavBase } from '@/lib/navUtils'
import { useTabSlider } from '@/hooks/useTabSlider'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { NotificationModal } from './modals/NotificationModal'
import { NotificationDetailModal } from './modals/NotificationDetailModal'

const inputCls = 'px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] transition-colors'

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Info; color: string; bg: string; label: string; labelBn: string }> = {
  info: { icon: Info, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)', label: 'Info', labelBn: 'তথ্য' },
  success: { icon: CheckCircle2, color: 'var(--green)', bg: 'var(--green-light)', label: 'Success', labelBn: 'সফল' },
  warning: { icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-light)', label: 'Warning', labelBn: 'সতর্কতা' },
  error: { icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)', label: 'Alert', labelBn: 'জরুরি' },
}

const CATEGORY_CONFIG: Record<NotificationCategory, { label: string; labelBn: string; color: string }> = {
  system: { label: 'System Update', labelBn: 'সিস্টেম আপডেট', color: 'var(--teal)' },
  billing: { label: 'Monthly Payment & Billing', labelBn: 'পেমেন্ট ও বিলিং', color: 'var(--amber)' },
  academic: { label: 'Academic', labelBn: 'একাডেমিক', color: 'var(--brand)' },
  general: { label: 'General', labelBn: 'সাধারণ', color: 'var(--text-muted)' },
}

export default function NotificationsPage() {
  const bn = useBn()
  const { canDelete, canEdit } = usePermission()
  const { isMobile } = useWindowSize()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { resolved } = useSubdomain()
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)

  const isSuperAdmin = user?.role === 'super_admin'
  const isViewing = isSuperAdmin && !!viewingInstitutionId
  const canCreateNotification = isSuperAdmin && !isViewing
  const viewingRole = isViewing ? (location.pathname.split('/')[3] || 'admin') : undefined
  const navBase = isViewing
    ? getSuperAdminViewNavBase(user, viewingRole)
    : isSuperAdmin
      ? '/super-admin/admin'
      : getNavBase(user, resolved)

  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const markUnread = useNotificationStore((s) => s.markUnread)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const deleteNotification = useNotificationStore((s) => s.deleteNotification)
  const clearAll = useNotificationStore((s) => s.clearAll)
  const syncFromServer = useNotificationStore((s) => s.syncFromServer)
  const checkAndGenerateSystemNotifications = useNotificationStore((s) => s.checkAndGenerateSystemNotifications)

  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'billing' | 'academic' | 'unread'>('all')
  const [search, setSearch] = useState('')
  const [viewNotification, setViewNotification] = useState<Notification | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)

  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const sliderRef = useRef<HTMLDivElement>(null)
  useTabSlider({ activeTab, tabRefs, sliderRef })

  useEffect(() => {
    const slug = sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug') || undefined
    void syncFromServer(slug)
    checkAndGenerateSystemNotifications(slug)
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [syncFromServer, checkAndGenerateSystemNotifications])

  const [searchParams, setSearchParams] = useSearchParams()
  const viewId = searchParams.get('view')

  useEffect(() => {
    if (viewId && notifications.length > 0) {
      const target = notifications.find((n) => n.id === viewId)
      if (target) {
        setViewNotification(target)
        if (!target.read) markRead(target.id)
        searchParams.delete('view')
        setSearchParams(searchParams, { replace: true })
      }
    }
  }, [viewId, notifications, markRead, searchParams, setSearchParams])

  const isSuperAdminView = isSuperAdmin && !isViewing

  // Visible notifications based on school context
  const visibleNotifications = useMemo(() => {
    if (isSuperAdminView) return notifications
    const currentSlug = sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug') || viewingInstitutionId || user?.subdomain || (user as any)?.schoolId
    const currentSchoolId = (user as any)?.schoolId || (user as any)?.institutionId || viewingInstitutionId

    return notifications.filter((n) =>
      isNotificationForSchool(n, {
        slug: currentSlug,
        id: currentSchoolId,
        subdomain: user?.subdomain,
        schoolId: (user as any)?.schoolId,
      })
    )
  }, [notifications, isSuperAdminView, viewingInstitutionId, user])

  // Unread counts
  const unreadTotal = useMemo(() => visibleNotifications.filter((n) => !n.read).length, [visibleNotifications])
  const unreadSystem = useMemo(() => visibleNotifications.filter((n) => !n.read && n.category === 'system').length, [visibleNotifications])
  const unreadBilling = useMemo(() => visibleNotifications.filter((n) => !n.read && n.category === 'billing').length, [visibleNotifications])
  const unreadAcademic = useMemo(() => visibleNotifications.filter((n) => !n.read && (n.category === 'academic' || (!n.category && n.type !== 'error'))).length, [visibleNotifications])

  const tabs = [
    { key: 'all', label: bn ? 'সকল নোটিফিকেশন' : 'All', icon: Bell, count: unreadTotal },
    { key: 'system', label: bn ? 'সফটওয়্যার ও সিস্টেম আপডেট' : 'Software & Updates', icon: Sparkles, count: unreadSystem },
    { key: 'billing', label: bn ? 'মাসিক পেমেন্ট ও বিলিং' : 'Monthly Payment & Billing', icon: CreditCard, count: unreadBilling },
    { key: 'academic', label: bn ? 'একাডেমিক ও কার্যক্রম' : 'Academic & Operations', icon: GraduationCap, count: unreadAcademic },
    { key: 'unread', label: bn ? 'অপঠিত' : 'Unread', icon: Clock, count: unreadTotal },
  ]

  const filtered = useMemo(() => {
    let list = [...visibleNotifications]

    // Tab filter
    if (activeTab === 'system') {
      list = list.filter((n) => n.category === 'system')
    } else if (activeTab === 'billing') {
      list = list.filter((n) => n.category === 'billing')
    } else if (activeTab === 'academic') {
      list = list.filter((n) => n.category === 'academic' || (!n.category && n.category !== 'system' && n.category !== 'billing'))
    } else if (activeTab === 'unread') {
      list = list.filter((n) => !n.read)
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.titleBn && n.titleBn.includes(q)) ||
          (n.message && n.message.toLowerCase().includes(q)) ||
          (n.messageBn && n.messageBn.includes(q)) ||
          (n.sender && n.sender.toLowerCase().includes(q))
      )
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [visibleNotifications, activeTab, search])

  const handleMarkAllRead = () => {
    if (isSuperAdminView) {
      markAllRead()
    } else {
      visibleNotifications.forEach((n) => {
        if (!n.read) markRead(n.id)
      })
    }
  }

  const handleClearAll = () => {
    if (isSuperAdminView) {
      clearAll()
    } else {
      visibleNotifications.forEach((n) => {
        deleteNotification(n.id)
      })
    }
    setShowClearConfirm(false)
  }

  useEffect(() => {
    setPage(1)
  }, [search, activeTab, perPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleNavigateToLink = (linkStr: string) => {
    if (linkStr.startsWith('/')) {
      if (navBase && !linkStr.startsWith(navBase) && !linkStr.startsWith('/i/') && !linkStr.startsWith('/super-admin/')) {
        navigate(`${navBase}${linkStr}`)
      } else {
        navigate(linkStr)
      }
    } else {
      navigate(linkStr)
    }
  }

  const handleCardClick = (n: Notification) => {
    if (!n.read) markRead(n.id)
    setViewNotification(n)
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
            {bn ? 'নোটিফিকেশন ও ঘোষণা' : 'Notifications & Announcements'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mt-0.5">
            {bn ? `মোট: ${visibleNotifications.length}টি নোটিফিকেশন` : `Total: ${visibleNotifications.length} notifications`}
            {unreadTotal > 0 && ` · ${unreadTotal} ${bn ? 'টি অপঠিত' : 'unread'}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadTotal > 0 && canEdit('notifications') && (
            <button
              onClick={() => handleMarkAllRead()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer bg-transparent"
            >
              <CheckCheck size={14} />
              {bn ? 'সব পড়া হয়েছে' : 'Mark All Read'}
            </button>
          )}

          {visibleNotifications.length > 0 && canDelete('notifications') && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.75rem] font-medium border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors cursor-pointer bg-transparent"
            >
              <Trash2 size={14} />
              {bn ? 'সব মুছুন' : 'Clear All'}
            </button>
          )}

          {canCreateNotification && (
            <button
              onClick={() => {
                setEditingNotification(null)
                setShowCompose(true)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.8125rem] font-medium text-white transition-colors cursor-pointer border-none shadow-sm"
              style={{ background: 'var(--brand)' }}
            >
              <Plus size={16} />
              {bn ? 'নতুন নোটিফিকেশন' : 'Create Notification'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs with Slider */}
      <div className="relative mb-4">
        <div ref={sliderRef} className="absolute bottom-0 h-[2px] bg-[var(--brand)] transition-all duration-200 rounded-full" style={{ zIndex: 1 }} />
        <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              ref={(el) => { if (el) tabRefs.current.set(tab.key, el) }}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[0.8125rem] font-medium transition-colors relative shrink-0 cursor-pointer border-none bg-transparent ${
                activeTab === tab.key ? 'text-[var(--brand)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0 rounded-full text-[0.625rem] font-bold text-white" style={{ background: 'var(--brand)' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={bn ? 'নোটিফিকেশন বা বার্তা খুঁজুন...' : 'Search notifications, updates, or billing alerts...'}
          className={inputCls + ' w-full pl-9'}
        />
      </div>

      {/* Notification List (Message Page Style) */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <Bell size={48} className="mb-3 opacity-30" />
          <p className="text-[0.9375rem] font-medium">
            {search
              ? (bn ? 'কোনো নোটিফিকেশন মেলেনি' : 'No notifications found')
              : activeTab === 'system'
                ? (bn ? 'কোনো সফটওয়্যার আপডেট নোটিফিকেশন নেই' : 'No system update notifications')
                : activeTab === 'billing'
                  ? (bn ? 'কোনো মাসিক পেমেন্ট বা বিলিং নোটিফিকেশন নেই' : 'No payment or billing alerts')
                  : activeTab === 'unread'
                    ? (bn ? 'সব নোটিফিকেশন পড়া হয়েছে' : 'All notifications have been read')
                    : (bn ? 'কোনো নোটিফিকেশন নেই' : 'No notifications available')}
          </p>
          {!search && (
            <p className="text-[0.75rem] mt-1 text-[var(--text-muted)]">
              {bn ? 'নতুন কোনো সিস্টেম বা বিলিং আপডেট আসলে এখানে প্রদর্শিত হবে' : 'New system announcements and alerts will appear here'}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((n) => {
            const typeConf = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
            const catConf = CATEGORY_CONFIG[n.category || 'general'] || CATEGORY_CONFIG.general
            const senderName = n.sender || (n.category === 'system' ? 'Super Admin' : n.category === 'billing' ? 'Billing Dept' : 'Admin')
            const displayTitle = (bn ? n.titleBn || n.title : n.title || n.titleBn) || ''
            const displayMessage = (bn ? n.messageBn || n.message : n.message || n.messageBn) || ''
            const formattedTime = getTimeAgo(n.createdAt, bn)

            return (
              <div
                key={n.id}
                onClick={() => handleCardClick(n)}
                className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  !n.read
                    ? 'border-[var(--brand)] bg-[var(--bg-secondary)] shadow-sm hover:border-[var(--brand)]'
                    : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)]/60 hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs"
                  style={{ background: typeConf.bg, color: typeConf.color }}
                >
                  <typeConf.icon size={17} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[0.8125rem] ${!n.read ? 'font-bold' : 'font-medium'} text-[var(--text-primary)] truncate`}>
                      {senderName}
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--brand)' }} />}

                    {/* Category Badge */}
                    <span
                      className="inline-flex items-center gap-1 text-[0.625rem] font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: `${catConf.color}18`, color: catConf.color }}
                    >
                      {bn ? catConf.labelBn : catConf.label}
                    </span>

                    {/* Alert Type Badge */}
                    <span
                      className="inline-flex items-center text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: typeConf.bg, color: typeConf.color }}
                    >
                      {bn ? typeConf.labelBn : typeConf.label}
                    </span>

                    {/* Target Audience Badge */}
                    {n.targetType === 'specific' ? (
                      <span
                        className="inline-flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500"
                        title={n.targetInstitutionNames?.join(', ') || 'Targeted'}
                      >
                        <Building2 size={10} />
                        {isSuperAdminView
                          ? `${bn ? 'টার্গেট: ' : 'Target: '}${n.targetInstitutionNames?.[0] || 'Specific'}${
                              (n.targetInstitutionNames?.length || 0) > 1
                                ? ` +${(n.targetInstitutionNames?.length || 0) - 1}`
                                : ''
                            }`
                          : (bn ? 'আপনার প্রতিষ্ঠান' : 'Targeted')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.5625rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--teal-light)] text-[var(--teal)]">
                        <Sparkles size={10} />
                        {bn ? 'সকল প্রতিষ্ঠান' : 'All Institutes'}
                      </span>
                    )}

                    <span className="text-[0.6875rem] text-[var(--text-muted)] ml-auto shrink-0 flex items-center gap-1">
                      <Clock size={11} />
                      {formattedTime}
                    </span>
                  </div>

                  <p className={`text-[0.8125rem] ${!n.read ? 'font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-primary)]'} truncate mt-1 mb-0`}>
                    {displayTitle}
                  </p>

                  <p className="text-[0.75rem] text-[var(--text-secondary)] line-clamp-2 mt-0.5 mb-0">
                    {displayMessage}
                  </p>
                </div>

                {/* Hover Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (n.read) markUnread(n.id)
                      else markRead(n.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors cursor-pointer border-none bg-transparent"
                    title={n.read ? (bn ? 'অপঠিত করুন' : 'Mark unread') : (bn ? 'পঠিত করুন' : 'Mark read')}
                  >
                    {n.read ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  {canDelete('notifications') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(n.id)
                      }}
                      className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer border-none bg-transparent"
                      title={bn ? 'মুছুন' : 'Delete'}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {filtered.length > perPage && (
        <div className="mt-4">
          <PaginationControls
            page={page}
            setPage={setPage}
            perPage={perPage}
            setPerPage={setPerPage}
            total={filtered.length}
            totalPages={totalPages}
          />
        </div>
      )}

      {/* Compose / Edit Modal */}
      {showCompose && canCreateNotification && (
        <NotificationModal
          existing={editingNotification}
          onSaved={() => {
            setShowCompose(false)
            setEditingNotification(null)
          }}
          onClose={() => {
            setShowCompose(false)
            setEditingNotification(null)
          }}
          bn={bn}
        />
      )}

      {/* Notification Detail Modal (Animated Popup) */}
      {viewNotification && (
        <NotificationDetailModal
          notification={viewNotification}
          onClose={() => setViewNotification(null)}
          onToggleRead={(id) => {
            if (viewNotification.read) markUnread(id)
            else markRead(id)
            setViewNotification((prev) => (prev ? { ...prev, read: !prev.read } : null))
          }}
          onDelete={(id) => {
            deleteNotification(id)
            setViewNotification(null)
          }}
          onEdit={
            canCreateNotification
              ? (item) => {
                  setViewNotification(null)
                  setEditingNotification(item)
                  setShowCompose(true)
                }
              : undefined
          }
          onNavigate={(link) => handleNavigateToLink(link)}
          bn={bn}
        />
      )}

      {/* Delete Single Confirmation Dialog */}
      {deleteTarget && (
        <DeleteConfirmDialog
          onConfirm={() => {
            deleteNotification(deleteTarget)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
          title={bn ? 'নোটিফিকেশন মুছুন' : 'Delete Notification'}
          message={bn ? 'আপনি কি নিশ্চিত এই নোটিফিকেশনটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this notification?'}
          isBn={bn}
        />
      )}

      {/* Clear All Confirmation Dialog */}
      {showClearConfirm && (
        <DeleteConfirmDialog
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
          title={bn ? 'সব নোটিফিকেশন মুছুন' : 'Clear All Notifications'}
          message={bn ? 'আপনি কি নিশ্চিত সব নোটিফিকেশন স্থায়ীভাবে মুছে ফেলতে চান?' : 'Are you sure you want to clear all notifications?'}
          isBn={bn}
        />
      )}
    </div>
  )
}

function getTimeAgo(dateStr: string, bn: boolean): string {
  if (!dateStr) return bn ? 'এইমাত্র' : 'Just now'
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  if (isNaN(then)) return bn ? 'এইমাত্র' : 'Just now'
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return bn ? 'এইমাত্র' : 'Just now'
  if (diff < 3600) return bn ? `${Math.floor(diff / 60)} মিনিট আগে` : `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return bn ? `${Math.floor(diff / 3600)} ঘণ্টা আগে` : `${Math.floor(diff / 3600)}h ago`
  return bn ? `${Math.floor(diff / 86400)} দিন আগে` : `${Math.floor(diff / 86400)}d ago`
}
