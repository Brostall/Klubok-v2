export function YarnMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path
        fill="#eb8a3e"
        d="M32 8c12 0 22 9 22 22 0 16-12 26-22 26S10 46 10 30C10 17 20 8 32 8Z"
      />
      <path
        fill="none"
        stroke="#f7ede0"
        strokeWidth="3"
        strokeLinecap="round"
        d="M22 24c8-8 22-6 24 8"
      />
      <path
        fill="none"
        stroke="#d24136"
        strokeWidth="3"
        strokeLinecap="round"
        d="M18 32c7 12 22 12 28 1"
      />
      <path
        fill="none"
        stroke="#f7ede0"
        strokeWidth="2.6"
        strokeLinecap="round"
        d="M24 42c8 6 18 4 22-6"
      />
      <path
        fill="none"
        stroke="#c44732"
        strokeWidth="2.8"
        strokeLinecap="round"
        d="M20 28c10-9 24-2 22 10"
      />
      <ellipse cx="26" cy="22" rx="5" ry="3.2" fill="#f7ede0" opacity="0.45" />
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

export function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="currentColor" d="M2 9 16 3 11.2 15 9 10.2 2 9Z" />
    </svg>
  )
}
