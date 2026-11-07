import { useEffect, useMemo, useReducer } from 'react'
import { AnimatePresence, MotionConfig, motion, type Variants } from 'framer-motion'

import MallArcadeBackground from './components/ui/MallArcadeBackground'
import './screens/BoothScreens.css'
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
  StickerPackId,
} from './types/photobooth'

/* ------------------------------------------------------------------ */
/*  Visual config                                                      */
/* ------------------------------------------------------------------ */

/** Backdrop color behind each screen (HEX for html2canvas safety) */
const SCREEN_BACKDROP: Record<Screen, string> = {
  home: '#fbf4eb',
  frames: '#fbf4eb',
  camera: '#fbf4eb',
  customize: '#fbf4eb',
  result: '#fbf4eb',
}

/** A gentle page change within the same illustrated mall corner. */
const screenVariants: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 22 },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [state, dispatch] = useReducer(boothReducer, INITIAL_STATE)
  const { screen, boothMode, frameCount, photos, retakeIndex, layout, filter, frameDesign, stickerPack } = state

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
      setStickerPack: (pack: StickerPackId) =>
        dispatch({ type: 'SET_STICKER_PACK', stickerPack: pack }),
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
            stickerPack={stickerPack}
            onLayoutChange={actions.setLayout}
            onFilterChange={actions.setFilter}
            onFrameDesignChange={actions.setFrameDesign}
            onStickerPackChange={actions.setStickerPack}
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
            stickerPack={stickerPack}
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
      <div className="app-shell relative isolate min-h-dvh overflow-x-hidden overflow-y-auto font-body text-ink md:h-dvh md:max-h-dvh md:overflow-hidden">
        {/* One continuous mall scene behind every screen. */}
        <motion.div
          aria-hidden
          className="absolute inset-0 -z-10"
          initial={false}
          animate={{ backgroundColor: SCREEN_BACKDROP[screen] }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <MallArcadeBackground />
        </motion.div>

        <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
          <motion.main
            key={screen}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="mall-content min-h-dvh origin-center md:h-dvh md:max-h-dvh md:overflow-hidden"
            data-screen={screen}
          >
            {renderScreen()}
          </motion.main>
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
