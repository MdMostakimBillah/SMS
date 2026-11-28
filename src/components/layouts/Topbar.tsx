import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Clock,
  Settings,
  LogOut,
  HelpCircle,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Maximize,
  Minimize,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sparkles,
  CreditCard,
  GraduationCap,
  X,
} from 'lucide-react'
import { useNotificationStore, isNotificationForSchool, resolveCurrentSchoolIdentifiers, type Notification } from '@/store/notificationStore'
import { NotificationDetailModal } from '@/pages/notifications/modals/NotificationDetailModal'
import { useAppStore } from '@/store/appStore'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ROLE_LABELS, type InstitutionRole } from '@/lib/navUtils'
import { usePermissionStore } from '@/store/permissionStore'
import { useSubdomain } from '@/hooks/useSubdomain'
import { useSuperAdminStore } from '@/store/superAdminStore'
import { getNavBase, getSuperAdminViewNavBase, getLogoutRedirect } from '@/lib/navUtils'
import { t } from '@/lib/i18n'
import type { TranslationKey } from '@/lib/i18n'
import type { Theme, Language } from '@/types'

const NOTIF_ICONS: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  info: { icon: <Info size={13} />, bg: 'color-mix(in srgb, var(--brand) 12%, transparent)', color: 'var(--brand)' },
  success: { icon: <CheckCircle size={13} />, bg: 'var(--green-light)', color: 'var(--green)' },
  warning: { icon: <AlertTriangle size={13} />, bg: 'var(--orange-light)', color: 'var(--orange)' },
  error: { icon: <XCircle size={13} />, bg: 'var(--red-light)', color: 'var(--red)' },
  system: { icon: <Sparkles size={13} />, bg: 'var(--teal-light)', color: 'var(--teal)' },
  billing: { icon: <CreditCard size={13} />, bg: 'var(--amber-light)', color: 'var(--amber)' },
  academic: { icon: <GraduationCap size={13} />, bg: 'color-mix(in srgb, var(--brand) 12%, transparent)', color: 'var(--brand)' },
}

