import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  CircleCheck,
  Download,
  LoaderCircle,
  Mail,
  RotateCcw,
  Send,
  TriangleAlert,
} from 'lucide-react'

import PhotoStrip from '../components/PhotoStrip'
import { FILTERS, FRAME_DESIGNS, type ResultProps } from '../types/photobooth'
import { bakeFilteredPhotos, useBakedPhotos } from '../utils/photoFilters'

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const INK = '#0a0a0a'
const PRINT_DURATION_SEC = 2.8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const formatDateStr = () =>
  new Date()
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .toUpperCase()

/* ------------------------------------------------------------------ */
/*  Result screen                                                      */
/* ------------------------------------------------------------------ */

export default function Result({
  boothMode,
  photos,
  layout,
  filter,
  frameDesign,
  onBack,
  onRestart,
}: ResultProps) {
  const [dateStr] = useState(formatDateStr)
  const [isPrinting, setIsPrinting] = useState(true)

  const stripExportRef = useRef<HTMLDivElement>(null)
  const bakedPhotos = useBakedPhotos(photos, filter)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [emailFeedback, setEmailFeedback] = useState('')

  const stripWidth = layout === '2-column-grid' ? 420 : 280
  const design = FRAME_DESIGNS[frameDesign]

  // Fallback timer in case reduced motion skips the animation callback
  useEffect(() => {
    if (!isPrinting) return
    const timer = setTimeout(() => setIsPrinting(false), (PRINT_DURATION_SEC + 0.5) * 1000)
    return () => clearTimeout(timer)
  }, [isPrinting])

  const handleSaveToGallery = async () => {
    const node = stripExportRef.current
    if (!node || saveState === 'saving') return

    setSaveState('saving')
    try {
      if (!bakedPhotos) {
        await bakeFilteredPhotos(photos, filter)
      }

      const [{ default: html2canvas }] = await Promise.all([
        import('html2canvas'),
        document.fonts?.ready,
      ])

      const canvas = await html2canvas(node, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: design.stripBg,
        scale: Math.max(2, window.devicePixelRatio || 1),
        logging: false,
      })

      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `pop-booth-${Date.now()}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      link.remove()

      setSaveState('saved')
    } catch (err) {
      console.error('[photobooth] Failed to export photo strip', err)
      setSaveState('error')
    }
  }

  const handleSendEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEmailState('error')
      setEmailFeedback('Please enter a valid email address!')
      return
    }

    setEmailState('sending')
    setEmailFeedback('')

    // Simulate a 2-second loading state (will connect to Hono backend next)
    await new Promise<void>((resolve) => setTimeout(resolve, 2000))

    setEmailState('sent')
    setEmailFeedback(`Boom! Strip sent to ${trimmed}!`)
  }

  return (
    <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-6 px-4 py-6 md:py-10">
      {/* ---------- Header ---------- */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            onClick={onBack}
            aria-label="Go back to Customize"
            whileHover={{ rotate: -8, scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border-4 border-ink bg-white shadow-brutal-sm outline-none focus-visible:ring-4 focus-visible:ring-pop-yellow"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={3} />
          </motion.button>

          <div>
            <h1 className="font-display text-4xl leading-none tracking-wide text-white text-outline [text-shadow:4px_4px_0_#0a0a0a] sm:text-5xl md:text-6xl">
              {isPrinting ? 'Printing Strip…' : 'Your Strip!'}
            </h1>
            <p className="mt-1.5 inline-block -rotate-1 rounded-md border-3 border-ink bg-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest md:text-sm">
              {photos.length} Photos · {FILTERS[filter].label} · {design.label}
            </p>
          </div>
        </div>
      </header>

      {/* ---------- Main Booth Area ---------- */}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        {/* Left: Photobooth Dispenser Machine + Sliding Strip */}
        <div className="mx-auto w-full" style={{ maxWidth: stripWidth + 76 }}>
          {/* Machine Header & Horizontal Dispenser Slot */}
          <motion.div
            className="relative z-20 rounded-3xl border-[6px] border-ink bg-pop-magenta px-4 pb-8 pt-4 shadow-brutal-lg"
            animate={isPrinting ? { x: [0, -1.5, 1.5, -1, 0] } : { x: 0 }}
            transition={isPrinting ? { duration: 0.25, repeat: Infinity } : undefined}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-2xl tracking-wider text-white text-outline-sm md:text-3xl">
                POP-O-MATIC 3000
              </span>

              <div aria-hidden className="flex gap-1.5">
                {['bg-pop-yellow', 'bg-pop-green', 'bg-pop-cyan'].map((bg, i) => (
                  <motion.span
                    key={bg}
                    className={`h-4 w-4 rounded-full border-3 border-ink ${bg}`}
                    animate={isPrinting ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
                    transition={
                      isPrinting ? { duration: 0.6, repeat: Infinity, delay: i * 0.2 } : undefined
                    }
                  />
                ))}
              </div>
            </div>

            {/* Machine Status Screen */}
            <div
              role="status"
              aria-live="polite"
              className="mt-3 flex min-h-12 items-center justify-center rounded-xl border-4 border-ink bg-ink px-3 py-2 text-center font-display text-xl tracking-widest md:text-2xl"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isPrinting ? (
                  <motion.span
                    key="printing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-pop-yellow"
                  >
                    PRINTING YOUR STRIP...
                  </motion.span>
                ) : (
                  <motion.span
                    key="ready"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="text-pop-green"
                  >
                    YOUR STRIP IS READY!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Horizontal Dispenser Slot */}
            <div
              aria-hidden
              className="absolute -bottom-3.5 left-1/2 z-30 h-7 -translate-x-1/2 rounded-full border-4 border-ink bg-ink"
              style={{ width: `min(calc(100% - 1rem), ${stripWidth + 24}px)` }}
            >
              <div className="mx-auto mt-1.5 h-1.5 w-[92%] rounded-full bg-[#3a3a3a]" />
            </div>
          </motion.div>

          {/* Chute clipping container: strip slides down out of the slot */}
          <div
            className="relative z-10 mx-auto overflow-hidden px-3 pb-6 pt-1"
            style={{ width: `min(100%, ${stripWidth + 28}px)` }}
          >
            <motion.div
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: PRINT_DURATION_SEC,
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={() => setIsPrinting(false)}
              className="origin-top shadow-brutal-lg"
            >
              <PhotoStrip
                ref={stripExportRef}
                photos={bakedPhotos ?? photos}
                boothMode={boothMode}
                layout={layout}
                filter={filter}
                frameDesign={frameDesign}
                applyCssFilter={!bakedPhotos}
                dateStr={dateStr}
              />
            </motion.div>
          </div>
        </div>

        {/* Right: Save & Email Actions */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          {/* 1. SAVE TO GALLERY Card */}
          <div className="rounded-2xl border-[5px] border-ink bg-white p-5 shadow-brutal-lg">
            <h2 className="mb-1 font-display text-3xl tracking-wide">Keep Your Strip!</h2>
            <p className="mb-4 text-sm font-bold">
              Export a high-resolution PNG with your chosen filter & frame.
            </p>

            <motion.button
              type="button"
              onClick={handleSaveToGallery}
              disabled={saveState === 'saving'}
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border-[5px] border-ink bg-pop-green px-6 py-3.5 font-display text-3xl tracking-wider text-ink outline-none focus-visible:ring-4 focus-visible:ring-pop-yellow disabled:cursor-not-allowed disabled:opacity-60"
              initial={{ boxShadow: `8px 8px 0px 0px ${INK}` }}
              animate={{ x: 0, y: 0, boxShadow: `8px 8px 0px 0px ${INK}` }}
              whileHover={
                saveState !== 'saving'
                  ? { x: -2, y: -2, boxShadow: `10px 10px 0px 0px ${INK}` }
                  : undefined
              }
              whileTap={
                saveState !== 'saving'
                  ? { x: 8, y: 8, boxShadow: `0px 0px 0px 0px ${INK}` }
                  : undefined
              }
              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
            >
              {saveState === 'saving' ? (
                <>
                  <LoaderCircle className="h-7 w-7 animate-spin" strokeWidth={3} />
                  SAVING...
                </>
              ) : saveState === 'saved' ? (
                <>
                  <CircleCheck className="h-7 w-7" strokeWidth={3} />
                  SAVED! SAVE AGAIN
                </>
              ) : (
                <>
                  <Download className="h-7 w-7" strokeWidth={3} />
                  SAVE TO GALLERY
                </>
              )}
            </motion.button>

            {saveState === 'error' && (
              <p
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-lg border-3 border-ink bg-paper px-3 py-1.5 text-sm font-bold text-ink"
              >
                <TriangleAlert className="h-4 w-4 shrink-0 text-pop-magenta" strokeWidth={3} />
                Could not export strip. Please try again.
              </p>
            )}
          </div>

          {/* 2. SEND TO EMAIL Card */}
          <form
            onSubmit={handleSendEmail}
            noValidate
            className="rounded-2xl border-[5px] border-ink bg-pop-yellow p-5 shadow-brutal-lg"
          >
            <h2 className="mb-1 flex items-center gap-2 font-display text-3xl tracking-wide">
              <Mail className="h-7 w-7" strokeWidth={3} />
              SEND TO EMAIL
            </h2>
            <label htmlFor="strip-email" className="mb-3 block text-sm font-bold">
              Get your digital photo strip delivered straight to your inbox.
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="strip-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailState !== 'sending') {
                    setEmailState('idle')
                    setEmailFeedback('')
                  }
                }}
                disabled={emailState === 'sending'}
                className="min-w-0 flex-1 rounded-xl border-4 border-ink bg-white px-4 py-2.5 text-base font-bold text-ink shadow-brutal-sm outline-none placeholder:text-[#7a7a7a] focus:ring-4 focus:ring-pop-cyan disabled:opacity-60"
              />

              <motion.button
                type="submit"
                disabled={emailState === 'sending' || email.trim() === ''}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-4 border-ink bg-pop-magenta px-6 py-2.5 font-display text-2xl tracking-wider text-white text-outline-sm outline-none focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
                initial={{ boxShadow: `6px 6px 0px 0px ${INK}` }}
                animate={{ x: 0, y: 0, boxShadow: `6px 6px 0px 0px ${INK}` }}
                whileHover={
                  emailState !== 'sending' && email.trim() !== ''
                    ? { x: -2, y: -2, boxShadow: `8px 8px 0px 0px ${INK}` }
                    : undefined
                }
                whileTap={
                  emailState !== 'sending' && email.trim() !== ''
                    ? { x: 6, y: 6, boxShadow: `0px 0px 0px 0px ${INK}` }
                    : undefined
                }
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
              >
                {emailState === 'sending' ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" strokeWidth={3} />
                    SENDING...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" strokeWidth={3} />
                    SEND
                  </>
                )}
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {(emailState === 'sent' || emailState === 'error') && (
                <motion.p
                  key={emailState + emailFeedback}
                  role={emailState === 'error' ? 'alert' : 'status'}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-3 flex items-center gap-2 rounded-xl border-3 border-ink px-3 py-2 text-sm font-bold ${
                    emailState === 'sent' ? 'bg-pop-green text-ink' : 'bg-white text-ink'
                  }`}
                >
                  {emailState === 'sent' ? (
                    <CircleCheck className="h-5 w-5 shrink-0" strokeWidth={3} />
                  ) : (
                    <TriangleAlert className="h-5 w-5 shrink-0 text-pop-magenta" strokeWidth={3} />
                  )}
                  {emailFeedback}
                </motion.p>
              )}
            </AnimatePresence>
          </form>

          {/* 3. Start Over Button */}
          <div className="flex justify-center pb-4">
            <motion.button
              type="button"
              onClick={onRestart}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border-4 border-ink bg-white px-6 py-2.5 font-display text-2xl tracking-wider text-ink outline-none focus-visible:ring-4 focus-visible:ring-pop-yellow"
              initial={{ boxShadow: `6px 6px 0px 0px ${INK}` }}
              animate={{ x: 0, y: 0, boxShadow: `6px 6px 0px 0px ${INK}` }}
              whileHover={{ x: -2, y: -2, boxShadow: `8px 8px 0px 0px ${INK}` }}
              whileTap={{ x: 6, y: 6, boxShadow: `0px 0px 0px 0px ${INK}` }}
              transition={{ type: 'spring', stiffness: 600, damping: 20 }}
            >
              <RotateCcw className="h-5 w-5" strokeWidth={3} />
              START OVER
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
