import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Download, Heart, Mail, Printer, RotateCcw, Send, Sparkles, TriangleAlert } from 'lucide-react'

import PhotoStrip from '../components/PhotoStrip'
import BrutalButton from '../components/ui/BrutalButton'
import ScreenHeader from '../components/ui/ScreenHeader'
import { FILTERS, FRAME_DESIGNS, type ResultProps } from '../types/photobooth'
import { usePreviewScale } from '../hooks/usePreviewScale'
import { bakeFilteredPhotos, useBakedPhotos } from '../utils/photoFilters'
import './Result.css'

const PRINT_DURATION_SEC = 2.8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const formatDateStr = () => new Date().toLocaleDateString('en-US', {
  month: 'short', day: '2-digit', year: 'numeric',
}).toUpperCase()

function CurlyArrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 115 92" fill="none" className="scrapbook-arrow">
      <path d="M9 9c35-9 75 1 71 26-3 20-40 16-35-1 5-16 35-8 39 10 3 15-5 27-19 34m1-17-4 20 20-4" stroke="#2a211d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m97 16 4-6m1 20 8 1" stroke="#b27b87" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function ScissorsDoodle() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 105" className="scrapbook-scissors" fill="none">
      <path d="m48 57 56-42c5 16-13 37-43 53L48 57Z" fill="#d8e7df" stroke="#2a211d" strokeWidth="3" strokeLinejoin="round" />
      <path d="m48 63 31-56c15 14 6 37-18 62L48 63Z" fill="#fffaf1" stroke="#2a211d" strokeWidth="3" strokeLinejoin="round" />
      <path d="M42 60C19 39 2 62 17 76c12 12 29 2 31-9m1-1c-8 10-10 28 3 31 20 5 24-23 10-30" fill="#f3a6b8" stroke="#2a211d" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="30" cy="66" rx="9" ry="7" transform="rotate(27 30 66)" fill="#fffaf1" stroke="#2a211d" strokeWidth="2" />
      <ellipse cx="54" cy="83" rx="6" ry="9" transform="rotate(19 54 83)" fill="#fffaf1" stroke="#2a211d" strokeWidth="2" />
      <circle cx="56" cy="61" r="4" fill="#f7d97e" stroke="#2a211d" strokeWidth="2" />
      <path d="m6 29 9 3m4-15 4 7m87 57-9-3" stroke="#2a211d" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export default function Result({
  boothMode, photos, layout, filter, frameDesign, stickerPack = 'cats', onBack, onRestart,
}: ResultProps) {
  const reducedMotion = useReducedMotion()
  const [dateStr] = useState(formatDateStr)
  const [isPrinting, setIsPrinting] = useState(true)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [printState, setPrintState] = useState<'idle' | 'preparing' | 'error'>('idle')
  const [emailOpen, setEmailOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [emailFeedback, setEmailFeedback] = useState('')
  const [emailError, setEmailError] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const stripExportRef = useRef<HTMLDivElement>(null)
  const exportInProgress = useRef(false)
  const printSheetRef = useRef<HTMLDivElement | null>(null)
  const mountedRef = useRef(true)
  const { viewportRef, contentRef, scale: previewScale, height: previewHeight } = usePreviewScale()
  const bakedPhotos = useBakedPhotos(photos, filter)
  const stripWidth = layout === '2-column-grid' ? 420 : 280
  const design = FRAME_DESIGNS[frameDesign]
  const busy = saveState === 'saving' || printState === 'preparing'

  useEffect(() => {
    if (!isPrinting) return
    const timer = setTimeout(() => setIsPrinting(false), reducedMotion ? 100 : (PRINT_DURATION_SEC + 0.5) * 1000)
    return () => clearTimeout(timer)
  }, [isPrinting, reducedMotion])

  useEffect(() => {
    if (emailOpen) emailInputRef.current?.focus()
  }, [emailOpen])

  useEffect(() => {
    mountedRef.current = true
    const finishPrint = () => {
      if (!printSheetRef.current) return
      printSheetRef.current.remove()
      printSheetRef.current = null
      exportInProgress.current = false
      setPrintState('idle')
    }
    window.addEventListener('afterprint', finishPrint)
    return () => {
      mountedRef.current = false
      window.removeEventListener('afterprint', finishPrint)
      printSheetRef.current?.remove()
      printSheetRef.current = null
      exportInProgress.current = false
    }
  }, [])

  /** Export only the full-size strip. Scrapbook rotation and decorations stay on screen. */
  const createStripImage = async () => {
    const node = stripExportRef.current
    if (!node) throw new Error('The photo strip is not ready yet.')
    const width = node.offsetWidth
    const height = node.offsetHeight
    const [filteredPhotos, { default: html2canvas }] = await Promise.all([
      bakeFilteredPhotos(photos, filter),
      import('html2canvas'),
      document.fonts?.ready,
    ])
    const canvas = await html2canvas(node, {
      useCORS: true,
      backgroundColor: design.stripBg,
      scale: Math.max(2, window.devicePixelRatio || 1),
      width,
      height,
      logging: false,
      onclone: async (_, strip) => {
        // Every ancestor can carry a preview transform (scale, tilt or print motion).
        let ancestor: HTMLElement | null = strip
        while (ancestor) {
          ancestor.style.transform = 'none'
          ancestor.style.overflow = 'visible'
          ancestor = ancestor.parentElement
        }
        Object.assign(strip.style, { position: 'fixed', left: '0', top: '0', width: `${width}px`, margin: '0' })
        await Promise.all(Array.from(strip.querySelectorAll('img')).map(async (image, index) => {
          image.src = filteredPhotos[index] ?? image.src
          image.style.filter = 'none'
          await image.decode()
        }))
      },
    })
    return canvas.toDataURL('image/png')
  }

  const handleDownload = async () => {
    if (exportInProgress.current) return
    exportInProgress.current = true
    setSaveState('saving')
    try {
      const link = document.createElement('a')
      link.download = `catabooth-${Date.now()}.png`
      link.href = await createStripImage()
      document.body.appendChild(link)
      link.click()
      link.remove()
      setSaveState('saved')
    } catch (error) {
      console.error('[catabooth] Could not download the photo strip', error)
      setSaveState('error')
    } finally {
      exportInProgress.current = false
    }
  }

  const handlePrint = async () => {
    if (exportInProgress.current) return
    exportInProgress.current = true
    setPrintState('preparing')
    const sheet = document.createElement('div')
    sheet.className = 'catabooth-print-sheet'
    try {
      const image = new Image()
      image.alt = 'Your Catabooth photo strip'
      image.src = await createStripImage()
      await image.decode()
      if (!mountedRef.current) {
        exportInProgress.current = false
        return
      }
      sheet.appendChild(image)
      printSheetRef.current = sheet
      document.body.appendChild(sheet)
      // Some browsers return before their print dialog has captured the page.
      // Retain the sheet and export lock until afterprint (including cancellation).
      window.print()
    } catch (error) {
      console.error('[catabooth] Could not prepare the photo strip for printing', error)
      sheet.remove()
      if (printSheetRef.current === sheet) printSheetRef.current = null
      exportInProgress.current = false
      if (mountedRef.current) setPrintState('error')
    }
  }

  const handleEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const address = email.trim()
    if (!EMAIL_PATTERN.test(address)) {
      setEmailError(true)
      setEmailFeedback('Add a valid email address to open your draft.')
      emailInputRef.current?.focus()
      return
    }
    const subject = encodeURIComponent('A little Catabooth keepsake for you')
    const body = encodeURIComponent('Here is my Catabooth photo strip!\n\nAttach the downloaded Catabooth PNG before sending this email.')
    const link = document.createElement('a')
    link.href = `mailto:${encodeURIComponent(address)}?subject=${subject}&body=${body}`
    link.click()
    setEmailError(false)
    setEmailFeedback('Email draft requested. Attach your downloaded PNG in your mail app, then send it there.')
  }

  return (
    <section className="app-screen result-screen">
      <ScreenHeader
        title={isPrinting ? 'Printing a little happiness…' : 'A little keepsake!'}
        subtitle={`${photos.length} photos · ${FILTERS[filter].label} · ${design.label}`}
        onBack={onBack}
      />

      <div className="scrapbook-layout">
        <div ref={viewportRef} className="scrapbook-preview" style={{ '--preview-height': `${previewHeight}px` } as CSSProperties}>
          <div ref={contentRef} className="scrapbook-preview-scale" style={{ width: stripWidth + 120, transform: `translateX(-50%) scale(${previewScale})` }}>
            <div className="scrapbook-caption-space">
              <AnimatePresence mode="wait" initial={false}>
                {isPrinting ? (
                  <motion.div key="dispenser" className="scrapbook-dispenser" initial={false} exit={{ opacity: 0, y: -8 }}>
                    <span>CATABOOTH KEEPSAKES</span>
                    <span className="scrapbook-printer-status"><span /> a little magic in progress…</span>
                    <div className="scrapbook-dispenser-slot" />
                  </motion.div>
                ) : (
                  <motion.div key="caption" className="scrapbook-caption" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <span>your photostrip!</span>
                    <CurlyArrow />
                    <Heart className="scrapbook-caption-heart" aria-hidden="true" strokeWidth={2} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="scrapbook-chute" style={{ overflow: isPrinting ? 'hidden' : 'visible' }}>
              <motion.div
                className="scrapbook-paper"
                style={{ width: stripWidth }}
                initial={{ y: reducedMotion ? 0 : '-100%', opacity: reducedMotion ? 1 : 0 }}
                animate={{ y: 0, opacity: 1, rotate: isPrinting ? 0 : -3 }}
                transition={{ y: { duration: reducedMotion ? 0 : PRINT_DURATION_SEC, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: reducedMotion ? 0 : 0.3 }, rotate: { duration: reducedMotion ? 0 : 0.5, ease: 'easeOut' } }}
                onAnimationComplete={() => setIsPrinting(false)}
              >
                <PhotoStrip
                  ref={stripExportRef}
                  photos={bakedPhotos ?? photos}
                  boothMode={boothMode}
                  layout={layout}
                  filter={filter}
                  frameDesign={frameDesign}
                  stickerPack={stickerPack}
                  applyCssFilter={!bakedPhotos}
                  dateStr={dateStr}
                />
              </motion.div>
              {!isPrinting && <ScissorsDoodle />}
            </div>
            <p className="scrapbook-paper-note">a tiny moment, yours to keep <span aria-hidden="true">♡</span></p>
          </div>
        </div>

        <div className="scrapbook-actions">
          <div className="scrapbook-action-card">
            <span aria-hidden="true" className="scrapbook-tape" />
            <span className="scrapbook-ready-note" role="status"><Sparkles aria-hidden="true" size={15} /> {isPrinting ? 'fresh from the booth…' : 'made with a little love'}</span>
            <h2>Keep the good bits.</h2>
            <p>A pocket-sized memory for your scrapbook, your wall, or someone you love.</p>

            <div className="scrapbook-button-grid">
              <BrutalButton color="mint" icon={saveState === 'saved' ? Check : Download} loading={saveState === 'saving'} disabled={isPrinting || busy} onClick={handleDownload}>
                {saveState === 'saving' ? 'saving…' : saveState === 'saved' ? 'download again' : 'download'}
              </BrutalButton>
              <button type="button" className="scrapbook-email-toggle" aria-expanded={emailOpen} aria-controls="scrapbook-email-drawer" onClick={() => setEmailOpen(!emailOpen)} disabled={isPrinting}>
                <Mail aria-hidden="true" size={19} /> send to email
              </button>
              <BrutalButton color="butter" icon={Printer} loading={printState === 'preparing'} disabled={isPrinting || busy} onClick={handlePrint}>
                {printState === 'preparing' ? 'preparing…' : 'print'}
              </BrutalButton>
              <BrutalButton color="cream" icon={RotateCcw} onClick={onRestart} disabled={busy}>restart</BrutalButton>
            </div>

            {(saveState === 'error' || printState === 'error') && (
              <p className="scrapbook-feedback is-error" role="alert"><TriangleAlert aria-hidden="true" size={16} /> We couldn’t prepare your strip. Please try again.</p>
            )}

            {emailOpen && (
              <form id="scrapbook-email-drawer" className="scrapbook-email-drawer" onSubmit={handleEmail} noValidate>
                <label htmlFor="strip-email">A keepsake for your inbox</label>
                <p>Download your strip first. We’ll open an email draft so you can attach the PNG and send it.</p>
                <div className="scrapbook-email-fields">
                  <input ref={emailInputRef} id="strip-email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} aria-invalid={emailError} aria-describedby={emailFeedback ? 'scrapbook-email-feedback' : undefined} onChange={(event) => { setEmail(event.target.value); setEmailFeedback(''); setEmailError(false) }} />
                  <button type="submit" aria-label="Open email draft"><Send aria-hidden="true" size={18} /></button>
                </div>
                {emailFeedback && <p id="scrapbook-email-feedback" className={`scrapbook-feedback${emailError ? ' is-error' : ''}`} role={emailError ? 'alert' : 'status'}>{emailFeedback}</p>}
              </form>
            )}

            <span className="scrapbook-file-note">PNG keeps every color, sticker & little detail.</span>
          </div>
          <div aria-hidden="true" className="scrapbook-end-note"><span>✧</span> see you at the booth again! <span>✧</span></div>
        </div>
      </div>
    </section>
  )
}
