import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function TopLoadingBar() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer1 = setTimeout(() => setProgress(70), 100)
    const timer2 = setTimeout(() => setProgress(90), 800)
    const timer3 = setTimeout(() => setProgress(100), 1200)
    const timer4 = setTimeout(() => setVisible(false), 1500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [])

  if (!visible) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 99999,
        background: 'transparent',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          borderRadius: '0 4px 4px 0',
          transition: 'width 300ms ease-out',
          background: 'linear-gradient(90deg, var(--brand), var(--brand-light))',
          boxShadow: '0 0 10px var(--brand), 0 0 5px var(--brand)',
        }}
      />
    </div>,
    document.body
  )
}
