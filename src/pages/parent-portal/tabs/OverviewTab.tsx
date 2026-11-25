import React from 'react'
import type { PortalChild, HomeworkItem, FeeItem, ExamResultItem, PortalTab } from '../types'
import { OverviewKpiCards } from './overview/OverviewKpiCards'
import { OverviewActivityCards } from './overview/OverviewActivityCards'

interface OverviewTabProps {
  child: PortalChild
  fees: FeeItem[]
  homeworkList: HomeworkItem[]
  results: ExamResultItem[]
  onNavigateTab: (tab: PortalTab) => void
  onOpenPayModal: () => void
  isBn: boolean
}

export const OverviewTab = React.memo(function OverviewTab({
  child,
  fees,
  homeworkList,
  results,
  onNavigateTab,
  onOpenPayModal,
  isBn,
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <OverviewKpiCards
        child={child}
        fees={fees}
        homeworkList={homeworkList}
        results={results}
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
