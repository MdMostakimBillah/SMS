import React from 'react'
import type { PortalChild, HomeworkItem, FeeItem } from '../types'
import { OverviewKpiCards } from './overview/OverviewKpiCards'
import { OverviewActivityCards } from './overview/OverviewActivityCards'

interface OverviewTabProps {
  child: PortalChild
  fees: FeeItem[]
  homeworkList: HomeworkItem[]
  onNavigateTab: (tab: any) => void
  onOpenPayModal: () => void
  isBn: boolean
}

export const OverviewTab = React.memo(function OverviewTab({
  child,
  fees,
  homeworkList,
  onNavigateTab,
  onOpenPayModal,
  isBn,
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <OverviewKpiCards
        fees={fees}
        homeworkList={homeworkList}
        onNavigateTab={onNavigateTab}
        onOpenPayModal={onOpenPayModal}
        isBn={isBn}
      />

      <OverviewActivityCards
        child={child}
        homeworkList={homeworkList}
        onNavigateTab={onNavigateTab}
        isBn={isBn}
      />
    </div>
  )
})
