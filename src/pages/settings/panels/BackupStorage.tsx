import React, { useState } from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { useClassStore } from '@/store/classStore'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'
import { setLocalStorageMode } from '@/lib/storageMode'
import { CheckCircle2 } from 'lucide-react'
import { StorageModeSection } from './backup/StorageModeSection'
import { LocalVaultSection } from './backup/LocalVaultSection'
import { LocalBackupSection } from './backup/LocalBackupSection'
import { TelegramBackupSection } from './backup/TelegramBackupSection'

interface Props {
  isBn: boolean
  onBack: () => void
}

export const BackupStoragePanel: React.FC<Props> = ({ isBn, onBack }) => {
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const institution = useClassStore((s) => s.institution)
  const updateInstitution = useClassStore((s) => s.updateInstitution)
  const { user } = useAuth()

  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  const schoolSlug = sessionStorage.getItem('edutech_inst_slug') || 'edutech'
  const schoolName = institution?.name || 'EduTech School'

  const rawMode = settings.storageSettings?.mode || institution?.storageMode || 'cloud'
  const storageMode: 'cloud' | 'local_computer' | 'local_server' =
    rawMode === 'local_computer' || rawMode === 'local_server' ? rawMode : 'cloud'
  const serverUrl = settings.storageSettings?.serverUrl || institution?.serverUrl || ''
  const folderName = settings.storageSettings?.folderName || institution?.folderName || ''

  const botToken = settings.telegramBackup?.botToken || ''
  const chatId = settings.telegramBackup?.chatId || ''
  const autoBackup = Boolean(settings.telegramBackup?.autoBackup)

  const syncStorage = async (
    newMode: 'cloud' | 'local_computer' | 'local_server',
    newUrl?: string,
    newFolder?: string
  ) => {
    const finalUrl = newUrl !== undefined ? newUrl : serverUrl
    const finalFolder = newFolder !== undefined ? newFolder : folderName

    setLocalStorageMode(newMode)
    if (institution) {
      updateInstitution({
        ...institution,
        storageMode: newMode,
        serverUrl: finalUrl,
        folderName: finalFolder,
      })
    }

    const targetId =
      user?.schoolId ||
      (typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('edutech_viewing_id') || sessionStorage.getItem('edutech_inst_slug')
        : null)

    if (targetId) {
      try {
        await authApi.updateSchool(targetId, {
          storageMode: newMode,
          serverUrl: finalUrl,
          folderName: finalFolder,
        })
      } catch {
        /* ignore server error in offline/local */
      }
    }

    setSavedNotice(
      isBn
        ? 'স্টোরেজ সেটিংস সফলভাবে সংরক্ষিত ও আপডেট হয়েছে'
        : 'Storage settings successfully updated'
    )
    setTimeout(() => setSavedNotice(null), 3000)
  }

  const handleModeChange = (mode: 'cloud' | 'local_computer' | 'local_server') => {
    updateSettings({
      storageSettings: {
        ...(settings.storageSettings || { serverUrl: '', folderName: '' }),
        mode,
      },
    })
    syncStorage(mode)
  }

  const handleServerUrlChange = (url: string) => {
    updateSettings({
      storageSettings: {
        ...(settings.storageSettings || { mode: 'local_server', folderName: '' }),
        serverUrl: url,
      },
    })
    syncStorage(storageMode, url)
  }

  const handleFolderNameChange = (folder: string) => {
    updateSettings({
      storageSettings: {
        ...(settings.storageSettings || { mode: 'local_server', serverUrl: '' }),
        folderName: folder,
      },
    })
    syncStorage(storageMode, undefined, folder)
  }

  const handleBotTokenChange = (token: string) => {
    updateSettings({
      telegramBackup: {
        ...(settings.telegramBackup || { chatId: '', autoBackup: false }),
        botToken: token,
      },
    })
  }

  const handleChatIdChange = (id: string) => {
    updateSettings({
      telegramBackup: {
        ...(settings.telegramBackup || { botToken: '', autoBackup: false }),
        chatId: id,
      },
    })
  }

  const handleAutoBackupChange = (enabled: boolean) => {
    updateSettings({
      telegramBackup: {
        ...(settings.telegramBackup || { botToken: '', chatId: '' }),
        autoBackup: enabled,
      },
    })
  }

  return (
    <SettingsPanel title="Backup & Storage" titleBn="ব্যাকআপ ও স্টোরেজ" isBn={isBn} onBack={onBack}>
      <div className="space-y-5">
        <p className="text-[0.8125rem] text-[var(--text-muted)]">
          {isBn
            ? 'লোকাল কম্পিউটারে অফলাইন ফাইল হিসেবে সংরক্ষণ ও রিস্টোর করুন, এবং টেলিগ্রাম চ্যানেলে স্বয়ংক্রিয় ক্লাউড স্ন্যাপশট পাঠান।'
            : 'Download and restore offline backups on your local computer, configure local servers, and send instant database snapshots to Telegram.'}
        </p>

        {savedNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* 1. Storage Mode */}
        <StorageModeSection
          isBn={isBn}
          mode={storageMode}
          serverUrl={serverUrl}
          folderName={folderName}
          onModeChange={handleModeChange}
          onServerUrlChange={handleServerUrlChange}
          onFolderNameChange={handleFolderNameChange}
        />

        {/* 1b. Local Data Vault (JSON files in a chosen folder) */}
        {storageMode === 'local_computer' && <LocalVaultSection isBn={isBn} />}

        {/* 2. Local Computer Backup Fetcher */}
        <LocalBackupSection
          isBn={isBn}
          schoolSlug={schoolSlug}
          schoolName={schoolName}
        />

        {/* 3. Telegram Cloud Backup Fetcher */}
        <TelegramBackupSection
          isBn={isBn}
          schoolSlug={schoolSlug}
          schoolName={schoolName}
          botToken={botToken}
          chatId={chatId}
          autoBackup={autoBackup}
          direct={storageMode === 'local_computer'}
          onBotTokenChange={handleBotTokenChange}
          onChatIdChange={handleChatIdChange}
          onAutoBackupChange={handleAutoBackupChange}
        />
      </div>
    </SettingsPanel>
  )
}
