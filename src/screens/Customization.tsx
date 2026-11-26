import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Maximize2, RotateCcw, Sparkles, X } from 'lucide-react'

import PhotoStrip from '../components/PhotoStrip'
import StickerDoodle from '../components/StickerDoodle'
import BrutalButton from '../components/ui/BrutalButton'
import ScreenHeader from '../components/ui/ScreenHeader'
import { usePreviewScale } from '../hooks/usePreviewScale'
import {
  CAPTION_LIMIT, FILTERS, FILTER_ORDER, FRAME_DESIGNS, FRAME_DESIGN_ORDER, LAYOUTS, LOOKS,
  STICKER_PACKS, STICKER_PACK_ORDER, type BoothLook, type CustomizationProps,
} from '../types/photobooth'
import { useBakedPhotos, useFilterPreviews } from '../utils/photoFilters'
import './Customization.css'

const TABS = ['Looks', 'Frame', 'Stickers', 'Filters'] as const
type EditorTab = typeof TABS[number]

function SelectionMark({ selected }: { selected: boolean }) {
  return <span className="studio-selection-mark" aria-hidden="true">{selected && <Check size={13} strokeWidth={3} />}</span>
}

function LookPreview({ look, photo }: { look: BoothLook; photo?: string }) {
  const design = FRAME_DESIGNS[look.frameDesign]
  return (
    <span className="studio-look-strip" aria-hidden="true" style={{ backgroundColor: design.stripBg, color: design.footerText }}>
      <span className="studio-look-marquee" style={{ backgroundColor: design.headerBg, color: design.headerText }}>CATA</span>
      {[0, 1].map((variant) => <span className="studio-look-photo" key={variant} style={{ backgroundColor: design.cellColors[variant] }}>
        {photo && <img src={photo} alt="" />}
        <StickerDoodle pack={look.stickerPack} variant={variant} size={22} style={{ position: 'absolute', left: variant ? undefined : -9, right: variant ? -9 : undefined, top: -6 }} />
      </span>)}
      <span className="studio-look-signature">made with love</span>
    </span>
  )
}

