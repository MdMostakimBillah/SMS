import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBn } from '@/hooks/useBn'
import { useWindowSize } from '@/hooks/useWindowSize'
import { useAdmissionStore, type StudentAdmission } from '@/store/admissionStore'
import { useNavPath } from '@/hooks/useNavPath'
import { useClassStore, getClassOptions, buildSectionsMap } from '@/store/classStore'
import { usePermission } from '@/hooks/usePermission'
import { isMatchingSession } from '@/lib/classStudentCount'
import { PromotionClassSelectors } from './components/PromotionClassSelectors'
import { PromotionHeader } from './components/PromotionHeader'
import { PromotionTable } from './components/PromotionTable'

export default function ClassPromotionPage() {
  const navigate = useNavigate()
  const nav = useNavPath()
  const { isMobile } = useWindowSize()
  const isBn = useBn()
  const { canCreate } = usePermission()

  const bulkAddStudents = useAdmissionStore((s) => s.bulkAddStudents)
  const allStudents = useAdmissionStore((s) => s.students)
  const { classes, institution, sessionClasses } = useClassStore()

  const classOptions = useMemo(() => getClassOptions(classes), [classes])
  const sectionsMap = useMemo(() => buildSectionsMap(classes), [classes])

  const currentSession = institution.currentSession
  const sessions = institution.sessions

  const [fSession, setFSession] = useState(currentSession)
  const [fromClass, setFromClass] = useState('')
  const [fromSection, setFromSection] = useState('')
  const [toClass, setToClass] = useState('')
  const [toSection, setToSection] = useState('')
  const [newSession, setNewSession] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [rollMap, setRollMap] = useState<Record<string, string>>({})
  const [isPromoting, setIsPromoting] = useState(false)
  const [promoted, setPromoted] = useState(false)
  const [promotedCount, setPromotedCount] = useState(0)

  // Pagination for ultra-fast rendering on low-end hardware
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)

  const toClassOptions = useMemo(() => {
    const list = newSession ? sessionClasses[newSession] : undefined
    const targetClasses = list && list.length > 0 ? list : classes
    return getClassOptions(targetClasses)
  }, [newSession, sessionClasses, classes])

  const toSectionsMap = useMemo(() => {
    const list = newSession ? sessionClasses[newSession] : undefined
    const targetClasses = list && list.length > 0 ? list : classes
    return buildSectionsMap(targetClasses)
  }, [newSession, sessionClasses, classes])

  useEffect(() => {
    useAdmissionStore.getState().syncFromServer().catch(() => {})
  }, [])

  useEffect(() => {
    setToClass('')
    setToSection('')
  }, [newSession])

  // Filter students matching selected session and active status
  const approved = useMemo(() => {
    if (!allStudents || allStudents.length === 0) return []
    let list = allStudents
    if (fSession) {
      const matched = allStudents.filter((s) => isMatchingSession(s.academicYear, fSession))
      list = matched.length > 0 ? matched : allStudents
    }
    return list.filter((s) => s.status === 'approved' && s.active !== false)
  }, [allStudents, fSession])

  const filtered = useMemo(() => {
    return approved.filter((s) => {
      if (fromClass && s.class !== fromClass) return false
      if (fromSection && s.section !== fromSection) return false
      return true
    })
  }, [approved, fromClass, fromSection])

  // Reset pagination when filter changes
  useEffect(() => {
    setPage(1)
  }, [fromClass, fromSection, fSession])

  const selectedSet = useMemo(() => new Set(selected), [selected])
  const allSel = filtered.length > 0 && filtered.every((s) => selectedSet.has(s.id))

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const prevSet = new Set(prev)
      const allFilteredSelected = filtered.every((s) => prevSet.has(s.id))
      if (allFilteredSelected) {
        // Deselect all filtered students while preserving selections outside the filter
        const filteredIdSet = new Set(filtered.map((s) => s.id))
        return prev.filter((id) => !filteredIdSet.has(id))
      }
      // Add all filtered students
      const merged = new Set(prev)
      for (const s of filtered) merged.add(s.id)
      return Array.from(merged)
    })
  }, [filtered])

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return Array.from(next)
    })
  }, [])

  const updateRoll = useCallback((id: string, val: string) => {
    setRollMap((prev) => {
      if (prev[id] === val) return prev
      return { ...prev, [id]: val }
    })
  }, [])

  // Pagination slice
  const paginatedStudents = useMemo(() => {
    if (perPage >= filtered.length) return filtered
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page, perPage])

  const totalPages = Math.ceil(filtered.length / perPage) || 1

  // Atomic batch promotion
  const promote = useCallback(() => {
    if (selected.length === 0) {
      alert(isBn ? 'অনুগ্রহ করে কমপক্ষে একজন ছাত্র নির্বাচন করুন' : 'Please select at least one student')
      return
    }
    if (!toClass) {
      alert(isBn ? 'অনুগ্রহ করে লক্ষ্য শ্রেণি নির্বাচন করুন' : 'Please select target class')
      return
    }
    if (!newSession) {
      alert(isBn ? 'অনুগ্রহ করে নতুন সেশন নির্বাচন করুন' : 'Please select new session')
      return
    }

    setIsPromoting(true)

    // Schedule on next tick to allow button UI state to paint immediately
    setTimeout(() => {
      try {
        const now = new Date().toISOString()
        const today = now.split('T')[0]

        // 1. Calculate highest numeric ID sequence in target session to guarantee uniqueness
        const sessionClean = newSession.replace(/[^a-zA-Z0-9]/g, '')
        const sessionPrefix = `ET-${sessionClean}-`
        let maxSeq = 0
        for (const s of allStudents) {
          if (s.id && s.id.startsWith(sessionPrefix)) {
            const seq = parseInt(s.id.slice(sessionPrefix.length), 10)
            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
          }
        }
        let count = maxSeq

        // 2. Fast O(1) map for selected student lookup
        const studentMap = new Map(allStudents.map((s) => [s.id, s]))

        // 3. Assemble all new promoted student records in 1 memory pass
        const promotedRecords: StudentAdmission[] = []
        for (const id of selected) {
          const student = studentMap.get(id)
          if (!student) continue

          count++
          const newId = `${sessionPrefix}${String(count).padStart(4, '0')}`
          const customRoll = rollMap[id]?.trim()

          promotedRecords.push({
            ...student,
            id: newId,
            createdAt: now,
            updatedAt: now,
            class: toClass,
            section: toSection || student.section,
            academicYear: newSession,
            roll: customRoll !== undefined && customRoll !== '' ? customRoll : student.roll,
            status: 'approved',
            approvedAt: today,
          })
        }

        if (promotedRecords.length === 0) {
          setIsPromoting(false)
          return
        }

        // 4. Single atomic batch update — 1 Zustand dispatch, 1 debounced localStorage write, 1 vault disk flush
        bulkAddStudents(promotedRecords)

        setPromotedCount(promotedRecords.length)
        setPromoted(true)
        setSelected([])
        setRollMap({})
        setTimeout(() => setPromoted(false), 4000)
      } finally {
        setIsPromoting(false)
      }
    }, 16)
  }, [selected, toClass, toSection, newSession, rollMap, allStudents, bulkAddStudents, isBn])

  return (
    <div>
      <PromotionHeader
        isBn={isBn}
        isMobile={isMobile}
        fSession={fSession}
        selectedCount={selected.length}
        canPromote={canCreate('students.promotion')}
        isPromoting={isPromoting}
        promoted={promoted}
        promotedCount={promotedCount}
        onBack={() => navigate(nav('/students'))}
        onPromote={promote}
      />

      <div className={`grid gap-[1rem] items-start ${isMobile ? 'grid-cols-1' : 'grid-cols-[300px_1fr]'}`}>
        <PromotionClassSelectors
          isBn={isBn}
          sessions={sessions}
          currentSession={currentSession}
          fSession={fSession}
          fromClass={fromClass}
          fromSection={fromSection}
          toClass={toClass}
          toSection={toSection}
          newSession={newSession}
          classOptions={classOptions}
          sectionsMap={sectionsMap}
          toClassOptions={toClassOptions}
          toSectionsMap={toSectionsMap}
          onFSessionChange={(v) => {
            setFSession(v)
            setSelected([])
            setRollMap({})
            setFromClass('')
            setFromSection('')
          }}
          onFromClassChange={(v) => {
            setFromClass(v)
            setSelected([])
            setRollMap({})
          }}
          onFromSectionChange={(v) => {
            setFromSection(v)
            setSelected([])
            setRollMap({})
          }}
          onToClassChange={(v) => setToClass(v)}
          onToSectionChange={(v) => setToSection(v)}
          onNewSessionChange={(v) => setNewSession(v)}
        />

        <PromotionTable
          isBn={isBn}
          fromClass={fromClass}
          filtered={filtered}
          selected={selected}
          selectedSet={selectedSet}
          allSel={allSel}
          onToggleAll={toggleAll}
          toClass={toClass}
          toSection={toSection}
          rollMap={rollMap}
          onToggleOne={toggleOne}
          onRollChange={updateRoll}
          page={page}
          perPage={perPage}
          setPage={setPage}
          setPerPage={setPerPage}
          totalPages={totalPages}
          paginatedStudents={paginatedStudents}
        />
      </div>
    </div>
  )
}
