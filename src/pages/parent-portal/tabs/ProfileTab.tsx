import React from 'react'
import type { PortalChild } from '../types'
import { ProfileHero } from './profile/ProfileHero'
import { ProfileAcademicCard } from './profile/ProfileAcademicCard'
import { ProfileGuardianCard } from './profile/ProfileGuardianCard'
import { ProfilePersonalCard } from './profile/ProfilePersonalCard'

interface ProfileTabProps {
  child: PortalChild
  onOpenIdCard: () => void
  isBn: boolean
}

export const ProfileTab = React.memo(function ProfileTab({
  child,
  onOpenIdCard,
  isBn,
}: ProfileTabProps) {
  return (
    <div className="space-y-4">
      <ProfileHero
        child={child}
        onOpenIdCard={onOpenIdCard}
        isBn={isBn}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProfileAcademicCard child={child} isBn={isBn} />
        <ProfileGuardianCard child={child} isBn={isBn} />
        <ProfilePersonalCard child={child} isBn={isBn} />
      </div>
    </div>
  )
})
