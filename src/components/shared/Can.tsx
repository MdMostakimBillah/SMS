import type { ReactNode } from 'react'
import { usePermission, type PermissionAction } from '@/hooks/usePermission'

interface CanProps {
  permission: string
  action: PermissionAction
  fallback?: ReactNode
  children: ReactNode
}

export function Can({ permission, action, fallback = null, children }: CanProps) {
  const { can } = usePermission()
  return can(permission, action) ? <>{children}</> : <>{fallback}</>
}
