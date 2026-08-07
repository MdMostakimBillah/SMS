import { useEffect } from 'react'
import { useClassStore } from '@/store/classStore'
import type { ThemeColors } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'
import { useSuperAdminStore } from '@/store/superAdminStore'

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
let lastAppliedColor = ''

export function applyThemeColors(colors: ThemeColors) {
  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ID
    document.head.appendChild(styleEl)
  }

  const theme = useAppStore.getState().theme
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const selector = isDark ? "[data-theme='dark']" : ":root, [data-theme='light']"

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

  styleEl.textContent = `${selector} { ${cssVars} }`

  // Update <meta name="theme-color"> dynamically
  const brandColor = colors.brand
  if (brandColor && brandColor !== lastAppliedColor) {
    lastAppliedColor = brandColor
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    metaThemeColor.setAttribute('content', brandColor)

    // Update PWA manifest theme_color dynamically
    updateManifestThemeColor(brandColor)

    // Update favicon with brand color
    updateFavicon(brandColor)

    // Notify service worker of brand color change
    sendBrandColorToSW(brandColor)
  }
}

function updateManifestThemeColor(color: string) {
  fetch('/manifest.json')
    .then((res) => res.json())
    .then((manifest) => {
      manifest.theme_color = color

      const svg = generateFaviconSVG(color)
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
      const svgUrl = URL.createObjectURL(svgBlob)
      manifest.icons = [
        {
          src: svgUrl,
          sizes: 'any',
          type: 'image/svg+xml',
        },
      ]

      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
      const manifestURL = URL.createObjectURL(blob)
      let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
      if (manifestLink) {
        if (manifestLink.dataset.blobUrl) {
          URL.revokeObjectURL(manifestLink.dataset.blobUrl)
        }
        manifestLink.href = manifestURL
        manifestLink.dataset.blobUrl = manifestURL
      }
    })
    .catch(() => {
      // Silently fail - manifest is static fallback
    })
}

function generateFaviconSVG(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <rect width="48" height="48" rx="10" fill="${color}"/>
  <path d="M24 10L8 20L24 30L40 20L24 10Z" fill="white" opacity="0.9"/>
  <path d="M12 22V32L24 38L36 32V22" stroke="white" stroke-width="2" fill="none" opacity="0.7"/>
  <path d="M36 22V32" stroke="white" stroke-width="2" opacity="0.7"/>
  <circle cx="36" cy="34" r="2" fill="white" opacity="0.7"/>
</svg>`
}

function updateFavicon(color: string) {
  const svg = generateFaviconSVG(color)
  const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`

  const oldLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (oldLink) {
    oldLink.remove()
  }

  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/svg+xml'
  link.href = dataUrl
  document.head.appendChild(link)
}

function sendBrandColorToSW(color: string) {
  if (!navigator.serviceWorker) return
  navigator.serviceWorker.ready.then((reg) => {
    const slug = sessionStorage.getItem('edutech_inst_slug')
    const institutions = useSuperAdminStore.getState().institutions
    const inst = slug ? institutions.find((i) => i.slug === slug) : null
    const { institution: classInst } = useClassStore.getState()
    reg.active?.postMessage({
      type: 'SET_INSTITUTION',
      name: inst?.name || classInst.name || null,
      brandName: inst?.brandName || classInst.brandName || null,
      slug: inst?.slug || slug || null,
      logo: inst?.logo || classInst.logo || null,
      brandColor: color,
    })
  })
}

export function clearThemeColors() {
  const styleEl = document.getElementById(STYLE_ID)
  if (styleEl) {
    styleEl.remove()
  }
}

export function useThemeColors() {
  const theme = useAppStore((s) => s.theme)
  const lightColors = useClassStore((s) => s.institution.lightColors)
  const darkColors = useClassStore((s) => s.institution.darkColors)

  const lightColorsKey = JSON.stringify(lightColors)
  const darkColorsKey = JSON.stringify(darkColors)

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    const colors = isDark ? darkColors : lightColors
    if (colors) {
      applyThemeColors(colors)
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        const c = e.matches ? darkColors : lightColors
        if (c) applyThemeColors(c)
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme, lightColorsKey, darkColorsKey])
}
