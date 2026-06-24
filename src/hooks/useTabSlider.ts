import { useCallback, useEffect } from 'react'

interface UseTabSliderOptions {
  activeTab: string
  tabRefs: React.RefObject<Map<string, HTMLButtonElement> | null>
  sliderRef: React.RefObject<HTMLDivElement | null>
  scrollIntoView?: boolean
  getContainer?: (slider: HTMLDivElement) => HTMLElement | null
  useScrollLeft?: boolean
}

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