import type { Ref } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  FILTERS,
  FRAME_DESIGNS,
  type BoothMode,
  type FilterId,
  type FrameDesignId,
  type LayoutId,
  type PhotoDataUrl,
} from '../types/photobooth'

const INK = '#0a0a0a'
const DISPLAY_FONT = '"Bangers", "Impact", system-ui, sans-serif'
const BODY_FONT = '"Space Grotesk", system-ui, sans-serif'

interface PhotoStripProps {
  photos: readonly PhotoDataUrl[]
  boothMode: BoothMode
  layout: LayoutId
  filter?: FilterId
  frameDesign?: FrameDesignId
  /** Set to false when photos already have the filter baked into their pixels */
  applyCssFilter?: boolean
  /** When provided, each photo becomes clickable to trigger a selective retake */
  onPhotoClick?: (index: number) => void
  dateStr?: string
  ref?: Ref<HTMLDivElement>
}

export default function PhotoStrip({
  photos,
  boothMode,
  layout,
  filter = 'original',
  frameDesign = 'classic-white',
  applyCssFilter = true,
  onPhotoClick,
  dateStr = 'POP! SNAP!',
  ref,
}: PhotoStripProps) {
  const columns = layout === '2-column-grid' ? 2 : 1
  const cssFilter = applyCssFilter ? FILTERS[filter].css : 'none'
  const design = FRAME_DESIGNS[frameDesign]

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: design.stripBg,
        border: design.stripBorder,
        padding: 14,
        fontFamily: BODY_FONT,
        color: design.footerText,
      }}
    >
      {/* ---------- Strip Header ---------- */}
      <div
        style={{
          backgroundColor: design.headerBg,
          border: design.cellBorder,
          padding: '8px 10px 10px',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 32,
            lineHeight: 1,
            letterSpacing: 2,
            color: design.headerText,
            textShadow: design.headerShadow,
          }}
        >
          CATABOOTH{design.motif ? ` ${design.motif}` : ''}
        </div>
        {boothMode === 'together' && (
          <div
            style={{
              display: 'inline-block',
              marginTop: 6,
              backgroundColor: design.badgeBg,
              color: design.badgeText,
              border: `3px solid ${INK}`,
              borderRadius: 999,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              lineHeight: 1.4,
            }}
          >
            ★ TOGETHER ★
          </div>
        )}
      </div>

      {/* ---------- Photos Grid ---------- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: columns === 2 ? '1fr 1fr' : '1fr',
          gap: 10,
        }}
      >
        {photos.map((src, i) => {
          const cellBg = design.cellColors[i % design.cellColors.length]

          if (onPhotoClick) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onPhotoClick(i)}
                aria-label={`Retake shot ${i + 1}`}
                title={`Click to retake shot #${i + 1}`}
                className="group relative block w-full cursor-pointer overflow-hidden p-0 text-left outline-none focus-visible:ring-4 focus-visible:ring-pop-yellow"
                style={{
                  border: design.cellBorder,
                  backgroundColor: cellBg,
                  lineHeight: 0,
                }}
              >
                <img
                  src={src}
                  alt={`Shot ${i + 1}`}
                  crossOrigin="anonymous"
                  draggable={false}
                  style={{
                    display: 'block',
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                    filter: cssFilter,
                    imageRendering: filter === 'pixelate' ? 'pixelated' : 'auto',
                  }}
                />
                {/* Interactive retake hover overlay */}
                <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full border-3 border-ink bg-pop-yellow px-3 py-1 font-display text-base tracking-wider text-ink shadow-brutal-sm">
                    <RotateCcw className="h-4 w-4" strokeWidth={3} />
                    RETAKE #{i + 1}
                  </span>
                </span>
              </button>
            )
          }

          return (
            <div
              key={i}
              style={{
                border: design.cellBorder,
                backgroundColor: cellBg,
                lineHeight: 0,
                overflow: 'hidden',
              }}
            >
              <img
                src={src}
                alt={`Shot ${i + 1}`}
                crossOrigin="anonymous"
                draggable={false}
                style={{
                  display: 'block',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                  filter: cssFilter,
                  imageRendering: filter === 'pixelate' ? 'pixelated' : 'auto',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* ---------- Strip Footer ---------- */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 8,
          borderTop: `3px dashed ${design.footerText}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: design.footerText,
        }}
      >
        <span>★ {dateStr}</span>
        <span>{photos.length} SHOTS ★</span>
      </div>
    </div>
  )
}
