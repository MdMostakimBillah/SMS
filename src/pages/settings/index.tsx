import { useState, useMemo } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBn } from '@/hooks/useBn'
import {
  Globe, Palette, Keyboard, Home,
  Mail, Bell, Shield, Key,
  Calendar,
  Trash2, Star,
  Monitor, Code, Activity, Users,
} from 'lucide-react'
import { SettingsGroup } from './components/SettingsGroup'
import { SettingsRow } from './components/SettingsRow'
import type { SettingGroup } from './types'

import { LanguageRegionPanel } from './panels/LanguageRegion'
import { ThemeDisplayPanel } from './panels/ThemeDisplay'
import { ShortcutsNavPanel } from './panels/ShortcutsNav'
import { DefaultHomePagePanel } from './panels/DefaultHomePage'
import { BackupEmailPanel } from './panels/BackupEmail'
import { LoginAlertsPanel } from './panels/LoginAlerts'
import { AuthenticatorAppPanel } from './panels/AuthenticatorApp'
import { ChangeLoginMethodPanel } from './panels/ChangeLoginMethod'
import { AccessModesPanel } from './panels/AccessModes'
import { SessionManagementPanel } from './panels/SessionManagement'
import { EmailPasswordPanel } from './panels/EmailPassword'
import { DangerZonePanel } from './panels/DangerZone'
import { BookmarkSettingsPanel } from './panels/BookmarkSettings'
import { ActiveSessionsPanel } from './panels/ActiveSessions'
import { ApiKeysPanel } from './panels/ApiKeys'
import { NotificationPreferencesPanel } from './panels/NotificationPreferences'
import { ActivityLogPanel } from './panels/ActivityLog'
import { StaffPermissionsPanel } from './panels/StaffPermissions'
import { RolesList } from './panels/RolesList'
import { RoleEditor } from './panels/RoleEditor'

export default function Page() {
  const { user } = useAuth()
  const isBn = useBn()
  const isSuperAdmin = user?.role === 'super_admin'
  const isInstAdmin = user?.role === 'admin'

  if (!isSuperAdmin && !isInstAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle size={48} className="text-[var(--amber)] mx-auto mb-4 opacity-50" />
          <div className="text-[1rem] font-semibold text-[var(--text-primary)] mb-2">
            {isBn ? 'অ্যাক্সেস অস্বীকৃত' : 'Access Denied'}
          </div>
          <div className="text-[0.8125rem] text-[var(--text-muted)]">
            {isBn ? 'শুধুমাত্র অ্যাডমিন সেটিংস অ্যাক্সেস করতে পারেন' : 'Only admin can access settings'}
          </div>
        </div>
      </div>
    )
  }

  return <SettingsContent isBn={isBn} isInstAdmin={isInstAdmin} isSuperAdmin={isSuperAdmin} />
}

