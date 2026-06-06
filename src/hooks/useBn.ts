import { useAppStore } from '@/store/appStore'

export function useBn(): boolean {
  const language = useAppStore((s) => s.language)
  return language === 'bn'
}