function getTopbarTimeAgo(dateStr: string, isBn: boolean): string {
  if (!dateStr) return isBn ? 'এইমাত্র' : 'Just now'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return isBn ? 'এইমাত্র' : 'Just now'
  if (diff < 3600) return isBn ? `${Math.floor(diff / 60)} মি. আগে` : `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return isBn ? `${Math.floor(diff / 3600)} ঘণ্টা আগে` : `${Math.floor(diff / 3600)}h ago`
  return isBn ? `${Math.floor(diff / 86400)} দিন আগে` : `${Math.floor(diff / 86400)}d ago`
}

const THEME_OPTIONS: { value: Theme; labelKey: TranslationKey; icon: React.ReactNode }[] = [
  { value: 'light', labelKey: 'theme_light', icon: <Sun size={13} /> },
  { value: 'dark', labelKey: 'theme_dark', icon: <Moon size={13} /> },
  { value: 'system', labelKey: 'theme_system', icon: <Monitor size={13} /> },
]

const LANG_OPTIONS: { value: Language; labelKey: TranslationKey }[] = [
  { value: 'bn', labelKey: 'lang_bn' },
  { value: 'en', labelKey: 'lang_en' },
]

const ICON_BTN: React.CSSProperties = {
  width: '2rem',
  height: '2rem',
  borderRadius: '0.5rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  position: 'relative',
  flexShrink: 0,
  transition: 'all 0.15s',
}

const demoMessages = [
  {
    id: 1,
    name: 'Rahima Khatun',
    nameBn: 'রহিমা খাতুন',
    role: 'Parent',
    roleBn: 'অভিভাবক',
    avatar: 'RK',
    avatarBg: 'var(--teal)',
    lastMsg: 'My son is feeling unwell.',
    lastMsgBn: 'আমার ছেলে অসুস্থ।',
    time: '10 min ago',
    timeBn: '১০ মিনিট আগে',
    unread: 2,
  },
  {
    id: 2,
    name: 'Dr. Rafiqul Islam',
    nameBn: 'ড. রফিকুল ইসলাম',
    role: 'Teacher',
    roleBn: 'শিক্ষক',
    avatar: 'RI',
    avatarBg: 'var(--brand)',
    lastMsg: 'Lab equipment list ready.',
    lastMsgBn: 'ল্যাব তালিকা প্রস্তুত।',
    time: '30 min ago',
    timeBn: '৩০ মিনিট আগে',
    unread: 0,
  },
]

export default React.memo(function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()
  const { resolved } = useSubdomain()
  const viewingInstitutionId = useSuperAdminStore((s) => s.viewingInstitutionId)
  const viewingId = viewingInstitutionId || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('edutech_viewing_id') : null)
  const isViewing = user?.role === 'super_admin' && !!viewingId
  const viewingRole = isViewing ? (location.pathname.split('/')[3] || 'admin') : undefined
  const navBase = isViewing
    ? getSuperAdminViewNavBase(user, viewingRole)
    : user?.role === 'super_admin'
      ? '/super-admin/admin'
      : getNavBase(user, resolved)
  const theme = useAppStore((s) => s.theme)
  const language = useAppStore((s) => s.language)
  const setTheme = useAppStore((s) => s.setTheme)
  const setLanguage = useAppStore((s) => s.setLanguage)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)

  // Look up the actual role name from permission store
  const staffPermissions = usePermissionStore((s) => s.staffPermissions) ?? []
  const roles = usePermissionStore((s) => s.roles) ?? []
  const myStaff = user?.staffId ? staffPermissions.find((s) => s.staffId === user.staffId) : undefined
  const myRole = myStaff ? roles.find((r) => r.id === myStaff.roleId) : undefined
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const isBn = useBn()
  const { isMobile } = useWindowSize()
  const searchDivRef = useRef<HTMLDivElement>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [msgOpen, setMsgOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const msgRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) setMsgOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const markUnread = useNotificationStore((s) => s.markUnread)
  const deleteNotification = useNotificationStore((s) => s.deleteNotification)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const syncFromServer = useNotificationStore((s) => s.syncFromServer)
  const checkAndGenerateSystemNotifications = useNotificationStore((s) => s.checkAndGenerateSystemNotifications)
  const [viewNotification, setViewNotification] = useState<Notification | null>(null)
  const [toastNotif, setToastNotif] = useState<Notification | null>(null)

  const isSuperAdminView = user?.role === 'super_admin' && !isViewing

  useEffect(() => {
    checkAndGenerateSystemNotifications()
    void syncFromServer()

    // Realtime notification listener
    const handleNewNotif = (e: any) => {
      const n: Notification = e.detail
      if (!n) return
      const idents = resolveCurrentSchoolIdentifiers(user)

      if (isSuperAdminView || isNotificationForSchool(n, idents)) {
        setToastNotif(n)
        const state = useNotificationStore.getState()
        if (!state.notifications.some((item) => item.id === n.id)) {
          useNotificationStore.setState({
            notifications: [n, ...state.notifications],
          })
        }
      }
    }
    window.addEventListener('edutech:new_notification', handleNewNotif)

    // Periodic sync (every 25s) for background updates & local PC mode
    const interval = setInterval(() => {
      void syncFromServer()
    }, 25000)

    // Sync on tab focus or visibility change
    const onFocus = () => {
      void syncFromServer()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      window.removeEventListener('edutech:new_notification', handleNewNotif)
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [checkAndGenerateSystemNotifications, syncFromServer, isSuperAdminView, viewingId, user])

  useEffect(() => {
    if (!toastNotif) return
    const timer = setTimeout(() => {
      setToastNotif(null)
    }, 7000)
    return () => clearTimeout(timer)
  }, [toastNotif])

  const visibleNotifications = useMemo(() => {
    if (isSuperAdminView) return notifications
    const idents = resolveCurrentSchoolIdentifiers(user)
    return notifications.filter((n) => isNotificationForSchool(n, idents))
  }, [notifications, isSuperAdminView, viewingId, user])

  const unreadNotifs = visibleNotifications.filter((n) => !n.read).length
  const unreadMsgs = demoMessages.reduce((sum, m) => sum + m.unread, 0)
  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '2.5rem',
    right: 0,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    zIndex: 300,
    width: isMobile ? 'min(21.25rem, calc(100vw - 16px))' : '21.25rem',
    maxHeight: '24rem',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
  }
  const panelHeader: React.CSSProperties = {
    padding: '0.75rem 0.875rem',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
  const panelItem: React.CSSProperties = {
    padding: '0.625rem 0.875rem',
    display: 'flex',
    gap: '0.625rem',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  }
  const profileDd: React.CSSProperties = {
    position: 'absolute',
    top: '2.625rem',
    right: 0,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    zIndex: 300,
    width: isMobile ? 'min(15rem, calc(100vw - 16px))' : '15rem',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  }
  const profileItem: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.5rem 0.875rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    transition: 'all 0.15s ease',
    borderRadius: '0.375rem',
  }

  return (
    <header
      className="glass"
      style={{
        height: isMobile ? '3.125rem' : '3.375rem',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 0.625rem' : '0 1.25rem',
        gap: isMobile ? '0.375rem' : '0.5rem',
        flexShrink: 0,
        zIndex: 100,
        borderRadius: 0,
        border: 'none',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Sidebar Toggle — desktop only */}
      {!isMobile ? (
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? (isBn ? 'সাইডবার প্রসারিত করুন' : 'Expand sidebar') : (isBn ? 'সাইডবার সংকুচিত করুন' : 'Collapse sidebar')}
          title={sidebarCollapsed ? (isBn ? 'সাইডবার প্রসারিত করুন' : 'Expand sidebar') : (isBn ? 'সাইডবার সংকুচিত করুন' : 'Collapse sidebar')}
          className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] relative shrink-0 transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      ) : (
        <button
          onClick={toggleSidebar}
          aria-label={isBn ? 'মেনু' : 'Menu'}
          title={isBn ? 'মেনু' : 'Menu'}
          className="w-8 h-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] relative shrink-0 transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Search */}
      {isMobile ? (
        <button style={{ ...ICON_BTN, flexShrink: 0 }} aria-label={isBn ? 'অনুসন্ধান' : 'Search'} onClick={() => setCommandPaletteOpen(true)}>
          <Search size={15} />
        </button>
      ) : (
        <div
          ref={searchDivRef}
          onClick={() => setCommandPaletteOpen(true)}
          style={{
            flex: 1,
            maxWidth: '18.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '0.375rem 0.75rem',
            cursor: 'pointer',
            minWidth: 0,
            transition: 'border-color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flex: 1 }}>{t('search_placeholder', language)}</span>
          <kbd
            style={{
              fontSize: '0.625rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '0.125rem 0.375rem',
              borderRadius: '0.25rem',
              color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            ⌘K
          </kbd>
        </div>
      )}

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.25rem' : '0.375rem',
          flexShrink: 0,
        }}
      >
        {/* Offline Indicator (Only shown when internet connection is lost) */}
        {!isOnline && (
          <div
            title={isBn ? 'অফলাইন মোড সক্রিয় - লোকাল স্টোরেজে সম্পূর্ণ কাজ চলবে' : 'Offline Mode Active - Running offline with full local access'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: isMobile ? '0.125rem 0.375rem' : '0.1875rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: 500,
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.28)',
              color: '#d97706',
              cursor: 'default',
              userSelect: 'none',
              marginRight: isMobile ? '0.125rem' : '0.25rem',
            }}
          >
            <span
              style={{
                width: '0.375rem',
                height: '0.375rem',
                borderRadius: '50%',
                background: '#eab308',
              }}
            />
            {!isMobile && (
              <span>
                {isBn ? 'অফলাইন' : 'Offline'}
              </span>
            )}
          </div>
        )}

        {/* Notification */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            style={ICON_BTN}
            aria-label={isBn ? 'নোটিফিকেশন' : 'Notifications'}
            onClick={() => {
              setNotifOpen(!notifOpen)
              setMsgOpen(false)
              setProfileOpen(false)
            }}
          >
            <Bell size={15} />
            {unreadNotifs > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-0.125rem',
                  right: '-0.125rem',
                  minWidth: '0.875rem',
                  height: '0.875rem',
                  background: 'var(--red)',
                  borderRadius: '9999px',
                  border: '1.5px solid var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: '#fff',
                  padding: '0 0.1875rem',
                }}
              >
                {unreadNotifs}
              </div>
            )}
          </button>
          {notifOpen && (
            <div style={panelStyle}>
              <div style={panelHeader}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {isBn ? 'নোটিফিকেশন' : 'Notifications'}
                </span>
                {unreadNotifs > 0 && (
                  <span
                    onClick={() => {
                      if (isSuperAdminView) {
                        markAllRead()
                      } else {
                        visibleNotifications.forEach((n) => {
                          if (!n.read) markRead(n.id)
                        })
                      }
                    }}
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--brand)',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    {isBn ? 'সব পড়ুন' : 'Mark all read'}
                  </span>
                )}
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '18.75rem' }}>
                {visibleNotifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {isBn ? 'কোনো নোটিফিকেশন নেই' : 'No notifications'}
                  </div>
                ) : (
                  visibleNotifications.slice(0, 10).map((n) => {
                    const cfg = (n.category && NOTIF_ICONS[n.category]) || NOTIF_ICONS[n.type] || NOTIF_ICONS.info
                    const titleText = (isBn ? n.titleBn || n.title : n.title || n.titleBn) || ''
                    const msgText = (isBn ? n.messageBn || n.message : n.message || n.messageBn) || ''
                    const timeText = getTopbarTimeAgo(n.createdAt, isBn)

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read) markRead(n.id)
                          setNotifOpen(false)
                          setViewNotification(n)
                        }}
                        style={{
                          ...panelItem,
                          background: !n.read ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (n.read) e.currentTarget.style.background = 'var(--bg-secondary)'
                        }}
                        onMouseLeave={(e) => {
                          if (n.read) e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <div
                          style={{
                            width: '1.875rem',
                            height: '1.875rem',
                            borderRadius: '0.5rem',
                            background: cfg.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: cfg.color,
                          }}
                        >
                          {cfg.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.125rem' }}>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: !n.read ? 600 : 500,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                              }}
                            >
                              {titleText}
                            </div>
                            {n.category && (
                              <span
                                style={{
                                  fontSize: '0.5625rem',
                                  fontWeight: 600,
                                  padding: '1px 4px',
                                  borderRadius: '4px',
                                  background: cfg.bg,
                                  color: cfg.color,
                                  textTransform: 'uppercase',
                                  flexShrink: 0,
                                }}
                              >
                                {n.category}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '0.6875rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.3,
                              marginBottom: '0.125rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {msgText}
                          </div>
                          <div
                            style={{
                              fontSize: '0.625rem',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Clock size={10} />
                            {timeText}
                          </div>
                        </div>
                        {!n.read && (
                          <div
                            style={{
                              width: '0.375rem',
                              height: '0.375rem',
                              borderRadius: '50%',
                              background: 'var(--brand)',
                              flexShrink: 0,
                              marginTop: '0.25rem',
                            }}
                          />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              <div
                onClick={() => {
                  setNotifOpen(false)
                  navigate(`${navBase}/notifications`)
                }}
                style={{
                  padding: '0.625rem',
                  textAlign: 'center',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--brand)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isBn ? 'সকল নোটিফিকেশন দেখুন →' : 'View all notifications →'}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={msgRef} style={{ position: 'relative' }}>
          <button
            style={ICON_BTN}
            aria-label={isBn ? 'বার্তা' : 'Messages'}
            onClick={() => {
              setMsgOpen(!msgOpen)
              setNotifOpen(false)
              setProfileOpen(false)
            }}
          >
            <MessageSquare size={15} />
            {unreadMsgs > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '-0.125rem',
                  right: '-0.125rem',
                  minWidth: '0.875rem',
                  height: '0.875rem',
                  background: 'var(--brand)',
                  borderRadius: '9999px',
                  border: '1.5px solid var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.5rem',
                  fontWeight: 600,
                  color: '#fff',
                  padding: '0 0.1875rem',
                }}
              >
                {unreadMsgs}
              </div>
            )}
          </button>
          {msgOpen && (
            <div style={panelStyle}>
              <div style={panelHeader}>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {isBn ? 'বার্তা' : 'Messages'}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--brand)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {isBn ? 'সব দেখুন' : 'View all'}
                </span>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '20.625rem' }}>
                {demoMessages.map((m) => (
                  <div
                    key={m.id}
                    style={panelItem}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      style={{
                        width: '2.125rem',
                        height: '2.125rem',
                        borderRadius: '0.5rem',
                        background: m.avatarBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        color: '#fff',
                      }}
                    >
                      {m.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.125rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {isBn ? m.nameBn : m.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.625rem',
                            color: 'var(--text-muted)',
                            flexShrink: 0,
                          }}
                        >
                          {isBn ? m.timeBn : m.time}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.5625rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.125rem',
                        }}
                      >
                        {isBn ? m.roleBn : m.role}
                      </div>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isBn ? m.lastMsgBn : m.lastMsg}
                      </div>
                    </div>
                    {m.unread > 0 && (
                      <div
                        style={{
                          minWidth: '1rem',
                          height: '1rem',
                          borderRadius: '0.5rem',
                          background: 'var(--brand)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.5625rem',
                          fontWeight: 700,
                          color: '#fff',
                          flexShrink: 0,
                          marginTop: '0.25rem',
                        }}
                      >
                        {m.unread}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        {!isMobile && (
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? (isBn ? 'ফুলস্ক্রিন বন্ধ' : 'Exit Fullscreen') : (isBn ? 'ফুলস্ক্রিন' : 'Fullscreen')}
            title={isFullscreen ? (isBn ? 'ফুলস্ক্রিন বন্ধ' : 'Exit Fullscreen') : (isBn ? 'ফুলস্ক্রিন' : 'Fullscreen')}
            style={ICON_BTN}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        )}

        {!isMobile && (
          <div
            style={{
              width: '0.0625rem',
              height: '1.25rem',
              background: 'var(--border)',
              margin: '0 2px',
            }}
          />
        )}

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div
            onClick={() => {
              setProfileOpen(!profileOpen)
              setNotifOpen(false)
              setMsgOpen(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: isMobile ? '4px' : '4px 8px 4px 4px',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '1.625rem',
                height: '1.625rem',
                borderRadius: '0.375rem',
                background: user?.photo ? 'transparent' : 'var(--brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.625rem',
                fontWeight: 700,
                color: '#fff',
                overflow: 'hidden',
              }}
            >
              {user?.photo ? (
                <img src={user.photo} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (user?.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
              )}
            </div>
        {!isMobile && (
              <div>
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    lineHeight: 1,
                  }}
                >
                  {user?.name || (isBn ? 'ব্যবহারকারী' : 'User')}
                </div>
                <div
                  style={{
                    fontSize: '0.5625rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.0625rem',
                  }}
                >
                  {user?.role === 'super_admin' ? (isBn ? 'সুপার অ্যাডমিন' : 'Super Admin') : (user?.role === 'admin' || user?.role === 'school_admin') ? (isBn ? 'প্রশাসক' : 'Admin') : myRole ? (isBn ? (myRole.nameBn || myRole.name) : myRole.name) : ROLE_LABELS[user?.role as InstitutionRole] ? (isBn ? ROLE_LABELS[user?.role as InstitutionRole].bn : ROLE_LABELS[user?.role as InstitutionRole].en) : (isBn ? 'শিক্ষক/স্টাফ' : 'Teacher/Staff')}
                </div>
              </div>
            )}
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
          </div>

          {profileOpen && (
            <div style={profileDd}>
              {/* Profile header */}
              <div
                style={{
                  padding: '0.875rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                }}
              >
                <div
                  style={{
                    width: '2.375rem',
                    height: '2.375rem',
                    borderRadius: '0.625rem',
                    background: user?.photo ? 'transparent' : 'var(--brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {user?.photo ? (
                    <img src={user.photo} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user?.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {user?.name || (isBn ? 'ব্যবহারকারী' : 'User')}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  {user?.role === 'super_admin' ? (isBn ? 'সুপার অ্যাডমিন' : 'Super Admin') : (user?.role === 'admin' || user?.role === 'school_admin') ? (isBn ? 'প্রশাসক' : 'Admin') : myRole ? (isBn ? (myRole.nameBn || myRole.name) : myRole.name) : ROLE_LABELS[user?.role as InstitutionRole] ? (isBn ? ROLE_LABELS[user?.role as InstitutionRole].bn : ROLE_LABELS[user?.role as InstitutionRole].en) : (isBn ? 'শিক্ষক/স্টাফ' : 'Teacher/Staff')}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div
                style={{
                  padding: '0.375rem',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {[
                  {
                    icon: <LayoutDashboard size={14} />,
                    labelEn: 'Dashboard',
                    labelBn: 'ড্যাশবোর্ড',
                    path: `${navBase}/dashboard`,
                  },
                  {
                    icon: <Users size={14} />,
                    labelEn: 'Students',
                    labelBn: 'ছাত্র',
                    path: `${navBase}/students`,
                  },
                  {
                    icon: <ClipboardCheck size={14} />,
                    labelEn: 'Attendance',
                    labelBn: 'উপস্থিতি',
                    path: `${navBase}/attendance`,
                  },
                  ...(user?.role === 'super_admin' ? [{
                    icon: <Crown size={14} className="text-amber-500" />,
                    labelEn: 'Super Admin Panel',
                    labelBn: 'সুপার অ্যাডমিন প্যানেল',
                    path: '/super-admin',
                  }] : []),
                ].map((item) => (
                  <div
                    key={item.path}
                    style={profileItem}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                    onClick={() => {
                      navigate(item.path)
                      setProfileOpen(false)
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
                    {isBn ? item.labelBn : item.labelEn}
                  </div>
                ))}
              </div>

              {/* Language */}
              <div
                style={{
                  padding: '0.375rem',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', padding: '4px 10px', gap: '0.375rem' }}>
                  {LANG_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => setLanguage(opt.value)}
                      style={{
                        flex: 1,
                        padding: '0.375rem',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                        fontWeight: language === opt.value ? 600 : 400,
                        textAlign: 'center',
                        transition: 'all 0.15s',
                        background: language === opt.value ? 'var(--brand)' : 'var(--bg-secondary)',
                        color: language === opt.value ? '#fff' : 'var(--text-secondary)',
                        border: `1px solid ${language === opt.value ? 'var(--brand)' : 'var(--border)'}`,
                      }}
                    >
                      {t(opt.labelKey, language)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div
                style={{
                  padding: '0.375rem',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', padding: '4px 10px', gap: '0.375rem' }}>
                  {THEME_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      style={{
                        flex: 1,
                        padding: '0.375rem',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.6875rem',
                        fontWeight: theme === opt.value ? 600 : 400,
                        textAlign: 'center',
                        transition: 'all 0.15s',
                        background: theme === opt.value ? 'var(--brand)' : 'var(--bg-secondary)',
                        color: theme === opt.value ? '#fff' : 'var(--text-secondary)',
                        border: `1px solid ${theme === opt.value ? 'var(--brand)' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      {opt.icon}
                      {t(opt.labelKey, language)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom actions */}
              <div style={{ padding: '0.375rem' }}>
                {[
                  {
                    icon: <Settings size={14} />,
                    labelEn: 'Settings',
                    labelBn: 'সেটিংস',
                    path: `${navBase}/settings`,
                  },
                  {
                    icon: <HelpCircle size={14} />,
                    labelEn: 'Help',
                    labelBn: 'সাহায্য',
                    path: `${navBase}/help`,
                  },
                ].map((item) => (
                  <div
                    key={item.path}
                    style={profileItem}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                    onClick={() => {
                      navigate(item.path)
                      setProfileOpen(false)
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
                    {isBn ? item.labelBn : item.labelEn}
                  </div>
                ))}
                <div
                  style={{
                    ...profileItem,
                    color: 'var(--red)',
                    marginTop: '0.125rem',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--red-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => {
                    // Logout redirect derives from the server-restored user
                    // only (getLogoutRedirect is a pure function) — legacy
                    // localStorage identity is never consulted.
                    const slug = sessionStorage.getItem('edutech_inst_slug')
                    logout()
                    navigate(getLogoutRedirect(user?.role, slug))
                  }}
                >
                  <LogOut size={14} />
                  {isBn ? 'লগ আউট' : 'Log Out'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
          onNavigate={(link) => {
            setViewNotification(null)
            if (link.startsWith('/')) {
              if (navBase && !link.startsWith(navBase) && !link.startsWith('/i/') && !link.startsWith('/super-admin/')) {
                navigate(`${navBase}${link}`)
              } else {
                navigate(link)
              }
            } else {
              navigate(link)
            }
          }}
          bn={isBn}
        />
      )}

      {toastNotif &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={() => {
              if (!toastNotif.read) markRead(toastNotif.id)
              setViewNotification(toastNotif)
              setToastNotif(null)
            }}
            className="fixed top-4 right-4 z-[99999] max-w-[22rem] w-[calc(100vw-2rem)] bg-[var(--bg-primary)] border border-[var(--brand)]/40 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 cursor-pointer transition-all hover:scale-[1.02] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200"
            role="alert"
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--brand)]/15 text-[var(--brand)] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[0.625rem] font-bold text-[var(--brand)] uppercase tracking-wider">
                  {isBn ? 'সুপার অ্যাডমিন বার্তা' : 'Super Admin Alert'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setToastNotif(null)
                  }}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 rounded cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <h4 className="text-[0.8125rem] font-bold text-[var(--text-primary)] truncate mt-0.5">
                {isBn ? toastNotif.titleBn || toastNotif.title : toastNotif.title || toastNotif.titleBn}
              </h4>
              <p className="text-[0.6875rem] text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                {isBn ? toastNotif.messageBn || toastNotif.message : toastNotif.message || toastNotif.messageBn}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-[0.625rem] font-semibold text-[var(--brand)]">
                <span>{isBn ? 'বিস্তারিত দেখতে ক্লিক করুন →' : 'Click to view details →'}</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  )
})
