import React, { useState } from 'react'

export interface StaffAvatarProps {
  id?: string
  name?: string
  photo?: string | null
  gender?: string
  className?: string
  sizeCls?: string
  roundedCls?: string
  alt?: string
}

/**
 * Generates an offline SVG profile avatar data URL for any staff member.
 * Provides a professional avatar image with gradient backdrop and sleek person silhouette.
 */
export function getStaffProfileImageUrl(
  name: string = 'Staff',
  id: string = '',
  gender: string = 'male'
): string {
  const isFemale =
    gender?.toLowerCase() === 'female' ||
    gender?.toLowerCase() === 'f' ||
    gender?.toLowerCase() === 'মহিলা'

  // Pick deterministic gradient colors based on id/name
  const seed = (id || name || 'staff')
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0)

  const palettes = [
    ['#4F46E5', '#7C3AED'], // Indigo - Violet
    ['#0D9488', '#14B8A6'], // Teal
    ['#D97706', '#F59E0B'], // Amber
    ['#16A34A', '#22C55E'], // Emerald - Green
    ['#9333EA', '#A855F7'], // Purple
    ['#2563EB', '#3B82F6'], // Blue
    ['#DB2777', '#EC4899'], // Rose - Pink
    ['#0284C7', '#38BDF8'], // Sky
  ]
  const [c1, c2] = palettes[seed % palettes.length]

  const svg = isFemale
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="url(#g)" />
  <!-- Female silhouette -->
  <circle cx="50" cy="38" r="16" fill="rgba(255,255,255,0.95)" />
  <path d="M32,38 C32,24 40,18 50,18 C60,18 68,24 68,38 C68,44 65,48 64,52 C61,46 58,45 50,45 C42,45 39,46 36,52 C35,48 32,44 32,38 Z" fill="rgba(255,255,255,0.35)" />
  <path d="M50,56 C44,56 42,59 40,64 C30,68 22,76 20,88 C26,90 40,92 50,92 C60,92 74,90 80,88 C78,76 70,68 60,64 C58,59 56,56 50,56 Z" fill="rgba(255,255,255,0.92)" />
</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="url(#g)" />
  <!-- Male/Neutral silhouette -->
  <circle cx="50" cy="37" r="16" fill="rgba(255,255,255,0.95)" />
  <path d="M33,34 C35,22 43,18 50,18 C57,18 65,22 67,34 C63,30 58,29 50,29 C42,29 37,30 33,34 Z" fill="rgba(255,255,255,0.35)" />
  <path d="M50,55 C45,55 43,58 41,63 C31,67 23,75 21,88 C27,90 41,92 50,92 C59,92 73,90 79,88 C77,75 69,67 59,63 C57,58 55,55 50,55 Z" fill="rgba(255,255,255,0.92)" />
  <polygon points="50,66 45,58 55,58" fill="${c1}" opacity="0.4" />
</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const StaffAvatar: React.FC<StaffAvatarProps> = React.memo(function StaffAvatar({
  id = '',
  name = 'Staff',
  photo,
  gender,
  className = '',
  sizeCls = 'w-6 h-6',
  roundedCls = 'rounded-md',
  alt,
}) {
  const [imgError, setImgError] = useState(false)
  const defaultAvatar = getStaffProfileImageUrl(name, id, gender)
  const src = !imgError && photo ? photo : defaultAvatar

  return (
    <div
      className={`${sizeCls} ${roundedCls} flex items-center justify-center shrink-0 overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] ${className}`}
    >
      <img
        src={src}
        alt={alt || name || 'Staff'}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  )
})
