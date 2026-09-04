import { useState, useCallback } from 'react'
import { useForm as useReactHookForm } from 'react-hook-form'
import type { DefaultValues, RegisterOptions } from 'react-hook-form'
import { z } from 'zod'

/** Bilingual error message mapping.
 * Keys match Zod error codes or custom strings.
 */
type BilingualErrors<T extends Record<string, any>> = {
  [K in keyof T]?: {
    [key: string]: string
  }
}

/** Form validation state returned by useFormValidation */
export interface FormValidationState<T extends Record<string, any>> {
  /** Form values */
  values: T
  /** Field errors */
  errors: Record<string, string | undefined>
  /** Fields that have been touched */
  touched: Record<string, boolean>
  /** Is the form currently submitting */
  isSubmitting: boolean
  /** Validation status */
  isValid: boolean
}

/** Form validation actions returned by useFormValidation */
export interface FormValidationActions<T extends Record<string, any>> {
  /** Register a field with React Hook Form */
  register: (field: keyof T, options?: RegisterOptions) => any
  /** Handle form submission */
  handleSubmit: (onSubmit: (data: T) => Promise<void> | void) => (event: Event) => Promise<void>
  /** Set a field value */
  setValue: (field: keyof T, value: any) => void
  /** Get a field value */
  getValue: (field: keyof T) => any
  /** Reset the form */
  reset: (values?: Partial<T>) => void
  /** Validate the form */
  validate: () => Promise<Record<string, string | undefined>>
  /** Show success message */
  showSuccess: (message: string) => void
  /** Show error message */
  showError: (message: string) => void
}

/**
 * Generic form validation hook supporting React Hook Form, Zod validation,
 * bilingual error messages, multi-step form support, and success/error callbacks.
 * @param options - Configuration options for the form hook
 * @returns Tuple of [state, actions]
 */
export function useFormValidation<T extends Record<string, any>>({
  schema,
  bilingualErrors,
  defaultValues,
  onSubmit,
  onError,
  multiStep = false,
  currentStep = 1,
  setCurrentStep,
}: {
  schema: z.ZodSchema<T>
  bilingualErrors?: BilingualErrors<T>
  defaultValues?: Partial<T>
  onSubmit: (data: T) => Promise<void> | void
  onError?: (errors: Record<string, string>) => void
  multiStep?: boolean
  currentStep?: number
  setCurrentStep?: (step: number) => void
}): [FormValidationState<T>, FormValidationActions<T>] {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValid, setIsValid] = useState(false)

  const reactForm = useReactHookForm<DefaultValues>({
    defaultValues,
    mode: 'onBlur',
  })

  const [values, setValues] = useState<T>(defaultValues || {} as T)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const register = useReactHookForm.register

  const handleSubmit = useReactHookForm.handleSubmit<
    T,
    DefaultValues
  >(async (data) => {
    try {
      const parsed = schema.parse(data)
      setValues(parsed as T)
      setErrors({})
      setTouched({})
      setIsSubmitting(true)
      const result = await onSubmit(parsed as T)
      setIsSubmitting(false)
      if (result !== undefined && result !== null) {
        showSuccess(result)
      }
    } catch (e) {
      setIsSubmitting(false)
      if (onError) {
        onError(normalizeZodErrors(e as z.ZodError, bilingualErrors))
      }
    }
  })

  const validate = useCallback(async (): Promise<Record<string, string | undefined>> => {
    try {
      await schema.parse(values)
      setErrors({})
      setTouched({})
      setIsValid(true)
      return {}
    } catch (e) {
      setIsValid(false)
      const errRecord = normalizeZodErrors(e as z.ZodError, bilingualErrors)
      setErrors(errRecord)
      return errRecord
    }
  }, [values, bilingualErrors])

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const getValue = useCallback((field: keyof T) => {
    return values[field]
  }, [values])

  const reset = useCallback((values?: Partial<T>) => {
    setValues(values || {} as T)
    setErrors({})
    setTouched({})
    reactForm.reset()
  }, [])

  const showSuccess = useCallback((message: string) => {
    // Can be replaced with toast integration
    console.log('Success:', message)
  }, [])

  const showError = useCallback((message: string) => {
    // Can be replaced with toast integration
    console.error('Error:', message)
  }, [])

  const normalizeZodErrors = useCallback(
    (error: z.ZodError, bilingualErrors?: BilingualErrors<T>): Record<string, string> => {
      const errorRecord: Record<string, string> = {}

      error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        const defaultMsg = issue.message

        if (bilingualErrors && bilingualErrors[path as keyof T]) {
          const fieldErrors = bilingualErrors[path as keyof T]
          const code = issue.code
          if (code in fieldErrors) {
            errorRecord[path] = fieldErrors[code]
          } else {
            errorRecord[path] = defaultMsg
          }
        } else {
          errorRecord[path] = defaultMsg
        }
      })

      return errorRecord
    },
    [bilingualErrors]
  )

  return [
    {
      values,
      errors,
      touched,
      isSubmitting,
      isValid,
    } as FormValidationState<T>,
    {
      register,
      handleSubmit,
      setValue,
      getValue,
      reset,
      validate,
      showSuccess,
      showError,
    } as FormValidationActions<T>
  ]
}