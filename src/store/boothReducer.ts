import {
  LAYOUTS,
  getDefaultLayout,
  type BoothMode,
  type FilterId,
  type FrameCount,
  type FrameDesignId,
  type LayoutId,
  type PhotoDataUrl,
  type Screen,
} from '../types/photobooth'

/* ------------------------------------------------------------------ */
/*  State & Action Types                                               */
/* ------------------------------------------------------------------ */

export interface BoothState {
  screen: Screen
  boothMode: BoothMode
  frameCount: FrameCount
  photos: PhotoDataUrl[]
  retakeIndex: number | null
  layout: LayoutId
  filter: FilterId
  frameDesign: FrameDesignId
}

export type BoothAction =
  | { type: 'START' }
  | { type: 'SET_MODE'; boothMode: BoothMode }
  | { type: 'SELECT_FRAMES'; frameCount: FrameCount }
  | { type: 'CAPTURE_COMPLETE'; photos: PhotoDataUrl[] }
  | { type: 'RETAKE_SINGLE'; index: number }
  | { type: 'SET_LAYOUT'; layout: LayoutId }
  | { type: 'SET_FILTER'; filter: FilterId }
  | { type: 'SET_FRAME_DESIGN'; frameDesign: FrameDesignId }
  | { type: 'CONFIRM_DESIGN' }
  | { type: 'RETAKE' }
  | { type: 'BACK' }
  | { type: 'RESTART' }

export const INITIAL_STATE: BoothState = {
  screen: 'home',
  boothMode: 'solo',
  frameCount: 4,
  photos: [],
  retakeIndex: null,
  layout: 'vertical-strip',
  filter: 'original',
  frameDesign: 'classic-white',
}

const PREVIOUS_SCREEN: Record<Screen, Screen> = {
  home: 'home',
  frames: 'home',
  camera: 'frames',
  customize: 'camera',
  result: 'customize',
}

/* ------------------------------------------------------------------ */
/*  Action Helpers                                                     */
/* ------------------------------------------------------------------ */

export function handleSelectFrames(state: BoothState, frameCount: FrameCount): BoothState {
  return {
    ...state,
    frameCount,
    layout: getDefaultLayout(frameCount),
    photos: [],
    retakeIndex: null,
    screen: 'camera',
  }
}

function handleSingleRetakeComplete(
  state: BoothState,
  retakeIndex: number,
  photos: PhotoDataUrl[],
): BoothState {
  const newShot = photos[0]
  if (!newShot) return state
  const updated = [...state.photos]
  updated[retakeIndex] = newShot
  return {
    ...state,
    photos: updated,
    retakeIndex: null,
    screen: 'customize',
  }
}

export function handleCaptureComplete(state: BoothState, photos: PhotoDataUrl[]): BoothState {
  if (state.retakeIndex !== null) {
    return handleSingleRetakeComplete(state, state.retakeIndex, photos)
  }
  if (photos.length !== state.frameCount) return state
  return {
    ...state,
    photos,
    retakeIndex: null,
    filter: 'original',
    screen: 'customize',
  }
}

export function handleRetakeSingle(state: BoothState, index: number): BoothState {
  if (index < 0 || index >= state.photos.length) return state
  return {
    ...state,
    retakeIndex: index,
    screen: 'camera',
  }
}

export function handleSetLayout(state: BoothState, layout: LayoutId): BoothState {
  const option = LAYOUTS.find((l) => l.id === layout)
  if (!option?.supports.includes(state.frameCount)) return state
  return { ...state, layout }
}

export function handleConfirmDesign(state: BoothState): BoothState {
  return state.photos.length > 0 ? { ...state, screen: 'result' } : state
}

export function handleBack(state: BoothState): BoothState {
  if (state.screen === 'camera' && state.retakeIndex !== null) {
    return {
      ...state,
      retakeIndex: null,
      screen: 'customize',
    }
  }

  const discardPhotos = state.screen === 'customize'
  return {
    ...state,
    screen: PREVIOUS_SCREEN[state.screen],
    photos: discardPhotos ? [] : state.photos,
    retakeIndex: null,
  }
}

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

type ActionHandlerMap = {
  [A in BoothAction as A['type']]: (state: BoothState, action: A) => BoothState
}

const ACTION_HANDLERS: ActionHandlerMap = {
  START: (state) => ({ ...state, screen: 'frames' }),
  SET_MODE: (state, action) => ({ ...state, boothMode: action.boothMode }),
  SELECT_FRAMES: (state, action) => handleSelectFrames(state, action.frameCount),
  CAPTURE_COMPLETE: (state, action) => handleCaptureComplete(state, action.photos),
  RETAKE_SINGLE: (state, action) => handleRetakeSingle(state, action.index),
  SET_LAYOUT: (state, action) => handleSetLayout(state, action.layout),
  SET_FILTER: (state, action) => ({ ...state, filter: action.filter }),
  SET_FRAME_DESIGN: (state, action) => ({ ...state, frameDesign: action.frameDesign }),
  CONFIRM_DESIGN: (state) => handleConfirmDesign(state),
  RETAKE: (state) => ({ ...state, photos: [], retakeIndex: null, screen: 'camera' }),
  BACK: (state) => handleBack(state),
  RESTART: () => INITIAL_STATE,
}

export function boothReducer(state: BoothState, action: BoothAction): BoothState {
  const handler = ACTION_HANDLERS[action.type] as (
    s: BoothState,
    a: BoothAction,
  ) => BoothState
  return handler(state, action)
}
