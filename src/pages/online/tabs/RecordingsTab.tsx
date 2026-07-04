import { useMemo } from 'react'
import { Play, Clock, Edit2, Trash2 } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useOnlineStore, getThumbnail, platformColors, platformLabels, type OnlineClass } from '@/store/onlineStore'
import { getVideoProgressPercent } from '../utils'

interface Props {
  filterClassId: string
  filterSectionId: string
  filterSubjectId: string
  search: string
  onPlay: (item: OnlineClass) => void
  onEdit: (item: OnlineClass) => void
  onDelete: (id: string) => void
}

function timeAgo(dateStr: string, isBn: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return isBn ? `${mins} মিনিট আগে` : `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return isBn ? `${hours} ঘণ্টা আগে` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return isBn ? `${days} দিন আগে` : `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function RecordingsTab({ filterClassId, filterSectionId, filterSubjectId, search, onPlay, onEdit, onDelete }: Props) {
  const isBn = useBn()
  const { classes } = useClassStore()
  const { teachers, subjects } = useTeacherStore()
  const allClasses = useOnlineStore((s) => s.classes)

  const recordings = useMemo(() => {
    let result = allClasses.filter((c) => c.status === 'ended')
    if (filterClassId) result = result.filter((c) => c.classId === filterClassId)
    if (filterSectionId) result = result.filter((c) => c.sectionId === filterSectionId)
    if (filterSubjectId) result = result.filter((c) => c.subjectId === filterSubjectId)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) => c.title.toLowerCase().includes(q) || c.titleBn.includes(q))
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [allClasses, filterClassId, filterSectionId, filterSubjectId, search])

  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
          <Play size={28} className="text-[var(--text-muted)]" />
        </div>
        <p className="text-[0.875rem] text-[var(--text-secondary)]">
          {isBn ? 'কোনো রেকর্ডিং নেই' : 'No recordings yet'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {recordings.map((item) => {
        const cls = classes.find((c) => c.id === item.classId)
        const teacher = teachers.find((t) => t.id === item.teacherId)
        const subject = subjects.find((s) => s.id === item.subjectId)
        const progress = getVideoProgressPercent(item.url)
        return (
          <div
            key={item.id}
            className="group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-primary)] hover:shadow-lg transition-all cursor-pointer"
            onClick={() => onPlay(item)}
          >
            {/* Thumbnail */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {item.thumbnailUrl || getThumbnail(item.url) ? (
                <img src={item.thumbnailUrl || getThumbnail(item.url)} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${platformColors[item.platform]}20, ${platformColors[item.platform]}08)` }}>
                  <Play size={40} className="text-[var(--text-muted)]" />
                </div>
              )}
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
              {/* Progress bar */}
              {progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/40 z-10">
                  <div className="h-full bg-[var(--brand)] transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
            {/* Info */}
            <div className="p-3">
              <h3 className="text-[0.8125rem] font-semibold text-[var(--text-primary)] line-clamp-2 mb-1">
                {isBn && item.titleBn ? item.titleBn : item.title}
              </h3>
              <p className="text-[0.6875rem] text-[var(--text-muted)] mb-2">
                {teacher ? (isBn ? teacher.nameBn : teacher.nameEn) : ''}
                {cls ? ` · ${isBn ? cls.nameBn : cls.name}` : ''}
                {subject ? ` · ${isBn ? subject.nameBn : subject.name}` : ''}
              </p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[0.625rem] text-[var(--text-muted)]">
                  <Clock size={10} />
                  {timeAgo(item.createdAt, isBn)}
                </span>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onEdit(item)} className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-light)] transition-colors cursor-pointer">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[var(--red-light)] transition-colors cursor-pointer">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
