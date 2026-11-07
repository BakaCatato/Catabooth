import type { Ref } from 'react'
import { RotateCcw } from 'lucide-react'
import StickerDoodle from './StickerDoodle'
import {
  FILTERS,
  FRAME_DESIGNS,
  type BoothMode,
  type FilterId,
  type FrameDesignId,
  type LayoutId,
  type PhotoDataUrl,
  type StickerPackId,
} from '../types/photobooth'

const INK = '#2a211d'
const DISPLAY_FONT = '"Bangers", "Impact", system-ui, sans-serif'
const BODY_FONT = '"Space Grotesk", system-ui, sans-serif'

interface PhotoStripProps {
  photos: readonly PhotoDataUrl[]
  boothMode: BoothMode
  layout: LayoutId
  filter?: FilterId
  frameDesign?: FrameDesignId
  stickerPack?: StickerPackId
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
  frameDesign = 'cream',
  stickerPack = 'cats',
  applyCssFilter = true,
  onPhotoClick,
  dateStr = 'made with love',
  ref,
}: PhotoStripProps) {
  const columns = layout === '2-column-grid' ? 2 : 1
  const cssFilter = applyCssFilter ? FILTERS[filter].css : 'none'
  const design = FRAME_DESIGNS[frameDesign]

  return (
    <div
      ref={ref}
      data-strip-color={frameDesign}
      data-sticker-pack={stickerPack}
      style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: design.stripBg,
        border: design.stripBorder,
        borderRadius: 3,
        padding: 18,
        fontFamily: BODY_FONT,
        color: design.footerText,
      }}
    >
      {/* ---------- Strip Header ---------- */}
      <div
        style={{
          position: 'relative',
          backgroundColor: design.headerBg,
          border: design.cellBorder,
          borderRadius: 3,
          padding: '9px 6px 8px',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 30,
            lineHeight: 1,
            letterSpacing: 2,
            color: design.headerText,
            textShadow: design.headerShadow,
          }}
        >
          CATABOOTH
        </div>
        <div style={{ marginTop: 4, fontSize: 8, letterSpacing: 1.2, color: design.headerText }}>
          LITTLE MOMENTS, BIG FEELINGS
        </div>
        {boothMode === 'together' && (
          <div
            style={{
              display: 'inline-block',
              marginTop: 6,
              backgroundColor: design.badgeBg,
              color: design.badgeText,
              border: `2px solid ${INK}`,
              borderRadius: 999,
              padding: '2px 9px',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              lineHeight: 1.3,
            }}
          >
            BETTER TOGETHER
          </div>
        )}
        <StickerDoodle
          pack={stickerPack}
          variant={2}
          size={32}
          style={{ position: 'absolute', right: -15, top: -15, transform: 'rotate(12deg)' }}
        />
      </div>

      {/* ---------- Photos Grid ---------- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: columns === 2 ? '1fr 1fr' : '1fr',
          gap: 16,
        }}
      >
        {photos.map((src, i) => {
          const cellBg = design.cellColors[i % design.cellColors.length]
          const leftEdge = i % 2 === 0
          const photo = (
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
          )
          return (
            <div key={i} style={{ position: 'relative', minWidth: 0 }}>
              {onPhotoClick ? (
                <button
                  type="button"
                  onClick={() => onPhotoClick(i)}
                  aria-label={`Retake shot ${i + 1}`}
                  title={`Click to retake shot #${i + 1}`}
                  className="group relative block w-full cursor-pointer overflow-hidden p-0 text-left outline-none focus-visible:ring-4 focus-visible:ring-butter"
                  style={{ border: design.cellBorder, backgroundColor: cellBg, lineHeight: 0 }}
                >
                  {photo}
                  <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-2 py-1 font-display text-sm tracking-wider text-ink shadow-brutal-sm">
                      <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                      RETAKE #{i + 1}
                    </span>
                  </span>
                </button>
              ) : (
                <div style={{ border: design.cellBorder, backgroundColor: cellBg, lineHeight: 0, overflow: 'hidden' }}>
                  {photo}
                </div>
              )}
              {/* Doodles live in the paper margins and never intercept retake clicks. */}
              <StickerDoodle
                pack={stickerPack}
                variant={i}
                size={30}
                style={{
                  position: 'absolute',
                  ...(leftEdge ? { left: -16, top: -10 } : { right: -16, bottom: -10 }),
                  transform: `rotate(${leftEdge ? -14 : 12}deg)`,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* ---------- Strip Footer ---------- */}
      <div
        style={{
          marginTop: 15,
          paddingTop: 9,
          borderTop: `2px dashed ${design.footerText}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 6,
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: design.footerText,
        }}
      >
        <span>{dateStr}</span>
        <span style={{ whiteSpace: 'nowrap' }}>{photos.length} LITTLE MEMORIES</span>
      </div>
    </div>
  )
}
