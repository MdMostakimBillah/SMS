import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { PanelRightOpen, PanelRightClose, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { gsap } from 'gsap'

export interface DrawerItem {
  id: string
  path: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  titleBn: string
  titleEn: string
}

interface QuickActionDrawerProps {
  title: string
  items: DrawerItem[]
}

export default function QuickActionDrawer({ title, items }: QuickActionDrawerProps) {
  const isBn = useBn()
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile } = useWindowSize()

  const [isOpen, setIsOpen] = useState(false)
  const handleRef = useRef<HTMLButtonElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)

  const toggle = useCallback(() => setIsOpen((p) => !p), [])

  // GSAP open/close
  useEffect(() => {
    if (!panelRef.current || !backdropRef.current) return
    if (isOpen) {
      backdropRef.current.style.display = 'block'
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      gsap.fromTo(panelRef.current, { x: '100%' }, { x: '0%', duration: 0.3, ease: 'power3.out' })
    } else {
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: () => { if (backdropRef.current) backdropRef.current.style.display = 'none' } })
      gsap.to(panelRef.current, { x: '100%', duration: 0.25, ease: 'power3.in' })
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Drag handle touch/mouse events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    startXRef.current = e.clientX
    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startXRef.current
      if (!isOpen && dx < -50) {
        setIsOpen(true)
        cleanup()
      } else if (isOpen && dx > 50) {
        setIsOpen(false)
        cleanup()
      }
    }
    const cleanup = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    const onUp = () => cleanup()
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [isOpen])

  return (
    <>
      {/* Handle */}
      <button
        ref={handleRef}
        onClick={toggle}
        onPointerDown={handlePointerDown}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[800] flex items-center justify-center w-[1.75rem] h-[3.5rem] rounded-l-lg cursor-pointer border-none transition-all duration-200 hover:w-[2rem]"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRight: 'none',
          color: isOpen ? 'var(--brand)' : 'var(--text-secondary)',
          boxShadow: '-2px 0 12px rgba(0,0,0,0.1)',
        }}
        title={isBn ? 'দ্রুত পাওয়া' : 'Quick access'}
      >
        {isOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
      </button>

      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-[810]"
        style={{ display: 'none', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 z-[820] flex flex-col"
        style={{
          width: isMobile ? '100vw' : '17.5rem',
          transform: 'translateX(100%)',
          background: 'var(--bg-primary)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-[0.875rem] font-semibold text-[var(--text-primary)]">
            {title}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-7 h-7 rounded-lg border-none cursor-pointer bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <PanelRightClose size={14} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path)
                  if (isMobile) setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-none cursor-pointer mb-1 transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                }`}
                style={{ fontFamily: 'inherit' }}
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                  style={{ background: isActive ? 'var(--brand)' : item.iconBg }}
                >
                  <Icon size={15} style={{ color: isActive ? '#fff' : item.iconColor }} />
                </div>
                <span className="flex-1 text-left text-[0.8125rem] font-medium truncate">
                  {isBn ? item.titleBn : item.titleEn}
                </span>
                <ChevronRight
                  size={14}
                  className="shrink-0"
                  style={{ color: isActive ? 'var(--brand)' : 'var(--text-muted)' }}
                />
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
