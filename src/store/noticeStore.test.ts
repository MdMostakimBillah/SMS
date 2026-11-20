import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNoticeStore, noticeId } from './noticeStore'
import { keyToVaultPath, vaultPathToKey } from '@/lib/vault/mapping'

describe('noticeStore & vault integration', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useNoticeStore.setState({
      notices: [
        {
          id: 'N-TEST-1',
          title: 'Test Notice 1',
          titleBn: 'টেস্ট নোটিশ ১',
          content: '<p>Content 1</p>',
          contentBn: '<p>বিষয়বস্তু ১</p>',
          author: 'Admin',
          authorBn: 'অ্যাডমিন',
          target: 'all',
          priority: 'high',
          category: 'General',
          pinned: false,
          isActive: true,
          publishedAt: new Date().toISOString(),
          expiresAt: '',
        },
      ],
      categories: ['General', 'Academic'],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
  })

  it('maps notices.json correctly in vault path mapping', () => {
    expect(keyToVaultPath('edutech-notices_demo', 'demo')).toBe('demo/notices.json')
    expect(keyToVaultPath('edutech-notices', 'demo')).toBe('demo/notices.json')
    expect(keyToVaultPath('edutech-notices', null)).toBe('notices.json')

    expect(vaultPathToKey('demo/notices.json', { slug: 'demo' })).toBe('edutech-notices_demo')
    expect(vaultPathToKey('notices.json', { slug: 'demo' })).toBe('edutech-notices_demo')
  })

  it('adds notice, updates state, and generates valid id', async () => {
    const newNotice = await useNoticeStore.getState().addNotice({
      title: 'Annual Sports Notice',
      titleBn: 'বার্ষিক ক্রীড়া নোটিশ',
      content: '<p>Sports details</p>',
      contentBn: '<p>ক্রীড়া বিবরণ</p>',
      author: 'Principal',
      authorBn: 'অধ্যক্ষ',
      target: 'students',
      priority: 'urgent',
      category: 'Events',
      pinned: true,
      isActive: true,
      publishedAt: new Date().toISOString(),
      expiresAt: '2026-12-31',
    })

    expect(newNotice.id).toBeTruthy()
    expect(useNoticeStore.getState().notices.length).toBe(2)
    expect(useNoticeStore.getState().notices[0].title).toBe('Annual Sports Notice')
    expect(useNoticeStore.getState().notices[0].pinned).toBe(true)
  })

  it('updates notice and toggles pin correctly', async () => {
    await useNoticeStore.getState().togglePin('N-TEST-1')
    expect(useNoticeStore.getState().notices.find((n) => n.id === 'N-TEST-1')?.pinned).toBe(true)

    await useNoticeStore.getState().updateNotice('N-TEST-1', { title: 'Updated Title' })
    expect(useNoticeStore.getState().notices.find((n) => n.id === 'N-TEST-1')?.title).toBe('Updated Title')
  })

  it('deletes notice properly', async () => {
    await useNoticeStore.getState().deleteNotice('N-TEST-1')
    expect(useNoticeStore.getState().notices.find((n) => n.id === 'N-TEST-1')).toBeUndefined()
  })

  it('bypasses server network calls in local_computer mode and marks synced', async () => {
    sessionStorage.setItem('edutech_storage_mode', 'local_computer')
    await useNoticeStore.getState().syncFromServer('demo')
    expect(useNoticeStore.getState().serverSynced).toBe(true)
    expect(useNoticeStore.getState().syncing).toBe(false)
  })
})
