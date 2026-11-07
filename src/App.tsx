import { useEffect, useMemo, useReducer } from 'react'
import { AnimatePresence, MotionConfig, motion, type Variants } from 'framer-motion'

import HalftoneBackground from './components/ui/HalftoneBackground'
import Home from './screens/Home'
import FrameSelection from './screens/FrameSelection'
import CameraScreen from './screens/CameraScreen'
import Customization from './screens/Customization'
import Result from './screens/Result'
import { INITIAL_STATE, boothReducer } from './store/boothReducer'
import type {
  BoothMode,
  FilterId,
  FrameCount,
  FrameDesignId,
  LayoutId,
  PhotoDataUrl,
  Screen,
} from './types/photobooth'

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
  const { screen, boothMode, frameCount, photos, retakeIndex, layout, filter, frameDesign } = state

  // `dispatch` is stable, so these handlers never change identity
  const actions = useMemo(
    () => ({
      start: () => dispatch({ type: 'START' }),
      selectMode: (mode: BoothMode) => dispatch({ type: 'SET_MODE', boothMode: mode }),
      selectFrames: (count: FrameCount) => dispatch({ type: 'SELECT_FRAMES', frameCount: count }),
      completeCapture: (shots: PhotoDataUrl[]) =>
        dispatch({ type: 'CAPTURE_COMPLETE', photos: shots }),
      retakeSingle: (index: number) => dispatch({ type: 'RETAKE_SINGLE', index }),
      setLayout: (id: LayoutId) => dispatch({ type: 'SET_LAYOUT', layout: id }),
      setFilter: (id: FilterId) => dispatch({ type: 'SET_FILTER', filter: id }),
      setFrameDesign: (design: FrameDesignId) =>
        dispatch({ type: 'SET_FRAME_DESIGN', frameDesign: design }),
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
            boothMode={boothMode}
            selected={frameCount}
            onSelectMode={actions.selectMode}
            onSelect={actions.selectFrames}
            onBack={actions.back}
          />
        )

      case 'camera':
        return (
          <CameraScreen
            boothMode={boothMode}
            frameCount={frameCount}
            retakeIndex={retakeIndex}
            existingPhotos={photos}
            onComplete={actions.completeCapture}
            onBack={actions.back}
          />
        )

      case 'customize':
        return (
          <Customization
            boothMode={boothMode}
            photos={photos}
            frameCount={frameCount}
            layout={layout}
            filter={filter}
            frameDesign={frameDesign}
            onLayoutChange={actions.setLayout}
            onFilterChange={actions.setFilter}
            onFrameDesignChange={actions.setFrameDesign}
            onRetakeSingle={actions.retakeSingle}
            onConfirm={actions.confirmDesign}
            onRetake={actions.retake}
          />
        )

      case 'result':
        return (
          <Result
            boothMode={boothMode}
            photos={photos}
            layout={layout}
            filter={filter}
            frameDesign={frameDesign}
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
