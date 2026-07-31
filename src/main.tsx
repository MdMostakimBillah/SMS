import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import './styles/premium-theme.css'
import App from './App'

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
          reg.active?.postMessage({ type: 'SET_BRAND_COLOR', color: brandColor })
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
