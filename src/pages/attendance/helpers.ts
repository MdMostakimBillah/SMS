let isBnGlobal = false

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function twentyDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 20)
  return d.toISOString().split('T')[0]
}

export function toBnNum(n: number): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
  return String(n).replace(/\d/g, (d) => bn[+d])
}

export function getDaysBetween(from: string, to: string): string[] {
  const days: string[] = []
  const a = new Date(from),
    b = new Date(to)
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) days.push(d.toISOString().split('T')[0])
  return days
}

export function shortDate(ds: string) {
  return ds.slice(5)
}

export function dayName(ds: string) {
  const d = new Date(ds).toLocaleDateString('en', { weekday: 'short' })
  return d === 'Fri' ? (isBnGlobal ? 'সাপ্তাহিক ছুটি' : 'Fri') : d
}

export function isFriday(ds: string): boolean {
  return new Date(ds).getDay() === 5
}

export function setGlobalBn(val: boolean) {
  isBnGlobal = val
}

export type Tab = 'today' | 'range' | 'device' | 'employee' | 'student'
export type StatusFilter = 'all' | 'present' | 'absent' | 'on-leave'
