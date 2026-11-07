import './MallArcadeBackground.css'

const FLOOR_ROWS = [0, 24, 56, 100, 158, 238, 340]
const projectTile = (column: number, depth: number) => 720 + (column - 12) * 90 * (1 + depth / 160)

/** Shared, decorative mall corner. No images or motion are needed for the scene. */
export default function MallArcadeBackground() {
  return (
    <div className="mall-arcade-scene" aria-hidden="true">
      <div className="mall-wall-panels" />
      <div className="mall-wall-trim" />
      <div className="mall-hanging-sign">
        <span className="mall-sign-chain mall-sign-chain-left" />
        <span className="mall-sign-chain mall-sign-chain-right" />
        <span className="mall-sign-star">✧</span>
        <span>ARCADE & PHOTO CORNER <span className="mall-sign-arrow">→</span></span>
      </div>
      {[false, true].map((right) => (
        <div key={String(right)} className={`mall-ceiling-lamp ${right ? 'mall-ceiling-lamp-right' : ''}`}>
          <div className="mall-lamp-glow" />
          <svg viewBox="0 0 100 90" fill="none">
            <path d="M50 0v36" stroke="#574b44" strokeWidth="3" />
            <path d="M20 61c3-32 57-32 60 0Z" fill="#d6b8b9" stroke="#574b44" strokeWidth="3" />
            <ellipse cx="50" cy="62" rx="31" ry="7" fill="#fff0b5" stroke="#574b44" strokeWidth="3" />
          </svg>
        </div>
      ))}
      <svg className="mall-tiled-floor" viewBox="0 0 1440 340" preserveAspectRatio="none" fill="none">
        <rect width="1440" height="340" fill="#efe2d2" />
        {FLOOR_ROWS.slice(0, -1).flatMap((top, row) => {
          const bottom = FLOOR_ROWS[row + 1]
          return Array.from({ length: 24 }, (_, column) => (
            <path
              key={`${row}-${column}`}
              d={`M${projectTile(column, top)} ${top}H${projectTile(column + 1, top)}L${projectTile(column + 1, bottom)} ${bottom}H${projectTile(column, bottom)}Z`}
              fill={(row + column) % 2 ? '#e2d1be' : '#efe2d2'}
              stroke="#69594b"
              strokeOpacity="0.28"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          ))
        })}
        <path d="M0 2H1440" stroke="#69594b" strokeWidth="3" />
      </svg>
      <svg className="mall-potted-plant" viewBox="0 0 180 290" fill="none" stroke="#3e4739" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="90" cy="271" rx="74" ry="12" fill="#8f786e" opacity="0.15" stroke="none" />
        <path d="M88 210c-4-62 12-118 6-182m-6 142-42-56m43 26 42-53m-38 6L60 55" />
        <path d="M94 76C54 43 77 15 105 8c18 30 17 48-11 68Z" fill="#a7bf98" />
        <path d="M87 123C43 131 25 99 28 69c43-1 61 22 59 54Z" fill="#bfd0ac" />
        <path d="M95 146c-4-45 21-69 58-65 0 40-22 66-58 65Z" fill="#91ae91" />
        <path d="M85 192c-39 6-69-20-66-56 40-3 65 19 66 56Z" fill="#a7bf98" />
        <path d="M91 199c-1-39 30-57 61-49-8 36-26 53-61 49Z" fill="#bfd0ac" />
        <path d="m48 209 9 57q33 16 66 0l9-57" fill="#dca996" stroke="#574b44" />
        <rect x="43" y="200" width="94" height="19" rx="6" fill="#efc2aa" stroke="#574b44" />
        <path d="m68 230 3 26m39-26-3 26" stroke="#b67e69" />
      </svg>
      <svg className="mall-stanchion" viewBox="0 0 160 210" fill="none" stroke="#574b44" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="80" cy="196" rx="75" ry="10" fill="#8f786e" opacity="0.15" stroke="none" />
        <path d="M27 56c29 44 78 44 105 0" stroke="#574b44" strokeWidth="13" />
        <path d="M27 56c29 44 78 44 105 0" stroke="#cc8f9e" strokeWidth="7" />
        {[27, 132].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy="187" rx="22" ry="7" fill="#d3b27e" />
            <path d={`M${x - 4} 58v126h8V58`} fill="#efd3a0" />
            <circle cx={x} cy="48" r="12" fill="#efd3a0" />
          </g>
        ))}
      </svg>
    </div>
  )
}
