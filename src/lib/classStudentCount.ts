import type { StudentAdmission } from '@/pages/students/admission/types'
import type { ClassInfo, ClassSection } from '@/store/classStore'

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
}

export function toEnNum(str: string): string {
  return str.replace(/[০-৯]/g, (d) => BN_TO_EN_DIGITS[d] || d)
}

/**
 * Checks whether an academic year string matches the current session.
 * Handles "2025-26", "2025-2026", empty/undefined, etc.
 */
export function isMatchingSession(studentYear?: string | null, currentSession?: string | null): boolean {
  if (!studentYear || !currentSession) return true
  const sy = studentYear.trim()
  const cs = currentSession.trim()
  if (sy === cs) return true

  // Compare starting year (e.g. "2025-26" and "2025-2026" both start with "2025")
  const syStart = sy.split('-')[0].trim()
  const csStart = cs.split('-')[0].trim()
  if (syStart && csStart && syStart === csStart) return true

  return false
}

/**
 * Matches a student's class attribute with a ClassInfo entity.
 * Handles:
 * - Direct name match ("PSC" === "PSC", "Class 1" === "Class 1")
 * - Bengali name match ("পিএসসি" === "পিএসসি", "১ম শ্রেণি" === "১ম শ্রেণি")
 * - ID match ("CLS-01" === "CLS-01")
 * - Numbered class variations ("Class 1", "1", "01", "১")
 */
export function isStudentInClass(student: { class?: string | null }, cls: ClassInfo): boolean {
  if (!student || !student.class) return false
  const sc = student.class.trim()
  if (!sc) return false

  const scLower = sc.toLowerCase()
  const clsNameLower = cls.name.trim().toLowerCase()
  const clsNameBn = (cls.nameBn || '').trim()
  const clsId = cls.id.trim().toLowerCase()

  // 1. Direct name match (case-insensitive)
  if (scLower === clsNameLower) return true

  // 2. Direct Bengali name match
  if (clsNameBn && sc === clsNameBn) return true

  // 3. ID match
  if (scLower === clsId) return true

  // Convert Bengali numerals if any
  const scEn = toEnNum(sc)
  const scEnLower = scEn.toLowerCase()

  // 4. Strip "Class" prefix: e.g. "Class 1" -> "1", "class 5" -> "5"
  const scClean = scEnLower.replace(/^class\s*/i, '').trim()
  const clsClean = clsNameLower.replace(/^class\s*/i, '').trim()
  if (scClean && clsClean && scClean === clsClean) return true

  // 5. Numeric matching: e.g. "Class 01" vs "1" or "01"
  const scNum = scClean.replace(/^0+/, '')
  const clsNum = clsClean.replace(/^0+/, '')
  if (scNum && clsNum && /^\d+$/.test(scNum) && /^\d+$/.test(clsNum) && scNum === clsNum) {
    return true
  }

  return false
}

/**
 * Matches a student's section attribute with a ClassSection entity.
 * Handles:
 * - Direct match ("General" === "General", "A" === "A")
 * - "Section" prefix strip ("Section General" === "General", "Section A" === "A")
 * - Section ID match
 * - Single section fallback: if class only has 1 section and student's section is blank, student is in that section
 */
export function isStudentInSection(
  student: { class?: string | null; section?: string | null },
  cls: ClassInfo,
  sec: ClassSection
): boolean {
  if (!isStudentInClass(student, cls)) return false

  const ss = (student.section || '').trim()
  const secName = (sec.name || '').trim()
  const secId = (sec.id || '').trim()

  // If the class only has 1 section and student has no section assigned, they belong to this section
  if (!ss && cls.sections.length === 1) return true
  if (!ss) return false

  const ssLower = ss.toLowerCase()
  const secNameLower = secName.toLowerCase()

  // 1. Direct name match
  if (ssLower === secNameLower) return true

  // 2. ID match
  if (secId && ssLower === secId.toLowerCase()) return true

  // 3. Strip "Section" prefix
  const ssClean = ssLower.replace(/^section\s*/i, '').trim()
  const secClean = secNameLower.replace(/^section\s*/i, '').trim()
  if (ssClean && secClean && ssClean === secClean) return true

  return false
}

/**
 * Counts qualifying students in a specific section of a class.
 */
export function getSectionStudentCount(
  students: StudentAdmission[],
  cls: ClassInfo,
  sec: ClassSection,
  currentSession?: string
): number {
  return students.filter((s) => {
    if (s.active === false || s.status === 'rejected') return false
    if (!isMatchingSession(s.academicYear, currentSession)) return false
    return isStudentInSection(s, cls, sec)
  }).length
}

/**
 * Counts qualifying students in a class.
 */
export function getClassStudentCount(
  students: StudentAdmission[],
  cls: ClassInfo,
  currentSession?: string
): number {
  return students.filter((s) => {
    if (s.active === false || s.status === 'rejected') return false
    if (!isMatchingSession(s.academicYear, currentSession)) return false
    return isStudentInClass(s, cls)
  }).length
}
