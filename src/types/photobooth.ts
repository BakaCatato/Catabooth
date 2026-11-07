export type Screen = 'home' | 'frames' | 'camera' | 'customize' | 'result'

export type BoothMode = 'solo' | 'together'

export interface BoothModeOption {
  id: BoothMode
  label: string
  subtitle: string
  /** Seconds counted down before every shot */
  countdown: number
}

export const BOOTH_MODES: Record<BoothMode, BoothModeOption> = {
  solo: { id: 'solo', label: 'JUST ME', subtitle: 'Solo Session', countdown: 3 },
  together: { id: 'together', label: 'TOGETHER', subtitle: 'Group Session', countdown: 5 },
}

export type FrameCount = 2 | 4 | 6 | 8
export const FRAME_OPTIONS: readonly FrameCount[] = [2, 4, 6, 8]

export type LayoutId = 'vertical-strip' | '2-column-grid'

export interface LayoutOption {
  id: LayoutId
  label: string
  columns: 1 | 2
  /** Frame counts this layout looks good with */
  supports: readonly FrameCount[]
}

export const LAYOUTS: readonly LayoutOption[] = [
  { id: 'vertical-strip', label: 'Vertical Strip', columns: 1, supports: [2, 4, 6, 8] },
  { id: '2-column-grid', label: '2-Column Grid', columns: 2, supports: [2, 4, 6, 8] },
]

/** Default layout for the chosen number of shots */
export const getDefaultLayout = (count: FrameCount): LayoutId =>
  count >= 6 ? '2-column-grid' : 'vertical-strip'

/* ------------------------------------------------------------------ */
/*  Frame Designs                                                      */
/* ------------------------------------------------------------------ */

export type FrameDesignId = 'classic-white' | 'cute-bear' | 'y2k-cyber' | 'dark-mode'

export interface FrameDesignOption {
  id: FrameDesignId
  label: string
  stripBg: string
  stripBorder: string
  headerBg: string
  headerText: string
  headerShadow: string
  badgeBg: string
  badgeText: string
  footerText: string
  cellBorder: string
  cellColors: readonly string[]
  /** Optional decorative motif label in header */
  motif?: string
}

export const FRAME_DESIGNS: Record<FrameDesignId, FrameDesignOption> = {
  'classic-white': {
    id: 'classic-white',
    label: 'Classic White',
    stripBg: '#ffffff',
    stripBorder: '6px solid #0a0a0a',
    headerBg: '#ff2bd6',
    headerText: '#ffffff',
    headerShadow: '3px 3px 0 #0a0a0a',
    badgeBg: '#ffe600',
    badgeText: '#0a0a0a',
    footerText: '#0a0a0a',
    cellBorder: '4px solid #0a0a0a',
    cellColors: ['#00e5ff', '#ffe600', '#39ff14', '#ff2bd6'],
  },
  'cute-bear': {
    id: 'cute-bear',
    label: 'Cute Bear (Brown/Pink accents)',
    stripBg: '#fce4ec',
    stripBorder: '6px solid #5d4037',
    headerBg: '#8d6e63',
    headerText: '#fff8e7',
    headerShadow: '3px 3px 0 #3e2723',
    badgeBg: '#f48fb1',
    badgeText: '#3e2723',
    footerText: '#4e342e',
    cellBorder: '4px solid #5d4037',
    cellColors: ['#f8bbd0', '#d7ccc8', '#ffe0b2', '#f48fb1'],
    motif: 'ʕ•ᴥ•ʔ',
  },
  'y2k-cyber': {
    id: 'y2k-cyber',
    label: 'Y2K Cyber (Neon Green/Black)',
    stripBg: '#0a0a0a',
    stripBorder: '6px solid #39ff14',
    headerBg: '#39ff14',
    headerText: '#0a0a0a',
    headerShadow: '2px 2px 0 #ffffff',
    badgeBg: '#00e5ff',
    badgeText: '#0a0a0a',
    footerText: '#39ff14',
    cellBorder: '4px solid #39ff14',
    cellColors: ['#39ff14', '#00e5ff', '#ff2bd6', '#ffe600'],
    motif: '✦ Y2K 2000 ✦',
  },
  'dark-mode': {
    id: 'dark-mode',
    label: 'Dark Mode',
    stripBg: '#18181b',
    stripBorder: '6px solid #0a0a0a',
    headerBg: '#27272a',
    headerText: '#ffe600',
    headerShadow: '3px 3px 0 #0a0a0a',
    badgeBg: '#ff2bd6',
    badgeText: '#ffffff',
    footerText: '#e4e4e7',
    cellBorder: '4px solid #3f3f46',
    cellColors: ['#27272a', '#3f3f46', '#27272a', '#3f3f46'],
  },
}

export const FRAME_DESIGN_ORDER: readonly FrameDesignId[] = [
  'classic-white',
  'cute-bear',
  'y2k-cyber',
  'dark-mode',
]

/* ------------------------------------------------------------------ */
/*  Filters                                                            */
/* ------------------------------------------------------------------ */

export type FilterId =
  | 'original'
  | 'grayscale'
  | 'vintage'
  | 'high-contrast'
  | 'sepia'
  | 'invert'
  | 'pixelate'

export interface FilterOption {
  id: FilterId
  label: string
  /** Valid value for both CSS `filter` and CanvasRenderingContext2D.filter */
  css: string
  /** Downscale factor for pixelation */
  pixelSize?: number
}

export const FILTERS: Record<FilterId, FilterOption> = {
  original: { id: 'original', label: 'Original', css: 'none' },
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
  sepia: {
    id: 'sepia',
    label: 'Sepia',
    css: 'sepia(1) contrast(1.08)',
  },
  invert: {
    id: 'invert',
    label: 'Invert',
    css: 'invert(1)',
  },
  pixelate: {
    id: 'pixelate',
    label: 'Pixelate',
    css: 'contrast(1.15) saturate(1.2)',
    pixelSize: 10,
  },
}

export const FILTER_ORDER: readonly FilterId[] = [
  'original',
  'grayscale',
  'vintage',
  'high-contrast',
  'sepia',
  'invert',
  'pixelate',
]

/** Base64 data URL produced by react-webcam's getScreenshot() */
export type PhotoDataUrl = string

// ---------- Screen prop contracts (consumed by App.tsx) ----------

export interface HomeProps {
  onStart: () => void
}

export interface FrameSelectionProps {
  boothMode: BoothMode
  selected: FrameCount
  onSelectMode: (mode: BoothMode) => void
  onSelect: (count: FrameCount) => void
  onBack: () => void
}

export interface CameraScreenProps {
  boothMode: BoothMode
  frameCount: FrameCount
  /** When non-null, CameraScreen runs a single 3s countdown and returns [newPhoto] */
  retakeIndex?: number | null
  existingPhotos?: readonly PhotoDataUrl[]
  onComplete: (photos: PhotoDataUrl[]) => void
  onBack: () => void
}

export interface CustomizationProps {
  boothMode: BoothMode
  photos: PhotoDataUrl[]
  frameCount: FrameCount
  layout: LayoutId
  filter: FilterId
  frameDesign: FrameDesignId
  onLayoutChange: (layout: LayoutId) => void
  onFilterChange: (filter: FilterId) => void
  onFrameDesignChange: (design: FrameDesignId) => void
  onRetakeSingle: (index: number) => void
  onConfirm: () => void
  onRetake: () => void
}

export interface ResultProps {
  boothMode: BoothMode
  photos: PhotoDataUrl[]
  layout: LayoutId
  filter: FilterId
  frameDesign: FrameDesignId
  onBack: () => void
  onRestart: () => void
}
