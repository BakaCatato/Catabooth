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

export type FrameDesignId = 'cream' | 'pink' | 'green' | 'blue' | 'yellow' | 'purple' | 'maroon' | 'dark'

export interface FrameDesignOption {
  id: FrameDesignId
  label: string
  shortLabel: string
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
}

function stripColor(
  id: FrameDesignId,
  label: string,
  shortLabel: string,
  stripBg: string,
  headerBg: string,
  dark = false,
): FrameDesignOption {
  return {
    id, label, shortLabel, stripBg, headerBg,
    stripBorder: '3px solid #2a211d',
    headerText: '#2a211d',
    headerShadow: '1px 1px 0 #fffaf1',
    badgeBg: '#fffaf1',
    badgeText: '#2a211d',
    footerText: dark ? '#fffaf1' : '#2a211d',
    cellBorder: '2px solid #2a211d',
    cellColors: ['#f9efe2', '#f3d3d9', '#dcebe1', '#f7e8b8'],
  }
}

/** Export artwork uses hex colors so html2canvas never encounters CSS color functions. */
export const FRAME_DESIGNS: Record<FrameDesignId, FrameDesignOption> = {
  cream: stripColor('cream', 'Warm Cream', 'Cream', '#fffaf1', '#f7d97e'),
  pink: stripColor('pink', 'Soft Pastel Pink', 'Pink', '#f6ccd6', '#f3a6b8'),
  green: stripColor('green', 'Matcha Green', 'Green', '#c9dfbf', '#b1ca9e'),
  blue: stripColor('blue', 'Baby Blue', 'Blue', '#cce2f0', '#adcde3'),
  yellow: stripColor('yellow', 'Butter Yellow', 'Yellow', '#f8e6a7', '#f7d97e'),
  purple: stripColor('purple', 'Lavender', 'Purple', '#dfd2ed', '#c9b6e0'),
  maroon: stripColor('maroon', 'Retro Maroon', 'Maroon', '#784251', '#f0bfcc', true),
  dark: stripColor('dark', 'Cozy Espresso / Ink', 'Dark', '#382c28', '#d9c5b3', true),
}

export const FRAME_DESIGN_ORDER: readonly FrameDesignId[] = [
  'cream', 'pink', 'green', 'blue', 'yellow', 'purple', 'maroon', 'dark',
]

/* ------------------------------------------------------------------ */
/*  Sticker packs                                                      */
/* ------------------------------------------------------------------ */

export type StickerPackId =
  | 'none' | 'cats' | 'girlypop' | 'cute' | 'y2k'
  | 'shinchan' | 'matcha' | 'cyber' | 'coquette' | 'scribbles'

export interface StickerPackOption {
  id: StickerPackId
  label: string
  description: string
}

export const STICKER_PACKS: Record<StickerPackId, StickerPackOption> = {
  none: { id: 'none', label: 'None', description: 'No stickers, just your little moments.' },
  cats: { id: 'cats', label: 'Cats', description: 'Cozy cats, tiny paws, and sleepy cuddles.' },
  girlypop: { id: 'girlypop', label: 'Girlypop', description: 'Pink bows, flowing ribbons, and little hearts.' },
  cute: { id: 'cute', label: 'Cute', description: 'Bear ears, pastel flowers, and rosy cheeks.' },
  y2k: { id: 'y2k', label: 'Y2K', description: 'Chrome stars, dreamy sparkles, and butterflies.' },
  shinchan: { id: 'shinchan', label: 'Shinchan', description: 'Quirky doodle brows, action lines, and cheeky stars.' },
  matcha: { id: 'matcha', label: 'Matcha', description: 'A matcha latte, a warm croissant, and fresh leaves.' },
  cyber: { id: 'cyber', label: 'Cyber', description: 'Retro pixel hearts, gamepads, and arcade sparks.' },
  coquette: { id: 'coquette', label: 'Coquette', description: 'Cherry blossoms, pearls, and a little lace bow.' },
  scribbles: { id: 'scribbles', label: 'Scribbles', description: 'Hand-drawn arrows, crowns, and a cutie note.' },
}

export const STICKER_PACK_ORDER: readonly StickerPackId[] = [
  'none', 'cats', 'girlypop', 'cute', 'y2k',
  'shinchan', 'matcha', 'cyber', 'coquette', 'scribbles',
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
  stickerPack: StickerPackId
  onLayoutChange: (layout: LayoutId) => void
  onFilterChange: (filter: FilterId) => void
  onFrameDesignChange: (design: FrameDesignId) => void
  onStickerPackChange: (pack: StickerPackId) => void
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
  stickerPack: StickerPackId
  onBack: () => void
  onRestart: () => void
}
