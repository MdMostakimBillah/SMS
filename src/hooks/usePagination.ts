import { useState, useMemo, useCallback } from 'react'

export function usePagination<T>(items: T[], defaultPerPage = 20) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(defaultPerPage)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(items.length / perPage)), [items.length, perPage])
  const paginated = useMemo(() => items.slice((page - 1) * perPage, page * perPage), [items, page, perPage])

  const resetPage = useCallback(() => setPage(1), [])

  return { page, setPage, perPage, setPerPage, totalPages, paginated, resetPage }
}
