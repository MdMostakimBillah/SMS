import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Play } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { getYouTubeId, getThumbnail, platformColors, platformLabels, type OnlineClass } from '@/store/onlineStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'

interface Props {
  item: OnlineClass
  onClose: () => void
}

function getEmbedUrl(url: string): string {
  const ytId = getYouTubeId(url)
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&controls=1&enablejsapi=1&origin=${window.location.origin}`
  if (/facebook\.com|fb\.watch/.test(url)) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`
  return url
}

function getFbEmbedUrl(url: string): string {
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

  const [playing, setPlaying] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [progress, setProgress] = useState(0)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const isYoutube = !!getYouTubeId(item.url)
  const embedUrl = isYoutube ? getEmbedUrl(item.url) : getFbEmbedUrl(item.url)
  const thumbUrl = item.thumbnailUrl || getThumbnail(item.url)

  const startProgress = useCallback(() => {
    setProgress(0)
    if (progressInterval.current) clearInterval(progressInterval.current)
    progressInterval.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (progressInterval.current) clearInterval(progressInterval.current)
          return 100
        }
        return p + 0.5
      })
    }, 500)
  }, [])

  const stopProgress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopProgress()
  }, [stopProgress])

  const handlePlay = () => {
    setPlaying(true)
    startProgress()
  }

  const handleClose = () => {
    stopProgress()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={handleClose}>
      <div
        className="relative w-full max-w-4xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#000' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={handleClose} className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 flex items-center justify-center cursor-pointer text-white hover:bg-black/80 transition-colors">
          <X size={18} />
        </button>

        {/* Video area */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          {playing ? (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={item.title}
            />
          ) : (
            <div className="absolute inset-0 cursor-pointer group" onClick={handlePlay}>
              {/* Thumbnail */}
              {thumbUrl ? (
                <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${platformColors[item.platform]}40, ${platformColors[item.platform]}15)` }}>
                  <Play size={64} className="text-white/60" />
                </div>
              )}
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-[var(--brand)]/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play size={36} className="text-white ml-1" fill="white" />
                </div>
              </div>
              {/* LIVE badge */}
              {item.status === 'live' && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--red)] text-white text-[0.75rem] font-bold">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
              )}
              {/* Platform badge */}
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md text-white text-[0.625rem] font-medium" style={{ background: platformColors[item.platform] }}>
                {platformLabels[item.platform][isBn ? 'bn' : 'en']}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar — only when playing */}
        {playing && (
          <div className="relative h-1 bg-white/10">
            <div
              className="absolute left-0 top-0 h-full bg-[var(--brand)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.625rem] text-white/60 font-medium">
              {Math.round(progress)}%
            </div>
          </div>
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
          <h2 className="text-lg font-semibold text-white mb-1">
            {isBn && item.titleBn ? item.titleBn : item.title}
          </h2>
          {(item.description || item.descriptionBn) && (
            <p className="text-[0.8125rem] text-white/60 mb-3">
              {isBn && item.descriptionBn ? item.descriptionBn : item.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-[0.75rem] text-white/40">
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
