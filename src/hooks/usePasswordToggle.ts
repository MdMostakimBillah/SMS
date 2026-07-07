import { useState, useCallback } from 'react'

export function usePasswordToggle(initial = false) {
  const [show, setShow] = useState(initial)
  const toggle = useCallback(() => setShow((s) => !s), [])
  return { show, toggle }
}
