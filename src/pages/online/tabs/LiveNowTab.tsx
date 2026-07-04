import { useMemo } from 'react'
import { Play } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useOnlineStore, platformColors, platformLabels, type OnlineClass } from '@/store/onlineStore'

interface Props {
  filterClassId: string
  filterSectionId: string
  filterSubjectId: string
  search: string
  onPlay: (item: OnlineClass) => void
}

export function LiveNowTab({ filterClassId, filterSectionId, filterSubjectId, search, onPlay }: Props) {
  const isBn = useBn()
  const { classes } = useClassStore()
  const { teachers, subjects } = useTeacherStore()
  const allClasses = useOnlineStore((s) => s.classes)

  const liveClasses = useMemo(() => {
    let result = allClasses.filter((c) => c.status === 'live')
    if (filterClassId) result = result.filter((c) => c.classId === filterClassId)
    if (filterSectionId) result = result.filter((c) => c.sectionId === filterSectionId)
    if (filterSubjectId) result = result.filter((c) => c.subjectId === filterSubjectId)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.title.toLowerCase().includes(q) || c.titleBn.includes(q))
    }
    return result
  }, [allClasses, filterClassId, filterSectionId, filterSubjectId, search])

  if (liveClasses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--red-light)] flex items-center justify-center mb-4">
          <Play size={28} className="text-[var(--red)] ml-0.5" />
        </div>
        <p className="text-[0.875rem] text-[var(--text-secondary)]">
          {isBn ? 'এখন কোনো লাইভ ক্লাস নেই' : 'No live classes right now'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {liveClasses.map((item) => {
        const cls = classes.find((c) => c.id === item.classId)
        const teacher = teachers.find((t) => t.id === item.teacherId)
        const subject = subjects.find((s) => s.id === item.subjectId)
        return (
          <div
            key={item.id}
            className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] hover:shadow-lg transition-all cursor-pointer"
            onClick={() => onPlay(item)}
          >
            {/* Thumbnail */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${platformColors[item.platform]}30, ${platformColors[item.platform]}10)` }}>
                  <Play size={48} className="text-white/70" />
                </div>
              )}
              {/* LIVE badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--red)] text-white text-[0.625rem] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
              {/* Platform badge */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-white text-[0.5625rem] font-medium" style={{ background: platformColors[item.platform] }}>
                {platformLabels[item.platform][isBn ? 'bn' : 'en']}
              </div>
              {/* Hover play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <div className="w-14 h-14 rounded-full bg-[var(--brand)] flex items-center justify-center shadow-xl">
                  <Play size={24} className="text-white ml-0.5" fill="white" />
                </div>
              </div>
            </div>
            {/* Info */}
            <div className="p-3">
              <h3 className="text-[0.8125rem] font-semibold text-[var(--text-primary)] line-clamp-2 mb-1">
                {isBn && item.titleBn ? item.titleBn : item.title}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)]">
                {teacher ? (isBn ? teacher.nameBn : teacher.nameEn) : ''}
                {cls ? ` · ${isBn ? cls.nameBn : cls.name}` : ''}
                {subject ? ` · ${isBn ? subject.nameBn : subject.name}` : ''}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
