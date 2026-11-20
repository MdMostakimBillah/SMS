import { useCallback, useEffect } from 'react'
import { useNoticeStore, type Notice } from '@/store/noticeStore'

export type NoticesStatus = 'loading' | 'ready' | 'error'

export function useNotices() {
  const notices = useNoticeStore((s) => s.notices)
  const categories = useNoticeStore((s) => s.categories)
  const serverSynced = useNoticeStore((s) => s.serverSynced)
  const syncing = useNoticeStore((s) => s.syncing)
  const syncError = useNoticeStore((s) => s.syncError)
  const lastSyncAt = useNoticeStore((s) => s.lastSyncAt)
  const importCandidate = useNoticeStore((s) => s.importCandidate)
  const importing = useNoticeStore((s) => s.importing)

  const syncFromServer = useNoticeStore((s) => s.syncFromServer)
  const addNotice = useNoticeStore((s) => s.addNotice)
  const updateNotice = useNoticeStore((s) => s.updateNotice)
  const deleteNotice = useNoticeStore((s) => s.deleteNotice)
  const togglePin = useNoticeStore((s) => s.togglePin)
  const addCategory = useNoticeStore((s) => s.addCategory)
  const removeCategory = useNoticeStore((s) => s.removeCategory)
  const importLocal = useNoticeStore((s) => s.importLocal)
  const dismissImport = useNoticeStore((s) => s.dismissImport)

  useEffect(() => {
    void syncFromServer()
  }, [syncFromServer])

  const retry = useCallback(() => {
    void syncFromServer()
  }, [syncFromServer])

  const save = useCallback(
    async (data: Omit<Notice, 'id'>, editId?: string) => {
      if (editId) {
        await updateNotice(editId, data)
      } else {
        await addNotice(data)
      }
    },
    [addNotice, updateNotice]
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteNotice(id)
    },
    [deleteNotice]
  )

  const status: NoticesStatus = syncing && notices.length === 0 ? 'loading' : 'ready'

  return {
    status,
    notices,
    categories,
    error: syncError,
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
    serverSynced,
    syncing,
    lastSyncAt,
  }
}
