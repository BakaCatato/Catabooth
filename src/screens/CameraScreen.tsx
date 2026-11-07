import { useCallback, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowLeftRight,
  Camera,
  CameraOff,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
  User,
  Users,
} from 'lucide-react'

import { BOOTH_MODES, type CameraScreenProps, type PhotoDataUrl } from '../types/photobooth'

/* ------------------------------------------------------------------ */
/*  Static config & helpers                                            */
/* ------------------------------------------------------------------ */

const INK = '#0a0a0a'

type CameraStatus = 'pending' | 'ready' | 'error' | 'unsupported'

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: 'user',
  width: { ideal: 1280 },
  height: { ideal: 960 },
  aspectRatio: { ideal: 4 / 3 },
}

const VIEWFINDER_CORNERS = [
  'left-3 top-3 border-l-[6px] border-t-[6px]',
  'right-3 top-3 border-r-[6px] border-t-[6px]',
  'bottom-3 left-3 border-b-[6px] border-l-[6px]',
  'bottom-3 right-3 border-b-[6px] border-r-[6px]',
] as const

const hasMediaDevices = () =>
  typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'

/** Promise-based delay that rejects immediately when the session is aborted */
function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason)
    const onAbort = () => {
      clearTimeout(id)
      reject(signal.reason)
    }
    const id = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Generates an in-memory WAV data URL for a crisp mechanical camera shutter
 * click + flash capacitor pop so it can be played via standard HTML5 <audio>.
 */
function createShutterSoundDataUrl(): string {
  const sampleRate = 22050
  const numSamples = Math.floor(sampleRate * 0.14)
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, numSamples * 2, true)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    // First curtain snap at t = 0, second curtain snap at t = 0.045s
    const snap1 = Math.exp(-t * 95) * (Math.random() * 2 - 1)
    const snap2 = t > 0.045 ? Math.exp(-(t - 0.045) * 110) * (Math.random() * 2 - 1) * 0.85 : 0
    const tone = Math.sin(2 * Math.PI * 1150 * t) * Math.exp(-t * 75) * 0.45
    const sample = Math.max(-1, Math.min(1, (snap1 + snap2 + tone) * 0.9))
    view.setInt16(44 + i * 2, sample * 32767, true)
  }

  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return `data:audio/wav;base64,${btoa(binary)}`
}

let cachedShutterUrl: string | null = null

/** Plays a realistic camera shutter click sound when the flash triggers */
function playShutterSound() {
  try {
    if (!cachedShutterUrl) {
      cachedShutterUrl = createShutterSoundDataUrl()
    }
    const audio = new Audio(cachedShutterUrl)
    audio.volume = 0.85
    void audio.play().catch(() => undefined)
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}

function describeCameraError(err: string | DOMException): string {
  const name = typeof err === 'string' ? '' : err.name
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access was blocked. Allow camera permission in your browser address bar, then hit Try Again.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return "We couldn't find a camera connected to your device."
    case 'NotReadableError':
    case 'AbortError':
      return 'Your camera appears busy in another app or tab. Close it and hit Try Again.'
    default:
      return "The camera couldn't start. Check your browser permissions and hit Try Again."
  }
}

/* ------------------------------------------------------------------ */
/*  CameraScreen                                                       */
/* ------------------------------------------------------------------ */

