import { lazy, type ComponentType } from 'react'

function retryImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 1,
  delay = 800
): Promise<{ default: T }> {
  return new Promise((resolve, reject) => {
    factory()
      .then(resolve)
      .catch((error) => {
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
