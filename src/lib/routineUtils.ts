import type { ClassInfo, ClassRoutine } from '@/store/classStore'

/**
 * Days of the week in routine order (Saturday is index 0 in Bangladesh school routines).
 */
export const ROUTINE_DAYS_EN = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
] as const

export const ROUTINE_DAYS_BN = [
  'শনিবার',
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
] as const

/**
 * Normalizes class strings by extracting numeric digits or lowercasing.
 * E.g., "Class 10" -> "10", "10" -> "10", "Play" -> "play".
 */
export function normalizeClassString(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()
  const match = trimmed.match(/\d+/)
  if (match) {
    return match[0]
  }
  return trimmed.toLowerCase()
}

/**
 * Finds the matching ClassRoutine for a student given their class name/ID and section.
 * Precedence:
 * 1. Matching class and matching specific section
 * 2. Matching class and general/all section (empty or 'all')
 * 3. Any routine for that class
 */
export function matchRoutineForStudent(
  studentClass: string,
  studentSection: string | undefined,
  classes: ClassInfo[] = [],
  routines: ClassRoutine[] = []
): ClassRoutine | undefined {
  if (!studentClass || !routines.length) return undefined

  const sClassTrimmed = studentClass.trim()
  const sClassLower = sClassTrimmed.toLowerCase()
  const sClassNormalized = normalizeClassString(sClassTrimmed)

  // Find class from classes store
  const matchedClass = classes.find((c) => {
    if (c.id === sClassTrimmed || c.id.toLowerCase() === sClassLower) return true
    if (c.name.trim().toLowerCase() === sClassLower) return true
    if (normalizeClassString(c.name) === sClassNormalized) return true
    return false
  })

  const classId = matchedClass?.id || sClassTrimmed
  const sSec = (studentSection || '').trim().toLowerCase()

  const matchedSection = matchedClass?.sections?.find((sec) => {
    if (sec.id.toLowerCase() === sSec) return true
    if (sec.name.trim().toLowerCase() === sSec) return true
    return false
  })

  const sectionId = matchedSection?.id || (studentSection || '').trim()

  // 1. Specific class + section match
  let routine = routines.find((r) => {
    const classMatches =
      r.classId === classId ||
      r.classId === matchedClass?.id ||
      r.classId.toLowerCase() === sClassLower ||
      (matchedClass && r.classId === matchedClass.name)

    if (!classMatches) return false

    const rSec = (r.sectionId || '').trim().toLowerCase()
    return (
      rSec === sectionId.toLowerCase() ||
      (matchedSection && rSec === matchedSection.name.toLowerCase()) ||
      (sSec && rSec === sSec)
    )
  })

  // 2. Class match with empty or 'all' section
  if (!routine) {
    routine = routines.find((r) => {
      const classMatches =
        r.classId === classId ||
        r.classId === matchedClass?.id ||
        r.classId.toLowerCase() === sClassLower ||
        (matchedClass && r.classId === matchedClass.name)

      if (!classMatches) return false

      const rSec = (r.sectionId || '').trim().toLowerCase()
      return !rSec || rSec === 'all'
    })
  }

  // 3. Fallback to any routine matching class
  if (!routine) {
    routine = routines.find((r) => {
      return (
        r.classId === classId ||
        r.classId === matchedClass?.id ||
        r.classId.toLowerCase() === sClassLower ||
        (matchedClass && r.classId === matchedClass.name)
      )
    })
  }

  return routine
}

/**
 * Determines whether a given Date is a weekend/weekly holiday according to the routine.
 * Handles both:
 * - RoutineTab indices (0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri)
 * - Standard JS getDay() day indices (0=Sun, 5=Fri, 6=Sat)
 * - Default fallback to Friday in Bangladesh when no routine or empty weekends.
 */
export function isDateRoutineWeekend(date: Date, routine?: ClassRoutine): boolean {
  const jsDay = date.getDay() // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
  // RoutineTab day index where Saturday is 0, Sunday is 1, ..., Friday is 6
  const routineDayIndex = (jsDay + 1) % 7

  const weekendDays = routine?.weekendDays

  if (Array.isArray(weekendDays) && weekendDays.length > 0) {
    // Check if matches RoutineTab index (0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri)
    if (weekendDays.includes(routineDayIndex)) {
      return true
    }
    // Legacy support: if weekendDays has [5], it often represented Friday in JS Date (e.g., // Friday is weekend)
    if (jsDay === 5 && weekendDays.includes(5)) {
      return true
    }
    return false
  }

  // Default national weekly holiday in Bangladesh is Friday (jsDay === 5)
  return jsDay === 5
}

/**
 * Returns human-readable list of weekend day names for the routine.
 */
export function getRoutineWeekendDayNames(
  routine?: ClassRoutine,
  isBn: boolean = false
): string[] {
  const weekendDays = routine?.weekendDays
  if (Array.isArray(weekendDays) && weekendDays.length > 0) {
    const names = new Set<string>()
    weekendDays.forEach((idx) => {
      // If 0-6 in RoutineTab order
      if (idx >= 0 && idx < 7) {
        names.add(isBn ? ROUTINE_DAYS_BN[idx] : ROUTINE_DAYS_EN[idx])
      }
    })
    if (names.size > 0) return Array.from(names)
  }
  return [isBn ? 'শুক্রবার' : 'Friday']
}

/**
 * Formats punch / attendance verification method for display.
 */
export function formatPunchMethod(method?: string, isBn: boolean = false): string {
  switch (method) {
    case 'rfid':
      return isBn ? 'আরএফআইডি স্মার্ট কার্ড' : 'RFID Smart Card'
    case 'fingerprint':
      return isBn ? 'বায়োমেট্রিক আঙুলের ছাপ' : 'Biometric Fingerprint'
    case 'face':
      return isBn ? 'ফেসিয়াল রিকগনিশন' : 'Facial Recognition'
    case 'mobile':
      return isBn ? 'মোবাইল অ্যাপ চেক-ইন' : 'Mobile App Check-in'
    case 'punch':
    case 'manual':
      return isBn ? 'শ্রেণি শিক্ষক ম্যানুয়াল এন্ট্রি' : 'Class Teacher Manual Entry'
    case 'leave':
      return isBn ? 'অনুমোদিত ছুটির রেকর্ড' : 'Approved Leave Record'
    case 'weekend':
      return isBn ? 'ক্লাস রুটিন অনুযায়ী সাপ্তাহিক ছুটি' : 'Weekend as per Class Routine'
    default:
      return isBn ? 'ম্যানুয়াল নথিভুক্ত' : 'Manual Entry'
  }
}
