export const GRADE_SCALE = [
  { letter: 'A+', range: '80–100', min: 80 },
  { letter: 'A', range: '70–79', min: 70 },
  { letter: 'A-', range: '60–69', min: 60 },
  { letter: 'B', range: '50–59', min: 50 },
  { letter: 'C', range: '40–49', min: 40 },
  { letter: 'D', range: '33–39', min: 33 },
  { letter: 'F', range: '0–32', min: 0 },
] as const

export function getGradeLetter(pct: number): string {
  if (pct >= 80) return 'A+'
  if (pct >= 70) return 'A'
  if (pct >= 60) return 'A-'
  if (pct >= 50) return 'B'
  if (pct >= 40) return 'C'
  if (pct >= 33) return 'D'
  return 'F'
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#16a34a',
  A: '#22c55e',
  'A-': '#4ade80',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#f97316',
  F: '#ef4444',
}

export function getGradeColor(letter: string): string {
  return GRADE_COLORS[letter] || '#6b7280'
}

export function getGpa(pct: number, passed = true): number {
  if (!passed) return 0.0
  if (pct >= 80) return 5.0
  if (pct >= 70) return 4.0
  if (pct >= 60) return 3.5
  if (pct >= 50) return 3.0
  if (pct >= 40) return 2.0
  if (pct >= 33) return 1.0
  return 0.0
}

export function computeGrade(pct: number): { letter: string; gpa: number; color: string } {
  const letter = getGradeLetter(pct)
  return { letter, gpa: getGpa(pct), color: getGradeColor(letter) }
}