function SettingsContent({ isBn, isInstAdmin, isSuperAdmin }: { isBn: boolean; isInstAdmin: boolean; isSuperAdmin: boolean }) {
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [creatingRole, setCreatingRole] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const generalGroup: SettingGroup = {
    title: 'General Settings',
    titleBn: 'সাধারণ সেটিংস',
    items: [
      { key: 'language-region', icon: Globe, iconBg: '#3b82f615', iconColor: '#3b82f6', title: 'Language & Region', titleBn: 'ভাষা ও অঞ্চল', description: 'Manage language, time zone, and locale preferences', descriptionBn: 'ভাষা, টাইমজোন ও লোকেল পছন্দ পরিচালনা করুন' },
      { key: 'theme-display', icon: Palette, iconBg: '#8b5cf615', iconColor: '#8b5cf6', title: 'Theme & Display', titleBn: 'থিম ও প্রদর্শন', description: 'Set light/dark mode and content density', descriptionBn: 'হালকা/গাঢ় মোড ও কনটেন্ট ঘনত্ব নির্ধারণ' },
      { key: 'shortcuts-nav', icon: Keyboard, iconBg: '#f59e0b15', iconColor: '#f59e0b', title: 'Shortcuts & Navigation', titleBn: 'শর্টকাট ও নেভিগেশন', description: 'Customize keyboard shortcuts and navigation flow', descriptionBn: 'কীবোর্ড শর্টকাট ও নেভিগেশন কাস্টমাইজ করুন' },
      { key: 'default-home', icon: Home, iconBg: '#10b98115', iconColor: '#10b981', title: 'Default Home Page', titleBn: 'ডিফল্ট হোম পেজ', description: 'Choose what opens first when you log in', descriptionBn: 'লগইনের পর প্রথমে কী খুলবে তা বেছে নিন' },
    ],
  }

  const navigationGroup: SettingGroup = {
    title: 'Navigation',
    titleBn: 'নেভিগেশন',
    items: [
      { key: 'bookmarks', icon: Star, iconBg: '#f59e0b15', iconColor: '#f59e0b', title: 'Bookmarks', titleBn: 'বুকমার্ক', description: 'Quick access pages shown in sidebar', descriptionBn: 'সাইডবারে দেখানো দ্রুত প্রবেশের পৃষ্ঠাসমূহ' },
    ],
  }

  const loginGroup: SettingGroup = {
    title: 'Login & Security',
    titleBn: 'লগইন ও নিরাপত্তা',
    items: [
      { key: 'backup-email', icon: Mail, iconBg: '#10b98115', iconColor: '#10b981', title: 'Backup Email', titleBn: 'ব্যাকআপ ইমেইল', description: 'Receive recovery links via a backup address', descriptionBn: 'ব্যাকআপ ঠিকানার মাধ্যমে পুনরুদ্ধার লিংক পান' },
      { key: 'login-alerts', icon: Bell, iconBg: '#ef444415', iconColor: '#ef4444', title: 'Login Alerts', titleBn: 'লগইন সতর্কতা', description: 'Get notified whenever your account is accessed', descriptionBn: 'অ্যাকাউন্ট অ্যাক্সেস হলে সতর্কতা পান', rightLabel: 'On', rightLabelBn: 'চালু' },
      { key: 'authenticator', icon: Shield, iconBg: '#6366f115', iconColor: '#6366f1', title: 'Authenticator App', titleBn: 'প্রমাণীকরণ অ্যাপ', description: 'Connect Google Authenticator or Authy', descriptionBn: 'Google Authenticator বা Authy সংযুক্ত করুন', rightLabel: 'Off', rightLabelBn: 'বন্ধ' },
      { key: 'login-method', icon: Key, iconBg: '#f59e0b15', iconColor: '#f59e0b', title: 'Change Login Method', titleBn: 'লগইন পদ্ধতি পরিবর্তন', description: 'Switch between password or passkey login', descriptionBn: 'পাসওয়ার্ড বা পাসকির মধ্যে পরিবর্তন করুন', rightLabel: 'Password', rightLabelBn: 'পাসওয়ার্ড' },
    ],
  }

  const institutionGroup: SettingGroup = {
    title: 'Institution',
    titleBn: 'প্রতিষ্ঠান',
    items: [
      { key: 'access-modes', icon: Globe, iconBg: '#3b82f615', iconColor: '#3b82f6', title: 'Access Modes', titleBn: 'অ্যাক্সেস মোড', description: 'Path, subdomain, and custom domain access', descriptionBn: 'পাথ, সাবডোমেইন ও কাস্টম ডোমেইন অ্যাক্সেস' },
      { key: 'session-mgmt', icon: Calendar, iconBg: '#8b5cf615', iconColor: '#8b5cf6', title: 'Session Management', titleBn: 'সেশন ব্যবস্থাপনা', description: 'Manage academic sessions', descriptionBn: 'শৈক্ষিক সেশন পরিচালনা করুন' },
      { key: 'roles-permissions', icon: Shield, iconBg: '#6366f115', iconColor: '#6366f1', title: 'Roles & Permissions', titleBn: 'ভূমিকা ও অনুমতি', description: 'Manage roles and permission templates', descriptionBn: 'ভূমিকা ও অনুমতির টেমপ্লেট পরিচালনা করুন' },
      { key: 'staff-permissions', icon: Users, iconBg: '#10b98115', iconColor: '#10b981', title: 'Staff Access', titleBn: 'স্টাফ অ্যাক্সেস', description: 'Assign roles to teachers and staff', descriptionBn: 'শিক্ষক ও স্টাফকে ভূমিকা নির্ধারণ করুন' },
    ],
  }

  const advancedGroup: SettingGroup = {
    title: 'Advanced',
    titleBn: 'উন্নত',
    items: [
      { key: 'active-sessions', icon: Monitor, iconBg: '#3b82f615', iconColor: '#3b82f6', title: 'Active Sessions', titleBn: 'সক্রিয় সেশন', description: 'View and manage logged-in devices', descriptionBn: 'লগইন করা ডিভাইস দেখুন ও পরিচালনা করুন' },
      { key: 'api-keys', icon: Code, iconBg: '#10b98115', iconColor: '#10b981', title: 'API Keys', titleBn: 'API কী', description: 'Manage API access keys', descriptionBn: 'API অ্যাক্সেস কী পরিচালনা করুন' },
      { key: 'notification-prefs', icon: Bell, iconBg: '#f59e0b15', iconColor: '#f59e0b', title: 'Notification Preferences', titleBn: 'নোটিফিকেশন পছন্দ', description: 'Choose notification channels', descriptionBn: 'নোটিফিকেশন চ্যানেল নির্বাচন করুন' },
      { key: 'activity-log', icon: Activity, iconBg: '#8b5cf615', iconColor: '#8b5cf6', title: 'Activity Log', titleBn: 'কার্যক্রম লগ', description: 'View recent account activity', descriptionBn: 'সাম্প্রতিক অ্যাকাউন্ট কার্যক্রম দেখুন' },
    ],
  }

  const accountGroup: SettingGroup = {
    title: 'Account',
    titleBn: 'অ্যাকাউন্ট',
    items: [
      { key: 'email-password', icon: Mail, iconBg: '#6366f115', iconColor: '#6366f1', title: 'Email & Password', titleBn: 'ইমেইল ও পাসওয়ার্ড', description: 'Change login credentials', descriptionBn: 'লগইন তথ্য পরিবর্তন করুন' },
      { key: 'danger-zone', icon: Trash2, iconBg: '#ef444415', iconColor: '#ef4444', title: 'Danger Zone', titleBn: 'বিপজ্জনক অঞ্চল', description: 'Delete your account permanently', descriptionBn: 'আপনার অ্যাকাউন্ট স্থায়ীভাবে মুছুন' },
    ],
  }

  const filteredGroups = useMemo(() => {
    const groups = isInstAdmin || isSuperAdmin
      ? [generalGroup, navigationGroup, loginGroup, institutionGroup, advancedGroup, accountGroup]
      : [generalGroup, navigationGroup, loginGroup, advancedGroup, accountGroup]

    if (!searchQuery.trim()) return groups

    const query = searchQuery.toLowerCase()
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            (isBn ? item.titleBn : item.title).toLowerCase().includes(query) ||
            (isBn ? item.descriptionBn : item.description).toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [searchQuery, isBn, isInstAdmin, isSuperAdmin])

  const renderPanel = () => {
    if (creatingRole) {
      return <RoleEditor isBn={isBn} roleId={null} onBack={() => setCreatingRole(false)} onCreated={(id) => { setCreatingRole(false); setEditingRoleId(id) }} />
    }
    if (editingRoleId) {
      return <RoleEditor isBn={isBn} roleId={editingRoleId} onBack={() => setEditingRoleId(null)} />
    }
    switch (activePanel) {
      case 'language-region': return <LanguageRegionPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'theme-display': return <ThemeDisplayPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'shortcuts-nav': return <ShortcutsNavPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'default-home': return <DefaultHomePagePanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'backup-email': return <BackupEmailPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'login-alerts': return <LoginAlertsPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'authenticator': return <AuthenticatorAppPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'login-method': return <ChangeLoginMethodPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'access-modes': return <AccessModesPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'session-mgmt': return <SessionManagementPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'roles-permissions': return <RolesList isBn={isBn} onBack={() => setActivePanel(null)} onEditRole={(id) => { setActivePanel(null); setEditingRoleId(id) }} onCreateRole={() => { setActivePanel(null); setCreatingRole(true) }} />
      case 'staff-permissions': return <StaffPermissionsPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'email-password': return <EmailPasswordPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'danger-zone': return <DangerZonePanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'bookmarks': return <BookmarkSettingsPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'active-sessions': return <ActiveSessionsPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'api-keys': return <ApiKeysPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'notification-prefs': return <NotificationPreferencesPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'activity-log': return <ActivityLogPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      default: return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[1.375rem] font-bold text-[var(--text-primary)] tracking-tight">
          {isBn ? 'সেটিংস' : 'Settings'}
        </h1>
      </div>

      {/* Panel or Group List */}
      {activePanel || editingRoleId || creatingRole ? (
        renderPanel()
      ) : (
        <div>
          {/* Search Bar */}
          <div className="mb-5">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'সেটিংস খুঁজুন...' : 'Search settings...'}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[0.875rem] text-[var(--text-primary)] outline-none focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] placeholder:text-[var(--text-muted)] transition-all duration-200"
              />
            </div>
          </div>

          <div>
            {filteredGroups.map((group) => (
              <div key={group.title}>
                <SettingsGroup title={group.title} titleBn={group.titleBn} isBn={isBn}>
                  {group.items.map((item, idx) => (
                    <SettingsRow
                      key={item.key}
                      item={item}
                      isBn={isBn}
                      isLast={idx === group.items.length - 1}
                      onClick={() => setActivePanel(item.key)}
                    />
                  ))}
                </SettingsGroup>
              </div>
            ))}
            {filteredGroups.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                  <Search size={20} className="text-[var(--text-muted)]" />
                </div>
                <div className="text-[0.875rem] font-medium text-[var(--text-primary)] mb-1">
                  {isBn ? 'কোনো সেটিংস পাওয়া যায়নি' : 'No settings found'}
                </div>
                <div className="text-[0.75rem] text-[var(--text-muted)]">
                  {isBn ? 'অন্য কীওয়ার্ড দিয়ে খুঁজুন' : 'Try a different keyword'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
