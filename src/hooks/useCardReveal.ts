import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function useCardReveal(deps: React.DependencyList = []) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const cards = containerRef.current.querySelectorAll('.anim-card')
    gsap.fromTo(cards, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out' })
  }, deps)

  return containerRef
}
