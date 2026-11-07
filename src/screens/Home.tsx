import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Camera, Cat, Heart, Sparkles, Star } from 'lucide-react'
import type { HomeProps } from '../types/photobooth'
import TokenDispenser, { type TokenStep } from '../components/TokenDispenser'
import { useBoothSounds } from '../hooks/useBoothSounds'
import { incrementVisitorCount, readVisitorCount, VISITOR_COUNT_KEY } from '../utils/visitorCounter'
import './Home.css'

type CurtainState = 'closed' | 'open' | 'closing'

const FEATURED_STRIPS = [
  { paper: '#fff8e7', backdrop: '#e9b8c7', fur: '#f3c779', tilt: -9, caption: 'MEOW!' },
  { paper: '#f4d6df', backdrop: '#bcd7cf', fur: '#fff8e7', tilt: 6, caption: 'BFFS' },
  { paper: '#fff0b5', backdrop: '#c9c1df', fur: '#b7c8d8', tilt: -5, caption: 'CHEESE' },
  { paper: '#e4dff1', backdrop: '#efcea5', fur: '#f8e3ce', tilt: 10, caption: 'LOVE YA' },
] as const

/** Tiny ink-drawn portraits keep the showcase crisp at every screen size. */
function CatPortrait({ fur, pose }: { fur: string; pose: number }) {
  return (
    <svg viewBox="0 0 64 54" fill="none" aria-hidden="true">
      <path d="M10 54c0-13 8-20 22-20s22 7 22 20" fill={fur} stroke="currentColor" strokeWidth="2.5" />
      <path
        d="m13 25-1-18 14 9a28 28 0 0 1 13 0l13-9-1 19c7 18-3 23-19 23S6 43 13 25Z"
        fill={fur}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="m17 14 1 10 6-4m22-6-1 10-6-4" fill="#e7a0ae" />
      {pose === 1 ? (
        <path d="m20 31 5-2-5-2m18 4 5-2-5-2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx="23" cy="29" rx="2" ry="3" fill="currentColor" />
          <ellipse cx="41" cy="29" rx="2" ry="3" fill="currentColor" />
        </>
      )}
      <ellipse cx="18" cy="35" rx="4" ry="2.5" fill="#e7a0ae" />
      <ellipse cx="46" cy="35" rx="4" ry="2.5" fill="#e7a0ae" />
      <path d="m29 33 3 3 3-3Z" fill="currentColor" />
      <path d="M26 38q3 5 6-2 3 7 6 2M9 31l7 2m-8 5 8-1m32-4 7-2m-7 6 8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {pose === 2 && <path d="m46 8 3-5 3 5 5 2-5 2-3 5-3-5-5-2Z" fill="#fff8e7" stroke="currentColor" strokeWidth="1.5" />}
    </svg>
  )
}

function FeaturedStrips({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="booth-showcase rounded-2xl border-4 border-ink">
      <h2 className="relative z-10 border-b-4 border-ink bg-[#fff0b5] px-2 py-2 text-center font-display text-2xl tracking-[0.12em]">
        FEATURED STRIPS
      </h2>
      <div className="relative px-4 pb-4 pt-10" aria-hidden="true">
        <svg className="absolute left-0 top-3 h-9 w-full" viewBox="0 0 300 36" preserveAspectRatio="none" fill="none">
          <path d="M-5 8Q150 48 305 8" stroke="#0a0a0a" strokeWidth="2.5" />
        </svg>
        <div className="relative flex items-start justify-center gap-3">
          {FEATURED_STRIPS.map(({ paper, backdrop, fur, tilt, caption }, index) => (
            <motion.div
              key={caption}
              className="booth-mini-strip"
              style={{ backgroundColor: paper, marginTop: index === 1 || index === 2 ? 9 : 0 }}
              initial={false}
              animate={{ rotate: reducedMotion ? tilt : [tilt, tilt + 3, tilt] }}
              transition={{ duration: 4.5 + index * 0.4, ease: 'easeInOut', repeat: Infinity }}
            >
              <span className="booth-clothespin" />
              {[0, 1, 2].map((pose) => (
                <div key={pose} className="mb-1 overflow-hidden border-[1.5px] border-ink" style={{ backgroundColor: backdrop }}>
                  <CatPortrait fur={fur} pose={(pose + index) % 3} />
                </div>
              ))}
              <span className="block whitespace-nowrap text-center font-display text-[8px] tracking-wide">{caption}</span>
            </motion.div>
          ))}
        </div>
        <p className="mt-6 text-center text-[9px] font-bold tracking-[0.2em]">GOOD TIMES, ON REPEAT.</p>
      </div>
      <p className="sr-only">Four colorful photo strips with playful illustrated cats hang from a string.</p>
    </div>
  )
}

