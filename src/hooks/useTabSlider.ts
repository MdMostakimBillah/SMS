import { useCallback, useEffect } from 'react'

/** Options for the {@link useTabSlider} hook. */
interface UseTabSliderOptions {
  /** ID of the currently active tab. */
  activeTab: string
  /** Map of tab IDs to their button elements. */
  tabRefs: React.RefObject<Map<string, HTMLButtonElement> | null>
  /** Ref to the sliding indicator element. */
  sliderRef: React.RefObject<HTMLDivElement | null>
  /** Whether to scroll the active tab into view on change (only when not fully visible). */
  scrollIntoView?: boolean
  /** Custom container resolver; defaults to slider.parentElement. */
  getContainer?: (slider: HTMLDivElement) => HTMLElement | null
}

/**
 * Positions a sliding indicator under the active tab and updates on resize.
 * Handles skeleton loading by re-checking on every render until positioned.
 * @returns A callback to manually reposition the slider.
 */
export function useTabSlider({
  activeTab,
  tabRefs,
  sliderRef,
  scrollIntoView = false,
  getContainer,
}: UseTabSliderOptions) {
  const updateTabSlider = useCallback(() => {
    const slider = sliderRef.current
    const activeEl = tabRefs.current?.get(activeTab)
    if (!activeEl || !slider) return

    const container = getContainer
      ? getContainer(slider)
      : slider.parentElement
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    const scrollLeft = container.scrollLeft || 0

    slider.style.width = `${activeRect.width}px`
    slider.style.transform = `translateX(${activeRect.left - containerRect.left + scrollLeft}px)`
  }, [activeTab, tabRefs, sliderRef, getContainer])

  // Every render: position slider if it has zero width (handles skeleton → real content)
  useEffect(() => {
    const slider = sliderRef.current
    if (slider && slider.getBoundingClientRect().width === 0) {
      updateTabSlider()
    }
  })

  // Main effect: position on activeTab change, scrollIntoView, resize
  useEffect(() => {
    updateTabSlider()

    if (scrollIntoView) {
      const activeEl = tabRefs.current?.get(activeTab)
      const container = getContainer
        ? getContainer(sliderRef.current!)
        : sliderRef.current?.parentElement
      if (activeEl && container) {
        const cRect = container.getBoundingClientRect()
        const aRect = activeEl.getBoundingClientRect()
        if (aRect.left < cRect.left || aRect.right > cRect.right) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
      }
    }

    window.addEventListener('resize', updateTabSlider)
    return () => window.removeEventListener('resize', updateTabSlider)
  }, [updateTabSlider, scrollIntoView, activeTab, tabRefs, getContainer, sliderRef])

  return updateTabSlider
}
