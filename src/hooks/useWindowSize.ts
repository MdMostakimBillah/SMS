import { useState, useEffect, useRef } from 'react'

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = () => {
      if (timerRef.current) return
      timerRef.current = setTimeout(() => {
        setSize({ width: window.innerWidth, height: window.innerHeight })
        timerRef.current = null
      }, 100)
    }
    window.addEventListener('resize', handler, { passive: true })
    return () => {
      window.removeEventListener('resize', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return {
    ...size,
    isMobile: size.width < 768,
    isTablet: size.width >= 768 && size.width < 1024,
    isDesktop: size.width >= 1024,
  }
}
