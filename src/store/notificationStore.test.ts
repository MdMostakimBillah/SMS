import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotificationStore, SEED_NOTIFICATIONS, notificationId } from './notificationStore'
import { notificationsApi } from '@/lib/api'
import { normalizeVaultJsonForStore, vaultPathToKey } from '@/lib/vault/mapping'

describe('notificationStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useNotificationStore.persist?.clearStorage()
    useNotificationStore.setState({
      notifications: [],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
    vi.restoreAllMocks()
  })

  it('starts with empty default notifications', () => {
    expect(SEED_NOTIFICATIONS).toEqual([])
    expect(useNotificationStore.getState().notifications).toEqual([])
  })

  it('adds, updates, marks read/unread, and deletes notifications', () => {
    const id = notificationId()
    const n = {
      id,
      title: 'Exam Schedule',
      titleBn: 'পরীক্ষার সময়সূচি',
      message: 'Published for Class 10',
      messageBn: 'দশম শ্রেণির জন্য প্রকাশিত',
      type: 'info' as const,
      read: false,
      link: '/exams',
      createdAt: new Date().toISOString(),
    }

    useNotificationStore.getState().addNotification(n)
    expect(useNotificationStore.getState().notifications).toHaveLength(1)
    expect(useNotificationStore.getState().notifications[0].title).toBe('Exam Schedule')

    useNotificationStore.getState().updateNotification(id, { title: 'Updated Exam Schedule' })
    expect(useNotificationStore.getState().notifications[0].title).toBe('Updated Exam Schedule')

    useNotificationStore.getState().markRead(id)
    expect(useNotificationStore.getState().notifications[0].read).toBe(true)

    useNotificationStore.getState().markUnread(id)
    expect(useNotificationStore.getState().notifications[0].read).toBe(false)

    useNotificationStore.getState().markAllRead()
    expect(useNotificationStore.getState().notifications[0].read).toBe(true)

    useNotificationStore.getState().deleteNotification(id)
    expect(useNotificationStore.getState().notifications).toHaveLength(0)
  })

  it('clears all notifications', () => {
    useNotificationStore.getState().addNotification({
      id: 'N-1',
      title: 'Alert 1',
      titleBn: 'সতর্কতা ১',
      message: 'Test message 1',
      messageBn: 'টেস্ট বার্তা ১',
      type: 'warning',
      read: false,
      createdAt: new Date().toISOString(),
    })
    useNotificationStore.getState().addNotification({
      id: 'N-2',
      title: 'Alert 2',
      titleBn: 'সতর্কতা ২',
      message: 'Test message 2',
      messageBn: 'টেস্ট বার্তা ২',
      type: 'error',
      read: false,
      createdAt: new Date().toISOString(),
    })
    expect(useNotificationStore.getState().notifications).toHaveLength(2)

    useNotificationStore.getState().clearAll()
    expect(useNotificationStore.getState().notifications).toHaveLength(0)
  })

  it('migrates legacy seed notifications by removing them', () => {
    const migrate = (useNotificationStore.persist as any).getOptions().migrate
    const oldState = {
      notifications: [
        { id: 'NTF-SEED-001', title: 'Exam Results Published' },
        { id: 'NTF-SEED-002', title: 'Fee Payment Overdue' },
        { id: 'NTF-CUSTOM-001', title: 'Principal Announcement' },
      ],
    }

    const migrated = migrate(oldState, 1)
    expect(migrated.notifications).toHaveLength(1)
    expect(migrated.notifications[0].id).toBe('NTF-CUSTOM-001')
  })

  it('syncs notifications from backend when server returns data', async () => {
    const mockData = {
      notifications: [
        {
          id: 'NTF-REMOTE-1',
          title: 'Sports Day Notice',
          titleBn: 'ক্রীড়া দিবস',
          message: 'Annual sports day on Friday',
          messageBn: 'শুক্রবার বার্ষিক ক্রীড়া দিবস',
          type: 'success' as const,
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }

    vi.spyOn(notificationsApi, 'get').mockResolvedValue(mockData)

    await useNotificationStore.getState().syncFromServer('test-school')

    const state = useNotificationStore.getState()
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].title).toBe('Sports Day Notice')
    expect(state.serverSynced).toBe(true)
  })

  it('skips server sync in local_computer mode', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const getSpy = vi.spyOn(notificationsApi, 'get')
    const updateSpy = vi.spyOn(notificationsApi, 'update')

    await useNotificationStore.getState().syncFromServer('local-school')
    expect(getSpy).not.toHaveBeenCalled()
    expect(useNotificationStore.getState().serverSynced).toBe(true)

    await useNotificationStore.getState().syncToServer()
    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('maps vault paths to notifications key', () => {
    expect(vaultPathToKey('notifications.json', { slug: 'school' })).toBe('edutech-notifications_school')
    expect(vaultPathToKey('notification_entries.json', { slug: 'school' })).toBe('edutech-notifications_school')
    expect(vaultPathToKey('school/notifications.json', { slug: 'school' })).toBe('edutech-notifications_school')
  })

  it('normalizes vault json into notifications state', () => {
    const raw = [
      { id: 'NTF-VAULT-1', title: 'Science Fair', titleBn: 'বিজ্ঞান মেলা', message: 'Join us tomorrow', messageBn: 'কাল যোগ দিন', type: 'info', read: true },
    ]
    const normalized = normalizeVaultJsonForStore(
      'edutech-notifications_school',
      JSON.stringify(raw),
      undefined,
      'school/notifications.json'
    )
    const parsed = JSON.parse(normalized)
    expect(parsed.state.notifications).toHaveLength(1)
    expect(parsed.state.notifications[0].title).toBe('Science Fair')
    expect(parsed.state.notifications[0].read).toBe(true)
  })
})
