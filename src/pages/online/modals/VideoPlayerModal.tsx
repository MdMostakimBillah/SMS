import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { getYouTubeId, platformColors, platformLabels, type OnlineClass } from '@/store/onlineStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'

interface Props {
  item: OnlineClass
  onClose: () => void
}

function getEmbedUrl(url: string): string {
  const ytId = getYouTubeId(url)
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1`
  if (/facebook\.com|fb\.watch/.test(url)) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`
  return url
}

export function VideoPlayerModal({ item, onClose }: Props) {
  const isBn = useBn()
  const { classes } = useClassStore()
  const { teachers, subjects } = useTeacherStore()

  const cls = classes.find((c) => c.id === item.classId)
  const teacher = teachers.find((t) => t.id === item.teacherId)
  const subject = subjects.find((s) => s.id === item.subjectId)
  const section = cls?.sections.find((s) => s.id === item.sectionId)
  const embedUrl = getEmbedUrl(item.url)

  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div
        className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center cursor-pointer text-white hover:bg-black/70 transition-colors">
          <X size={18} />
        </button>

        {/* Video embed — always rendered */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={item.title}
          />
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[0.625rem] px-2 py-0.5 rounded-full font-medium" style={{ background: `${platformColors[item.platform]}20`, color: platformColors[item.platform] }}>
              {platformLabels[item.platform][isBn ? 'bn' : 'en']}
            </span>
            {item.status === 'live' && (
              <span className="flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full font-medium bg-[var(--red-light)] text-[var(--red)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] animate-pulse" />
                {isBn ? 'লাইভ' : 'LIVE'}
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            {isBn && item.titleBn ? item.titleBn : item.title}
          </h2>
          {(item.description || item.descriptionBn) && (
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mb-3">
              {isBn && item.descriptionBn ? item.descriptionBn : item.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-[0.75rem] text-[var(--text-muted)]">
            {teacher && <span>{isBn ? teacher.nameBn : teacher.nameEn}</span>}
            {cls && <span>· {isBn ? cls.nameBn : cls.name}</span>}
            {section && <span>· {section.name}</span>}
            {subject && <span>· {isBn ? subject.nameBn : subject.name}</span>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
