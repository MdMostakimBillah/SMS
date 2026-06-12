import { useMemo } from 'react'
import { ClipboardList, Users, FlaskConical, Award, BookOpen, FileText } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useExamStore } from '@/store/examStore'

export default function UpcomingEvents() {
  const isBn = useBn()
  const { examConfigs } = useExamStore()

  const events = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const upcoming = examConfigs
      .filter((e) => e.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 4)
      .map((e) => ({
        bn: e.nameBn,
        en: e.name,
        date: e.startDate,
        color: e.type === 'annual' ? 'var(--red)' : e.type === 'semester-1' ? 'var(--amber)' : e.type === 'semester-2' ? 'var(--teal)' : 'var(--brand)',
        icon: e.type === 'annual' ? <ClipboardList size={12} /> : e.type.includes('semester') ? <BookOpen size={12} /> : <FileText size={12} />,
      }))

    if (upcoming.length === 0) {
      return [
        { bn: 'বার্ষিক পরীক্ষা শুরু', en: 'Annual Exam begins', date: '2026-05-20', color: 'var(--red)', icon: <ClipboardList size={12} /> },
        { bn: 'অভিভাবক-শিক্ষক সভা', en: 'Parent-Teacher Meeting', date: '2026-05-24', color: 'var(--amber)', icon: <Users size={12} /> },
        { bn: 'বিজ্ঞান মেলা ২০২৬', en: 'Science Fair 2026', date: '2026-06-02', color: 'var(--teal)', icon: <FlaskConical size={12} /> },
        { bn: 'টার্ম ২ ফলাফল', en: 'Term 2 Result', date: '2026-06-15', color: 'var(--brand)', icon: <Award size={12} /> },
      ]
    }

    return upcoming
  }, [examConfigs])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {events.map((ev, i) => {
        const dateObj = new Date(ev.date + 'T00:00:00')
        const dateLabel = dateObj.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric' })
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '10px 12px',
              background: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
          >
            <div
              style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '0.4375rem',
                background: `${ev.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: ev.color,
                flexShrink: 0,
              }}
            >
              {ev.icon}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {isBn ? ev.bn : ev.en}
            </div>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 600,
                color: ev.color,
                background: `${ev.color}15`,
                padding: '3px 8px',
                borderRadius: '0.375rem',
                flexShrink: 0,
              }}
            >
              {dateLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}
