import type { LucideIcon } from 'lucide-react'

export interface SettingItem {
  key: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  rightLabel?: string
  rightLabelBn?: string
}

export interface SettingGroup {
  title: string
  titleBn: string
  items: SettingItem[]
}
