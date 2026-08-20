import { useState, useEffect } from 'react'

/**
 * `useDebouncedValue` — returns a value that only updates `delay` ms after the
 * last change to `value`. Use it to defer expensive filtering/search operations
 * until the user stops typing.
 *
 * @param value The value to debounce.
 * @param delay Debounce delay in milliseconds (default 200).
 * @returns The latest value that has been stable for at least `delay` ms.
 */
export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}