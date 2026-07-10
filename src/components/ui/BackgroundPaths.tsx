import { useEffect, useRef, useMemo } from 'react'
import gsap from 'gsap'

interface WavePath {
  id: number
  d: string
  width: number
  opacity: number
  duration: number
}

function generatePaths(position: number): WavePath[] {
  return Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
    opacity: 0.05 + i * 0.02,
    duration: 6 + Math.random() * 4,
  }))
}

function FloatingPaths({ position }: { position: number }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const paths = useMemo(() => generatePaths(position), [position])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const pathEls = svg.querySelectorAll<SVGPathElement>('path')
    const tweens: gsap.core.Tween[] = []

    pathEls.forEach((el, i) => {
      const path = paths[i]
      const length = el.getTotalLength()

      gsap.set(el, {
        strokeDasharray: length,
        strokeDashoffset: length * 0.7,
        opacity: 0.6,
      })

      tweens.push(
        gsap.to(el, {
          strokeDashoffset: -length * 0.3,
          duration: path.duration,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      )

      tweens.push(
        gsap.to(el, {
          opacity: path.opacity,
          duration: path.duration * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      )
    })

    return () => {
      tweens.forEach((t) => t.kill())
    }
  }, [paths])

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <path
            key={path.id}
            d={path.d}
            stroke="var(--brand)"
            strokeWidth={path.width}
            strokeOpacity={0.05 + path.id * 0.02}
          />
        ))}
      </svg>
    </div>
  )
}

export function BackgroundPaths({ isDark = true }: { isDark?: boolean }) {
  return (
    <div className="absolute inset-0">
      <FloatingPaths position={1} />
      <FloatingPaths position={-1} />
    </div>
  )
}
