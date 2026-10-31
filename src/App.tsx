import { useEffect, useMemo, useReducer } from 'react'
import { AnimatePresence, MotionConfig, motion, type Variants } from 'framer-motion'

import HalftoneBackground from './components/ui/HalftoneBackground'
import Home from './screens/Home'
import FrameSelection from './screens/FrameSelection'
import CameraScreen from './screens/CameraScreen'
import Customization from './screens/Customization'
import Result from './screens/Result'
import {
  LAYOUTS,
  getDefaultLayout,
  type FilterId,
  type FrameCount,
  type LayoutId,
  type PhotoDataUrl,
  type Screen,
} from './types/photobooth'

/* ------------------------------------------------------------------ */
/*  State machine                                                      */
/* ------------------------------------------------------------------ */

interface BoothState {
  screen: Screen
  frameCount: FrameCount
  photos: PhotoDataUrl[]
  layout: LayoutId
  filter: FilterId
}

type BoothAction =
  | { type: 'START' }
  | { type: 'SELECT_FRAMES'; frameCount: FrameCount }
  | { type: 'CAPTURE_COMPLETE'; photos: PhotoDataUrl[] }
  | { type: 'SET_LAYOUT'; layout: LayoutId }
  | { type: 'SET_FILTER'; filter: FilterId }
  | { type: 'CONFIRM_DESIGN' }
  | { type: 'RETAKE' }
  | { type: 'BACK' }
  | { type: 'RESTART' }

const INITIAL_STATE: BoothState = {
  screen: 'home',
  frameCount: 4,
  photos: [],
  layout: 'vertical-strip',
  filter: 'none',
}

const PREVIOUS_SCREEN: Record<Screen, Screen> = {
  home: 'home',
  frames: 'home',
  camera: 'frames',
  customize: 'camera',
  result: 'customize',
}

function boothReducer(state: BoothState, action: BoothAction): BoothState {
  switch (action.type) {
    case 'START':
      return { ...state, screen: 'frames' }

    case 'SELECT_FRAMES':
      return {
        ...state,
        frameCount: action.frameCount,
        layout: getDefaultLayout(action.frameCount),
        photos: [],
        screen: 'camera',
      }

    case 'CAPTURE_COMPLETE':
      // Guard: never advance with an incomplete set of shots
      if (action.photos.length !== state.frameCount) return state
      return { ...state, photos: action.photos, filter: 'none', screen: 'customize' }

    case 'SET_LAYOUT': {
      const option = LAYOUTS.find((l) => l.id === action.layout)
      if (!option?.supports.includes(state.frameCount)) return state
      return { ...state, layout: action.layout }
    }

    case 'SET_FILTER':
      return { ...state, filter: action.filter }

    case 'CONFIRM_DESIGN':
      return state.photos.length > 0 ? { ...state, screen: 'result' } : state

    case 'RETAKE':
      return { ...state, photos: [], screen: 'camera' }

    case 'BACK': {
      // Going back from Customize means the shots are discarded → retake
      const discardPhotos = state.screen === 'customize'
      return {
        ...state,
        screen: PREVIOUS_SCREEN[state.screen],
        photos: discardPhotos ? [] : state.photos,
      }
    }

    case 'RESTART':
      return INITIAL_STATE

    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Visual config                                                      */
/* ------------------------------------------------------------------ */

/** Backdrop color behind each screen (HEX for html2canvas safety) */
const SCREEN_BACKDROP: Record<Screen, string> = {
  home: '#00e5ff',
  frames: '#ffe600',
  camera: '#ff2bd6',
  customize: '#39ff14',
  result: '#00e5ff',
}

/** Comic "panel slam" transition between screens */
const screenVariants: Variants = {
  initial: { opacity: 0, scale: 0.9, rotate: -2, y: 60 },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
  exit: {
    opacity: 0,
    scale: 1.05,
    rotate: 2,
    y: -40,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [state, dispatch] = useReducer(boothReducer, INITIAL_STATE)
  const { screen, frameCount, photos, layout, filter } = state

  // `dispatch` is stable, so these handlers never change identity
  const actions = useMemo(
    () => ({
      start: () => dispatch({ type: 'START' }),
      selectFrames: (count: FrameCount) => dispatch({ type: 'SELECT_FRAMES', frameCount: count }),
      completeCapture: (shots: PhotoDataUrl[]) =>
        dispatch({ type: 'CAPTURE_COMPLETE', photos: shots }),
      setLayout: (id: LayoutId) => dispatch({ type: 'SET_LAYOUT', layout: id }),
      setFilter: (id: FilterId) => dispatch({ type: 'SET_FILTER', filter: id }),
      confirmDesign: () => dispatch({ type: 'CONFIRM_DESIGN' }),
      retake: () => dispatch({ type: 'RETAKE' }),
      back: () => dispatch({ type: 'BACK' }),
      restart: () => dispatch({ type: 'RESTART' }),
    }),
    [],
  )

  // Warn before a refresh/close wipes un-downloaded photos
  const hasUnsavedPhotos = photos.length > 0
  useEffect(() => {
    if (!hasUnsavedPhotos) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedPhotos])

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <Home onStart={actions.start} />

      case 'frames':
        return (
          <FrameSelection
            selected={frameCount}
            onSelect={actions.selectFrames}
            onBack={actions.back}
          />
        )

      case 'camera':
        return (
          <CameraScreen
            frameCount={frameCount}
            onComplete={actions.completeCapture}
            onBack={actions.back}
          />
        )

      case 'customize':
        return (
          <Customization
            photos={photos}
            frameCount={frameCount}
            layout={layout}
            filter={filter}
            onLayoutChange={actions.setLayout}
            onFilterChange={actions.setFilter}
            onConfirm={actions.confirmDesign}
            onRetake={actions.retake}
          />
        )

      case 'result':
        return (
          <Result
            photos={photos}
            layout={layout}
            filter={filter}
            onBack={actions.back}
            onRestart={actions.restart}
          />
        )

      default: {
        const exhaustive: never = screen
        return exhaustive
      }
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate min-h-dvh overflow-x-hidden font-body text-ink">
        {/* Persistent animated backdrop — color morphs per screen */}
        <motion.div
          aria-hidden
          className="fixed inset-0 -z-10"
          initial={false}
          animate={{ backgroundColor: SCREEN_BACKDROP[screen] }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <HalftoneBackground dotColor="rgba(10,10,10,0.14)" size={26} dotRadius={3} duration={7} />
        </motion.div>

        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
          <motion.main
            key={screen}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-dvh origin-center"
          >
            {renderScreen()}
          </motion.main>
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
