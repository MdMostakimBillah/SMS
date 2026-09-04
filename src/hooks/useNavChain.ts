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
 * Truncates the chain to the given index (inclusive).
 * @param index - The index to truncate to
 * @returns The truncated chain
 */
export function truncateChain(index: number): NavChainItem[] {
  try {
    const chain = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const truncated = chain.slice(0, index + 1)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(truncated))
    return truncated
  } catch {
    return []
  }
}

/**
 * Truncates the chain to the given index and navigates to that page.
 * @param index - The index to truncate to and navigate to
 * @param navigateFn - Router navigate function
 */
export function truncateAndNavigate(index: number, navigateFn: (path?: string) => void): void {
  truncateChain(index)
  if (index < getChainLength() - 1) {
    const path = getChainPath(index)
    if (path) navigateFn(path)
  }
}

/** Returns the length of the current chain. */
function getChainLength(): number {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').length
  } catch {
    return 0
  }
}

/** Returns the path at the given index in the current chain. */
function getChainPath(index: number): string | undefined {
  try {
    const chain = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return index >= 0 && index < chain.length ? chain[index].path : undefined
  } catch {
    return undefined
  }
}

/** Utility for breadcrumb onClick handlers that truncates chain and navigates. */
export function chainClickHandler(index: number, navigateFn: () => void): void {
  truncateAndNavigate(index, navigateFn)
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
  const truncateChainLocal = useCallback((index: number) => {
    try {
      const chain = getChain()
      setChain(chain.slice(0, index + 1))
    } catch {
      // ignore
    }
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
    truncateChain: truncateChainLocal,
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

/**
 * Exported utilities for navigation chain management.
 */
// truncateChain, truncateAndNavigate, chainClickHandler are already exported above