import { useId } from 'react'

/** Full animation cycle in seconds (matches the brand-logo loop). */
const LOOP = 12

interface Twinkle {
  cx: number
  cy: number
  r: number
  delay: number
}

const RIM_LIGHTS: Twinkle[] = [
  { cx: 216, cy: 116, r: 5, delay: 0 },
  { cx: 244, cy: 122, r: 5, delay: 0.7 },
  { cx: 272, cy: 126, r: 5, delay: 1.4 },
  { cx: 300, cy: 128, r: 5, delay: 2.1 },
  { cx: 328, cy: 126, r: 5, delay: 2.8 },
  { cx: 356, cy: 122, r: 5, delay: 3.5 },
  { cx: 384, cy: 116, r: 5, delay: 4.2 },
]

const SPARKS = [
  { x: 120, y: 60, s: 1, delay: 0.4 },
  { x: 168, y: 150, s: 0.8, delay: 1.9 },
  { x: 452, y: 70, s: 1, delay: 1.1 },
  { x: 492, y: 170, s: 0.8, delay: 2.6 },
  { x: 108, y: 250, s: 0.9, delay: 3.2 },
  { x: 500, y: 258, s: 0.9, delay: 0.8 },
]

const DIGITS = [
  { value: '4', x: 243, y: 272, rotate: -12, stagger: 0 },
  { value: '0', x: 300, y: 232, rotate: 0, stagger: 0.4 },
  { value: '4', x: 357, y: 272, rotate: 12, stagger: 0.8 },
]

/**
 * Thematic UFO-abduction SVG scene: a saucer hovers with twinkling rim
 * lights, shining a tractor beam that lifts the 404 digits. The digits draw
 * themselves on with a stroke, fade in their fill, hold, then reverse-hide
 * and redraw — the same loop language as the brand logo. Single-hue artwork
 * (brand + white) to stay minimal.
 *
 * Animation ids and `@keyframes` are namespaced per instance (via `useId`),
 * and `prefers-reduced-motion` renders the settled artwork with no motion.
 */
export function NotFoundArt() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '') || 'nf0'
  const unq = (s: string) => `${s}_${uid}`
  const root = `nf_${uid}`
  const settledDelay = -LOOP / 2

  return (
    <svg
      viewBox="0 0 600 360"
      className={root}
      role="img"
      aria-label="404 page not found illustration"
      style={{ width: '100%', height: 'auto', maxWidth: '22rem' }}
    >
      <style>{`
        @keyframes ${unq('digit')} {
          0% { stroke-dashoffset: 700; fill-opacity: 0; }
          14% { stroke-dashoffset: 0; fill-opacity: 0; }
          22% { stroke-dashoffset: 0; fill-opacity: 1; }
          68% { stroke-dashoffset: 0; fill-opacity: 1; }
          76% { stroke-dashoffset: 0; fill-opacity: 0; }
          88% { stroke-dashoffset: 700; fill-opacity: 0; }
          100% { stroke-dashoffset: 700; fill-opacity: 0; }
        }
        .${root} .digit {
          font-size: 4.75rem;
          font-weight: 800;
          text-anchor: middle;
          stroke-width: 2.5;
          stroke-dasharray: 700;
          animation: ${unq('digit')} ${LOOP}s ease-in-out infinite;
        }
        @keyframes ${unq('bob')} {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-0.625rem); }
        }
        .${root} .ufo-bob { animation: ${unq('bob')} 6s ease-in-out infinite; }
        .${root} .lift { animation: ${unq('bob')} 5s ease-in-out infinite; }
        @keyframes ${unq('twinkle')} {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        .${root} .tw { animation: ${unq('twinkle')} 3.2s ease-in-out infinite; }
        @keyframes ${unq('beam')} {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        .${root} .beam { animation: ${unq('beam')} 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .${root} * { animation: none !important; }
          .${root} .digit { stroke-dashoffset: 0; fill-opacity: 1; }
          .${root} .tw { opacity: 0.8; }
        }
      `}</style>

      <defs>
        <linearGradient id={unq('beamGrad')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brand)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--brand)" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Sparkles */}
      {SPARKS.map((s, i) => (
        <path
          key={i}
          className="tw"
          d={`M ${s.x} ${s.y - 7 * s.s} L ${s.x} ${s.y + 7 * s.s} M ${s.x - 7 * s.s} ${s.y} L ${s.x + 7 * s.s} ${s.y}`}
          stroke="var(--brand)"
          strokeWidth={2.5 * s.s}
          strokeLinecap="round"
          opacity={0.6}
          style={{ animationDelay: `${s.delay - LOOP / 2}s` }}
        />
      ))}

      {/* Tractor beam */}
      <polygon
        className="beam"
        points="252,122 348,122 432,332 168,332"
        fill={`url(#${unq('beamGrad')})`}
      />

      {/* Abducted digits riding the beam */}
      <g className="lift">
        {DIGITS.map((d) => (
          <text
            key={d.x}
            className="digit"
            x={d.x}
            y={d.y}
            fill="var(--brand)"
            stroke="var(--brand)"
            transform={`rotate(${d.rotate} ${d.x} ${d.y - 26})`}
            style={{ animationDelay: `${d.stagger + settledDelay}s` }}
          >
            {d.value}
          </text>
        ))}
      </g>

      {/* UFO (gentle hover) */}
      <g className="ufo-bob">
        {/* Antennae */}
        <line x1={272} y1={52} x2={258} y2={22} stroke="var(--brand)" strokeWidth={4} strokeLinecap="round" />
        <line x1={328} y1={52} x2={342} y2={22} stroke="var(--brand)" strokeWidth={4} strokeLinecap="round" />
        <circle cx={258} cy={20} r={5} fill="var(--brand)" />
        <circle cx={342} cy={20} r={5} fill="var(--brand)" />
        {/* Dome */}
        <path d="M 250 92 A 50 44 0 0 1 350 92 Z" fill="var(--brand)" opacity={0.3} />
        <path
          d="M 250 92 A 50 44 0 0 1 350 92"
          fill="none"
          stroke="var(--brand)"
          strokeWidth={4}
          strokeLinecap="round"
        />
        {/* Saucer body */}
        <ellipse cx={300} cy={102} rx={112} ry={30} fill="var(--brand)" />
        <ellipse cx={300} cy={110} rx={112} ry={24} fill="var(--brand)" opacity={0.55} />
        {/* Twinkling rim lights */}
        {RIM_LIGHTS.map((l, i) => (
          <circle
            key={i}
            className="tw"
            cx={l.cx}
            cy={l.cy}
            r={l.r}
            fill="#ffffff"
            style={{ animationDelay: `${l.delay - LOOP / 2}s` }}
          />
        ))}
      </g>
    </svg>
  )
}
