import { useState, type CSSProperties } from 'react'
import {
  ArrowRight, Check, Columns2, Heart, Palette, RotateCcw, Rows3,
  Sparkles, Sticker, WandSparkles,
} from 'lucide-react'

import PhotoStrip from '../components/PhotoStrip'
import StickerDoodle from '../components/StickerDoodle'
import BrutalButton from '../components/ui/BrutalButton'
import ScreenHeader from '../components/ui/ScreenHeader'
import { usePreviewScale } from '../hooks/usePreviewScale'
import {
  FILTERS, FILTER_ORDER, FRAME_DESIGNS, FRAME_DESIGN_ORDER, LAYOUTS,
  STICKER_PACKS, STICKER_PACK_ORDER, type CustomizationProps,
} from '../types/photobooth'
import { useBakedPhotos } from '../utils/photoFilters'
import './Customization.css'

export default function Customization({
  boothMode, photos, frameCount, layout, filter, frameDesign, stickerPack,
  onLayoutChange, onFilterChange, onFrameDesignChange, onStickerPackChange,
  onRetakeSingle, onConfirm, onRetake,
}: CustomizationProps) {
  const [dateStr] = useState(() => new Date().toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  }).toUpperCase())
  const bakedPhotos = useBakedPhotos(photos, filter)
  const { viewportRef, contentRef, scale, height } = usePreviewScale()

  return (
    <section className="app-screen customize-screen">
      <ScreenHeader
        title="A little more you."
        subtitle="Pick a color. Add some happy little things."
        aside={<span className="doodle-pill bg-butter"><Heart size={15} aria-hidden="true" /> {frameCount} MOMENTS, ALL YOURS</span>}
      />

      <div className="studio-layout">
        <div className="studio-preview">
          <div className="studio-preview-label"><Sparkles size={16} aria-hidden="true" /> your little masterpiece</div>
          <div ref={viewportRef} className="studio-preview-viewport" style={{ '--preview-height': `${height}px` } as CSSProperties}>
            <div
              ref={contentRef}
              className="studio-preview-scale"
              style={{ width: layout === '2-column-grid' ? 420 : 280, transform: `translate(-50%, -50%) scale(${scale})` }}
            >
              <PhotoStrip
                photos={bakedPhotos ?? photos}
                boothMode={boothMode}
                layout={layout}
                filter={filter}
                frameDesign={frameDesign}
                stickerPack={stickerPack}
                applyCssFilter={!bakedPhotos}
                onPhotoClick={onRetakeSingle}
                dateStr={dateStr}
              />
            </div>
          </div>
          <p className="studio-preview-note"><RotateCcw size={13} aria-hidden="true" /> Tap any photo for a fresh take.</p>
        </div>

        <div className="studio-panel">
          <div className="studio-panel-heading"><Sticker size={21} aria-hidden="true" /><h2>The finishing touches</h2><span aria-hidden="true">✧</span></div>

          <fieldset className="studio-group">
            <legend><Columns2 size={15} aria-hidden="true" /> Layout</legend>
            <div className="studio-pills studio-layout-pills">
              {LAYOUTS.map((option) => {
                const Icon = option.columns === 1 ? Rows3 : Columns2
                return <button key={option.id} type="button" className="studio-pill" aria-pressed={layout === option.id} onClick={() => onLayoutChange(option.id)}><Icon size={15} aria-hidden="true" />{option.label}</button>
              })}
            </div>
          </fieldset>

          <fieldset className="studio-group">
            <legend><Palette size={15} aria-hidden="true" /> Strip color</legend>
            <div className="studio-pills studio-color-pills">
              {FRAME_DESIGN_ORDER.map((id) => {
                const design = FRAME_DESIGNS[id]
                return (
                  <button key={id} type="button" className="studio-pill studio-color-pill" aria-label={design.label} aria-pressed={frameDesign === id} onClick={() => onFrameDesignChange(id)}>
                    <span className="studio-swatch" aria-hidden="true" style={{ backgroundColor: design.stripBg, color: design.footerText }}>{frameDesign === id && <Check size={12} strokeWidth={3} />}</span>
                    {design.shortLabel}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="studio-group">
            <legend><Sticker size={15} aria-hidden="true" /> Stickers <span className="studio-legend-note">a tiny mood boost</span></legend>
            <div className="studio-pills studio-sticker-pills">
              {STICKER_PACK_ORDER.map((id) => {
                const pack = STICKER_PACKS[id]
                return <button key={id} type="button" className="studio-pill" aria-pressed={stickerPack === id} title={pack.description} onClick={() => onStickerPackChange(id)}><StickerDoodle pack={id} size={19} />{pack.label}</button>
              })}
            </div>
          </fieldset>

          <fieldset className="studio-group">
            <legend><WandSparkles size={15} aria-hidden="true" /> Filter</legend>
            <div className="studio-pills studio-filter-pills">
              {FILTER_ORDER.map((id) => <button key={id} type="button" className="studio-pill" aria-pressed={filter === id} onClick={() => onFilterChange(id)}>{FILTERS[id].label}</button>)}
            </div>
          </fieldset>

          <div className="studio-actions">
            <BrutalButton color="cream" size="sm" icon={RotateCcw} onClick={onRetake}>Retake all</BrutalButton>
            <BrutalButton color="rose" size="sm" icon={ArrowRight} onClick={onConfirm}>Print my strip</BrutalButton>
          </div>
        </div>
      </div>
    </section>
  )
}
