import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotificationStore, SEED_NOTIFICATIONS, notificationId, isNotificationForSchool, type Notification } from './notificationStore'
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

  it('fetches server notifications even in local_computer mode and keeps syncToServer local', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    const mockData = {
      notifications: [
        {
          id: 'NTF-LOCAL-SYNC-1',
          title: 'Emergency Server Notice',
          titleBn: 'জরুরি নোটিশ',
          message: 'Server maintenance',
          messageBn: 'রক্ষণাবেক্ষণ',
          type: 'warning' as const,
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }
    const getSpy = vi.spyOn(notificationsApi, 'get').mockResolvedValue(mockData)
    const updateSpy = vi.spyOn(notificationsApi, 'update').mockResolvedValue({ success: true })

    await useNotificationStore.getState().syncFromServer('local-school')
    expect(getSpy).toHaveBeenCalledWith('local-school')
    expect(useNotificationStore.getState().notifications.some((n) => n.id === 'NTF-LOCAL-SYNC-1')).toBe(true)
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

  it('correctly filters notifications with isNotificationForSchool', () => {
    const broadcastNotif: Notification = {
      id: 'N-ALL',
      title: 'Global Announcement',
      titleBn: 'সার্বিক ঘোষণা',
      message: 'All schools notice',
      messageBn: 'সকল স্কুলের নোটিশ',
      type: 'info',
      read: false,
      broadcastToAll: true,
      targetType: 'all',
      createdAt: new Date().toISOString(),
    }

    const targetedNotif: Notification = {
      id: 'N-SPECIFIC',
      title: 'Targeted Notice',
      titleBn: 'টার্গেটেড নোটিশ',
      message: 'For Daffodil only',
      messageBn: 'শুধু ড্যাফোডিলের জন্য',
      type: 'warning',
      read: false,
      broadcastToAll: false,
      targetType: 'specific',
      targetInstitutions: ['inst-daffodil', 'daffodil'],
      targetInstitutionNames: ['Daffodil Model High School'],
      createdAt: new Date().toISOString(),
    }

    // Broadcast should be visible to any school
    expect(isNotificationForSchool(broadcastNotif, { slug: 'daffodil' })).toBe(true)
    expect(isNotificationForSchool(broadcastNotif, { slug: 'sunrise' })).toBe(true)

    // Targeted should be visible only to targeted school
    expect(isNotificationForSchool(targetedNotif, { slug: 'daffodil' })).toBe(true)
    expect(isNotificationForSchool(targetedNotif, { id: 'inst-daffodil' })).toBe(true)
    expect(isNotificationForSchool(targetedNotif, { slug: 'sunrise' })).toBe(false)
    expect(isNotificationForSchool(targetedNotif, { id: 'inst-sunrise' })).toBe(false)
  })

  it('broadcastNotification routes targeted notification only to targeted school storage keys', async () => {
    localStorage.setItem('edutech-notifications_daffodil', JSON.stringify({ state: { notifications: [] } }))
    localStorage.setItem('edutech-notifications_sunrise', JSON.stringify({ state: { notifications: [] } }))

    const targetedNotif: Notification = {
      id: 'NTF-TARGET-TEST',
      title: 'Daffodil Exclusive Update',
      titleBn: 'ড্যাফোডিল বিশেষ আপডেট',
      message: 'Special configuration applied',
      messageBn: 'বিশেষ কনফিগারেশন প্রয়োগ করা হয়েছে',
      type: 'info',
      read: false,
      targetType: 'specific',
      targetInstitutions: ['daffodil'],
      targetInstitutionNames: ['Daffodil Model High School'],
      createdAt: new Date().toISOString(),
    }

    vi.spyOn(notificationsApi, 'broadcast').mockResolvedValue({ success: true } as any)

    await useNotificationStore.getState().broadcastNotification(targetedNotif)

    // Local state contains it
    expect(useNotificationStore.getState().notifications.some((n) => n.id === 'NTF-TARGET-TEST')).toBe(true)

    // Daffodil storage contains it
    const daffodilStore = JSON.parse(localStorage.getItem('edutech-notifications_daffodil') || '{}')
    expect(daffodilStore.state.notifications.some((n: any) => n.id === 'NTF-TARGET-TEST')).toBe(true)

    // Sunrise storage does NOT contain it
    const sunriseStore = JSON.parse(localStorage.getItem('edutech-notifications_sunrise') || '{}')
    expect(sunriseStore.state.notifications.some((n: any) => n.id === 'NTF-TARGET-TEST')).toBe(false)
  })

  it('matches targeted notification by institution name or EIIN via isNotificationForSchool', () => {
    const targetedNotif: Notification = {
      id: 'NTF-NAME-TEST',
      title: 'Targeted to Ideal School',
      titleBn: 'আইডিয়াল স্কুলের জন্য',
      message: 'Exclusive test',
      messageBn: 'টেস্ট',
      type: 'info',
      read: false,
      targetType: 'specific',
      targetInstitutions: ['inst-ideal'],
      targetInstitutionNames: ['Ideal School and College'],
      createdAt: new Date().toISOString(),
    }

    // Direct match by targetInstitutionNames
    expect(isNotificationForSchool(targetedNotif, { name: 'Ideal School and College' })).toBe(true)
    // Partial substring name match
    expect(isNotificationForSchool(targetedNotif, { name: 'Ideal School' })).toBe(true)
    // Unrelated school should not match
    expect(isNotificationForSchool(targetedNotif, { name: 'Daffodil Model High School' })).toBe(false)
  })

  it('instantly delivers notification to institution using local PC storage via realtime event pipeline', async () => {
    // Institution in local_computer storage mode
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    sessionStorage.setItem('edutech_inst_slug', 'rajuk-college')
    localStorage.setItem('edutech_inst_slug', 'rajuk-college')

    useNotificationStore.setState({ notifications: [] })

    const instantNotif: Notification = {
      id: 'NTF-REALTIME-INSTANT-1',
      title: 'Instant Super Admin Broadcast',
      titleBn: 'তাৎক্ষণিক সুপার অ্যাডমিন বার্তা',
      message: 'Urgent notice for local PC institutions',
      messageBn: 'লোকাল পিসির জন্য জরুরি নোটিশ',
      type: 'warning',
      read: false,
      targetType: 'specific',
      targetInstitutions: ['rajuk-college'],
      createdAt: new Date().toISOString(),
    }

    vi.spyOn(notificationsApi, 'broadcast').mockResolvedValue({ success: true } as any)

    // Super admin broadcasts notification
    await useNotificationStore.getState().broadcastNotification(instantNotif)

    // Store has it immediately
    const notifs = useNotificationStore.getState().notifications
    expect(notifs.some((n) => n.id === 'NTF-REALTIME-INSTANT-1')).toBe(true)

    // Local PC storage namespace for this institution is updated
    const localStore = JSON.parse(localStorage.getItem('edutech-notifications_rajuk-college') || '{}')
    expect(localStore.state.notifications.some((n: any) => n.id === 'NTF-REALTIME-INSTANT-1')).toBe(true)
  })
})
