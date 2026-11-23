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
      {/* Hero Header Banner Card */}
      <ProfileHero
        child={child}
        onOpenIdCard={onOpenIdCard}
        isBn={isBn}
      />

      {/* 3-Pillar Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pillar 1: Academic & Teacher Records */}
        <ProfileAcademicCard child={child} isBn={isBn} />

        {/* Pillar 2: Parents & Guardian Contacts */}
        <ProfileGuardianCard child={child} isBn={isBn} />

        {/* Pillar 3: Personal, Residence & Health */}
        <ProfilePersonalCard child={child} isBn={isBn} />
      </div>
    </div>
  )
})