export default function Customization({
  boothMode, photos, frameCount, layout, filter, frameDesign, stickerPack, caption, showDate,
  onLayoutChange, onFilterChange, onFrameDesignChange, onStickerPackChange,
  onLookChange, onCaptionChange, onShowDateChange, onRetakeSingle, onConfirm, onRetake,
}: CustomizationProps) {
  const [tab, setTab] = useState<EditorTab>('Looks')
  const [dateStr] = useState(() => new Date().toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  }).toUpperCase())
  const reducedMotion = useReducedMotion()
  const bakedPhotos = useBakedPhotos(photos, filter)
  const filterPreviews = useFilterPreviews(photos[0])
  const { viewportRef, contentRef, scale, height } = usePreviewScale(true, 0.45)
  const retakeDialogRef = useRef<HTMLDialogElement>(null)
  const inspectDialogRef = useRef<HTMLDialogElement>(null)
  const panelsRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([])
  const selectedLook = LOOKS.find((look) => look.frameDesign === frameDesign && look.stickerPack === stickerPack && look.filter === filter)

  const selectTab = (next: EditorTab) => {
    setTab(next)
    panelsRef.current?.scrollTo(0, 0)
  }
  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % TABS.length; break
      case 'ArrowLeft': next = (index + TABS.length - 1) % TABS.length; break
      case 'Home': next = 0; break
      case 'End': next = TABS.length - 1; break
      default: return
    }
    event.preventDefault()
    selectTab(TABS[next])
    tabsRef.current[next]?.focus()
  }
  const retakePhoto = (index: number) => {
    inspectDialogRef.current?.close()
    onRetakeSingle(index)
  }
  const stripProps = {
    photos: bakedPhotos ?? photos, boothMode, layout, filter, frameDesign, stickerPack,
    applyCssFilter: !bakedPhotos, dateStr, caption, showDate, onPhotoClick: retakePhoto,
  }

  return (
    <section className="app-screen customize-screen">
      <ScreenHeader title="A little more you." subtitle="Pick a look. Make it your own." />
      <div className="studio-layout">
        <div className="studio-preview">
          <div className="studio-preview-label"><Sparkles size={15} aria-hidden="true" /> your little masterpiece</div>
          <div ref={viewportRef} className="studio-preview-viewport" role="region" aria-label="Live strip preview. Scroll to see every photo." tabIndex={0}>
            <div className="studio-preview-canvas" style={{ '--preview-height': `${height}px` } as CSSProperties}>
              <div ref={contentRef} className="studio-preview-scale" data-compact-retakes={layout === 'vertical-strip' && scale < 0.45}
                style={{ width: layout === '2-column-grid' ? 420 : 280, transform: `translate(-50%, -50%) scale(${scale})`, '--preview-scale': scale } as CSSProperties}>
                <PhotoStrip {...stripProps} />
              </div>
            </div>
          </div>
          <button type="button" className="studio-inspect-button" onClick={() => inspectDialogRef.current?.showModal()}>
            <Maximize2 size={14} aria-hidden="true" /> Inspect & retake
          </button>
        </div>

        <div className="studio-panel">
          <div className="studio-panel-heading"><h2>Your scrapbook kit</h2><span aria-live="polite">{selectedLook?.label ?? 'Your own mix'}</span></div>
          <div className="studio-tabs" role="tablist" aria-label="Customize your strip">
            {TABS.map((name, index) => <button key={name} ref={(node) => { tabsRef.current[index] = node }}
              type="button" role="tab" id={`studio-tab-${name}`} aria-controls={`studio-panel-${name}`}
              aria-selected={tab === name} tabIndex={tab === name ? 0 : -1}
              onClick={() => selectTab(name)} onKeyDown={(event) => handleTabKey(event, index)}>{name}</button>)}
          </div>
          <div className="studio-panels" ref={panelsRef}>
            <section role="tabpanel" id="studio-panel-Looks" aria-labelledby="studio-tab-Looks" tabIndex={0} hidden={tab !== 'Looks'}>
              <p className="studio-panel-intro">A whole mood in one tap. Fine-tune it in the other tabs.</p>
              <div className="studio-look-grid">
                {LOOKS.map((look) => <button key={look.id} type="button" className="studio-choice studio-look-choice"
                  aria-label={look.label} aria-pressed={selectedLook?.id === look.id} onClick={() => onLookChange(look.id)}>
                  <LookPreview look={look} photo={filterPreviews?.images[look.filter]} />
                  <span className="studio-choice-copy"><strong>{look.label}</strong><small>{look.note}</small></span>
                  <SelectionMark selected={selectedLook?.id === look.id} />
                </button>)}
              </div>
            </section>

            <section role="tabpanel" id="studio-panel-Frame" aria-labelledby="studio-tab-Frame" tabIndex={0} hidden={tab !== 'Frame'}>
              <fieldset className="studio-group"><legend>Layout</legend><div className="studio-layout-choices">
                {LAYOUTS.map((option) => <button key={option.id} type="button" className="studio-choice studio-layout-choice"
                  aria-pressed={layout === option.id} onClick={() => onLayoutChange(option.id)}>
                  <span className="studio-layout-diagram" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${option.columns}, 1fr)` }}>
                    {Array.from({ length: frameCount }, (_, i) => <span key={i} />)}
                  </span>
                  <span>{option.label}</span><SelectionMark selected={layout === option.id} />
                </button>)}
              </div></fieldset>
              <fieldset className="studio-group"><legend>Paper color</legend><div className="studio-color-grid">
                {FRAME_DESIGN_ORDER.map((id) => <button key={id} type="button" className="studio-choice studio-color-choice"
                  aria-label={FRAME_DESIGNS[id].label} aria-pressed={frameDesign === id} onClick={() => onFrameDesignChange(id)}>
                  <span className="studio-paper-swatch" aria-hidden="true" style={{ backgroundColor: FRAME_DESIGNS[id].stripBg }} />
                  <span>{FRAME_DESIGNS[id].shortLabel}</span><SelectionMark selected={frameDesign === id} />
                </button>)}
              </div></fieldset>
              <div className="studio-caption-field">
                <label htmlFor="strip-caption">A little note <span id="strip-caption-count">optional · {caption.length} / {CAPTION_LIMIT}</span></label>
                <input id="strip-caption" type="text" value={caption} maxLength={CAPTION_LIMIT} placeholder="write a little note... ♡"
                  aria-describedby="strip-caption-count" onChange={(event) => onCaptionChange(event.target.value)} />
              </div>
              <label className="studio-date-toggle"><input type="checkbox" checked={showDate} onChange={(event) => onShowDateChange(event.target.checked)} /> Show date</label>
            </section>

            <section role="tabpanel" id="studio-panel-Stickers" aria-labelledby="studio-tab-Stickers" tabIndex={0} hidden={tab !== 'Stickers'}>
              <p className="studio-panel-intro">Little details for the paper edges.</p>
              <div className="studio-sticker-grid">
                {STICKER_PACK_ORDER.map((id) => <button key={id} type="button" className="studio-choice studio-sticker-choice"
                  aria-label={STICKER_PACKS[id].label} aria-pressed={stickerPack === id} title={STICKER_PACKS[id].description} onClick={() => onStickerPackChange(id)}>
                  <motion.span className="studio-sticker-sheet" key={`${id}-${stickerPack === id}`} aria-hidden="true"
                    initial={false} animate={stickerPack === id && !reducedMotion ? { scale: [1, 1.08, 1], rotate: [0, -3, 0] } : { scale: 1, rotate: 0 }} transition={{ duration: 0.22 }}>
                    {id === 'none' ? <span className="studio-no-stickers">Just the photos</span> : [0, 1, 2].map((variant) => <StickerDoodle key={variant} pack={id} variant={variant} size={29} />)}
                  </motion.span>
                  <span>{STICKER_PACKS[id].label}</span><SelectionMark selected={stickerPack === id} />
                </button>)}
              </div>
            </section>

            <section role="tabpanel" id="studio-panel-Filters" aria-labelledby="studio-tab-Filters" tabIndex={0} hidden={tab !== 'Filters'}>
              <p className="studio-panel-intro">Your first photo, seven ways.</p>
              <div className="studio-filter-grid">
                {FILTER_ORDER.map((id) => <button key={id} type="button" className="studio-choice studio-filter-choice"
                  aria-label={FILTERS[id].label} aria-pressed={filter === id} onClick={() => onFilterChange(id)}>
                  <span className="studio-filter-photo">
                    {filterPreviews?.images[id] ? <img src={filterPreviews.images[id]} alt="" /> : <small>{filterPreviews?.error ? 'Preview unavailable' : 'Developing…'}</small>}
                  </span>
                  <span>{FILTERS[id].label}</span><SelectionMark selected={filter === id} />
                </button>)}
              </div>
            </section>
          </div>
          <div className="studio-actions">
            <BrutalButton color="cream" size="sm" icon={RotateCcw} onClick={() => retakeDialogRef.current?.showModal()}>Retake all</BrutalButton>
            <BrutalButton color="rose" size="sm" icon={ArrowRight} onClick={onConfirm}>Finish my strip</BrutalButton>
          </div>
        </div>
      </div>

      <dialog ref={inspectDialogRef} className="studio-inspect-dialog" aria-labelledby="inspect-title">
        <div className="studio-inspect-heading"><h2 id="inspect-title">Your strip, up close</h2><button type="button" aria-label="Close strip preview" onClick={() => inspectDialogRef.current?.close()}><X size={22} /></button></div>
        <p>Tap a photo to retake just that moment.</p>
        <div className="studio-inspect-paper" style={{ maxWidth: layout === '2-column-grid' ? 420 : 280 }}><PhotoStrip {...stripProps} /></div>
      </dialog>
      <dialog ref={retakeDialogRef} className="studio-retake-dialog" aria-labelledby="retake-dialog-title" aria-describedby="retake-dialog-description">
        <h2 id="retake-dialog-title">Retake every photo?</h2>
        <p id="retake-dialog-description">This clears all {photos.length} photos and opens the camera for a fresh session.</p>
        <div className="studio-actions">
          <BrutalButton color="cream" size="sm" onClick={() => retakeDialogRef.current?.close()}>Cancel</BrutalButton>
          <BrutalButton color="rose" size="sm" icon={RotateCcw} onClick={() => { retakeDialogRef.current?.close(); onRetake() }}>Retake all photos</BrutalButton>
        </div>
      </dialog>
    </section>
  )
}
