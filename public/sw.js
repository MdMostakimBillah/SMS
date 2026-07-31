const CACHE_NAME = 'edutech-icons-v1'
let brandColor = '#6366f1'

function generateFaviconSVG(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <rect width="48" height="48" rx="10" fill="${color}"/>
  <path d="M24 10L8 20L24 30L40 20L24 10Z" fill="white" opacity="0.9"/>
  <path d="M12 22V32L24 38L36 32V22" stroke="white" stroke-width="2" fill="none" opacity="0.7"/>
  <path d="M36 22V32" stroke="white" stroke-width="2" opacity="0.7"/>
  <circle cx="36" cy="34" r="2" fill="white" opacity="0.7"/>
</svg>`
}

function generateManifest(color) {
  return {
    name: 'EduTech SMS',
    short_name: 'EduTech',
    description: 'School Management System',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: color,
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_BRAND_COLOR') {
    brandColor = event.data.color
  }
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (url.pathname === '/favicon.svg' || url.pathname === '/favicon.ico') {
    event.respondWith(
      new Response(generateFaviconSVG(brandColor), {
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
