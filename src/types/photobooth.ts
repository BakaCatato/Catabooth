export type Screen = 'home' | 'frames' | 'camera' | 'customize' | 'result'

export type FrameCount = 2 | 4 | 6 | 8
export const FRAME_OPTIONS: readonly FrameCount[] = [2, 4, 6, 8]

export type LayoutId = 'vertical-strip' | 'horizontal-strip' | 'grid-2x2' | 'grid-2-col'

export interface LayoutOption {
  id: LayoutId
  label: string
  /** Frame counts this layout looks good with */
  supports: readonly FrameCount[]
}

export const LAYOUTS: readonly LayoutOption[] = [
  { id: 'vertical-strip', label: 'Vertical Strip', supports: [2, 4, 6, 8] },
  { id: 'horizontal-strip', label: 'Horizontal Strip', supports: [2, 4] },
  { id: 'grid-2x2', label: '2x2 Grid', supports: [4] },
  // 6 shots → 2x3, 8 shots → 2x4
  { id: 'grid-2-col', label: '2-Column Grid', supports: [6, 8] },
]

/** First layout compatible with the chosen number of shots */
export const getDefaultLayout = (count: FrameCount): LayoutId =>
  LAYOUTS.find((l) => l.supports.includes(count))?.id ?? 'vertical-strip'

export type FilterId = 'none' | 'grayscale' | 'vintage' | 'high-contrast'

export interface FilterOption {
  id: FilterId
  label: string
  /** Valid value for both CSS `filter` and CanvasRenderingContext2D.filter */
  css: string
}

export const FILTERS: Record<FilterId, FilterOption> = {
  none: { id: 'none', label: 'Original', css: 'none' },
  grayscale: { id: 'grayscale', label: 'Grayscale', css: 'grayscale(1) contrast(1.1)' },
  vintage: {
    id: 'vintage',
    label: 'Vintage',
    css: 'sepia(0.6) saturate(1.4) contrast(1.05) brightness(0.95) hue-rotate(-10deg)',
  },
  'high-contrast': {
    id: 'high-contrast',
    label: 'High Contrast',
    css: 'contrast(1.6) saturate(1.3)',
  },
}

/** Base64 data URL produced by react-webcam's getScreenshot() */
export type PhotoDataUrl = string

// ---------- Screen prop contracts (consumed by App.tsx) ----------

export interface HomeProps {
  onStart: () => void
}

export interface FrameSelectionProps {
  selected: FrameCount
  onSelect: (count: FrameCount) => void
  onBack: () => void
}

export interface CameraScreenProps {
  frameCount: FrameCount
  onComplete: (photos: PhotoDataUrl[]) => void
  onBack: () => void
}

export interface CustomizationProps {
  photos: PhotoDataUrl[]
  frameCount: FrameCount
  layout: LayoutId
  filter: FilterId
  onLayoutChange: (layout: LayoutId) => void
  onFilterChange: (filter: FilterId) => void
  onConfirm: () => void
  onRetake: () => void
}

export interface ResultProps {
  photos: PhotoDataUrl[]
  layout: LayoutId
  filter: FilterId
  onBack: () => void
  onRestart: () => void
}
