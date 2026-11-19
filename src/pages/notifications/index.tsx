import { useState, useMemo, useEffect } from 'react'
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Trash2, CheckCheck, Plus, Search, Eye, EyeOff, Edit3 } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useNotificationStore, type Notification, type NotificationType } from '@/store/notificationStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSubdomain } from '@/hooks/useSubdomain'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { getNavBase, getSuperAdminViewNavBase } from '@/lib/navUtils'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { NotificationModal } from './modals/NotificationModal'
import { NotificationDetailModal } from './modals/NotificationDetailModal'

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bg: string; border: string; label: string; labelBn: string }> = {
  info: { icon: Info, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)', border: 'var(--brand)', label: 'Info', labelBn: 'তথ্য' },
  success: { icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-light)', border: 'var(--green)', label: 'Success', labelBn: 'সফল' },
  warning: { icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-light)', border: 'var(--orange)', label: 'Warning', labelBn: 'সতর্কতা' },
  error: { icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)', border: 'var(--red)', label: 'Alert', labelBn: 'জরুরি' },
}

export default function NotificationsPage() {
  const bn = useBn()
  const { canDelete, canEdit, canCreate } = usePermission()
  const { isMobile } = useWindowSize()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { resolved } = useSubdomain()
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)

  const isSuperAdmin = user?.role === 'super_admin'
  const isViewing = isSuperAdmin && !!viewingInstitutionId
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

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [composeModalOpen, setComposeModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [detailModalNotification, setDetailModalNotification] = useState<Notification | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)

  useEffect(() => {
    const slug = sessionStorage.getItem('edutech_inst_slug') || localStorage.getItem('edutech_inst_slug') || undefined
    void syncFromServer(slug)
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [syncFromServer])

  const filtered = useMemo(() => {
    let list = [...notifications]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((n) =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.titleBn && n.titleBn.includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q)) ||
        (n.messageBn && n.messageBn.includes(q))
      )
    }
    if (filterType) list = list.filter((n) => n.type === filterType)
    if (filterRead === 'read') list = list.filter((n) => n.read)
    if (filterRead === 'unread') list = list.filter((n) => !n.read)
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notifications, searchQuery, filterType, filterRead])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, filterType, filterRead, perPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

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

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id)
    if (n.link) {
      handleNavigateToLink(n.link)
    } else {
      setDetailModalNotification(n)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[12.5rem]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--brand)]/10 text-[var(--brand)] shrink-0">
              <Bell size={18} />
            </div>
            <div>
              <h1 className={`font-semibold text-[var(--text-primary)] m-0 ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
                {bn ? 'নোটিফিকেশন' : 'Notifications'}
              </h1>
              <p className="text-[0.8125rem] text-[var(--text-muted)] mt-0.5 mb-0">
                {bn ? `মোট: ${notifications.length}টি` : `Total: ${notifications.length}`}
                {unreadCount > 0 && ` · ${unreadCount} ${bn ? 'টি নতুন' : 'unread'}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canCreate('notifications') && (
            <button
              onClick={() => {
                setEditingNotification(null)
                setComposeModalOpen(true)
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer border-none shadow-sm"
            >
              <Plus size={14} />
              {bn ? 'নতুন নোটিফিকেশন' : 'Add Notification'}
            </button>
          )}

          {unreadCount > 0 && canEdit('notifications') && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer bg-transparent"
            >
              <CheckCheck size={14} />
              {bn ? 'সব পড়া হয়েছে' : 'Mark All Read'}
            </button>
          )}

          {notifications.length > 0 && canDelete('notifications') && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] font-medium border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors cursor-pointer bg-transparent"
            >
              <Trash2 size={14} />
              {bn ? 'সব মুছুন' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[15rem]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={bn ? 'নোটিফিকেশন খুঁজুন...' : 'Search notifications...'}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]/10 transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer appearance-none pr-7 bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75rem] bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]"
        >
          <option value="">{bn ? 'সকল ধরন' : 'All Types'}</option>
          <option value="info">{bn ? 'তথ্য' : 'Info'}</option>
          <option value="success">{bn ? 'সফল' : 'Success'}</option>
          <option value="warning">{bn ? 'সতর্কতা' : 'Warning'}</option>
          <option value="error">{bn ? 'জরুরি / ত্রুটি' : 'Alert / Error'}</option>
        </select>

        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value as 'all' | 'read' | 'unread')}
          className="px-3 py-2 rounded-xl text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer appearance-none pr-7 bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75rem] bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]"
        >
          <option value="all">{bn ? 'সব' : 'All Status'}</option>
          <option value="unread">{bn ? 'অপঠিত' : 'Unread'}</option>
          <option value="read">{bn ? 'পঠিত' : 'Read'}</option>
        </select>
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="col-span-full text-center py-16 px-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3 text-[var(--text-muted)]">
            <Bell size={28} className="opacity-40" />
          </div>
          <h3 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] m-0 mb-1">
            {searchQuery || filterType || filterRead !== 'all'
              ? (bn ? 'কোনো নোটিফিকেশন মেলেনি' : 'No matching notifications')
              : (bn ? 'কোনো নোটিফিকেশন নেই' : 'No notifications yet')}
          </h3>
          <p className="text-[0.75rem] text-[var(--text-muted)] m-0 max-w-sm mx-auto">
            {searchQuery || filterType || filterRead !== 'all'
              ? (bn ? 'অনুগ্রহ করে ভিন্ন ফিল্টার বা অনুসন্ধান শব্দ ব্যবহার করুন।' : 'Try adjusting your search query or filter options.')
              : (bn ? 'নতুন নোটিফিকেশন তৈরি হলে এখানে প্রদর্শিত হবে।' : 'New announcements and notifications will appear here.')}
          </p>
          {canCreate('notifications') && !searchQuery && !filterType && filterRead === 'all' && (
            <button
              onClick={() => {
                setEditingNotification(null)
                setComposeModalOpen(true)
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.75rem] font-semibold bg-[var(--brand)] text-white hover:opacity-90 transition-opacity cursor-pointer border-none shadow-sm"
            >
              <Plus size={14} />
              {bn ? 'প্রথম নোটিফিকেশন তৈরি করুন' : 'Create First Notification'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
            const Icon = config.icon
            const timeAgo = getTimeAgo(n.createdAt, bn)
            const isUnread = !n.read
            const displayTitle = (bn ? n.titleBn || n.title : n.title || n.titleBn) || ''
            const displayMessage = (bn ? n.messageBn || n.message : n.message || n.messageBn) || ''

            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`group relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer bg-[var(--bg-primary)] ${
                  isUnread
                    ? 'border-[var(--brand)]/40 shadow-sm'
                    : 'border-[var(--border)] hover:border-[var(--brand)]'
                }`}
              >
                <div className="mt-0.5 p-2 rounded-lg shrink-0" style={{ background: config.bg, color: config.color }}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0 pr-16">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-[0.8125rem] text-[var(--text-primary)] truncate m-0 ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                      {displayTitle}
                    </h3>
                    {isUnread && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--brand)' }} />}
                  </div>
                  <p className="text-[0.75rem] text-[var(--text-secondary)] mt-0.5 line-clamp-2 m-0">
                    {displayMessage}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[0.625rem] text-[var(--text-muted)] block">{timeAgo}</span>
                    <span className="text-[0.625rem] font-semibold px-1.5 py-0.2 rounded uppercase" style={{ background: config.bg, color: config.color }}>
                      {bn ? config.labelBn : config.label}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-1 shrink-0 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (n.read) markUnread(n.id)
                      else markRead(n.id)
                    }}
                    className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
                    title={n.read ? (bn ? 'অপঠিত করুন' : 'Mark unread') : (bn ? 'পঠিত করুন' : 'Mark read')}
                  >
                    {n.read ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>

                  {canEdit('notifications') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingNotification(n)
                        setComposeModalOpen(true)
                      }}
                      className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors"
                      title={bn ? 'সম্পাদনা' : 'Edit'}
                    >
                      <Edit3 size={13} />
                    </button>
                  )}

                  {canDelete('notifications') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(n.id)
                      }}
                      className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
                      title={bn ? 'মুছুন' : 'Delete'}
                    >
                      <Trash2 size={13} />
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
        <PaginationControls
          page={page}
          setPage={setPage}
          perPage={perPage}
          setPerPage={setPerPage}
          total={filtered.length}
          totalPages={totalPages}
        />
      )}

      {/* Modals */}
      {composeModalOpen && (
        <NotificationModal
          existing={editingNotification}
          onSaved={() => {
            setComposeModalOpen(false)
            setEditingNotification(null)
          }}
          onClose={() => {
            setComposeModalOpen(false)
            setEditingNotification(null)
          }}
          bn={bn}
        />
      )}

      {detailModalNotification && (
        <NotificationDetailModal
          notification={detailModalNotification}
          onClose={() => setDetailModalNotification(null)}
          onToggleRead={(id) => {
            if (detailModalNotification.read) markUnread(id)
            else markRead(id)
            setDetailModalNotification((prev) => prev ? { ...prev, read: !prev.read } : null)
          }}
          onDelete={(id) => {
            deleteNotification(id)
            setDetailModalNotification(null)
          }}
          onEdit={canEdit('notifications') ? (item) => {
            setDetailModalNotification(null)
            setEditingNotification(item)
            setComposeModalOpen(true)
          } : undefined}
          onNavigate={(link) => handleNavigateToLink(link)}
          bn={bn}
        />
      )}

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

      {showClearConfirm && (
        <DeleteConfirmDialog
          onConfirm={() => {
            clearAll()
            setShowClearConfirm(false)
          }}
          onCancel={() => setShowClearConfirm(false)}
          title={bn ? 'সব নোটিফিকেশন মুছুন' : 'Clear All Notifications'}
          message={bn ? 'আপনি কি নিশ্চিত সব নোটিফিকেশন মুছে ফেলতে চান?' : 'Are you sure you want to clear all notifications?'}
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
