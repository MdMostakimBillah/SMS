import type { ReactNode } from 'react'
import { usePermission, type PermissionAction } from '@/hooks/usePermission'
import { AccessRestricted } from './AccessRestricted'

interface PermissionGuardProps {
  permission: string
  action?: PermissionAction
  children: ReactNode
}

export function PermissionGuard({ permission, action = 'view', children }: PermissionGuardProps) {
  const { can, isAdmin } = usePermission()

  if (isAdmin || can(permission, action)) {
    return <>{children}</>
  }

  return <AccessRestricted />
}
