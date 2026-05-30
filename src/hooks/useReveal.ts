import { useEffect } from 'react'

export default function useReveal(rootSelector = '.reveal', baseDelay = 50) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(rootSelector)) as HTMLElement[]
    els.forEach((el, i) => {
      el.style.setProperty('--delay', `${i * baseDelay}ms`)
      // small timeout to ensure CSS is applied then class toggled
      requestAnimationFrame(() => {
        el.classList.add('is-visible')
      })
    })
    return () => {
      els.forEach(el => el.classList.remove('is-visible'))
    }
  }, [rootSelector, baseDelay])
}
