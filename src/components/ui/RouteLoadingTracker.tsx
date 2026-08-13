import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useLoadingBar } from '@/store/loadingBarStore'

export function RouteLoadingTracker() {
  const location = useLocation()
  const { start, complete } = useLoadingBar()
  const prevPath = useRef(location.pathname)
  const startedRef = useRef(false)

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname
      startedRef.current = true
      start()
    }
  }, [location.pathname, start])

  useEffect(() => {
    if (startedRef.current) {
      // Small delay to ensure component has mounted
      const t = setTimeout(() => {
        startedRef.current = false
        complete()
      }, 100)
      return () => clearTimeout(t)
    }
  }, [location.pathname, complete])

  return null
}
