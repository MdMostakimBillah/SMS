import type { Assignment } from '@/store/assignmentStore'
import type { ClassInfo } from '@/store/classStore'

/**
 * Normalizes a class or section string for comparison:
 * Removes "class", "শ্রেণি", "শ্রেণী", extra whitespace, and lowercase.
 */
export function normalizeClassString(val?: string): string {
  return (val || '')
    .toLowerCase()
    .trim()
    .replace(/^class\s*/i, '')
    .replace(/শ্রেণি|শ্রেণী/g, '')
    .trim()
}

/**
 * Extracts digits from a class name like "Class 10" → "10", "1" → "1".
 */
export function extractClassDigits(val?: string): string {
  const match = (val || '').match(/\d+/)
  return match ? match[0] : ''
}

/**
 * Pure function that determines if an assignment from the institution admin assignment page
 * matches a specific student's class and section.
 *
 * Handles:
 * - When assignment.classId is a class ID (e.g. "cls-10", "1") or class name ("Class 10")
 * - When assignment.sectionId is a section ID (e.g. "sec-1") or section name ("A")
 * - When assignment.sectionId is empty or "all" (applies to all sections in the class)
 * - Number extraction fallback ("Class 10" matching "10" or "Ten")
 * - Case-insensitive and Bengali script variations
 */
export function matchAssignmentToStudent(
  assignment: Assignment,
  studentClass: string,
  studentSection: string,
  classes: ClassInfo[] = []
): boolean {
  // If assignment has no class specified or is "all", it applies to all classes
  if (!assignment.classId || assignment.classId === 'all' || assignment.classId.trim() === '') {
    return true
  }

  const sClassNorm = normalizeClassString(studentClass)
  const aClassNorm = normalizeClassString(assignment.classId)
  const sDigits = extractClassDigits(studentClass)
  const aDigits = extractClassDigits(assignment.classId)

  // 1. Direct normalized match
  let classMatched =
    aClassNorm === sClassNorm ||
    assignment.classId.toLowerCase().trim() === studentClass.toLowerCase().trim() ||
    (sDigits && aDigits && sDigits === aDigits)

  // 2. Class store resolution
  if (!classMatched && classes.length > 0) {
    // Find target class where assignment.classId matches class.id or class.name
    const targetClass = classes.find(
      (c) =>
        c.id === assignment.classId ||
        normalizeClassString(c.name) === aClassNorm ||
        c.name.toLowerCase().trim() === assignment.classId.toLowerCase().trim()
    )

    if (targetClass) {
      const targetNorm = normalizeClassString(targetClass.name)
      const targetDigits = extractClassDigits(targetClass.name)

      classMatched =
        targetClass.id === studentClass ||
        targetNorm === sClassNorm ||
        targetClass.name.toLowerCase().trim() === studentClass.toLowerCase().trim() ||
        (targetDigits && sDigits && targetDigits === sDigits) ||
        (targetClass.nameBn && normalizeClassString(targetClass.nameBn) === sClassNorm)
    }

    // Reverse check: studentClass might be a class ID
    if (!classMatched) {
      const studentClassObj = classes.find(
        (c) =>
          c.id === studentClass ||
          normalizeClassString(c.name) === sClassNorm ||
          c.name.toLowerCase().trim() === studentClass.toLowerCase().trim()
      )

      if (studentClassObj) {
        const scNorm = normalizeClassString(studentClassObj.name)
        const scDigits = extractClassDigits(studentClassObj.name)

        classMatched =
          studentClassObj.id === assignment.classId ||
          scNorm === aClassNorm ||
          (scDigits && aDigits && scDigits === aDigits) ||
          studentClassObj.name.toLowerCase().trim() === assignment.classId.toLowerCase().trim()
      }
    }
  }

  if (!classMatched) return false

  // 3. Section Matching
  // If assignment has no sectionId, or sectionId is 'all', it applies to all sections of that class
  if (!assignment.sectionId || assignment.sectionId === 'all' || assignment.sectionId.trim() === '') {
    return true
  }

  const sSec = (studentSection || '').toLowerCase().trim()
  const aSec = assignment.sectionId.toLowerCase().trim()

  // Direct section match
  if (sSec === aSec) return true

  // Section resolution via classes
  if (classes.length > 0) {
    const parentClass = classes.find(
      (c) =>
        c.id === assignment.classId ||
        normalizeClassString(c.name) === aClassNorm ||
        normalizeClassString(c.name) === sClassNorm
    )

    if (parentClass?.sections) {
      const sectionObj = parentClass.sections.find(
        (sec) => sec.id === assignment.sectionId || sec.name.toLowerCase().trim() === aSec
      )
      if (sectionObj) {
        if (sectionObj.id === studentSection || sectionObj.name.toLowerCase().trim() === sSec) {
          return true
        }
      }
    }
  }

  return false
}
