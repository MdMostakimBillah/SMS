import { useState, useCallback } from 'react'

export function useSelection() {
  const [selected, setSelected] = useState<string[]>([])
  const toggle = useCallback((id: string) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }, [])
  const toggleAll = useCallback((ids: string[]) => {
    setSelected((p) => (p.length === ids.length ? [] : ids))
  }, [])
  const isSelected = useCallback((id: string) => selected.includes(id), [selected])
  const clear = useCallback(() => setSelected([]), [])
  return { selected, toggle, toggleAll, isSelected, clear, setSelected }
}
