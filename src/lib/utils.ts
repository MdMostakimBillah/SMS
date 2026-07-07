export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
