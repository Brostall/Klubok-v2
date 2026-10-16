type Props = { playing: boolean }

export function Turntable({ playing }: Props) {
  return (
    <svg
      className={playing ? 'deck deck--on' : 'deck'}
      viewBox="0 0 320 320"
      role="img"
      aria-label="Проигрыватель"
    >
      <rect x="12" y="12" width="296" height="296" rx="28" fill="#c9b7a8" />
      <rect x="24" y="24" width="272" height="272" rx="20" fill="#ebd2b0" />

      <circle cx="54" cy="54" r="18" fill="#785a46" />
      <circle cx="54" cy="54" r="10" fill="#f7ede0" />
      <circle cx="50" cy="50" r="3" fill="#c9b7a8" />

      <rect x="36" y="250" width="52" height="32" rx="8" fill="#f7ede0" />
      <circle cx="52" cy="266" r="9" fill="#d24136" />
      <circle cx="74" cy="266" r="6" fill="#eb8a3e" />

      <g className="platter">
        <circle cx="138" cy="168" r="118" fill="#785a46" />
        <circle
          cx="138"
          cy="168"
          r="114"
          fill="none"
          stroke="#f7ede0"
          strokeWidth="5"
          strokeDasharray="3 7"
        />
        <circle cx="138" cy="168" r="104" fill="#3f2e24" />
        <circle cx="138" cy="168" r="96" fill="none" stroke="#5a4336" strokeWidth="1.2" />
        <circle cx="138" cy="168" r="86" fill="none" stroke="#5a4336" strokeWidth="1.2" />
        <circle cx="138" cy="168" r="76" fill="none" stroke="#5a4336" strokeWidth="1.2" />
        <circle cx="138" cy="168" r="66" fill="none" stroke="#5a4336" strokeWidth="1.2" />
        <circle cx="138" cy="168" r="56" fill="none" stroke="#5a4336" strokeWidth="1.2" />
        <circle cx="138" cy="168" r="40" fill="#f7ede0" />
        <circle cx="138" cy="168" r="26" fill="#d24136" />
        <circle cx="138" cy="168" r="7" fill="#eb8a3e" />
        <circle cx="128" cy="158" r="6" fill="#ebb582" opacity="0.55" />
      </g>

      <circle cx="252" cy="86" r="36" fill="#5f4636" />
      <circle cx="252" cy="86" r="22" fill="#3f2e24" />
      <circle cx="252" cy="86" r="10" fill="#c9b7a8" />
      <circle cx="252" cy="86" r="5" fill="#f7ede0" />

      <g className="arm">
        <path
          d="M252 86 C 248 120 230 138 186 152"
          fill="none"
          stroke="#785a46"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <rect x="170" y="144" width="24" height="16" rx="5" fill="#3f2e24" transform="rotate(-18 182 152)" />
        <circle cx="176" cy="158" r="5" fill="#d24136" />
      </g>

      <rect x="278" y="150" width="16" height="96" rx="8" fill="#f7ede0" />
      <rect x="281" y="156" width="10" height="70" rx="4" fill="#c9b7a8" />
      <rect x="279" y="198" width="14" height="18" rx="4" fill="#eb8a3e" />
    </svg>
  )
}
