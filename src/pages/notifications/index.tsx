import { useState, useMemo, useEffect } from 'react'
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Trash2, CheckCheck } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { usePermission } from '@/hooks/usePermission'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useNotificationStore, type Notification, type NotificationType } from '@/store/notificationStore'
import { useNavigate } from 'react-router-dom'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  info: { icon: Info, color: 'var(--brand)', bg: 'var(--brand-light)' },
  success: { icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-light)' },
  warning: { icon: AlertTriangle, color: 'var(--orange)', bg: 'var(--orange-light)' },
  error: { icon: XCircle, color: 'var(--red)', bg: 'var(--red-light)' },
}

export default function NotificationsPage() {
  const bn = useBn()
  const { canDelete, canEdit } = usePermission()
  const { isMobile } = useWindowSize()
  const navigate = useNavigate()
  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const deleteNotification = useNotificationStore((s) => s.deleteNotification)
  const clearAll = useNotificationStore((s) => s.clearAll)

  const [filterType, setFilterType] = useState<string>('')
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const filtered = useMemo(() => {
    let list = [...notifications]
    if (filterType) list = list.filter((n) => n.type === filterType)
    if (filterRead === 'read') list = list.filter((n) => n.read)
    if (filterRead === 'unread') list = list.filter((n) => !n.read)
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notifications, filterType, filterRead])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const handleClick = (n: Notification) => {
    if (!n.read) markRead(n.id)
    if (n.link) navigate(n.link)
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-10 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex-1">
          <h1 className={`font-semibold text-[var(--text-primary)] ${isMobile ? 'text-lg' : 'text-[1.375rem]'}`}>
            {bn ? 'নোটিফিকেশন' : 'Notifications'}
          </h1>
          <p className="text-[0.8125rem] text-[var(--text-muted)] mt-0.5">
            {bn ? `মোট: ${notifications.length}টি` : `Total: ${notifications.length}`}
            {unreadCount > 0 && ` · ${unreadCount} ${bn ? 'টি নতুন' : 'unread'}`}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && canEdit('notifications') && (
            <button
              onClick={() => markAllRead()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.75rem] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <CheckCheck size={14} />
              {bn ? 'সব পড়া হয়েছে' : 'Mark All Read'}
            </button>
          )}
          {notifications.length > 0 && canDelete('notifications') && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.75rem] font-medium border border-[var(--red)] text-[var(--red)] hover:bg-[var(--red)] hover:text-white transition-colors"
            >
              <Trash2 size={14} />
              {bn ? 'সব মুছুন' : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer appearance-none pr-7 bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75rem] bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]"
        >
          <option value="">{bn ? 'সকল ধরন' : 'All Types'}</option>
          <option value="info">{bn ? 'তথ্য' : 'Info'}</option>
          <option value="success">{bn ? 'সফল' : 'Success'}</option>
          <option value="warning">{bn ? 'সতর্কতা' : 'Warning'}</option>
          <option value="error">{bn ? 'ত্রুটি' : 'Error'}</option>
        </select>
        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value as 'all' | 'read' | 'unread')}
          className="px-3 py-[0.625rem] rounded-lg text-[0.75rem] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] cursor-pointer appearance-none pr-7 bg-no-repeat bg-[right_0.5rem_center] bg-[length:0.75rem] bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E')]"
        >
          <option value="all">{bn ? 'সব' : 'All'}</option>
          <option value="unread">{bn ? 'অপঠিত' : 'Unread'}</option>
          <option value="read">{bn ? 'পঠিত' : 'Read'}</option>
        </select>
      </div>

      {/* Notification Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <Bell size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-[0.9375rem]">{bn ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}</p>
          <p className="text-[0.75rem] mt-1">{bn ? 'নতুন নোটিফিকেশন এখানে দেখা যাবে' : 'New notifications will appear here'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n) => {
            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
            const Icon = config.icon
            const timeAgo = getTimeAgo(n.createdAt, bn)
            const isUnread = !n.read
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className={`group relative rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 ${
                  isUnread
                    ? 'border-[var(--brand)]/40 bg-[var(--brand-light)]/50'
                    : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--brand)]'
                }`}
              >
                {/* Delete button - visible on hover */}
                {canDelete('notifications') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(n.id)
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--red)] hover:bg-[var(--red-light)] transition-all"
                    title={bn ? 'মুছুন' : 'Delete'}
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                {/* Card content */}
                <div className="flex items-start gap-3">
                  {/* Type icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: config.bg, color: config.color }}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title + unread dot */}
                    <div className="flex items-center gap-2 pr-7">
                      <h3
                        className={`text-[0.8125rem] text-[var(--text-primary)] leading-snug truncate ${
                          isUnread ? 'font-semibold' : 'font-medium'
                        }`}
                      >
                        {bn ? n.titleBn : n.title}
                      </h3>
                      {isUnread && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: 'var(--brand)' }}
                        />
                      )}
                    </div>

                    {/* Message */}
                    <p className="text-[0.75rem] text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                      {bn ? n.messageBn : n.message}
                    </p>

                    {/* Footer: type badge + time */}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-[0.5625rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: config.bg, color: config.color }}
                      >
                        {n.type}
                      </span>
                      <span className="text-[0.625rem] text-[var(--text-muted)]">{timeAgo}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          onConfirm={() => {
            deleteNotification(deleteTarget)
            setDeleteTarget(null)
          }}
          onCancel={() => setDeleteTarget(null)}
          title={bn ? 'নোটিফিকেশন মুছুন' : 'Delete Notification'}
          message={bn ? 'আপনি কি নিশ্চিত?' : 'Are you sure?'}
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
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return bn ? 'এইমাত্র' : 'Just now'
  if (diff < 3600) return bn ? `${Math.floor(diff / 60)} মিনিট আগে` : `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return bn ? `${Math.floor(diff / 3600)} ঘণ্টা আগে` : `${Math.floor(diff / 3600)}h ago`
  return bn ? `${Math.floor(diff / 86400)} দিন আগে` : `${Math.floor(diff / 86400)}d ago`
}
