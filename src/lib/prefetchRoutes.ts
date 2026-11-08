/**
 * Asynchronously warms the browser and Service Worker cache with all page chunks
 * during network-connected idle time after online login.
 * This guarantees that when a user turns off internet connection / data,
 * ANY page or route can be navigated to offline without module fetch errors.
 */

let prefetchStarted = false

export function prefetchAllRoutes(): void {
  if (prefetchStarted || typeof window === 'undefined') return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  prefetchStarted = true

  const routeLoaders: Array<() => Promise<unknown>> = [
    () => import('@/pages/dashboard'),
    () => import('@/pages/students'),
    () => import('@/pages/students/admission'),
    () => import('@/pages/students/all'),
    () => import('@/pages/students/update'),
    () => import('@/pages/students/bulk-update'),
    () => import('@/pages/students/id-cards'),
    () => import('@/pages/students/promotion'),
    () => import('@/pages/teachers'),
    () => import('@/pages/teachers/add'),
    () => import('@/pages/teachers/all'),
    () => import('@/pages/teachers/departments'),
    () => import('@/pages/teachers/subjects'),
    () => import('@/pages/teachers/designations'),
    () => import('@/pages/teachers/bulk-update'),
    () => import('@/pages/classes'),
    () => import('@/pages/attendance'),
    () => import('@/pages/finance'),
    () => import('@/pages/expenses'),
    () => import('@/pages/others-income'),
    () => import('@/pages/accounting-report'),
    () => import('@/pages/payroll'),
    () => import('@/pages/exams/index'),
    () => import('@/pages/exams/step1'),
    () => import('@/pages/exams/step2'),
    () => import('@/pages/exams/step3'),
    () => import('@/pages/exams/step4'),
    () => import('@/pages/exams/step5'),
    () => import('@/pages/exams/omr'),
    () => import('@/pages/syllabus'),
    () => import('@/pages/assignments'),
    () => import('@/pages/online'),
    () => import('@/pages/store'),
    () => import('@/pages/transport'),
    () => import('@/pages/hostel'),
    () => import('@/pages/library'),
    () => import('@/pages/messages'),
    () => import('@/pages/notice'),
    () => import('@/pages/notifications'),
    () => import('@/pages/settings'),
  ]

  let index = 0

  function loadNext() {
    if (index >= routeLoaders.length) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    const loader = routeLoaders[index++]
    loader()
      .catch(() => {
        // Silently ignore loading errors during prefetch
      })
      .finally(() => {
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          ;(window as any).requestIdleCallback(loadNext, { timeout: 1500 })
        } else {
          setTimeout(loadNext, 150)
        }
      })
  }

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    ;(window as any).requestIdleCallback(loadNext, { timeout: 2500 })
  } else {
    setTimeout(loadNext, 600)
  }
}
