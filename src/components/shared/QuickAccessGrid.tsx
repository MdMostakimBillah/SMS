import { useCallback, useState, type CSSProperties, type DragEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Plus } from 'lucide-react'

/**
 * One destination tile in the quick-access grid.
 *
 * The `title` / `desc` pair is the existing card copy; `value` is the figure
 * the layout is built around, so it must already be localised (Bengali digits,
 * `৳`, and so on are all fine because it travels as a string).
 */
export interface QuickAccessItem {
  id: string
  icon: LucideIcon
  iconColor: string
  titleBn: string
  titleEn: string
  /** Hero figure — the visual anchor of the card. */
  valueBn: string
  valueEn: string
  /** Line under the figure. */
  descBn: string
  descEn: string
  /** Accent card only: the muted line beneath the action title. */
  statBn?: string
  statEn?: string
}

interface Props {
  items: QuickAccessItem[]
  isBn: boolean
  isMobile: boolean
  isTablet: boolean
  /**
   * id of the accent "quick action" card that sits beside the hero. Pages
   * without an add/create destination simply omit it and the slot degrades to
   * a regular wide card.
   */
  actionId?: string
  onSelect: (id: string) => void
  onReorder: (from: number, to: number) => void
  className?: string
}

type Variant = 'hero' | 'action' | 'wide' | 'normal'

/** Column spans per breakpoint; 12 tracks on desktop, 6 on tablet, 2 on mobile. */
function spanFor(variant: Variant, isMobile: boolean, isTablet: boolean): number {
  if (isMobile) return variant === 'hero' || variant === 'action' ? 2 : 1
  if (isTablet) return variant === 'hero' || variant === 'action' ? 6 : 3
  if (variant === 'hero') return 8
  if (variant === 'action' || variant === 'wide') return 4
  return 3
}

function columnsFor(isMobile: boolean, isTablet: boolean): string {
  if (isMobile) return 'repeat(2, 1fr)'
  if (isTablet) return 'repeat(6, 1fr)'
  return 'repeat(12, 1fr)'
}

/** How many normal cards fit on a row before the grid wraps. */
function capacityFor(isMobile: boolean, isTablet: boolean): number {
  if (isMobile) return 2
  if (isTablet) return 2
  return 4
}

const cardBase: CSSProperties = {
  borderRadius: '0.75rem',
  padding: '1rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  minWidth: 0,
}

const captionStyle: CSSProperties = {
  fontSize: '0.75rem',
  lineHeight: 1.5,
  color: 'var(--text-muted)',
}

/**
 * Quick-access card grid shared by Teacher, Student, Exam and Fee management.
 *
 * The figure is the hero of every card: a wide lead card carries it beside a
 * supporting description, an accent quick-action card sits to its right, and
 * the remaining destinations run four-up underneath. Cards keep the app-wide
 * `glass` treatment and lift on hover — only the internal layout differs from
 * the old icon-tile cards. Drag-and-drop reordering lives here too, so each
 * page just hands over its ordered items and a callback.
 */
