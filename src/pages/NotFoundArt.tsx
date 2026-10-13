import { useId } from 'react'

/** Full animation cycle in seconds (matches the brand-logo loop). */
const LOOP = 12

interface Star {
  cx: number
  cy: number
  r: number
  delay: number
}

const STARS: Star[] = [
  { cx: 40, cy: 40, r: 2.2, delay: 0 },
  { cx: 95, cy: 90, r: 1.4, delay: 1.8 },
  { cx: 150, cy: 35, r: 1.8, delay: 3.1 },
  { cx: 210, cy: 70, r: 1.2, delay: 0.9 },
  { cx: 268, cy: 30, r: 2, delay: 2.4 },
  { cx: 330, cy: 62, r: 1.3, delay: 4.2 },
  { cx: 392, cy: 34, r: 1.7, delay: 1.1 },
  { cx: 448, cy: 78, r: 1.2, delay: 3.7 },
  { cx: 505, cy: 40, r: 2.1, delay: 0.5 },
  { cx: 560, cy: 88, r: 1.5, delay: 2.8 },
  { cx: 585, cy: 150, r: 1.3, delay: 4.8 },
  { cx: 20, cy: 160, r: 1.4, delay: 3.4 },
  { cx: 60, cy: 230, r: 1.8, delay: 1.5 },
  { cx: 540, cy: 235, r: 1.6, delay: 0.2 },
  { cx: 470, cy: 262, r: 1.2, delay: 2.1 },
  { cx: 130, cy: 262, r: 1.3, delay: 4.5 },
]

const DIGITS = [
  { value: '4', x: 128, stagger: 0 },
  { value: '0', x: 300, stagger: 0.4 },
  { value: '4', x: 472, stagger: 0.8 },
]

/**
 * Thematic "lost in space" SVG scene: the 404 digits draw themselves on with
 * a stroke, fade in their fill, hold, then reverse-hide and redraw — the same
 * loop language as the brand logo. A twinkling starfield, a ringed planet and
 * an orbiting satellite complete the scene.
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
      viewBox="0 0 600 300"
      className={root}
      role="img"
      aria-label="404 page not found illustration"
      style={{ width: '100%', height: 'auto', maxWidth: '34rem' }}
    >
      <style>{`
        @keyframes ${unq('digit')} {
          0% { stroke-dashoffset: 1200; fill-opacity: 0; }
          14% { stroke-dashoffset: 0; fill-opacity: 0; }
          22% { stroke-dashoffset: 0; fill-opacity: 1; }
          68% { stroke-dashoffset: 0; fill-opacity: 1; }
          76% { stroke-dashoffset: 0; fill-opacity: 0; }
          88% { stroke-dashoffset: 1200; fill-opacity: 0; }
          100% { stroke-dashoffset: 1200; fill-opacity: 0; }
        }
        .${root} .digit {
          font-size: 10.9375rem;
          font-weight: 800;
          text-anchor: middle;
          stroke-width: 3;
          stroke-dasharray: 1200;
          animation: ${unq('digit')} ${LOOP}s ease-in-out infinite;
        }
        @keyframes ${unq('twinkle')} {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.9; }
        }
        .${root} .star { animation: ${unq('twinkle')} 3.6s ease-in-out infinite; }
        @keyframes ${unq('orbit')} {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .${root} .sat-orbit {
          transform-origin: 300px 128px;
          animation: ${unq('orbit')} 9s linear infinite;
        }
        @keyframes ${unq('comet')} {
          0%, 58% { transform: translate(0, 0); opacity: 0; }
          62% { opacity: 1; }
          74% { transform: translate(-13rem, 7.5rem); opacity: 0; }
          100% { transform: translate(-13rem, 7.5rem); opacity: 0; }
        }
        .${root} .comet { animation: ${unq('comet')} ${LOOP}s ease-in infinite; }
        @media (prefers-reduced-motion: reduce) {
          .${root} * { animation: none !important; }
          .${root} .digit { stroke-dashoffset: 0; fill-opacity: 1; }
          .${root} .star { opacity: 0.7; }
          .${root} .comet { opacity: 0; }
        }
      `}</style>

      <defs>
        <linearGradient id={unq('tail')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--teal)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--teal)" />
        </linearGradient>
      </defs>

      {/* Starfield */}
      {STARS.map((s, i) => (
        <circle
          key={i}
          className="star"
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="var(--brand)"
          opacity={0.55}
          style={{ animationDelay: `${s.delay - LOOP / 2}s` }}
        />
      ))}

      {/* Ringed planet, upper right */}
      <g opacity={0.9}>
        <circle cx={512} cy={196} r={20} fill="var(--purple)" opacity={0.25} />
        <ellipse
          cx={512}
          cy={196}
          rx={36}
          ry={11}
          fill="none"
          stroke="var(--purple)"
          strokeWidth={2.5}
          opacity={0.55}
          transform="rotate(-18 512 196)"
        />
      </g>

      {/* Comet streak (once per loop) */}
      <g className="comet" opacity={0}>
        <line x1={468} y1={44} x2={516} y2={44} stroke={`url(#${unq('tail')})`} strokeWidth={3} strokeLinecap="round" />
        <circle cx={520} cy={44} r={3.5} fill="var(--teal)" />
      </g>

      {/* Faint orbit path around the middle digit */}
      <ellipse
        cx={300}
        cy={128}
        rx={104}
        ry={64}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={1.5}
        strokeDasharray="5 7"
        opacity={0.5}
      />
      {/* Orbiting satellite */}
      <g className="sat-orbit">
        <circle cx={300} cy={64} r={6} fill="var(--teal)" />
        <circle cx={300} cy={64} r={10.5} fill="none" stroke="var(--teal)" strokeWidth={1.5} opacity={0.5} />
      </g>

      {/* The animated 404 */}
      {DIGITS.map((d) => (
        <text
          key={d.x}
          className="digit"
          x={d.x}
          y={218}
          fill="var(--brand)"
          stroke="var(--brand)"
          style={{ animationDelay: `${d.stagger + settledDelay}s` }}
        >
          {d.value}
        </text>
      ))}
    </svg>
  )
}
