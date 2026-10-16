import { useId } from 'react'

const CX = 64
const CY = 62
const R = 46

function edge(y: number) {
  const half = Math.sqrt(Math.max(0, R * R - (y - CY) ** 2))
  return { left: CX - half, right: CX + half }
}

function curve(y: number, bow: number) {
  const { left, right } = edge(y)
  return `M ${left.toFixed(1)} ${y} Q ${CX} ${(y + bow).toFixed(1)} ${right.toFixed(1)} ${y}`
}

function ribbon(y: number, bow: number, thick: number) {
  const top = edge(y)
  const low = y + thick
  const bottom = edge(low)
  return [
    `M ${top.left.toFixed(1)} ${y}`,
    `Q ${CX} ${(y + bow).toFixed(1)} ${top.right.toFixed(1)} ${y}`,
    `L ${bottom.right.toFixed(1)} ${low.toFixed(1)}`,
    `Q ${CX} ${(low + bow * 0.9).toFixed(1)} ${bottom.left.toFixed(1)} ${low.toFixed(1)}`,
    'Z',
  ].join(' ')
}

const TURNS = [
  { y: 22, bow: 2.4, thick: 8 },
  { y: 35, bow: 3.6, thick: 9 },
  { y: 49, bow: 4.6, thick: 10 },
  { y: 64, bow: 4.4, thick: 10 },
  { y: 79, bow: 3.2, thick: 9 },
  { y: 93, bow: 2.2, thick: 7.5 },
]

export function YarnMark({ className }: { className?: string }) {
  const raw = useId().replace(/:/g, '')
  const wool = `klubok-wool-${raw}`
  const ball = `klubok-ball-${raw}`

  return (
    <svg className={className} viewBox="0 0 128 128" aria-hidden="true">
      <defs>
        <radialGradient id={wool} cx="36%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#f6c48a" />
          <stop offset="52%" stopColor="#e07a34" />
          <stop offset="100%" stopColor="#9a3822" />
        </radialGradient>
        <linearGradient id={`${wool}-cord`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8d7ae" />
          <stop offset="42%" stopColor="#f0a15a" />
          <stop offset="100%" stopColor="#c45a2c" />
        </linearGradient>
        <clipPath id={ball}>
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>
      <ellipse cx="64" cy="116" rx="28" ry="4.2" fill="#785a46" opacity="0.2" />
      <circle cx={CX} cy={CY} r={R} fill={`url(#${wool})`} />
      <g clipPath={`url(#${ball})`}>
        <ellipse cx="78" cy="78" rx="28" ry="22" fill="#6e2c18" opacity="0.18" />
        {TURNS.map((turn) => (
          <path key={`cord-${turn.y}`} d={ribbon(turn.y, turn.bow, turn.thick)} fill={`url(#${wool}-cord)`} />
        ))}
        {TURNS.map((turn) => (
          <path
            key={`sheen-${turn.y}`}
            d={curve(turn.y + 1.4, turn.bow * 0.92)}
            fill="none"
            stroke="#fff6ec"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.8"
          />
        ))}
        <g transform={`rotate(62 ${CX} ${CY})`}>
          <path d={ribbon(56, 5.2, 8)} fill={`url(#${wool}-cord)`} />
          <path
            d={curve(57.4, 4.8)}
            fill="none"
            stroke="#fff6ec"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.75"
          />
        </g>
      </g>
      <path
        d="M84 92c14 12 30 8 32-2 2.2-9-8-16-16-10"
        fill="none"
        stroke="#c45a2c"
        strokeWidth="6.2"
        strokeLinecap="round"
      />
      <path
        d="M84 90.4c13 11 27 7.2 29-1.8 2-8-7-14-14-9"
        fill="none"
        stroke="#f0a15a"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Logo() {
  return (
    <a className="logo" href="#/">
      <YarnMark />
      <span>Клубок</span>
    </a>
  )
}

export function Disc() {
  return (
    <svg className="disc" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="96" fill="#f3ddc4" />
      <circle cx="100" cy="100" r="86" fill="#785a46" />
      <circle cx="100" cy="100" r="74" fill="#c9b7a8" />
      <circle cx="100" cy="100" r="64" fill="#5f4636" />
      <circle cx="100" cy="100" r="52" fill="#c9b7a8" />
      <circle cx="100" cy="100" r="42" fill="#785a46" />
      <circle cx="100" cy="100" r="28" fill="#d24136" />
      <circle cx="92" cy="92" r="8" fill="#ebb582" opacity="0.7" />
    </svg>
  )
}

export function NoteIcon() {
  return (
    <svg viewBox="0 0 18 28" width="18" height="28" aria-hidden="true">
      <path
        fill="#785a46"
        d="M7 3.2v14.1a4.4 4.4 0 1 1-1.8-3.5V6.1L16 3.4v11.2a4.4 4.4 0 1 1-1.8-3.5V4.6L7 3.2Z"
      />
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path fill="currentColor" d="M7 4.2v13.6L18 11 7 4.2Z" />
    </svg>
  )
}

export function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path fill="currentColor" d="M6 4h4v14H6V4Zm6 0h4v14h-4V4Z" />
    </svg>
  )
}

export function SkipIcon({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      aria-hidden="true"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path fill="currentColor" d="M4 5v12l8-6-8-6Zm9 0h2v12h-2V5Z" />
    </svg>
  )
}

export function RepeatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.2 5h7.3l-1.6-1.6L14.3 2 19 6.7 14.3 11.4l-1.4-1.4L14.5 8.4H7.2A3.2 3.2 0 0 0 4 11.6v1.6H2v-1.6A5.2 5.2 0 0 1 7.2 5Zm7.6 12H7.5l1.6 1.6-1.4 1.4L3 15.3l4.7-4.7 1.4 1.4-1.6 1.6h7.3a3.2 3.2 0 0 0 3.2-3.2V9.2h2v1.6a5.2 5.2 0 0 1-5.2 5.2Z"
      />
    </svg>
  )
}

export function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="currentColor" d="M2 9 16 3 11.2 15 9 10.2 2 9Z" />
    </svg>
  )
}
