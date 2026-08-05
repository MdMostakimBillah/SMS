import { useEffect, useState } from 'react'

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

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent">
      <div
        className="h-full rounded-r-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--brand), var(--brand-light))',
          boxShadow: '0 0 10px var(--brand), 0 0 5px var(--brand)',
        }}
      />
    </div>
  )
}
