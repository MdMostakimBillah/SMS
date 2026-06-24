import { useCallback, useState } from 'react'

/** Tracks which fields have been touched and per-tab error sets. */
export interface FormValidationState<T extends Record<string, any>> {
  /** Set of field keys the user has interacted with. */
  touched: Set<keyof T>
  /** Map of tab ID to the set of field keys with validation errors. */
  errors: Record<string, Set<keyof T>>
}

/** Validation actions returned by {@link useFormValidation}. */
export interface FormValidationActions<T extends Record<string, any>> {
  /** Marks a field as touched. */
  touch: (key: keyof T) => void
  /** Validates required fields for a tab and returns the set of missing fields. */
  validate: (form: T, tab: string, requiredFields: (keyof T)[]) => Set<keyof T>
  /** Returns true if the field is touched and has an error on the active tab. */
  hasError: (key: keyof T, activeTab: string) => boolean
  /** Clears all errors for a given tab. */
  clearErrors: (tab: string) => void
  /** Resets touched and errors to initial state. */
  reset: () => void
}

/**
 * Generic form validation hook supporting multi-tab forms.
 * @param initialTabs - Tab IDs to initialize error tracking for.
 * @returns Tuple of [state, actions].
 */
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