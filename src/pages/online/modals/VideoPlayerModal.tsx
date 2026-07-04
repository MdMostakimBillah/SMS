import { createPortal } from 'react-dom'
import { X, ExternalLink, Play } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { getYouTubeId, platformColors, platformLabels, type OnlineClass } from '@/store/onlineStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'

interface Props {
  item: OnlineClass
  onClose: () => void
}

function isYouTube(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url)
}

function getYouTubeEmbedUrl(url: string): string {
  const ytId = getYouTubeId(url)
  if (!ytId) return ''
  return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&playlist=${ytId}`
}

export function VideoPlayerModal({ item, onClose }: Props) {
  const isBn = useBn()
  const { classes } = useClassStore()
  const { teachers, subjects } = useTeacherStore()

  const cls = classes.find((c) => c.id === item.classId)
  const teacher = teachers.find((t) => t.id === item.teacherId)
  const subject = subjects.find((s) => s.id === item.subjectId)
  const section = cls?.sections.find((s) => s.id === item.sectionId)
  const youtubeEmbed = getYouTubeEmbedUrl(item.url)
  const canEmbed = isYouTube(item.url)

  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div
        className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center cursor-pointer text-white hover:bg-black/70 transition-colors z-10">
          <X size={18} />
        </button>

        {/* Video area */}
        {canEmbed ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={youtubeEmbed}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={item.title}
            />
          </div>
        ) : (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative w-full group"
            style={{ paddingBottom: '56.25%' }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: `linear-gradient(135deg, ${platformColors[item.platform]}30, ${platformColors[item.platform]}10)` }}>
              <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                <Play size={36} className="text-white ml-1" fill="white" />
              </div>
              <div className="flex items-center gap-2 text-white text-[0.875rem] font-medium">
                <ExternalLink size={16} />
                {isBn ? 'নতুন ট্যাবে খুলুন' : 'Open in new tab'}
              </div>
              <p className="text-white/60 text-[0.75rem] max-w-md text-center px-4">
                {isBn ? 'এই প্ল্যাটফর্মের ভিডিও সরাসরি এম্বেড করা যায় না' : 'This platform does not support direct embedding'}
              </p>
            </div>
          </a>
        )}

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
