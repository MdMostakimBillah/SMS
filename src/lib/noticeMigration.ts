import type { NoticeData, NoticeInput } from './api'
import type { Notice } from '@/store/noticeStore'

/**
 * Pure adapters between the legacy localStorage notice shape (the UI contract
 * of the notice pages) and the notices API. No React, no IO — fully unit
 * tested (`noticeMigration.test.ts`).
 *
 * Migration invariants:
 * - The legacy local record id becomes the server-side idempotency key
 *   (`localId`), so a one-time import can be re-run safely.
 * - `expiresAt: ''` (legacy "no expiry") round-trips as `null`.
 * - `storage: undefined` round-trips as `null`.
 */

export const DEFAULT_NOTICE_CATEGORIES = ['General', 'Academic', 'Events', 'Emergency', 'Holiday']

/** Legacy/UI notice fields → API payload. */
export function noticeToApiInput(n: Omit<Notice, 'id'>): NoticeInput {
  return {
    title: n.title,
    titleBn: n.titleBn || null,
    content: n.content,
    contentBn: n.contentBn || null,
    author: n.author || null,
    authorBn: n.authorBn || null,
    target: n.target,
    priority: n.priority,
    category: n.category || 'General',
    pinned: n.pinned,
    isActive: n.isActive,
    publishedAt: n.publishedAt,
    expiresAt: n.expiresAt ? n.expiresAt : null,
    storage: n.storage ?? null,
  }
}

/** Legacy local record → one-time import payload (id becomes the idempotency key). */
export function localNoticeToImportItem(n: Notice): NoticeInput & { localId: string } {
  return { localId: n.id, ...noticeToApiInput(n) }
}

/** Server row → the exact local shape the notice pages already consume. */
export function serverNoticeToLocal(row: NoticeData): Notice {
  return {
    id: row.id,
    title: row.title,
    titleBn: row.titleBn ?? '',
    content: row.content,
    contentBn: row.contentBn ?? '',
    author: row.author ?? '',
    authorBn: row.authorBn ?? '',
    target: row.target as Notice['target'],
    priority: row.priority as Notice['priority'],
    category: row.category,
    pinned: row.pinned,
    isActive: row.isActive,
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt ? row.expiresAt : '',
    storage: row.storage ?? undefined,
  }
}

/** Built-in defaults first, then the school's custom labels — deduplicated. */
export function mergeCategories(serverNames: string[]): string[] {
  const merged = [...DEFAULT_NOTICE_CATEGORIES]
  for (const name of serverNames) {
    if (!merged.includes(name)) merged.push(name)
  }
  return merged
}
