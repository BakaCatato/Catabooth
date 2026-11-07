import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Camera, Cat, Check, Heart, Sparkles, Timer, User, Users } from 'lucide-react'
import ScreenHeader from '../components/ui/ScreenHeader'
import BrutalButton from '../components/ui/BrutalButton'
import { BOOTH_MODES, FRAME_OPTIONS, type BoothMode, type FrameSelectionProps } from '../types/photobooth'

const SHOT_NOTES = { 2: 'A little hello', 4: 'The classic strip', 6: 'A few more smiles', 8: 'The whole story' } as const

export default function FrameSelection({ boothMode, selected, onSelectMode, onSelect, onBack }: FrameSelectionProps) {
  const [step, setStep] = useState<'mode' | 'shots'>('mode')
  const choicesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step === 'shots') choicesRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus()
  }, [step])

  const chooseMode = (mode: BoothMode) => {
    onSelectMode(mode)
    setStep('shots')
  }

  return (
    <section className="app-screen frame-screen">
      <ScreenHeader
        title={step === 'mode' ? "Who's in the booth?" : 'How many memories?'}
        subtitle={step === 'mode' ? 'Come as you are. Bring your favorite humans.' : 'Pick your strip. We’ll take care of the countdown.'}
        onBack={step === 'mode' ? onBack : () => setStep('mode')}
        aside={<span className="doodle-pill bg-butter">STEP {step === 'mode' ? '1' : '2'} OF 2</span>}
      />

      <div className="booth-menu">
        <div className="booth-menu-heading">
          <Cat size={24} aria-hidden="true" />
          <span>CATABOOTH MENU</span>
          <span className="menu-handwriting">a little time for you ✧</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            ref={choicesRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            onAnimationComplete={() => {
              if (step === 'shots') choicesRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({ preventScroll: true })
            }}
          >
            {step === 'mode' ? (
              <div className="menu-mode-grid">
                {(['solo', 'together'] as const).map((mode) => {
                  const Icon = mode === 'solo' ? User : Users
                  const option = BOOTH_MODES[mode]
                  return (
                    <motion.button
                      key={mode}
                      type="button"
                      className="menu-card mode-card"
                      onClick={() => chooseMode(mode)}
                      aria-label={`Choose ${option.label}`}
                      whileHover={{ y: -3, rotate: mode === 'solo' ? -1 : 1 }}
                      whileTap={{ y: 2 }}
                    >
                      <span className={`menu-card-banner ${mode === 'solo' ? 'bg-mint' : 'bg-rose'}`}>
                        <Icon size={22} aria-hidden="true" /> {option.label}
                        {boothMode === mode && <Check size={18} aria-hidden="true" />}
                      </span>
                      <span className="menu-card-doodle" aria-hidden="true"><Icon /><Sparkles /></span>
                      <span className="menu-card-title">{option.subtitle}</span>
                      <span className="menu-card-description">{mode === 'solo' ? 'Just you, being wonderfully you.' : 'More faces. More happy little moments.'}</span>
                      <span className="doodle-pill bg-sand"><Timer size={14} aria-hidden="true" /> {option.countdown}s to strike a pose</span>
                    </motion.button>
                  )
                })}
              </div>
            ) : (
              <>
                <p className="menu-mode-note"><Heart size={15} aria-hidden="true" /> {BOOTH_MODES[boothMode].label} · {BOOTH_MODES[boothMode].countdown}s between shots</p>
                <div className="menu-shot-grid">
                  {FRAME_OPTIONS.map((count, index) => (
                    <motion.button
                      key={count}
                      type="button"
                      className="menu-card shot-card"
                      aria-pressed={selected === count}
                      aria-label={`${count} shots`}
                      onClick={() => onSelect(count)}
                      whileHover={{ y: -3 }}
                      whileTap={{ y: 2 }}
                    >
                      <span className={`menu-card-banner ${['bg-butter', 'bg-rose', 'bg-mint', 'bg-sand'][index]}`}>
                        {count} SHOTS {selected === count && <Check size={16} aria-hidden="true" />}
                      </span>
                      <span className="menu-strip-doodle" aria-hidden="true">
                        {Array.from({ length: count }, (_, i) => <span key={i}><Camera size={13} /></span>)}
                      </span>
                      <span className="menu-card-description">{SHOT_NOTES[count]}</span>
                    </motion.button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <footer className="menu-footer">
          <BrutalButton color="cream" size="sm" icon={ArrowLeft} onClick={step === 'mode' ? onBack : () => setStep('mode')}>
            {step === 'mode' ? 'Back to the arcade' : 'Change company'}
          </BrutalButton>
          <span><Sparkles size={15} aria-hidden="true" /> {step === 'mode' ? 'One cozy cabin. Endless possibilities.' : 'Tap a card to settle into the booth.'}</span>
        </footer>
      </div>
    </section>
  )
}
