export type Theme = 'light' | 'dark' | 'system'
export type Language = 'bn' | 'en'

export interface NavItem {
  key: string
  page: string
  icon: string
  badge?: string | number
  badgeColor?: 'red' | 'blue'
}

export interface NavGroup {
  key: string
  items: NavItem[]
}

export interface StatCard {
  label: string
  value: string
  change?: string
  changeType?: 'up' | 'down'
}