export function QuickAccessGrid({
  items,
  isBn,
  isMobile,
  isTablet,
  actionId,
  onSelect,
  onReorder,
  className,
}: Props) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const handleDragStart = useCallback((e: DragEvent, idx: number) => {
    setDraggedIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIdx(idx)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null)
    setDragOverIdx(null)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent, dropIdx: number) => {
      e.preventDefault()
      const from = draggedIdx
      setDraggedIdx(null)
      setDragOverIdx(null)
      if (from === null || from === dropIdx) return
      onReorder(from, dropIdx)
    },
    [draggedIdx, onReorder]
  )

  const variantOf = (idx: number): Variant => {
    if (idx === 0) return 'hero'
    if (idx === 1) return actionId && items[idx].id === actionId ? 'action' : 'wide'
    return 'normal'
  }

  // When the trailing cards don't fill a row, the last one stretches instead of
  // leaving a hole — Fee Management has seven destinations against four slots.
  const capacity = capacityFor(isMobile, isTablet)
  const normalCount = Math.max(0, items.length - 2)
  const lastRowAlone = normalCount > 0 && normalCount % capacity === 1
  const fullColumns = isMobile ? 2 : isTablet ? 6 : 12

  const valueStyle = (variant: Variant, raw: string): CSSProperties => {
    const base = variant === 'hero' ? (isMobile ? 2.25 : 3) : isMobile ? 1.5 : 2
    // Currency figures get long, so step the size down rather than wrap or spill.
    const length = raw.length
    const scale = length > 9 ? 0.55 : length > 7 ? 0.7 : length > 5 ? 0.85 : 1
    return {
      fontSize: `${base * scale}rem`,
      fontWeight: 600,
      lineHeight: 1,
      letterSpacing: '-0.0625rem',
      color: 'var(--text-primary)',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }
  }

  return (
    <div
      className={className ? `gsap-fade-up ${className}` : 'gsap-fade-up'}
      style={{ display: 'grid', gridTemplateColumns: columnsFor(isMobile, isTablet), gap: isMobile ? '0.5rem' : '0.75rem' }}
    >
      {items.map((item, idx) => {
        const variant = variantOf(idx)
        const IconComp = item.icon
        const isDragging = draggedIdx === idx
        const isDragOver = dragOverIdx === idx
        const isAccent = variant === 'action'
        const isLast = idx === items.length - 1
        const span =
          items.length === 1 || (variant === 'normal' && isLast && lastRowAlone)
            ? fullColumns
            : spanFor(variant, isMobile, isTablet)

        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (draggedIdx !== null) return
              onSelect(item.id)
            }}
            className="glass"
            style={{
              ...cardBase,
              gridColumn: `span ${span}`,
              minHeight: isMobile
                ? variant === 'hero' || variant === 'action' ? '9.5rem' : '7.5rem'
                : variant === 'hero' || variant === 'action' ? '11.5rem' : '8.5rem',
              opacity: isDragging ? 0.5 : 1,
              transform: isDragOver ? 'translateY(-2px)' : undefined,
              boxShadow: isDragOver ? '0 8px 32px rgba(0,0,0,0.12)' : 'none',
              borderColor: isDragOver ? 'var(--brand)' : undefined,
            }}
            onMouseEnter={(e) => {
              if (draggedIdx !== null) return
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={(e) => {
              if (draggedIdx !== null) return
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Header: icon + label, with the card's affordance on the right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
              <div style={labelStyle}>
                <IconComp size={14} style={{ color: item.iconColor, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isAccent ? (isBn ? 'দ্রুত অ্যাক্সেস' : 'Quick action') : isBn ? item.titleBn : item.titleEn}
                </span>
              </div>
              {variant === 'hero' ? (
                <ArrowUpRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              ) : null}
            </div>

            {/* Body */}
            {isAccent ? (
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {isBn ? item.titleBn : item.titleEn}
                  </div>
                  <div style={{ ...captionStyle, marginTop: '0.25rem' }}>{isBn ? item.statBn : item.statEn}</div>
                </div>
                <div
                  style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Plus size={15} />
                </div>
              </div>
            ) : variant === 'hero' ? (
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={valueStyle(variant, isBn ? item.valueBn : item.valueEn)}>{isBn ? item.valueBn : item.valueEn}</div>
                <div style={{ ...captionStyle, textAlign: 'right', maxWidth: '14rem' }}>
                  {isBn ? item.descBn : item.descEn}
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 'auto' }}>
                <div style={valueStyle(variant, isBn ? item.valueBn : item.valueEn)}>{isBn ? item.valueBn : item.valueEn}</div>
                <div style={{ ...captionStyle, marginTop: isMobile ? '0.375rem' : '0.5rem' }}>
                  {isBn ? item.descBn : item.descEn}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
