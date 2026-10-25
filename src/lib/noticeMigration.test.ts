import { describe, expect, it } from 'vitest'
import { DEFAULT_NOTICE_CATEGORIES, localNoticeToImportItem, mergeCategories, noticeToApiInput, serverNoticeToLocal } from './noticeMigration'
import type { NoticeData } from './api'
import type { Notice } from '@/store/noticeStore'

const localNotice = (overrides: Partial<Notice> = {}): Notice => ({
  id: 'NOTICE-123-1',
  title: 'Sports Day',
  titleBn: 'ক্রীড়া দিবস',
  content: '<p>Content</p>',
  contentBn: '<p>বিষয়</p>',
  author: 'Principal',
  authorBn: 'অধ্যক্ষ',
  target: 'all',
  priority: 'high',
  category: 'Events',
  pinned: true,
  isActive: true,
  publishedAt: '2026-10-01T08:00:00.000Z',
  expiresAt: '2026-10-25',
  ...overrides,
})

const serverRow = (overrides: Partial<NoticeData> = {}): NoticeData => ({
  id: 'srv-uuid-1',
  schoolId: 'school-1',
  title: 'Sports Day',
  titleBn: 'ক্রীড়া দিবস',
  content: '<p>Content</p>',
  contentBn: '<p>বিষয়</p>',
  author: 'Principal',
  authorBn: 'অধ্যক্ষ',
  target: 'all',
  priority: 'high',
  category: 'Events',
  pinned: true,
  isActive: true,
  publishedAt: '2026-10-01T08:00:00.000Z',
  expiresAt: '2026-10-25T00:00:00.000Z',
  storage: null,
  localId: 'NOTICE-123-1',
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-01T08:00:00.000Z',
  ...overrides,
})

describe('noticeToApiInput', () => {
  it('maps every field and nulls empty legacy strings', () => {
    const payload = noticeToApiInput(localNotice())
    expect(payload).toEqual({
      title: 'Sports Day',
      titleBn: 'ক্রীড়া দিবস',
      content: '<p>Content</p>',
      contentBn: '<p>বিষয়</p>',
      author: 'Principal',
      authorBn: 'অধ্যক্ষ',
      target: 'all',
      priority: 'high',
      category: 'Events',
      pinned: true,
      isActive: true,
      publishedAt: '2026-10-01T08:00:00.000Z',
      expiresAt: '2026-10-25',
      storage: null,
    })
  })

  it("normalizes the legacy 'no expiry' empty string to null", () => {
    expect(noticeToApiInput(localNotice({ expiresAt: '' })).expiresAt).toBeNull()
  })

  it('never includes a localId key on API-native payloads', () => {
    expect('localId' in noticeToApiInput(localNotice())).toBe(false)
  })
})

describe('localNoticeToImportItem', () => {
  it('uses the legacy local id as the idempotency key', () => {
    const item = localNoticeToImportItem(localNotice({ id: 'LEGACY-42' }))
    expect(item.localId).toBe('LEGACY-42')
    expect(item.title).toBe('Sports Day')
  })
})

describe('serverNoticeToLocal', () => {
  it('round-trips a server row back into the exact UI contract', () => {
    const local = serverNoticeToLocal(serverRow())
    expect(local).toEqual({
      id: 'srv-uuid-1',
      title: 'Sports Day',
      titleBn: 'ক্রীড়া দিবস',
      content: '<p>Content</p>',
      contentBn: '<p>বিষয়</p>',
      author: 'Principal',
      authorBn: 'অধ্যক্ষ',
      target: 'all',
      priority: 'high',
      category: 'Events',
      pinned: true,
      isActive: true,
      publishedAt: '2026-10-01T08:00:00.000Z',
      expiresAt: '2026-10-25T00:00:00.000Z',
      storage: undefined,
    })
  })

  it("converts a null expiry back to the legacy '' value (date-input contract)", () => {
    expect(serverNoticeToLocal(serverRow({ expiresAt: null })).expiresAt).toBe('')
  })

  it('fills nullable text fields with empty strings for the UI', () => {
    const local = serverNoticeToLocal(serverRow({ titleBn: null, contentBn: null, author: null, authorBn: null }))
    expect(local.titleBn).toBe('')
    expect(local.contentBn).toBe('')
    expect(local.author).toBe('')
    expect(local.authorBn).toBe('')
  })

  it('full migration round-trip preserves the record identity-relevant fields', () => {
    const original = localNotice()
    const back = serverNoticeToLocal({ ...serverRow(), ...noticeToApiInput(original), id: 'srv-1', schoolId: 's1' } as NoticeData)
    // Everything the UI displays/filters on survives the local → server → local trip:
    expect({ ...back, id: original.id }).toEqual(original)
  })
})

describe('mergeCategories', () => {
  it('keeps defaults first and appends custom labels without duplicates', () => {
    expect(mergeCategories(['Sports', 'General', 'Sports'])).toEqual([...DEFAULT_NOTICE_CATEGORIES, 'Sports'])
  })

  it('returns exactly the defaults when the server has no custom labels', () => {
    expect(mergeCategories([])).toEqual(DEFAULT_NOTICE_CATEGORIES)
  })
})
