import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Columns2,
  Frame,
  Palette,
  RotateCcw,
  Rows3,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import PhotoStrip from '../components/PhotoStrip'
import {
  FILTERS,
  FILTER_ORDER,
  FRAME_DESIGNS,
  FRAME_DESIGN_ORDER,
  LAYOUTS,
  type CustomizationProps,
  type LayoutId,
} from '../types/photobooth'
import { useBakedPhotos } from '../utils/photoFilters'

const INK = '#0a0a0a'

const LAYOUT_ICONS: Record<LayoutId, LucideIcon> = {
  'vertical-strip': Rows3,
  '2-column-grid': Columns2,
}

const formatDateStr = () =>
  new Date()
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .toUpperCase()

export default function Customization({
  boothMode,
  photos,
  frameCount,
  layout,
  filter,
  frameDesign,
  onLayoutChange,
  onFilterChange,
  onFrameDesignChange,
  onRetakeSingle,
  onConfirm,
  onRetake,
}: CustomizationProps) {
  const [dateStr] = useState(formatDateStr)
  const bakedPhotos = useBakedPhotos(photos, filter)
  const bakedSwatches = useBakedPhotos(photos.slice(0, 1), 'pixelate')

  // Responsive auto-scale calculation so the strip always fits inside the viewport
  const viewportBoxRef = useRef<HTMLDivElement>(null)
  const stripMeasureRef = useRef<HTMLDivElement>(null)
  const [stripScale, setStripScale] = useState(1)
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined)

  const baseStripWidth = layout === '2-column-grid' ? 380 : 260

  useEffect(() => {
    const updateScale = () => {
      const box = viewportBoxRef.current
      const stripEl = stripMeasureRef.current
      if (!box || !stripEl) return

      const naturalHeight = stripEl.offsetHeight
      const naturalWidth = stripEl.offsetWidth
      if (!naturalHeight || !naturalWidth) return

      // Max available height in the viewport so it never cuts off or forces scrolling
      const maxAvailHeight = Math.max(280, window.innerHeight - 210)
      const maxAvailWidth = Math.max(200, box.clientWidth - 16)

      const scaleH = maxAvailHeight / naturalHeight
      const scaleW = maxAvailWidth / naturalWidth
      const nextScale = Math.min(1, scaleH, scaleW)

      setStripScale(nextScale)
      setScaledHeight(Math.ceil(naturalHeight * nextScale))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    if (viewportBoxRef.current) observer.observe(viewportBoxRef.current)
    if (stripMeasureRef.current) observer.observe(stripMeasureRef.current)
    window.addEventListener('resize', updateScale)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [layout, photos.length, boothMode, frameDesign])

  const displayPhotos = filter === 'pixelate' && bakedPhotos ? bakedPhotos : photos
  const applyCss = filter !== 'pixelate'

  return (
    <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-5 px-4 py-5 md:py-8">
      {/* ---------- Header ---------- */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none tracking-wide text-white text-outline [text-shadow:4px_4px_0_#0a0a0a] sm:text-5xl md:text-6xl">
            Customize Your Strip!
          </h1>
          <p className="mt-1.5 inline-block -rotate-1 rounded-md border-3 border-ink bg-white px-3 py-0.5 text-xs font-bold uppercase tracking-widest md:text-sm">
            Click any photo on the strip to retake just that shot!
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border-4 border-ink bg-pop-yellow px-4 py-1.5 font-display text-xl tracking-wider text-ink shadow-brutal-sm">
          <Sparkles className="h-5 w-5" strokeWidth={3} />
          {frameCount} Shots Ready!
        </span>
      </header>

      {/* ---------- Main Content ---------- */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Left: Auto-Scaling Live Photo Strip Preview */}
        <div
          ref={viewportBoxRef}
          className="flex w-full flex-col items-center justify-center gap-2 lg:sticky lg:top-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="-rotate-2 rounded-md border-3 border-ink bg-ink px-3 py-0.5 font-display text-lg tracking-widest text-pop-yellow shadow-brutal-sm">
              ★ LIVE PREVIEW ★
            </span>
            <span className="rounded-md border-2 border-ink bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
              Tap a photo to retake
            </span>
          </div>

          {/* Scaled wrapper that constrains height to match the visual scale */}
          <div
            className="relative flex w-full items-start justify-center overflow-visible"
            style={{ height: scaledHeight }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={layout}
                initial={{ opacity: 0, scale: stripScale * 0.92 }}
                animate={{
                  opacity: 1,
                  scale: stripScale,
                }}
                exit={{ opacity: 0, scale: stripScale * 0.92 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                style={{
                  width: baseStripWidth,
                  transformOrigin: 'top center',
                }}
                className="shadow-brutal-lg"
              >
                <div ref={stripMeasureRef}>
                  <PhotoStrip
                    photos={displayPhotos}
                    boothMode={boothMode}
                    layout={layout}
                    filter={filter}
                    frameDesign={frameDesign}
                    applyCssFilter={applyCss}
                    onPhotoClick={onRetakeSingle}
                    dateStr={dateStr}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* 1. Layout Selector (clean buttons without hardcoded 1x6 / 2x3 text) */}
          <div className="rounded-2xl border-[5px] border-ink bg-white p-5 shadow-brutal-lg">
            <h2 className="mb-3.5 flex items-center gap-2.5 font-display text-3xl tracking-wide">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border-4 border-ink bg-pop-cyan">
                <Columns2 className="h-5 w-5" strokeWidth={3} />
              </span>
              1. Choose Layout
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {LAYOUTS.map((opt) => {
                const Icon = LAYOUT_ICONS[opt.id]
                const isSelected = layout === opt.id

                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onLayoutChange(opt.id)}
                    className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-4 border-ink p-4 text-center outline-none transition-colors focus-visible:ring-4 focus-visible:ring-pop-magenta ${
                      isSelected ? 'bg-pop-yellow' : 'bg-paper'
                    }`}
                    animate={{
                      y: isSelected ? -3 : 0,
                      boxShadow: `${isSelected ? 6 : 4}px ${isSelected ? 6 : 4}px 0px 0px ${INK}`,
                    }}
                    whileHover={{ y: -4, boxShadow: `8px 8px 0px 0px ${INK}` }}
                    whileTap={{ y: 2, boxShadow: `0px 0px 0px 0px ${INK}` }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  >
                    {isSelected && (
                      <span className="absolute -right-2.5 -top-2.5 flex h-8 w-8 items-center justify-center rounded-full border-3 border-ink bg-pop-green">
                        <Check className="h-4 w-4" strokeWidth={4} />
                      </span>
                    )}
                    <Icon className="h-8 w-8" strokeWidth={2.75} />
                    <span className="font-display text-2xl tracking-wider">{opt.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* 2. Frame Design Selector */}
          <div className="rounded-2xl border-[5px] border-ink bg-white p-5 shadow-brutal-lg">
            <h2 className="mb-3.5 flex items-center gap-2.5 font-display text-3xl tracking-wide">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border-4 border-ink bg-pop-yellow">
                <Frame className="h-5 w-5" strokeWidth={3} />
              </span>
              2. Frame Design
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FRAME_DESIGN_ORDER.map((designId) => {
                const design = FRAME_DESIGNS[designId]
                const isSelected = frameDesign === designId

                return (
                  <motion.button
                    key={designId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onFrameDesignChange(designId)}
                    className={`relative flex cursor-pointer items-center gap-3 rounded-xl border-4 border-ink p-3 text-left outline-none transition-colors focus-visible:ring-4 focus-visible:ring-pop-magenta ${
                      isSelected ? 'bg-pop-green' : 'bg-paper'
                    }`}
                    animate={{
                      y: isSelected ? -2 : 0,
                      boxShadow: `${isSelected ? 6 : 4}px ${isSelected ? 6 : 4}px 0px 0px ${INK}`,
                    }}
                    whileHover={{ y: -3, boxShadow: `7px 7px 0px 0px ${INK}` }}
                    whileTap={{ y: 2, boxShadow: `0px 0px 0px 0px ${INK}` }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  >
                    {isSelected && (
                      <span className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-3 border-ink bg-pop-yellow">
                        <Check className="h-3.5 w-3.5" strokeWidth={4} />
                      </span>
                    )}

                    {/* Mini frame color swatch */}
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 flex-col justify-between overflow-hidden rounded-lg p-1"
                      style={{
                        backgroundColor: design.stripBg,
                        border: design.cellBorder,
                      }}
                    >
                      <span
                        className="block h-2.5 w-full rounded-[2px]"
                        style={{ backgroundColor: design.headerBg }}
                      />
                      <span className="grid grid-cols-2 gap-0.5">
                        <span
                          className="h-3 rounded-[1px]"
                          style={{ backgroundColor: design.cellColors[0] }}
                        />
                        <span
                          className="h-3 rounded-[1px]"
                          style={{ backgroundColor: design.cellColors[1] }}
                        />
                      </span>
                    </span>

                    <div className="min-w-0 flex-1">
                      <span className="block font-display text-xl leading-tight tracking-wide text-ink">
                        {design.label}
                      </span>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* 3. Extended Filter Selector (horizontally scrollable swatch strip) */}
          <div className="rounded-2xl border-[5px] border-ink bg-white p-5 shadow-brutal-lg">
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2.5 font-display text-3xl tracking-wide">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border-4 border-ink bg-pop-magenta text-white">
                  <Palette className="h-5 w-5" strokeWidth={3} />
                </span>
                3. Apply Filter
              </h2>
              <span className="rounded-md border-2 border-ink bg-paper px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
                Swipe / Scroll →
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3 pt-2">
              {FILTER_ORDER.map((filterId) => {
                const opt = FILTERS[filterId]
                const isSelected = filter === filterId
                const previewSrc =
                  filterId === 'pixelate' && bakedSwatches?.[0] ? bakedSwatches[0] : photos[0]

                return (
                  <motion.button
                    key={filterId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onFilterChange(filterId)}
                    className={`relative flex w-32 shrink-0 cursor-pointer flex-col items-center gap-2 rounded-xl border-4 border-ink p-2.5 text-center outline-none transition-colors focus-visible:ring-4 focus-visible:ring-pop-magenta ${
                      isSelected ? 'bg-pop-cyan' : 'bg-paper'
                    }`}
                    animate={{
                      y: isSelected ? -3 : 0,
                      boxShadow: `${isSelected ? 6 : 4}px ${isSelected ? 6 : 4}px 0px 0px ${INK}`,
                    }}
                    whileHover={{ y: -4, boxShadow: `8px 8px 0px 0px ${INK}` }}
                    whileTap={{ y: 2, boxShadow: `0px 0px 0px 0px ${INK}` }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  >
                    {isSelected && (
                      <span className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-3 border-ink bg-pop-yellow">
                        <Check className="h-3.5 w-3.5" strokeWidth={4} />
                      </span>
                    )}

                    <div className="aspect-4/3 w-full overflow-hidden rounded-lg border-3 border-ink bg-ink">
                      {previewSrc && (
                        <img
                          src={previewSrc}
                          alt={opt.label}
                          className="h-full w-full object-cover"
                          style={{
                            filter: filterId === 'pixelate' ? 'none' : opt.css,
                            imageRendering: filterId === 'pixelate' ? 'pixelated' : 'auto',
                          }}
                        />
                      )}
                    </div>

                    <span className="font-display text-lg tracking-wider">{opt.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* 4. RETAKE & DONE Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pb-4 sm:justify-between">
            <motion.button
              type="button"
              onClick={onRetake}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border-4 border-ink bg-white px-6 py-3 font-display text-2xl tracking-wider text-ink outline-none focus-visible:ring-4 focus-visible:ring-pop-yellow"
              initial={{ boxShadow: `6px 6px 0px 0px ${INK}` }}
              animate={{ x: 0, y: 0, boxShadow: `6px 6px 0px 0px ${INK}` }}
              whileHover={{ x: -2, y: -2, boxShadow: `8px 8px 0px 0px ${INK}` }}
              whileTap={{ x: 6, y: 6, boxShadow: `0px 0px 0px 0px ${INK}` }}
              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
            >
              <RotateCcw className="h-6 w-6" strokeWidth={3} />
              RETAKE ALL
            </motion.button>

            <motion.button
              type="button"
              onClick={onConfirm}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border-[5px] border-ink bg-pop-magenta px-9 py-3.5 font-display text-3xl tracking-wider text-white text-outline-sm outline-none focus-visible:ring-4 focus-visible:ring-pop-yellow md:px-12 md:text-4xl"
              initial={{ boxShadow: `8px 8px 0px 0px ${INK}` }}
              animate={{ x: 0, y: 0, boxShadow: `8px 8px 0px 0px ${INK}` }}
              whileHover={{ x: -2, y: -2, boxShadow: `10px 10px 0px 0px ${INK}` }}
              whileTap={{ x: 8, y: 8, boxShadow: `0px 0px 0px 0px ${INK}` }}
              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
            >
              <Check className="h-7 w-7 md:h-8 md:w-8" strokeWidth={3.5} />
              DONE
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
