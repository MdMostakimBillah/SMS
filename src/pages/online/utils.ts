import { getYouTubeId } from '@/store/onlineStore'

const PROGRESS_KEY = 'edutech_video_progress'

interface VideoProgress {
  currentTime: number
  duration: number
  updatedAt: number
}

export function getVideoProgress(videoId: string): VideoProgress {
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
    return data[videoId] || { currentTime: 0, duration: 0, updatedAt: 0 }
  } catch {
    return { currentTime: 0, duration: 0, updatedAt: 0 }
  }
}

export function saveVideoProgress(videoId: string, currentTime: number, duration: number): void {
  if (!videoId || duration <= 0 || currentTime < 0) return
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
    if (duration > 0 && currentTime >= duration - 3) {
      delete data[videoId]
    } else {
      data[videoId] = { currentTime, duration, updatedAt: Date.now() }
    }
    const keys = Object.keys(data)
    if (keys.length > 100) {
      const sorted = keys.sort((a, b) => (data[a].updatedAt || 0) - (data[b].updatedAt || 0))
      sorted.slice(0, keys.length - 100).forEach((k) => delete data[k])
    }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function resetVideoProgress(videoId: string): void {
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
    delete data[videoId]
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function getVideoProgressPercent(url: string): number {
  const videoId = getYouTubeId(url)
  if (!videoId) return 0
  const { currentTime, duration } = getVideoProgress(videoId)
  if (duration <= 0 || currentTime <= 0) return 0
  return Math.min((currentTime / duration) * 100, 100)
}

export function formatVideoTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function isLiveStream(duration: number): boolean {
  return !isFinite(duration) || duration > 86400
}
