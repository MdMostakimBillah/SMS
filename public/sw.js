const CACHE_NAME = 'edutech-pwa-v4'
let brandColor = '#6366f1'
let institution = null // { name, brandName, slug, logo, brandColor }

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function generateManifest(color) {
  const name = institution?.name || 'EduTech SMS'
  const shortName = institution?.brandName || institution?.name || 'EduTech'
  const slug = institution?.slug
  const logo = institution?.logo

  // Build icons — institution logo first if available
  const icons = []
  if (logo) {
    icons.push({ src: logo, sizes: '512x512', type: 'image/png', purpose: 'any maskable' })
    icons.push({ src: logo, sizes: '192x192', type: 'image/png', purpose: 'any' })
  }
  icons.push({ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' })

  return {
    name,
    short_name: shortName.length > 12 ? shortName.slice(0, 12) : shortName,
    description: 'School Management System',
    start_url: slug ? `/i/${slug}` : '/dashboard',
    scope: slug ? `/i/${slug}/` : '/',
    id: slug ? `/i/${slug}` : '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: color,
    icons,
  }
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

  // Favicon — an institution's own logo always wins; otherwise let the
  // animated brand logo at /favicon.svg through untouched.
  if (url.pathname === '/favicon.svg' || url.pathname === '/favicon.ico') {
    if (institution?.logo) {
      event.respondWith(
        fetch(institution.logo)
          .then((res) => (res.ok ? res : fetch('/favicon.svg')))
          .catch(() => fetch('/favicon.svg'))
      )
      return
    }
    // No .ico ships — the animated brand SVG stands in for it.
    if (url.pathname === '/favicon.ico') {
      event.respondWith(fetch('/favicon.svg'))
      return
    }
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
