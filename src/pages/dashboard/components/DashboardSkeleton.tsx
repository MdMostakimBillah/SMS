import React from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useWindowSize } from '@/hooks/useWindowSize'

interface KpiRowSkeletonProps {
  count: number
  columns: string
  gap: string
  isMobile: boolean
}

const KpiRowSkeleton: React.FC<KpiRowSkeletonProps> = ({ count, columns, gap, isMobile }) => (
  <div style={{ display: 'grid', gridTemplateColumns: columns, gap }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '0.625rem',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          style={{
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Skeleton width="1rem" height="1rem" style={{ marginBottom: 0, borderRadius: '0.25rem' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Skeleton
            width={i % 2 === 0 ? '3.25rem' : '4rem'}
            height={isMobile ? '1rem' : '1.125rem'}
            style={{ marginBottom: '0.3125rem' }}
          />
          <Skeleton width={i % 2 === 0 ? '5.5rem' : '4.75rem'} height="0.6875rem" style={{ marginBottom: 0 }} />
        </div>
      </div>
    ))}
  </div>
)

interface SectionCardHeaderProps {
  titleWidth?: string
  rightWidth?: string
}

const SectionCardHeader: React.FC<SectionCardHeaderProps> = ({ titleWidth = '8.5rem', rightWidth }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.875rem',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Skeleton width="0.1875rem" height="0.875rem" style={{ marginBottom: 0, borderRadius: '0.125rem' }} />
      <Skeleton width={titleWidth} height="0.875rem" style={{ marginBottom: 0 }} />
    </div>
    {rightWidth && <Skeleton width={rightWidth} height="1.625rem" style={{ marginBottom: 0, borderRadius: '0.375rem' }} />}
  </div>
)

/** Loading skeleton mirroring the updated Dashboard sections and responsive grids. */
export const DashboardSkeleton: React.FC = () => {
  const { isMobile, isTablet } = useWindowSize()

  const col4 = isMobile ? '1fr 1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)'
  const col3 = isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3,1fr)'
  const col2 = isMobile ? '1fr' : '1fr 1fr'
  const gap = isMobile ? '0.625rem' : '0.875rem'

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.75rem',
    padding: isMobile ? '0.875rem' : '1rem',
    boxShadow: 'var(--shadow-xs)',
  }

  return (
    <div
      data-testid="dashboard-skeleton"
      role="status"
      aria-label="Loading dashboard"
      style={{ display: 'flex', flexDirection: 'column', gap }}
    >
      {/* Header skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <Skeleton
            variant="title"
            width={isMobile ? '11rem' : '15rem'}
            height="1.375rem"
            style={{ marginBottom: '0.375rem' }}
          />
          <Skeleton width={isMobile ? '9.5rem' : '14rem'} height="0.75rem" style={{ marginBottom: 0 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Skeleton width={isMobile ? '2.25rem' : '5.75rem'} height="2rem" style={{ marginBottom: 0, borderRadius: '0.5rem' }} />
          <Skeleton width={isMobile ? '2.5rem' : '5rem'} height="2rem" style={{ marginBottom: 0, borderRadius: '0.5rem' }} />
          <Skeleton width={isMobile ? '5.25rem' : '6.25rem'} height="2rem" style={{ marginBottom: 0, borderRadius: '0.5rem' }} />
        </div>
      </div>

      {/* Row 1: Student & Salary KPIs */}
      <KpiRowSkeleton count={4} columns={col4} gap={gap} isMobile={isMobile} />

      {/* Row 2: Teacher Quantity & Today Attendance KPIs */}
      <KpiRowSkeleton count={4} columns={col4} gap={gap} isMobile={isMobile} />

      {/* Row 3: Finance KPIs */}
      <KpiRowSkeleton count={4} columns={col4} gap={gap} isMobile={isMobile} />

      {/* Row 4: Messages, Birthdays & Software Payment KPIs */}
      <KpiRowSkeleton count={4} columns={col4} gap={gap} isMobile={isMobile} />

      {/* Tasks & Task Summary (2 columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: col2, gap }}>
        <div style={cardStyle}>
          <SectionCardHeader titleWidth="6.5rem" rightWidth="6.75rem" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.625rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
              >
                <Skeleton variant="circle" width="1rem" height="1rem" />
                <div style={{ flex: 1 }}>
                  <Skeleton width={row === 2 ? '72%' : '58%'} height="0.75rem" style={{ marginBottom: '0.25rem' }} />
                  <Skeleton width="35%" height="0.625rem" style={{ marginBottom: 0 }} />
                </div>
                <Skeleton width="3rem" height="1.125rem" style={{ marginBottom: 0, borderRadius: '9999px' }} />
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <SectionCardHeader titleWidth="7.5rem" rightWidth="3.5rem" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3].map((row) => (
              <div key={row} style={{ display: 'flex', flexDirection: 'column', gap: '0.3125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton width="5.5rem" height="0.75rem" style={{ marginBottom: 0 }} />
                  <Skeleton width="2.25rem" height="0.75rem" style={{ marginBottom: 0 }} />
                </div>
                <Skeleton width="100%" height="0.5rem" style={{ marginBottom: 0, borderRadius: '9999px' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full-Width Monthly Income & Daily Collection Progress Chart */}
      <div style={cardStyle}>
        <SectionCardHeader titleWidth={isMobile ? '11.5rem' : '15.5rem'} />
        <div
          style={{
            height: isMobile ? '11.875rem' : '14.375rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingTop: '0.5rem',
          }}
        >
          {[1, 2, 3, 4].map((line) => (
            <div key={line} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Skeleton width="2.25rem" height="0.625rem" style={{ marginBottom: 0 }} />
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '3rem', paddingTop: '0.375rem' }}>
            {Array.from({ length: isMobile ? 6 : 12 }).map((_, idx) => (
              <Skeleton key={idx} width="1rem" height="0.625rem" style={{ marginBottom: 0 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts (3 columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: col3, gap }}>
        {[1, 2, 3].map((card) => (
          <div key={card} style={cardStyle}>
            <SectionCardHeader titleWidth={card === 1 ? '8rem' : '7rem'} />
            <Skeleton variant="rect" width="100%" height="10.5rem" />
          </div>
        ))}
      </div>
    </div>
  )
}