export default function CameraScreen({
  boothMode,
  frameCount,
  retakeIndex = null,
  existingPhotos = [],
  onComplete,
  onBack,
}: CameraScreenProps) {
  const webcamRef = useRef<Webcam>(null)
  const abortRef = useRef<AbortController | null>(null)
  const autoRetakeStartedRef = useRef(false)

  const isSelectiveRetake = retakeIndex !== null
  const countdownSeconds = isSelectiveRetake ? 3 : boothMode === 'solo' ? 3 : 5
  const modeInfo = BOOTH_MODES[boothMode]
  const ModeIcon = boothMode === 'solo' ? User : Users

  const [status, setStatus] = useState<CameraStatus>(() =>
    hasMediaDevices() ? 'pending' : 'unsupported',
  )
  const [cameraError, setCameraError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [mirrored, setMirrored] = useState(true)

  const [isCapturing, setIsCapturing] = useState(false)
  const [currentShot, setCurrentShot] = useState(retakeIndex ?? 0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoDataUrl[]>(() =>
    isSelectiveRetake ? [...existingPhotos] : [],
  )
  const [flashKey, setFlashKey] = useState(0)
  const [captureError, setCaptureError] = useState('')

  // Abort any active capture loop on unmount
  useEffect(() => () => abortRef.current?.abort(), [])

  const handleUserMedia = useCallback(() => {
    setStatus('ready')
    setCameraError('')
  }, [])

  const handleUserMediaError = useCallback((err: string | DOMException) => {
    setStatus('error')
    setCameraError(describeCameraError(err))
  }, [])

  const retryCamera = () => {
    setStatus('pending')
    setCameraError('')
    setRetryKey((k) => k + 1)
  }

  const handleBack = () => {
    abortRef.current?.abort()
    onBack()
  }

  const startCapture = useCallback(async () => {
    if (isCapturing || status !== 'ready') return

    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller

    setCaptureError('')
    setIsCapturing(true)

    try {
      if (isSelectiveRetake && retakeIndex !== null) {
        // Selective retake: single 3s countdown for just the chosen shot index
        setCurrentShot(retakeIndex)

        for (let sec = 3; sec > 0; sec--) {
          setCountdown(sec)
          await sleep(1000, signal)
        }

        setCountdown(null)
        const screenshot = webcamRef.current?.getScreenshot()
        if (!screenshot) {
          throw new Error('Could not capture frame from webcam')
        }

        playShutterSound()
        setFlashKey((k) => k + 1)
        setCapturedPhotos((prev) => {
          const next = [...prev]
          next[retakeIndex] = screenshot
          return next
        })

        await sleep(350, signal)
        onComplete([screenshot])
        return
      }

      // Standard full-session capture loop
      const taken: PhotoDataUrl[] = []
      setCapturedPhotos([])

      for (let i = 0; i < frameCount; i++) {
        setCurrentShot(i)

        for (let sec = countdownSeconds; sec > 0; sec--) {
          setCountdown(sec)
          await sleep(1000, signal)
        }

        setCountdown(null)
        const screenshot = webcamRef.current?.getScreenshot()
        if (!screenshot) {
          throw new Error('Could not capture frame from webcam')
        }

        playShutterSound()
        taken.push(screenshot)
        setCapturedPhotos([...taken])
        setFlashKey((k) => k + 1)
      }

      await sleep(350, signal)
      onComplete(taken)
    } catch (err) {
      if (signal.aborted) return
      console.error('[photobooth] Capture failed', err)
      setIsCapturing(false)
      setCountdown(null)
      if (!isSelectiveRetake) setCapturedPhotos([])
      setCaptureError('Lost the camera feed during capture. Check your camera and try again.')
    }
  }, [countdownSeconds, frameCount, isCapturing, isSelectiveRetake, onComplete, retakeIndex, status])

  // Automatically start the 3s selective retake countdown as soon as the camera stream is ready
  useEffect(() => {
    if (isSelectiveRetake && status === 'ready' && !autoRetakeStartedRef.current) {
      autoRetakeStartedRef.current = true
      void startCapture()
    }
  }, [isSelectiveRetake, status, startCapture])

  return (
    <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 py-6 md:py-10">
      {/* ---------- Header ---------- */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            whileHover={{ rotate: -8, scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border-4 border-ink bg-white shadow-brutal-sm outline-none focus-visible:ring-4 focus-visible:ring-pop-yellow"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={3} />
          </motion.button>

          <div>
            <h1 className="font-display text-4xl leading-none tracking-wide text-white text-outline [text-shadow:4px_4px_0_#0a0a0a] sm:text-5xl md:text-6xl">
              {isSelectiveRetake ? `Retake Shot #${retakeIndex + 1}!` : 'Strike a Pose!'}
            </h1>
            <p className="mt-1.5 inline-block -rotate-1 rounded-md border-3 border-ink bg-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest md:text-sm">
              {isSelectiveRetake
                ? `Replacing Shot #${retakeIndex + 1} · 3s Timer`
                : `${modeInfo.label} · ${frameCount} Shots · ${countdownSeconds}s Timer`}
            </p>
          </div>
        </div>

        {isSelectiveRetake ? (
          <span className="inline-flex items-center gap-2 rounded-full border-4 border-ink bg-pop-yellow px-4 py-1.5 font-display text-xl tracking-wider text-ink shadow-brutal-sm">
            <RotateCcw className="h-5 w-5" strokeWidth={3} />
            QUICK RETAKE (3s)
          </span>
        ) : (
          <span
            className={`inline-flex items-center gap-2 rounded-full border-4 border-ink px-4 py-1.5 font-display text-xl tracking-wider shadow-brutal-sm ${
              boothMode === 'together' ? 'bg-pop-yellow text-ink' : 'bg-pop-cyan text-ink'
            }`}
          >
            <ModeIcon className="h-5 w-5" strokeWidth={3} />
            {modeInfo.label} ({countdownSeconds}s)
          </span>
        )}
      </header>

      {/* ---------- Main Booth Area ---------- */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        {/* Left: Viewfinder + Controls */}
        <div className="flex flex-col gap-5">
          {/* Comic-style viewfinder */}
          <div className="relative mx-auto aspect-4/3 w-full max-w-3xl overflow-hidden rounded-2xl border-[6px] border-ink bg-ink shadow-brutal-lg">
            {status !== 'unsupported' && (
              <Webcam
                key={retryKey}
                ref={webcamRef}
                audio={false}
                mirrored={mirrored}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.92}
                forceScreenshotSourceSize
                disablePictureInPicture
                videoConstraints={VIDEO_CONSTRAINTS}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {/* Comic crop-mark corners */}
            {VIEWFINDER_CORNERS.map((pos) => (
              <span
                key={pos}
                aria-hidden
                className={`pointer-events-none absolute z-10 h-10 w-10 border-white ${pos}`}
              />
            ))}

            {/* Top badges */}
            {status === 'ready' && (
              <span className="absolute left-16 top-4 z-10 flex items-center gap-1.5 rounded-md border-3 border-ink bg-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest">
                <motion.span
                  className="h-2.5 w-2.5 rounded-full bg-pop-magenta"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                LIVE
              </span>
            )}

            {isCapturing && (
              <span className="absolute right-16 top-4 z-10 rounded-md border-3 border-ink bg-pop-yellow px-3 py-0.5 font-display text-lg tracking-wider text-ink shadow-brutal-sm">
                {isSelectiveRetake
                  ? `RETAKING #${retakeIndex + 1}`
                  : `SHOT ${Math.min(currentShot + 1, frameCount)} / ${frameCount}`}
              </span>
            )}

            {/* Large bold countdown overlay */}
            <div
              aria-live="assertive"
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            >
              <AnimatePresence mode="popLayout">
                {countdown !== null && (
                  <motion.span
                    key={`shot-${currentShot}-sec-${countdown}`}
                    initial={{ scale: 2.2, opacity: 0, rotate: -18 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.4, opacity: 0, rotate: 18 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                    className="font-display text-[9rem] leading-none text-pop-yellow text-outline text-shadow-brutal md:text-[13rem]"
                  >
                    {countdown}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* White screen flash animation inside viewfinder */}
            {flashKey > 0 && (
              <motion.div
                key={`viewfinder-flash-${flashKey}`}
                aria-hidden
                className="pointer-events-none absolute inset-0 z-30 bg-white"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            )}

            {/* Camera loading / error overlays */}
            {status === 'pending' && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink p-6">
                <div className="max-w-sm -rotate-1 rounded-2xl border-[5px] border-ink bg-paper p-6 text-center shadow-[8px_8px_0_0_#fff0b5]">
                  <LoaderCircle className="mx-auto mb-3 h-12 w-12 animate-spin" strokeWidth={2.5} />
                  <h2 className="font-display text-3xl tracking-wide">Warming Up Camera…</h2>
                  <p className="mt-2 text-sm font-bold">
                    Please allow camera access when your browser prompts you.
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink p-6">
                <div className="max-w-sm -rotate-1 rounded-2xl border-[5px] border-ink bg-paper p-6 text-center shadow-[8px_8px_0_0_#fff0b5]">
                  <CameraOff className="mx-auto mb-3 h-12 w-12 text-pop-magenta" strokeWidth={2.5} />
                  <h2 className="font-display text-3xl tracking-wide">Camera Blocked!</h2>
                  <p className="mt-2 text-sm font-bold">{cameraError}</p>
                  <button
                    type="button"
                    onClick={retryCamera}
                    className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border-4 border-ink bg-pop-yellow px-4 py-2 font-display text-xl tracking-wider shadow-brutal-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
                  >
                    <RefreshCw className="h-5 w-5" strokeWidth={3} />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {status === 'unsupported' && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink p-6">
                <div className="max-w-sm -rotate-1 rounded-2xl border-[5px] border-ink bg-paper p-6 text-center shadow-[8px_8px_0_0_#fff0b5]">
                  <CameraOff className="mx-auto mb-3 h-12 w-12 text-pop-magenta" strokeWidth={2.5} />
                  <h2 className="font-display text-3xl tracking-wide">Camera Unavailable</h2>
                  <p className="mt-2 text-sm font-bold">
                    This browser cannot access a camera here. Open the app over HTTPS or localhost.
                  </p>
                </div>
              </div>
            )}
          </div>

          {captureError && (
            <p
              role="alert"
              className="mx-auto flex max-w-3xl items-center gap-2 rounded-xl border-4 border-ink bg-white px-4 py-2.5 text-sm font-bold shadow-brutal-sm"
            >
              <TriangleAlert className="h-5 w-5 shrink-0 text-pop-magenta" strokeWidth={3} />
              {captureError}
            </p>
          )}

          {/* Controls Bar */}
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-4 sm:justify-between">
            {/* Mirror-image toggle button */}
            <button
              type="button"
              onClick={() => setMirrored((m) => !m)}
              aria-pressed={mirrored}
              className="flex cursor-pointer items-center gap-3 rounded-xl border-4 border-ink bg-white px-4 py-2.5 font-bold uppercase tracking-wider shadow-brutal-sm outline-none transition-transform focus-visible:ring-4 focus-visible:ring-pop-yellow active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <ArrowLeftRight className="h-5 w-5" strokeWidth={3} />
              Mirror: {mirrored ? 'ON' : 'OFF'}
              <span
                className={`relative h-7 w-12 rounded-full border-3 border-ink transition-colors ${
                  mirrored ? 'bg-pop-green' : 'bg-paper'
                }`}
              >
                <motion.span
                  className="absolute top-[3px] h-4 w-4 rounded-full border-3 border-ink bg-white"
                  animate={{ left: mirrored ? 22 : 2 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                />
              </span>
            </button>

            {/* START CAPTURE button — hidden once capture starts */}
            {!isCapturing ? (
              <motion.button
                type="button"
                onClick={startCapture}
                disabled={status !== 'ready'}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border-[5px] border-ink bg-pop-yellow px-7 py-3.5 font-display text-3xl tracking-wider text-ink outline-none focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 md:px-10 md:text-4xl"
                initial={{ boxShadow: `8px 8px 0px 0px ${INK}` }}
                animate={{ x: 0, y: 0, boxShadow: `8px 8px 0px 0px ${INK}` }}
                whileHover={
                  status === 'ready'
                    ? { x: -2, y: -2, boxShadow: `10px 10px 0px 0px ${INK}` }
                    : undefined
                }
                whileTap={
                  status === 'ready'
                    ? { x: 8, y: 8, boxShadow: `0px 0px 0px 0px ${INK}` }
                    : undefined
                }
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              >
                <Camera className="h-7 w-7 md:h-8 md:w-8" strokeWidth={3} />
                {isSelectiveRetake ? `RETAKE SHOT #${retakeIndex + 1}` : 'START CAPTURE'}
              </motion.button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border-4 border-ink bg-pop-cyan px-5 py-2.5 font-display text-2xl tracking-wider text-ink shadow-brutal-sm">
                <motion.span
                  className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-pop-magenta"
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                />
                {isSelectiveRetake
                  ? `RETAKING SHOT #${retakeIndex + 1}...`
                  : `SAY CHEESE! (${capturedPhotos.length}/${frameCount})`}
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom: Visual strip of thumbnail previews */}
        <aside className="rounded-2xl border-[5px] border-ink bg-white p-4 shadow-brutal-lg">
          <div className="mb-3 flex items-baseline justify-between border-b-4 border-ink pb-2">
            <h2 className="font-display text-2xl tracking-wide">Photo Strip</h2>
            <span className="rounded-md border-2 border-ink bg-pop-yellow px-2 py-0.5 font-display text-lg">
              {isSelectiveRetake ? `Shot #${retakeIndex + 1}` : `${capturedPhotos.length} / ${frameCount}`}
            </span>
          </div>

          <ol className="grid grid-cols-4 gap-3 lg:grid-cols-2">
            {Array.from({ length: frameCount }, (_, i) => {
              const photo = capturedPhotos[i]
              const isRetakeTarget = isSelectiveRetake && i === retakeIndex
              const isActiveSlot = isCapturing && ((!photo && i === currentShot) || isRetakeTarget)

              return (
                <li
                  key={i}
                  className={`relative aspect-4/3 overflow-hidden rounded-lg border-4 border-ink ${
                    isRetakeTarget
                      ? 'ring-4 ring-pop-magenta bg-pop-yellow/50'
                      : photo
                        ? 'bg-ink shadow-brutal-sm'
                        : isActiveSlot
                          ? 'border-dashed bg-pop-yellow/40'
                          : 'border-dashed bg-paper'
                  }`}
                >
                  {photo ? (
                    <motion.img
                      src={photo}
                      alt={`Captured shot ${i + 1}`}
                      initial={{ scale: 1.5, opacity: 0, rotate: -6 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                      className={`h-full w-full object-cover ${isRetakeTarget && isCapturing ? 'opacity-40' : ''}`}
                    />
                  ) : (
                    <motion.span
                      className="absolute inset-0 flex items-center justify-center font-display text-2xl text-ink/70"
                      animate={isActiveSlot ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      transition={isActiveSlot ? { duration: 0.9, repeat: Infinity } : undefined}
                    >
                      #{i + 1}
                    </motion.span>
                  )}

                  {isRetakeTarget && (
                    <span className="absolute bottom-1 left-1 right-1 rounded border-2 border-ink bg-pop-yellow px-1 text-center font-display text-xs tracking-wider text-ink">
                      RETAKING
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </aside>
      </div>

      {/* Full-screen white flash overlay on each capture */}
      {flashKey > 0 && (
        <motion.div
          key={`screen-flash-${flashKey}`}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 bg-white"
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}
    </section>
  )
}
