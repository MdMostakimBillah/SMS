import React from 'react'
import { SettingsPanel } from '../components/SettingsPanel'
import { useAppStore } from '@/store/appStore'
import { useClassStore } from '@/store/classStore'
import { StorageModeSection } from './backup/StorageModeSection'
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

  const schoolSlug = sessionStorage.getItem('edutech_inst_slug') || 'edutech'
  const schoolName = institution?.name || 'EduTech School'

  const storageMode = settings.storageSettings?.mode || 'cloud'
  const serverUrl = settings.storageSettings?.serverUrl || ''
  const folderName = settings.storageSettings?.folderName || ''

  const botToken = settings.telegramBackup?.botToken || ''
  const chatId = settings.telegramBackup?.chatId || ''
  const autoBackup = Boolean(settings.telegramBackup?.autoBackup)

  const handleModeChange = (mode: 'cloud' | 'local_computer' | 'local_server') => {
    updateSettings({
      storageSettings: {
        ...(settings.storageSettings || { serverUrl: '', folderName: '' }),
        mode,
      },
    })
  }

  const handleServerUrlChange = (url: string) => {
    updateSettings({
      storageSettings: {
        ...(settings.storageSettings || { mode: 'local_server', folderName: '' }),
        serverUrl: url,
      },
    })
  }

  const handleFolderNameChange = (folder: string) => {
    updateSettings({
      storageSettings: {
        ...(settings.storageSettings || { mode: 'local_server', serverUrl: '' }),
        folderName: folder,
      },
    })
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
          onBotTokenChange={handleBotTokenChange}
          onChatIdChange={handleChatIdChange}
          onAutoBackupChange={handleAutoBackupChange}
        />
      </div>
    </SettingsPanel>
  )
}