function BoothInterior() {
  return (
    <div id="booth-interior" className="booth-interior absolute inset-0" aria-hidden="true">
      <div className="booth-interior-wall" />
      <span className="absolute left-5 top-7 -rotate-12"><Sparkles size={26} strokeWidth={2} /></span>
      <span className="absolute right-7 top-36 rotate-12"><Heart size={23} strokeWidth={2} /></span>
      <div className="booth-camera">
        <span className="absolute left-3 top-3 h-2 w-2 rounded-full border border-ink bg-[#d5edb5]" />
        <div className="booth-camera-lens"><span /></div>
        <span className="absolute right-2 top-3 h-3 w-6 rounded-sm border-2 border-ink bg-[#fff0b5]" />
        <span className="absolute bottom-2 left-0 right-0 text-center text-[8px] font-bold tracking-[0.18em]">LOOK HERE & SMILE</span>
      </div>
      <div className="booth-floor" />
      <div className="booth-stool">
        <div className="booth-stool-base" />
        <div className="booth-stool-stem" />
        <div className="booth-stool-lever" />
        <div className="booth-stool-seat" />
      </div>
    </div>
  )
}

function CurtainPanel({ side, isOpen, reducedMotion }: { side: 'left' | 'right'; isOpen: boolean; reducedMotion: boolean }) {
  return (
    <motion.div
      aria-hidden="true"
      className={`booth-curtain booth-curtain-${side}`}
      initial={false}
      animate={{ x: isOpen ? (side === 'left' ? '-82%' : '82%') : '0%' }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 26, mass: 0.8 }}
    >
      <div className="booth-curtain-rings">
        {[0, 1, 2, 3, 4].map((ring) => <span key={ring} />)}
      </div>
      <span className="booth-curtain-seam" />
    </motion.div>
  )
}

