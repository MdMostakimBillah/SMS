import { useEffect, useRef } from 'react'
import { useClassStore } from '@/store/classStore'
import type { ThemeColors } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'

const cssVarMap: Record<keyof import('@/store/classStore').ThemeColors, string> = {
  brand: '--brand',
  brand2: '--brand-2',
  brandLight: '--brand-light',
  teal: '--teal',
  tealLight: '--teal-light',
  green: '--green',
  greenLight: '--green-light',
  red: '--red',
  redLight: '--red-light',
  amber: '--amber',
  amberLight: '--amber-light',
  purple: '--purple',
  purpleLight: '--purple-light',
  bgPrimary: '--bg-primary',
  bgSecondary: '--bg-secondary',
  bgTertiary: '--bg-tertiary',
  surface: '--surface',
  surface2: '--surface-2',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  border: '--border',
  border2: '--border-2',
  cardBlue: '--card-blue',
  cardYellow: '--card-yellow',
  cardGreen: '--card-green',
  cardPurple: '--card-purple',
}

const STYLE_ID = 'edutech-custom-colors'

export function applyThemeColors(colors: ThemeColors) {
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ID
    document.head.appendChild(styleEl)
  }

  const cssVars = Object.entries(colors)
    .map(([key, value]) => {
      const cssVar = cssVarMap[key as keyof typeof cssVarMap]
      if (cssVar && value) {
        return `${cssVar}: ${value} !important`
      }
      return null
    })
    .filter(Boolean)
    .join('; ')

  styleEl.textContent = `:root, [data-theme='light'], [data-theme='dark'] { ${cssVars} }`
}

export function clearThemeColors() {
  const styleEl = document.getElementById(STYLE_ID)
  if (styleEl) {
    styleEl.remove()
  }
}

export function useThemeColors() {
  const theme = useAppStore((s) => s.theme)
  const institution = useClassStore((s) => s.institution)
  const appliedRef = useRef(false)

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    const colors = isDark ? institution.darkColors : institution.lightColors
    if (colors) {
      applyThemeColors(colors)
      appliedRef.current = true
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        const c = e.matches ? institution.darkColors : institution.lightColors
        if (c) applyThemeColors(c)
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme, institution.lightColors, institution.darkColors])
}
