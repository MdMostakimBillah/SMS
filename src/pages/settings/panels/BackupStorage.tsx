import React, { useState } from 'react'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useClassStore } from '@/store/classStore'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/lib/api'
import { setLocalStorageMode } from '@/lib/storageMode'
import { useVault } from '@/hooks/useVault'
import { vaultConnectFolder, vaultSyncNow } from '@/lib/vault/vault'
import { downloadLocalBackup, sendTelegramBackupNow } from '@/lib/backup'
import { StorageModeSection } from './backup/StorageModeSection'
import { LocalDatabaseControlPanel } from './backup/LocalDatabaseControlPanel'
import { ProviderCloudControlPanel } from './backup/ProviderCloudControlPanel'
import { VPSServerControlPanel } from './backup/VPSServerControlPanel'
import { TelegramBackupSection } from './backup/TelegramBackupSection'
import { LocalBackupSection } from './backup/LocalBackupSection'

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
  const vault = useVault()

  const [savedNotice, setSavedNotice] = useState<string | null>(null)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<string>(() => {
    return localStorage.getItem('edutech_last_backup_time') || '10/24/2026, 9:54 PM'
  })

  const schoolSlug = sessionStorage.getItem('edutech_inst_slug') || 'edutech'
  const schoolName = institution?.name || 'EduTech School'

  const isViewingSpecificInstitution =
    typeof sessionStorage !== 'undefined' && Boolean(sessionStorage.getItem('edutech_viewing_id'))
  const isSuperAdminAccount = user?.role === 'super_admin' && !isViewingSpecificInstitution

  const rawMode = isSuperAdminAccount
    ? 'cloud'
    : settings.storageSettings?.mode || institution?.storageMode || 'cloud'
  const storageMode: 'cloud' | 'local_computer' | 'local_server' =
    isSuperAdminAccount ? 'cloud' : (rawMode === 'local_computer' || rawMode === 'local_server' ? rawMode : 'cloud')
  const serverUrl = settings.storageSettings?.serverUrl || institution?.serverUrl || ''
  const folderName = settings.storageSettings?.folderName || institution?.folderName || ''

  const providerBytes = (institution as any)?.storageBytes ?? (user?.school as any)?.storageBytes ?? 0
  const providerMediaCount = (institution as any)?.mediaCount ?? (user?.school as any)?.mediaCount ?? 0

  const botToken = settings.telegramBackup?.botToken || ''
  const chatId = settings.telegramBackup?.chatId || ''
  const autoBackup = Boolean(settings.telegramBackup?.autoBackup)

  // Sync storage mode changes
  const syncStorage = async (
    newMode: 'cloud' | 'local_computer' | 'local_server',
    newUrl?: string,
    newFolder?: string
  ) => {
    // Super admin account can never switch to local computer or own VPS
    const effectiveMode: 'cloud' | 'local_computer' | 'local_server' =
      isSuperAdminAccount ? 'cloud' : newMode

    const finalUrl = newUrl !== undefined ? newUrl : serverUrl
    const finalFolder = newFolder !== undefined ? newFolder : folderName

    setLocalStorageMode(effectiveMode)
    if (institution) {
      updateInstitution({
        ...institution,
        storageMode: effectiveMode,
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
          storageMode: effectiveMode,
          serverUrl: finalUrl,
          folderName: finalFolder,
        })
      } catch {
        /* ignore server error in offline/local */
      }
    }

    setSavedNotice(
      isBn
        ? 'স্টোরেজ সেটিংস সফলভাবে আপডেট হয়েছে'
        : 'Storage settings successfully updated'
    )
    setTimeout(() => setSavedNotice(null), 3000)
  }

  const handleModeChange = (mode: 'cloud' | 'local_computer' | 'local_server') => {
    if (isSuperAdminAccount && mode !== 'cloud') {
      return
    }
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

  // Backup Now action
  const handleBackupNow = async () => {
    setIsBackingUp(true)
    try {
      downloadLocalBackup(schoolSlug, schoolName)
      if (botToken && chatId) {
        await sendTelegramBackupNow({
          schoolSlug,
          schoolName,
          botToken,
          chatId,
          via: storageMode === 'local_computer' ? 'browser' : 'server',
        })
      }
      if (vault.connected) {
        await vaultSyncNow()
      }
      const nowStr = new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      setLastBackupTime(nowStr)
      localStorage.setItem('edutech_last_backup_time', nowStr)
      setSavedNotice(isBn ? 'ব্যাকআপ সফলভাবে তৈরি হয়েছে!' : 'Backup successfully created!')
      setTimeout(() => setSavedNotice(null), 4000)
    } catch {
      setSavedNotice(isBn ? 'ব্যাকআপ তৈরিতে সমস্যা হয়েছে।' : 'Failed to create backup.')
      setTimeout(() => setSavedNotice(null), 4000)
    } finally {
      setIsBackingUp(false)
    }
  }

  // Change Folder action
  const handleChangeFolder = async () => {
    try {
      await vaultConnectFolder()
    } catch (err) {
      console.warn('Folder selection error:', err)
    }
  }

  // Cloud Sync action
  const handleCloudSync = async () => {
    await useClassStore.getState().syncToServer()
  }

  const displayFolderPath = vault.folderName
    ? `[DIRECTORY] /${vault.folderName}`
    : folderName
    ? `[DIRECTORY] /${folderName}`
    : '[FOLDER PATH]'

  return (
    <div className="fade-up space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Header: Kicker, Title, Subtitle, and Live Status Badge */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors mt-0.5 cursor-pointer shrink-0"
            title={isBn ? 'ফিরে যান' : 'Go back'}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[0.6875rem] font-bold text-[var(--brand)] tracking-widest uppercase block mb-1">
              {isBn ? 'সেটিংস · ডেটা' : 'SETTINGS · DATA'}
            </span>
            <h2 className="text-[1.625rem] font-bold text-[var(--text-primary)] tracking-tight">
              {isBn ? 'স্টোরেজ ও ডিপ্লয়মেন্ট' : 'Storage & deployment'}
            </h2>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-1 max-w-xl leading-relaxed">
              {isBn
                ? 'আপনার প্রতিষ্ঠানের রেকর্ড কোথায় সংরক্ষিত হবে তা নির্ধারণ করুন। ডেটা না হারিয়ে যেকোনো সময় পরিবর্তন করতে পারবেন।'
                : "Decide where your institution's records live. You can switch modes at any time without losing data."}
            </p>
          </div>
        </div>

        {/* Live Status Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--green-light)] border border-[var(--green)]/30 text-[var(--green)] text-[0.75rem] font-semibold shrink-0 self-start md:self-auto shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span>
            {storageMode === 'local_computer'
              ? (isBn ? 'লোকাল ডেটাবেস অনলাইন' : 'Local database online')
              : storageMode === 'cloud'
              ? (isBn ? 'ক্লাউড ডেটাবেস অনলাইন' : 'Cloud database online')
              : (isBn ? 'ভিপিএস ডেটাবেস অনলাইন' : 'VPS database online')}
          </span>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-[var(--green-light)] border border-[var(--green)]/30 text-[var(--green)] text-[0.75rem] flex items-center gap-2 shadow-sm">
          <CheckCircle2 size={16} />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 1. Storage Architecture Selection Cards (Provider Cloud, Local Computer, Own Server) */}
      <StorageModeSection
        isBn={isBn}
        mode={storageMode}
        isSuperAdminAccount={isSuperAdminAccount}
        onModeChange={handleModeChange}
      />

      {/* 2. Main Control Panel (Adapts dynamically based on active mode) */}
      {storageMode === 'local_computer' && (
        <LocalDatabaseControlPanel
          isBn={isBn}
          folderPath={displayFolderPath}
          lastBackupTime={lastBackupTime}
          isBackingUp={isBackingUp}
          providerBytes={providerBytes}
          providerMediaCount={providerMediaCount}
          onBackupNow={handleBackupNow}
          onChangeFolder={handleChangeFolder}
        />
      )}

      {storageMode === 'cloud' && (
        <ProviderCloudControlPanel
          isBn={isBn}
          lastBackupTime={lastBackupTime}
          onSyncNow={handleCloudSync}
        />
      )}

      {storageMode === 'local_server' && (
        <VPSServerControlPanel
          isBn={isBn}
          serverUrl={serverUrl}
          folderName={folderName}
          providerBytes={providerBytes}
          providerMediaCount={providerMediaCount}
          onServerUrlChange={handleServerUrlChange}
          onFolderNameChange={handleFolderNameChange}
          onSave={() => syncStorage('local_server', serverUrl, folderName)}
        />
      )}

      {/* 3. Telegram Disaster Recovery Backup (Essential when Local Computer mode is active) */}
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

      {/* 4. Manual JSON Backup & Restore Tools */}
      <LocalBackupSection
        isBn={isBn}
        schoolSlug={schoolSlug}
        schoolName={schoolName}
      />
    </div>
  )
}