export default function Home({ onStart }: HomeProps) {
  const [curtainState, setCurtainState] = useState<CurtainState>('closed')
  const [tokenStep, setTokenStep] = useState<TokenStep>('need-token')
  const [visitorCount, setVisitorCount] = useState(readVisitorCount)
  const dispensedRef = useRef(false)
  const startButtonRef = useRef<HTMLButtonElement>(null)
  const playSound = useBoothSounds()
  const reducedMotion = useReducedMotion() ?? false
  const isOpen = curtainState === 'open'
  const isClosing = curtainState === 'closing'

  const dispenseToken = () => {
    if (dispensedRef.current) return
    dispensedRef.current = true
    setVisitorCount(incrementVisitorCount())
    playSound('dispense')
    setTokenStep('token-dispensed')
  }

  const unlockCurtain = useCallback(() => {
    setTokenStep('token-inserted')
    setCurtainState('open')
  }, [])

  useEffect(() => {
    const syncCount = (event: StorageEvent) => {
      if (event.key === VISITOR_COUNT_KEY || event.key === null) setVisitorCount(readVisitorCount())
    }
    window.addEventListener('storage', syncCount)
    return () => window.removeEventListener('storage', syncCount)
  }, [])

  useEffect(() => {
    if (isOpen) startButtonRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (curtainState !== 'closing') return

    const timer = window.setTimeout(onStart, 550)
    return () => window.clearTimeout(timer)
  }, [curtainState, onStart])

  return (
    <section className="booth-home relative flex flex-col items-center justify-center px-4 pb-12 pt-4 text-ink sm:px-8 sm:pb-14" aria-labelledby="booth-title">
      <div className="relative mb-6 flex items-center gap-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs">
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
        A little booth. A lot of memories.
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
      </div>

      <div className="relative isolate w-full max-w-4xl pb-4">
        <div className="booth-machine relative rounded-t-[2rem] rounded-b-xl border-4 border-ink bg-paper">
          <header className="booth-marquee relative border-b-4 border-ink px-5 py-5 sm:px-9">
            <div className="booth-bulbs booth-bulbs-top" aria-hidden="true">
              {Array.from({ length: 13 }, (_, index) => <span key={index} />)}
            </div>
            <div className="booth-sign relative flex items-center justify-center gap-3 rounded-xl border-[3px] border-ink px-2 py-3 sm:gap-5">
              <Star className="hidden h-6 w-6 shrink-0 fill-[#e9b8c7] min-[400px]:block sm:h-9 sm:w-9" strokeWidth={2.5} aria-hidden="true" />
              <div className="min-w-0 text-center">
                <h1 id="booth-title" className="font-display text-[clamp(2.1rem,7vw,4.5rem)] leading-none tracking-[0.08em] text-[#b84c6a] text-outline-sm [text-shadow:2px_3px_0_#efc89d]">CATABOOTH</h1>
                <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.23em] sm:text-[10px]">Step in. Be silly. Keep the memory.</p>
              </div>
              <Star className="hidden h-6 w-6 shrink-0 fill-[#e9b8c7] min-[400px]:block sm:h-9 sm:w-9" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div className="booth-bulbs booth-bulbs-bottom" aria-hidden="true">
              {Array.from({ length: 13 }, (_, index) => <span key={index} />)}
            </div>
          </header>

          <div className="grid gap-6 p-4 sm:grid-cols-[0.95fr_1.05fr] sm:gap-7 sm:p-7">
            <div className="flex min-w-0 flex-col">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="booth-visitor-badge"><Star size={13} aria-hidden="true" /> VISITOR #{String(visitorCount).padStart(4, '0')}</span>
                <span className="booth-entrance-note" aria-hidden="true">hi, happy human!</span>
              </div>
              <FeaturedStrips reducedMotion={reducedMotion} />
              <TokenDispenser
                tokenStep={tokenStep}
                reducedMotion={reducedMotion}
                onDispense={dispenseToken}
                onInsertSound={() => playSound('insert')}
                onInserted={unlockCurtain}
              />
              <div className="mt-5 flex items-center justify-center gap-2 text-center text-[9px] font-bold uppercase tracking-[0.14em]">
                <Cat size={19} strokeWidth={2.5} aria-hidden="true" />
                Made for you & your favorite humans
              </div>
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                  <span className={`h-2.5 w-2.5 rounded-full border-2 border-ink ${isClosing ? 'bg-[#e9b8c7]' : 'bg-[#b8d8a0]'}`} aria-hidden="true" />
                  {isClosing ? 'IN SESSION' : tokenStep === 'token-inserted' ? 'BOOTH IS ALL YOURS' : 'ONE COIN TO BEGIN'}
                </span>
                <span className="font-display text-sm tracking-widest">NO. 01</span>
              </div>

              <div className="booth-doorway relative isolate overflow-hidden rounded-t-[1.5rem] border-4 border-ink" data-curtain-state={curtainState}>
                <BoothInterior />
                <div className="booth-curtain-rail" aria-hidden="true" />
                <CurtainPanel side="left" isOpen={isOpen} reducedMotion={reducedMotion} />
                <CurtainPanel side="right" isOpen={isOpen} reducedMotion={reducedMotion} />

                <div className={`booth-controls absolute inset-x-0 top-[46%] flex flex-col items-center px-5 ${isOpen ? 'z-10' : 'z-30'}`}>
                  {tokenStep !== 'token-inserted' ? (
                    <div className="booth-locked-badge">
                      <Cat size={27} strokeWidth={2} aria-hidden="true" />
                      <span>insert a coin first! ⬅️</span>
                      <small>{tokenStep === 'need-token' ? 'Grab a free token from the machine' : 'Drag or tap your golden cat token'}</small>
                    </div>
                  ) : (
                    <motion.button
                      ref={startButtonRef}
                      type="button"
                      disabled={isClosing}
                      aria-controls="booth-interior"
                      aria-expanded={isOpen}
                      onClick={() => { if (tokenStep === 'token-inserted' && isOpen) setCurtainState('closing') }}
                      className="booth-start-button w-full max-w-64 cursor-pointer rounded-xl border-[3px] border-ink bg-[#fff0b5] px-3 py-3 text-center font-display text-[clamp(1rem,3vw,1.3rem)] tracking-wide shadow-brutal-sm outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-ink disabled:cursor-wait"
                      animate={{ scale: isOpen && !reducedMotion ? [1, 1.035, 1] : 1 }}
                      transition={{ duration: 1.8, ease: 'easeInOut', repeat: isOpen && !reducedMotion ? Infinity : 0 }}
                      whileHover={isClosing || reducedMotion ? undefined : { y: -3 }}
                      whileTap={isClosing || reducedMotion ? undefined : { scale: 0.97 }}
                    >
                      {isClosing ? 'GET READY…' : 'STEP IN & CLOSE CURTAIN 📸'}
                    </motion.button>
                  )}
                  <span className={`mt-4 rounded-full px-3 py-1 text-center text-[9px] font-bold uppercase tracking-[0.12em] ${isOpen ? 'bg-paper text-ink' : 'bg-[#78374b] text-white'}`}>
                    {isClosing ? 'Your moment is coming' : isOpen ? 'Take a seat. Make a memory.' : 'A little magic behind the curtain'}
                  </span>
                </div>
                <div className="booth-threshold" aria-hidden="true" />
              </div>
              <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.18em]">Your best side? Every side.</p>
            </div>
          </div>

          <div className="booth-plinth flex items-center justify-between border-t-4 border-ink px-5 py-2" aria-hidden="true">
            <span className="booth-screw" />
            <span className="font-display text-xs tracking-[0.3em]">SMALL MOMENTS. BIG KEEPSAKES.</span>
            <span className="booth-screw" />
          </div>
        </div>
        <span className="booth-foot left-8" aria-hidden="true" />
        <span className="booth-foot right-8" aria-hidden="true" />
      </div>

      <div className="relative mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.12em] sm:gap-x-8">
        <span className="flex items-center gap-1.5"><Camera size={15} aria-hidden="true" /> 2–8 shots</span>
        <span className="flex items-center gap-1.5"><Sparkles size={15} aria-hidden="true" /> Retro filters</span>
        <span className="flex items-center gap-1.5"><Heart size={15} aria-hidden="true" /> Yours to keep</span>
      </div>
      <p role="status" className="sr-only">
        {isClosing ? 'Curtains closing. Starting your photobooth session.' : isOpen ? 'Token accepted! Curtains open. Step in and close the curtain when you are ready.' : tokenStep === 'token-dispensed' ? `Visitor ${visitorCount}. Your coin is ready. Drag it to the slot, or activate the coin or slot to insert it.` : 'Welcome to Catabooth. Dispense a free coin to unlock the curtain.'}
      </p>
    </section>
  )
}
