import { useCallback, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeftRight,
  Camera,
  CameraOff,
  LoaderCircle,
  RefreshCw,
  Heart,
  TriangleAlert,
  User,
  Users,
} from 'lucide-react'

import ScreenHeader from '../components/ui/ScreenHeader'
import BrutalButton from '../components/ui/BrutalButton'
import { BOOTH_MODES, type CameraScreenProps, type PhotoDataUrl } from '../types/photobooth'

/* ------------------------------------------------------------------ */
/*  Static config & helpers                                            */
/* ------------------------------------------------------------------ */

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
    <section className="app-screen camera-screen">
      <ScreenHeader
        title={isSelectiveRetake ? `One more, shot #${retakeIndex + 1}!` : 'Make yourself at home.'}
        subtitle={isSelectiveRetake ? 'A fresh take. Same happy memory.' : `${modeInfo.label} · ${frameCount} shots · ${countdownSeconds}s to pose`}
        onBack={handleBack}
        aside={<span className="doodle-pill bg-mint"><ModeIcon size={16} aria-hidden="true" /> {isSelectiveRetake ? 'QUICK RETAKE' : 'YOUR LITTLE PHOTO CORNER'}</span>}
      />

      <div className="camera-layout">
        <div className="camera-cabin">
          <div className="camera-cabin-label">
            <span><span className={`camera-indicator ${status === 'ready' ? 'is-ready' : ''}`} /> {status === 'ready' ? 'CAMERA IS READY' : 'SETTLE IN, LITTLE STAR'}</span>
            <span className="menu-handwriting">look here & smile ✧</span>
          </div>
          <div className="camera-stage">
            <div className="camera-viewfinder">
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
              {VIEWFINDER_CORNERS.map((position) => (
                <span key={position} aria-hidden="true" className={`camera-crop-mark ${position}`} />
              ))}
              {status === 'ready' && <span className="camera-live-badge"><span className="camera-indicator is-ready" /> LIVE</span>}
              {isCapturing && (
                <span className="camera-shot-badge">
                  {isSelectiveRetake ? `RETAKING #${retakeIndex + 1}` : `SHOT ${Math.min(currentShot + 1, frameCount)} / ${frameCount}`}
                </span>
              )}
              <div aria-live="assertive" className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                <AnimatePresence mode="popLayout">
                  {countdown !== null && (
                    <motion.span
                      key={`shot-${currentShot}-sec-${countdown}`}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                      className="camera-countdown font-display text-butter text-outline"
                    >{countdown}</motion.span>
                  )}
                </AnimatePresence>
              </div>
              {flashKey > 0 && (
                <motion.div key={`viewfinder-flash-${flashKey}`} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 bg-cream" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.45 }} />
              )}
              {status !== 'ready' && (
                <div className="camera-message" role={status === 'error' ? 'alert' : 'status'}>
                  {status === 'pending' ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" /> : <CameraOff aria-hidden="true" />}
                  <h2>{status === 'pending' ? 'Warming up the camera…' : status === 'error' ? 'A little camera hiccup' : 'Camera unavailable'}</h2>
                  <p>{status === 'pending' ? 'Allow camera access when your browser asks. Your seat is waiting!' : status === 'error' ? cameraError : 'Open Catabooth over HTTPS or localhost in a browser with camera support.'}</p>
                  {status === 'error' && <BrutalButton size="sm" color="butter" icon={RefreshCw} onClick={retryCamera}>Try Again</BrutalButton>}
                </div>
              )}
            </div>
          </div>
          {captureError && <p role="alert" className="camera-error"><TriangleAlert size={18} aria-hidden="true" /> {captureError}</p>}
          <div className="camera-controls">
            <button type="button" className="camera-mirror" onClick={() => setMirrored((value) => !value)} aria-pressed={mirrored}>
              <ArrowLeftRight size={18} aria-hidden="true" /> Mirror: {mirrored ? 'ON' : 'OFF'}
              <span className={mirrored ? 'bg-mint' : 'bg-sand'} aria-hidden="true"><span style={{ transform: mirrored ? 'translateX(14px)' : 'translateX(0)' }} /></span>
            </button>
            {!isCapturing ? (
              <BrutalButton color="rose" icon={Camera} onClick={startCapture} disabled={status !== 'ready'}>
                {isSelectiveRetake ? `RETAKE SHOT #${retakeIndex + 1}` : 'START CAPTURE'}
              </BrutalButton>
            ) : (
              <div role="status" className="camera-capturing">
                <span className="camera-indicator is-ready" />
                {isSelectiveRetake ? `RETAKING #${retakeIndex + 1}…` : `SAY CHEESE! (${capturedPhotos.length}/${frameCount})`}
              </div>
            )}
          </div>
        </div>

        <aside className="camera-photo-strip">
          <div className="camera-strip-heading"><h2>Your moments</h2><span>{capturedPhotos.length} / {frameCount}</span></div>
          <ol className="camera-thumbnail-grid" aria-label="Captured photos">
            {Array.from({ length: frameCount }, (_, i) => {
              const photo = capturedPhotos[i]
              const isRetakeTarget = isSelectiveRetake && i === retakeIndex
              const isActiveSlot = isCapturing && ((!photo && i === currentShot) || isRetakeTarget)
              return (
                <li key={i} className={`camera-thumbnail ${isActiveSlot ? 'is-active' : ''} ${isRetakeTarget ? 'is-retake' : ''}`} aria-current={isActiveSlot ? 'step' : undefined}>
                  {photo ? (
                    <motion.img src={photo} alt={`Captured shot ${i + 1}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`h-full w-full object-cover ${isRetakeTarget && isCapturing ? 'opacity-40' : ''}`} />
                  ) : <span><Camera size={18} aria-hidden="true" /><small>#{i + 1}</small></span>}
                  {isRetakeTarget && <span className="camera-retake-label">RETAKE</span>}
                </li>
              )
            })}
          </ol>
          <p className="camera-strip-note"><Heart size={19} aria-hidden="true" /> Little moments,<br />yours to keep.</p>
        </aside>
      </div>
      {flashKey > 0 && (
        <motion.div key={`screen-flash-${flashKey}`} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 bg-cream" initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }} />
      )}
    </section>
  )
}
