import { useCallback, useEffect } from 'react'

/** Options for the {@link useTabSlider} hook. */
interface UseTabSliderOptions {
  /** ID of the currently active tab. */
  activeTab: string
  /** Map of tab IDs to their button elements. */
  tabRefs: React.RefObject<Map<string, HTMLButtonElement> | null>
  /** Ref to the sliding indicator element. */
  sliderRef: React.RefObject<HTMLDivElement | null>
  /** Whether to scroll the active tab into view on change. */
  scrollIntoView?: boolean
  /** Custom container resolver; defaults to slider.parentElement. */
  getContainer?: (slider: HTMLDivElement) => HTMLElement | null
  /** Use container's scrollLeft for offset calculation (horizontal scroll containers). */
  useScrollLeft?: boolean
}

/**
 * Positions a sliding indicator under the active tab and updates on resize.
 * @returns A callback to manually reposition the slider.
 */
export function useTabSlider({
  activeTab,
  tabRefs,
  sliderRef,
  scrollIntoView = false,
  getContainer,
  useScrollLeft = false,
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
    const scrollLeft = useScrollLeft ? container.scrollLeft : 0

    slider.style.width = `${activeRect.width}px`
    slider.style.transform = `translateX(${activeRect.left - containerRect.left + scrollLeft}px)`
  }, [activeTab, tabRefs, sliderRef, getContainer, useScrollLeft])

  useEffect(() => {
    updateTabSlider()

    if (scrollIntoView) {
      const activeEl = tabRefs.current?.get(activeTab)
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }

    window.addEventListener('resize', updateTabSlider)
    return () => window.removeEventListener('resize', updateTabSlider)
  }, [updateTabSlider, scrollIntoView, activeTab, tabRefs])

  return updateTabSlider
}