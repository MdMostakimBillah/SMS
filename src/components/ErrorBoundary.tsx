import { Component, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

function isChunkLoadError(error: Error): boolean {
  const msg = error.message.toLowerCase()
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('importing a module failed') ||
    msg.includes('dynamically imported module') ||
    error.name === 'ChunkLoadError' ||
    error.name === 'SyntaxError'
  )
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    if (isChunkLoadError(_error)) {
      if ('caches' in globalThis) {
        caches.keys().then((names) => {
          Promise.all(names.map((name) => caches.delete(name))).then(() => {
            globalThis.location.reload()
          }).catch(() => {
            globalThis.location.reload()
          })
        }).catch(() => {
          globalThis.location.reload()
        })
      } else {
        globalThis.location.reload()
      }
    }
  }

  handleGoBack = () => {
    globalThis.location.href = '/login'
  }

  handleTryAgain = () => {
    if ('caches' in globalThis) {
      caches.keys().then((names) => {
        Promise.all(names.map((name) => caches.delete(name))).then(() => {
          globalThis.location.reload()
        }).catch(() => {
          globalThis.location.reload()
        })
      }).catch(() => {
        globalThis.location.reload()
      })
    } else {
      globalThis.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '20rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '0.875rem',
              background: 'var(--red-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={24} style={{ color: 'var(--red)' }} />
          </div>

          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Something went wrong
          </h2>

          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              maxWidth: '24rem',
            }}
          >
            An unexpected error occurred. Please try again or go back to the previous page.
          </p>

          {this.state.error && (
            <pre
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1.5rem',
                maxWidth: '100%',
                overflow: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
            </pre>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={this.handleGoBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Go Back
            </button>
            <button
              onClick={this.handleTryAgain}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                background: 'var(--brand)',
                border: 'none',
                color: '#fff',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
