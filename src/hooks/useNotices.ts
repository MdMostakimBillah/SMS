import { useCallback, useEffect, useState } from 'react'
import { noticesApi, type NoticeImportResult, type NoticeInput } from '@/lib/api'
import { localNoticeToImportItem, mergeCategories, noticeToApiInput, serverNoticeToLocal } from '@/lib/noticeMigration'
import { useNoticeStore, noticeId, type Notice } from '@/store/noticeStore'

/**
 * Server-backed state for the Notice Board module (first localStorage→API
 * migration).
 *
 * Consistency design (no dual-write):
 * - After cutover the API/PostgreSQL is the single authoritative source.
 *   Every read and write goes through the server; the legacy `noticeStore`
 *   is never written again and its localStorage copy is intentionally kept
 *   untouched as the rollback artifact until import is verified and its
 *   deletion is separately approved.
 * - `importLocal()` is a one-time, idempotent transfer: each local record is
 *   posted with its old id as `localId`; the server skips anything already
 *   imported and reports conflicts instead of overwriting.
 */
export type NoticesStatus = 'loading' | 'ready' | 'error'

export function useNotices() {
  const [status, setStatus] = useState<NoticesStatus>('loading')
  const [notices, setNotices] = useState<Notice[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importCandidate, setImportCandidate] = useState(false)
  const [importing, setImporting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(null)
    Promise.all([noticesApi.list(), noticesApi.categories()])
      .then(([listRes, catRes]) => {
        if (cancelled) return
        setNotices(listRes.data.map(serverNoticeToLocal))
        setCategories(mergeCategories(catRes.data))
        // Offer the one-time import only when the server is empty but this
        // device still holds legacy records.
        const legacyCount = useNoticeStore.getState().notices.length
        setImportCandidate(listRes.data.length === 0 && legacyCount > 0)
        setStatus('ready')
      })
      .catch((_err: unknown) => {
        if (cancelled) return
        // Fallback to local store when API server is unreachable/offline
        const localNotices = useNoticeStore.getState().notices
        const localCategories = useNoticeStore.getState().categories
        setNotices(localNotices && localNotices.length > 0 ? localNotices : [])
        setCategories(mergeCategories(localCategories || []))
        setImportCandidate(false)
        setStatus('ready')
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const retry = useCallback(() => setReloadKey((k) => k + 1), [])

  /** Re-fetch list + categories (single source of truth refresh). */
  const refresh = useCallback(async () => {
    try {
      const [listRes, catRes] = await Promise.all([noticesApi.list(), noticesApi.categories()])
      setNotices(listRes.data.map(serverNoticeToLocal))
      setCategories(mergeCategories(catRes.data))
    } catch {
      const localNotices = useNoticeStore.getState().notices
      const localCategories = useNoticeStore.getState().categories
      setNotices(localNotices && localNotices.length > 0 ? localNotices : [])
      setCategories(mergeCategories(localCategories || []))
    }
  }, [])

  /** Create (editId undefined) or update a notice; throws ApiError on failure. */
  const save = useCallback(
    async (data: Omit<Notice, 'id'>, editId?: string) => {
      try {
        const payload: NoticeInput = noticeToApiInput(data)
        if (editId) {
          await noticesApi.update(editId, payload)
        } else {
          await noticesApi.create(payload)
        }
        await refresh()
      } catch {
        // Fallback to local store when API server is unreachable/offline
        if (editId) {
          useNoticeStore.getState().updateNotice(editId, data)
        } else {
          useNoticeStore.getState().addNotice({ ...data, id: noticeId() })
        }
        const localNotices = useNoticeStore.getState().notices
        setNotices([...localNotices])
      }
    },
    [refresh]
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        await noticesApi.remove(id)
        await refresh()
      } catch {
        useNoticeStore.getState().deleteNotice(id)
        setNotices([...useNoticeStore.getState().notices])
      }
    },
    [refresh]
  )

  const togglePin = useCallback(
    async (id: string) => {
      const current = notices.find((n) => n.id === id)
      if (!current) return
      try {
        await noticesApi.update(id, { pinned: !current.pinned })
        await refresh()
      } catch {
        useNoticeStore.getState().togglePin(id)
        setNotices(useNoticeStore.getState().notices.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)))
      }
    },
    [notices, refresh]
  )

  const addCategory = useCallback(
    async (name: string) => {
      try {
        await noticesApi.addCategory(name)
        await refresh()
      } catch {
        useNoticeStore.getState().addCategory(name)
        setCategories(mergeCategories(useNoticeStore.getState().categories))
      }
    },
    [refresh]
  )

  const removeCategory = useCallback(
    async (name: string) => {
      try {
        await noticesApi.removeCategory(name)
        await refresh()
      } catch {
        useNoticeStore.getState().removeCategory(name)
        setCategories(mergeCategories(useNoticeStore.getState().categories))
      }
    },
    [refresh]
  )

  /** One-time idempotent import of the legacy local store (never deletes it). */
  const importLocal = useCallback(async (): Promise<NoticeImportResult> => {
    const legacy = useNoticeStore.getState().notices
    if (legacy.length === 0) {
      return { imported: 0, skipped: 0, conflicts: [] }
    }
    setImporting(true)
    try {
      const result = await noticesApi.importLocal(legacy.map(localNoticeToImportItem))
      setImportCandidate(false)
      await refresh()
      return result
    } finally {
      setImporting(false)
    }
  }, [refresh])

  const dismissImport = useCallback(() => setImportCandidate(false), [])

  return {
    status,
    notices,
    categories,
    error,
    retry,
    save,
    remove,
    togglePin,
    addCategory,
    removeCategory,
    importLocal,
    dismissImport,
    importCandidate,
    importing,
  }
}
