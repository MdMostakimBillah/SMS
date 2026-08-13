import { createPortal } from 'react-dom'
import { useLoadingBar } from '@/store/loadingBarStore'

export function TopLoadingBar() {
  const { loading, progress } = useLoadingBar()

  if (!loading && progress === 0) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 99999,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          borderRadius: '0 2px 2px 0',
          transition: progress === 100 ? 'width 300ms ease-in, opacity 300ms ease-in 100ms' : 'width 400ms ease',
          opacity: progress === 100 ? 0 : 1,
          background: 'linear-gradient(90deg, var(--brand), var(--brand-light, color-mix(in srgb, var(--brand) 40%, white)))',
          boxShadow: progress < 100 ? '0 0 10px var(--brand), 0 0 5px var(--brand)' : 'none',
        }}
      />
    </div>,
    document.body
  )
}
