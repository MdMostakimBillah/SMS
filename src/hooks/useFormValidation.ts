import { useCallback, useState } from 'react'

export interface FormValidationState<T extends Record<string, any>> {
  touched: Set<keyof T>
  errors: Record<string, Set<keyof T>>
}

export interface FormValidationActions<T extends Record<string, any>> {
  touch: (key: keyof T) => void
  validate: (form: T, tab: string, requiredFields: (keyof T)[]) => Set<keyof T>
  hasError: (key: keyof T, activeTab: string) => boolean
  clearErrors: (tab: string) => void
  reset: () => void
}

export function useFormValidation<T extends Record<string, any>>(
  initialTabs: string[]
): [FormValidationState<T>, FormValidationActions<T>] {
  const initialErrors: Record<string, Set<keyof T>> = {}
  initialTabs.forEach((tab) => {
    initialErrors[tab] = new Set()
  })

  const [touched, setTouched] = useState<Set<keyof T>>(new Set())
  const [errors, setErrors] = useState<Record<string, Set<keyof T>>>(initialErrors)

  const touch = useCallback((key: keyof T) => {
    setTouched((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const validate = useCallback((form: T, tab: string, requiredFields: (keyof T)[]): Set<keyof T> => {
    const missing = new Set<keyof T>()
    requiredFields.forEach((field) => {
      const value = form[field]
      if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
        missing.add(field)
      }
    })
    setErrors((prev) => ({ ...prev, [tab]: missing }))
    return missing
  }, [])

  const hasError = useCallback((key: keyof T, activeTab: string): boolean => {
    return touched.has(key) && errors[activeTab]?.has(key) === true
  }, [touched, errors])

  const clearErrors = useCallback((tab: string) => {
    setErrors((prev) => ({ ...prev, [tab]: new Set() }))
  }, [])

  const reset = useCallback(() => {
    setTouched(new Set())
    setErrors(initialErrors)
  }, [initialErrors])

  return [
    { touched, errors },
    { touch, validate, hasError, clearErrors, reset },
  ]
}