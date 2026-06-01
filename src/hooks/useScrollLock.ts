import { useEffect } from 'react'

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return
    const html = document.documentElement
    const scrollY = window.scrollY

    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const lock = () => window.scrollTo(0, scrollY)
    window.addEventListener('scroll', lock)

    return () => {
      html.style.overflow = ''
      document.body.style.overflow = ''
      window.removeEventListener('scroll', lock)
      window.scrollTo(0, scrollY)
    }
  }, [isLocked])
}
