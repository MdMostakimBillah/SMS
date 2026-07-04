import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { useBn } from '@/hooks/useBn'
import { getYouTubeId, platformColors, platformLabels, type OnlineClass } from '@/store/onlineStore'
import { useClassStore } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { getVideoProgress, saveVideoProgress, formatVideoTime, isLiveStream } from '../utils'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

interface Props {
  item: OnlineClass
  onClose: () => void
}

let ytApiPromise: Promise<void> | null = null
function loadYtApi(): Promise<void> {
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise<void>((resolve) => {
    if (window.YT?.Player) { resolve(); return }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
    const check = setInterval(() => {
      if (window.YT?.Player) { clearInterval(check); resolve() }
    }, 50)
    setTimeout(() => { clearInterval(check); resolve() }, 5000)
  })
  return ytApiPromise
}

export function VideoPlayerModal({ item, onClose }: Props) {
  const isBn = useBn()
  const videoId = getYouTubeId(item.url)
  const { classes } = useClassStore()
  const { teachers, subjects } = useTeacherStore()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [resumeFrom, setResumeFrom] = useState(0)
  const [showResumeToast, setShowResumeToast] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [useFallback, setUseFallback] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const hideTimeoutRef = useRef<number>(0)
  const saveIntervalRef = useRef<number>(0)
  const timeIntervalRef = useRef<number>(0)

  const live = duration > 0 && isLiveStream(duration)

  const cls = classes.find((c) => c.id === item.classId)
  const teacher = teachers.find((t) => t.id === item.teacherId)
  const subject = subjects.find((s) => s.id === item.subjectId)
  const section = cls?.sections.find((s) => s.id === item.sectionId)

  const resetHideTimeout = useCallback(() => {
    clearTimeout(hideTimeoutRef.current)
    setShowControls(true)
    if (isPlaying) {
      hideTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000)
    }
  }, [isPlaying])

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return
    if (isPlaying) playerRef.current.pauseVideo()
    else playerRef.current.playVideo()
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return
    if (isMuted) playerRef.current.unMute()
    else playerRef.current.mute()
    setIsMuted((prev) => !prev)
  }, [isMuted])

  const handleClose = useCallback(() => {
    try {
      if (playerRef.current && videoId) {
        const t = playerRef.current.getCurrentTime?.() || 0
        const d = playerRef.current.getDuration?.() || 0
        if (d > 0 && !isLiveStream(d)) saveVideoProgress(videoId, t, d)
      }
    } catch { /* ignore */ }
    onClose()
  }, [videoId, onClose])

  useEffect(() => {
    if (!videoId || !containerRef.current) { setUseFallback(true); return }

    let destroyed = false

    loadYtApi().then(() => {
      if (destroyed || !containerRef.current || !window.YT?.Player) {
        if (!destroyed) setUseFallback(true)
        return
      }
      const saved = getVideoProgress(videoId)

      const ytPlayer = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1, controls: 0, disablekb: 1, fs: 0,
          modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3,
          playsinline: 1, origin: window.location.origin,
        },
        events: {
          onReady: (e: any) => {
            if (destroyed) return
            playerRef.current = e.target
            setPlayerReady(true)
            const dur = e.target.getDuration()
            setDuration(dur)
            if (saved.currentTime > 3 && saved.duration > 0 && !isLiveStream(dur)) {
              e.target.seekTo(saved.currentTime, true)
              setResumeFrom(saved.currentTime)
              setShowResumeToast(true)
              setTimeout(() => setShowResumeToast(false), 3000)
            }
          },
          onStateChange: (e: any) => {
            if (destroyed) return
            const s = e.data
            setIsPlaying(s === 1)
            if (s === 0) {
              if (videoId) saveVideoProgress(videoId, 0, 0)
              setCurrentTime(0)
            }
            if (s === 1 || s === 2) {
              try {
                setDuration(e.target.getDuration())
                setCurrentTime(e.target.getCurrentTime())
              } catch { /* ignore */ }
            }
          },
        },
      })
      playerRef.current = ytPlayer
    }).catch(() => { if (!destroyed) setUseFallback(true) })

    return () => {
      destroyed = true
      try {
        if (playerRef.current) {
          const t = playerRef.current.getCurrentTime?.() || 0
          const d = playerRef.current.getDuration?.() || 0
          if (videoId && d > 0 && !isLiveStream(d)) saveVideoProgress(videoId, t, d)
          playerRef.current.destroy()
        }
      } catch { /* ignore */ }
      playerRef.current = null
      clearInterval(timeIntervalRef.current)
      clearInterval(saveIntervalRef.current)
    }
  }, [videoId])

  useEffect(() => {
    resetHideTimeout()
    return () => clearTimeout(hideTimeoutRef.current)
  }, [isPlaying, resetHideTimeout])

  useEffect(() => {
    if (!playerReady || live) return
    timeIntervalRef.current = window.setInterval(() => {
      try {
        if (playerRef.current) {
          setCurrentTime(playerRef.current.getCurrentTime() || 0)
          const d = playerRef.current.getDuration()
          if (d > 0) setDuration(d)
        }
      } catch { /* ignore */ }
    }, 500)
    return () => clearInterval(timeIntervalRef.current)
  }, [playerReady, live])

  useEffect(() => {
    if (!playerReady || live || !videoId) return
    saveIntervalRef.current = window.setInterval(() => {
      try {
        if (playerRef.current) {
          const t = playerRef.current.getCurrentTime() || 0
          const d = playerRef.current.getDuration() || 0
          saveVideoProgress(videoId, t, d)
        }
      } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(saveIntervalRef.current)
  }, [playerReady, live, videoId])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || live) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const seekTime = pct * duration
    playerRef.current.seekTo(seekTime, true)
    setCurrentTime(seekTime)
    resetHideTimeout()
  }, [duration, live, resetHideTimeout])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay() }
      if (e.key === 'm') toggleMute()
      if (e.key === 'ArrowLeft' && playerRef.current) {
        const t = Math.max(0, (playerRef.current.getCurrentTime?.() || 0) - 5)
        playerRef.current.seekTo(t, true)
        setCurrentTime(t)
      }
      if (e.key === 'ArrowRight' && playerRef.current) {
        const t = (playerRef.current.getCurrentTime?.() || 0) + 5
        playerRef.current.seekTo(t, true)
        setCurrentTime(t)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose, togglePlay, toggleMute])

  const progressPct = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0

  if (useFallback || !videoId) {
    return createPortal(
      <div className="fixed inset-0 z-[600] bg-black/95 flex items-center justify-center" onClick={handleClose}>
        <div className="relative w-full max-w-6xl mx-4" onClick={(e) => e.stopPropagation()}>
          <button onClick={handleClose} className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer text-white hover:bg-white/20 transition-colors z-10"><X size={20} /></button>
          <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
            <iframe src={item.url} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={item.title} />
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center" onMouseMove={resetHideTimeout}>
      <div className="relative w-full max-w-6xl mx-4 group" onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
        {/* Video container */}
        <div className="relative w-full rounded-xl overflow-hidden bg-black shadow-2xl" style={{ paddingBottom: '56.25%' }}>
          <div ref={containerRef} className="absolute inset-0" />

          {/* Controls overlay */}
          <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* Gradients */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pointer-events-auto">
              <div className="flex items-center gap-2">
                <span className="text-[0.625rem] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-white" style={{ background: platformColors[item.platform] }}>
                  {platformLabels[item.platform][isBn ? 'bn' : 'en']}
                </span>
                {item.status === 'live' && (
                  <span className="flex items-center gap-1.5 text-[0.625rem] px-2.5 py-1 rounded-full font-bold bg-red-600 text-white">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <button onClick={handleClose} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-pointer text-white/80 hover:text-white hover:bg-black/70 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Center play/pause */}
            {!isPlaying && playerReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                <button onClick={togglePlay} className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/25 transition-all active:scale-95 border border-white/10 shadow-2xl">
                  <Play size={36} className="text-white ml-1" fill="white" />
                </button>
              </div>
            )}

            {/* Loading */}
            {!playerReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-[3px] border-white/20 border-t-white animate-spin" />
              </div>
            )}

            {/* Resume toast */}
            {showResumeToast && resumeFrom > 0 && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-md text-white text-sm flex items-center gap-2 z-20 animate-bounce">
                <RotateCcw size={14} />
                {isBn ? `থেকে চালু হচ্ছে ${formatVideoTime(resumeFrom)}` : `Resuming from ${formatVideoTime(resumeFrom)}`}
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
              {/* Progress bar */}
              {!live && (
                <div className="relative w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/bar hover:h-2.5 transition-all" onClick={handleSeek}>
                  <div className="absolute inset-y-0 left-0 bg-red-600 rounded-full" style={{ width: `${progressPct}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-600 opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-lg border-2 border-white" style={{ left: `calc(${progressPct}% - 8px)` }} />
                </div>
              )}

              {/* Controls row */}
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="text-white hover:text-red-400 transition-colors cursor-pointer">
                  {isPlaying ? <Pause size={22} /> : <Play size={22} fill="white" />}
                </button>
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors cursor-pointer">
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                {!live && (
                  <span className="text-[0.75rem] text-white/70 font-mono tabular-nums">
                    {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
                  </span>
                )}
                {live && (
                  <span className="flex items-center gap-1.5 text-[0.6875rem] text-red-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    {isBn ? 'সরাসরি' : 'LIVE'}
                  </span>
                )}
                <div className="flex-1" />
                <span className="text-[0.75rem] text-white/40 truncate max-w-[250px]">
                  {isBn && item.titleBn ? item.titleBn : item.title}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info below player */}
        <div className="mt-4 px-1">
          <h2 className="text-lg font-semibold text-white mb-1">
            {isBn && item.titleBn ? item.titleBn : item.title}
          </h2>
          {(item.description || item.descriptionBn) && (
            <p className="text-[0.8125rem] text-white/50 mb-2">
              {isBn && item.descriptionBn ? item.descriptionBn : item.description}
            </p>
          )}
          <p className="text-[0.75rem] text-white/30">
            {[teacher && (isBn ? teacher.nameBn : teacher.nameEn), cls && (isBn ? cls.nameBn : cls.name), section?.name, subject && (isBn ? subject.nameBn : subject.name)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
