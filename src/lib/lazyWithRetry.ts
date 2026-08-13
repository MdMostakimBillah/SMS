import { lazy, type ComponentType } from 'react'

function isChunkError(error: any): boolean {
  const msg = (error?.message || '').toLowerCase()
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('importing a module failed') ||
    msg.includes('dynamically imported module') ||
    error?.name === 'ChunkLoadError'
  )
}

function retryImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  delay = 500
): Promise<{ default: T }> {
  return new Promise((resolve, reject) => {
    factory()
      .then(resolve)
      .catch((error) => {
        if (isChunkError(error)) {
          // Stale chunk URL — retrying won't help, reload immediately
          globalThis.location.reload()
          reject(error)
          return
        }
        if (retries <= 0) {
          reject(error)
          return
        }
        setTimeout(() => {
          retryImport(factory, retries - 1, delay).then(resolve, reject)
        }, delay)
      })
  })
}

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() => retryImport(factory))
}
