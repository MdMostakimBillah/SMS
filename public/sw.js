const CACHE_NAME = 'edutech-pwa-v5'
const PRECACHE_ASSETS = ['/', '/index.html', '/favicon.svg']

let brandColor = '#6366f1'
let institution = null // { name, brandName, slug, logo, brandColor }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Precache warning:', err)
        })
      })
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
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
  } else if (data.type === 'CACHE_ASSETS' && Array.isArray(data.urls)) {
    caches.open(CACHE_NAME).then((cache) => {
      data.urls.forEach((url) => {
        fetch(url)
          .then((res) => {
            if (res.ok) cache.put(url, res)
          })
          .catch(() => {})
      })
    })
  }
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // Never cache or hijack backend API endpoints; local stores handle offline persistence
  if (url.pathname.startsWith('/api/')) return

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
    if (url.pathname === '/favicon.ico') {
      event.respondWith(fetch('/favicon.svg'))
      return
    }
    return
  }

  // Dynamic PWA manifest
  if (url.pathname === '/manifest.json') {
    event.respondWith(
      new Response(JSON.stringify(generateManifest(brandColor)), {
        headers: { 'Content-Type': 'application/json' },
      })
    )
    return
  }

  // 1. Navigation requests (HTML documents): Network-First, falling back to cached /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone)
              cache.put('/index.html', networkResponse.clone())
            })
          }
          return networkResponse
        })
        .catch(async () => {
          const cachedRoute = await caches.match(event.request)
          if (cachedRoute) return cachedRoute
          const cachedIndex = await caches.match('/index.html')
          if (cachedIndex) return cachedIndex
          const cachedRoot = await caches.match('/')
          return cachedRoot || new Response('Offline: EduTech Shell not cached yet.', { status: 503 })
        })
    )
    return
  }

  // 2. Static application assets: Cache-First with Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.json')

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // In background, fetch and update cache
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse)
                })
              }
            })
            .catch(() => {})
          return cachedResponse
        }

        // Not in cache yet: fetch from network and save to cache
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const clone = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone)
              })
            }
            return networkResponse
          })
          .catch(() => {
            return new Response('', { status: 408, statusText: 'Offline asset not available' })
          })
      })
    )
    return
  }
})
