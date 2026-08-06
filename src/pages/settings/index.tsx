import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useBn } from '@/hooks/useBn'
import { Settings } from 'lucide-react'
import {
  Globe, Palette, Keyboard, Home,
  Mail, Bell, Shield, Key,
  Calendar,
  Trash2,
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

  return <SettingsContent isBn={isBn} isInstAdmin={isInstAdmin} />
}

function SettingsContent({ isBn, isInstAdmin }: { isBn: boolean; isInstAdmin: boolean }) {
  const [activePanel, setActivePanel] = useState<string | null>(null)

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

  const loginGroup: SettingGroup = {
    title: 'Login',
    titleBn: 'লগইন',
    items: [
      { key: 'backup-email', icon: Mail, iconBg: '#10b98115', iconColor: '#10b981', title: 'Backup Email', titleBn: 'ব্যাকআপ ইমেইল', description: 'Receive recovery links via a backup address', descriptionBn: 'ব্যাকআপ ঠিকানার মাধ্যমে পুনরুদ্ধার লিংক পান' },
      { key: 'login-alerts', icon: Bell, iconBg: '#ef444415', iconColor: '#ef4444', title: 'Login Alerts', titleBn: 'লগইন সতর্কতা', description: 'Get notified whenever your account is accessed', descriptionBn: 'অ্যাকাউন্ট অ্যাক্সেস হলে সতর্কতা পান' },
      { key: 'authenticator', icon: Shield, iconBg: '#6366f115', iconColor: '#6366f1', title: 'Authenticator App', titleBn: 'প্রমাণীকরণ অ্যাপ', description: 'Connect Google Authenticator or Authy', descriptionBn: 'Google Authenticator বা Authy সংযুক্ত করুন' },
      { key: 'login-method', icon: Key, iconBg: '#f59e0b15', iconColor: '#f59e0b', title: 'Change Login Method', titleBn: 'লগইন পদ্ধতি পরিবর্তন', description: 'Switch between password or passkey login', descriptionBn: 'পাসওয়ার্ড বা পাসকির মধ্যে পরিবর্তন করুন' },
    ],
  }

  const institutionGroup: SettingGroup = {
    title: 'Institution',
    titleBn: 'প্রতিষ্ঠান',
    items: [
      { key: 'access-modes', icon: Globe, iconBg: '#3b82f615', iconColor: '#3b82f6', title: 'Access Modes', titleBn: 'অ্যাক্সেস মোড', description: 'Path, subdomain, and custom domain access', descriptionBn: 'পাথ, সাবডোমেইন ও কাস্টম ডোমেইন অ্যাক্সেস' },
      { key: 'session-mgmt', icon: Calendar, iconBg: '#8b5cf615', iconColor: '#8b5cf6', title: 'Session Management', titleBn: 'সেশন ব্যবস্থাপনা', description: 'Manage academic sessions', descriptionBn: 'শৈক্ষিক সেশন পরিচালনা করুন' },
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

  const groups = isInstAdmin
    ? [generalGroup, loginGroup, institutionGroup, accountGroup]
    : [generalGroup, loginGroup, accountGroup]

  const allItems = groups.flatMap((g) => g.items)
  const activeItem = allItems.find((i) => i.key === activePanel)

  const renderPanel = () => {
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
      case 'email-password': return <EmailPasswordPanel isBn={isBn} onBack={() => setActivePanel(null)} />
      case 'danger-zone': return <DangerZonePanel isBn={isBn} onBack={() => setActivePanel(null)} />
      default: return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--brand-light)] flex items-center justify-center">
          <Settings size={20} className="text-[var(--brand)]" />
        </div>
        <div>
          <h1 className="text-[1.125rem] font-bold text-[var(--text-primary)]">
            {isBn ? 'সেটিংস' : 'Settings'}
          </h1>
          <p className="text-[0.75rem] text-[var(--text-muted)]">
            {isBn ? 'আপনার পছন্দ পরিচালনা করুন' : 'Manage your preferences'}
          </p>
        </div>
      </div>

      {/* Panel or Group List */}
      {activePanel && activeItem ? (
        renderPanel()
      ) : (
        <div className="space-y-1">
          {groups.map((group) => (
            <SettingsGroup key={group.title} title={group.title} titleBn={group.titleBn} isBn={isBn}>
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
          ))}
        </div>
      )}
    </div>
  )
}
