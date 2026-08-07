const CACHE_NAME = 'edutech-pwa-v2'
let brandColor = '#6366f1'
let institution = null // { name, brandName, slug, logo, brandColor }

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function generateFaviconSVG(color, letter) {
  const l = letter || 'E'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <rect width="48" height="48" rx="10" fill="${color}"/>
  <text x="24" y="32" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="24" font-weight="700" fill="white">${l}</text>
</svg>`
}

function generateManifest(color) {
  const name = institution?.name || 'EduTech SMS'
  const shortName = institution?.brandName || institution?.name || 'EduTech'
  const slug = institution?.slug
  const hasLogo = !!institution?.logo

  const manifest = {
    name,
    short_name: shortName.length > 12 ? shortName.slice(0, 12) : shortName,
    description: 'School Management System',
    start_url: slug ? `/i/${slug}` : '/dashboard',
    scope: slug ? `/i/${slug}/` : '/',
    id: slug ? `/i/${slug}` : '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: color,
    icons: hasLogo
      ? [
          { src: institution.logo, sizes: 'any', type: 'image/png' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ]
      : [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
  }

  return manifest
}

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data) return

  if (data.type === 'SET_INSTITUTION') {
    institution = {
      name: data.name || null,
      brandName: data.brandName || null,
      slug: data.slug || null,
      logo: data.logo || null,
      brandColor: data.brandColor || '#6366f1',
    }
    brandColor = institution.brandColor
  } else if (data.type === 'SET_BRAND_COLOR') {
    brandColor = data.color
    if (institution) institution.brandColor = data.color
  }
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin) return

  // Auto-detect institution from URL path if not set via message
  if (!institution) {
    const pathMatch = url.pathname.match(/^\/i\/([^/]+)/)
    if (pathMatch) {
      institution = { name: null, brandName: null, slug: pathMatch[1], logo: null, brandColor: '#6366f1' }
    }
  }

  if (url.pathname === '/favicon.svg' || url.pathname === '/favicon.ico') {
    const letter = institution?.name ? institution.name.charAt(0).toUpperCase() : 'E'
    event.respondWith(
      new Response(generateFaviconSVG(brandColor, letter), {
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    )
    return
  }

  if (url.pathname === '/manifest.json') {
    event.respondWith(
      new Response(JSON.stringify(generateManifest(brandColor)), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
    return
  }
})
