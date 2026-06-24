import { useCallback, useEffect } from 'react'

const STORAGE_KEY = 'edutech_navChain'
const TIMESTAMP_KEY = 'edutech_lastRedirect'
const STALE_THRESHOLD = 30000

export interface NavChainItem {
  path: string
  label: string
}

export function useNavChain() {
  const getChain = useCallback((): NavChainItem[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  }, [])

  const setChain = useCallback((chain: NavChainItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chain))
  }, [])

  const pushToChain = useCallback((item: NavChainItem) => {
    const chain = getChain()
    chain.push(item)
    setChain(chain)
  }, [getChain, setChain])

  const popFromChain = useCallback((): NavChainItem | null => {
    const chain = getChain()
    if (chain.length === 0) return null
    const popped = chain.pop()!
    setChain(chain)
    return popped
  }, [getChain, setChain])

  const truncateChain = useCallback((index: number) => {
    const chain = getChain()
    setChain(chain.slice(0, index + 1))
  }, [getChain, setChain])

  const clearChain = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const setRedirectTimestamp = useCallback(() => {
    sessionStorage.setItem(TIMESTAMP_KEY, String(Date.now()))
  }, [])

  const isRedirectRecent = useCallback((): boolean => {
    const lastRedirect = sessionStorage.getItem(TIMESTAMP_KEY)
    if (!lastRedirect) return false
    return Date.now() - Number(lastRedirect) <= STALE_THRESHOLD
  }, [])

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

export function useNavChainClearOnMount() {
  const { clearStaleChain } = useNavChain()

  useEffect(() => {
    clearStaleChain()
  }, [clearStaleChain])
}