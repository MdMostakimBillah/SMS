import { useMemo, useCallback } from 'react'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'

export function useClassFilters() {
  const classes = useClassStore((s) => s.classes)
  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])
  const getSections = useCallback((classId: string) => sectionsMap[classId] || [], [sectionsMap])
  return { classes, classOptions, sectionsMap, getSections }
}
