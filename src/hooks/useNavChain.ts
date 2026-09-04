import { useCallback, useEffect } from 'react'

const STORAGE_KEY = 'edutech_navChain'
const TIMESTAMP_KEY = 'edutech_lastRedirect'
const STALE_THRESHOLD = 30000

/** A single entry in the navigation breadcrumb chain. */
export interface NavChainItem {
  /** Route path of the page. */
  path: string
  /** Display label for breadcrumb rendering. */
  label: string
}

/**
 * Hook providing methods to manage a localStorage-based navigation breadcrumb chain.
 * @returns Object with chain manipulation helpers.
 */
export function useNavChain() {
  /** Reads the current navigation chain from localStorage. */
  const getChain = useCallback((): NavChainItem[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  }, [])

  /** Persists the navigation chain to localStorage. */
  const setChain = useCallback((chain: NavChainItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chain))
  }, [])

  /** Appends a page to the navigation chain. */
  const pushToChain = useCallback((item: NavChainItem) => {
    const chain = getChain()
    chain.push(item)
    setChain(chain)
  }, [getChain, setChain])

  /** Removes and returns the last item from the chain, or null if empty. */
  const popFromChain = useCallback((): NavChainItem | null => {
    const chain = getChain()
    if (chain.length === 0) return null
    const popped = chain.pop()!
    setChain(chain)
    return popped
  }, [getChain, setChain])

  /** Truncates the chain to the given index (inclusive). */
  const truncateChain = useCallback((index: number) => {
    const chain = getChain()
    setChain(chain.slice(0, index + 1))
  }, [getChain, setChain])

  /** Removes the entire navigation chain from localStorage. */
  const clearChain = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  /** Stores the current time in sessionStorage to mark a redirect navigation. */
  const setRedirectTimestamp = useCallback(() => {
    sessionStorage.setItem(TIMESTAMP_KEY, String(Date.now()))
  }, [])

  /** Returns true if the last redirect was within the stale threshold (30s). */
  const isRedirectRecent = useCallback((): boolean => {
    const lastRedirect = sessionStorage.getItem(TIMESTAMP_KEY)
    if (!lastRedirect) return false
    return Date.now() - Number(lastRedirect) <= STALE_THRESHOLD
  }, [])

  /** Clears the chain if the last redirect is stale (not recent). */
  const clearStaleChain = useCallback(() => {
    if (!isRedirectRecent()) {
      clearChain()
    }
  }, [isRedirectRecent, clearChain])

  return {
    getChain,
    setChain,
    pushToChain,
    popFromChain,
    truncateChain,
    clearChain,
    setRedirectTimestamp,
    isRedirectRecent,
    clearStaleChain,
  }
}

/**
 * Clears the navigation chain on mount if the last redirect is stale.
 * Use in page components that are navigated to directly (not via a redirect button).
 */
export function useNavChainClearOnMount() {
  const { clearStaleChain } = useNavChain()

  useEffect(() => {
    clearStaleChain()
  }, [clearStaleChain])
}