import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TopLoadingBar } from './components/ui/TopLoadingBar'
import './index.css'
import './styles/premium-theme.css'
import { cleanupOrphanedBaseKeys } from '@/lib/storage'
import App from './App'

cleanupOrphanedBaseKeys()

const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div />}>
      <ErrorBoundary>
        <BrowserRouter>
          <TopLoadingBar />
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  </StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      const onSWReady = () => {
        import('./store/classStore').then(({ useClassStore }) => {
          const { institution } = useClassStore.getState()
          const brandColor = institution.lightColors?.brand || '#6366f1'
          // Try to get institution details from superAdminStore for PWA identity
          import('./store/superAdminStore').then(({ useSuperAdminStore }) => {
            const slug = sessionStorage.getItem('edutech_inst_slug')
            const institutions = useSuperAdminStore.getState().institutions
            const inst = slug ? institutions.find((i) => i.slug === slug) : null
            reg.active?.postMessage({
              type: 'SET_INSTITUTION',
              name: inst?.name || institution.name || null,
              brandName: inst?.brandName || institution.brandName || null,
              slug: inst?.slug || slug || null,
              logo: inst?.logo || institution.logo || null,
              brandColor,
            })
          }).catch(() => {
            reg.active?.postMessage({ type: 'SET_BRAND_COLOR', color: brandColor })
          })
        })
      }
      if (reg.active) {
        onSWReady()
      } else {
        reg.installing?.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'activated') onSWReady()
        })
      }
    })
  })
}
