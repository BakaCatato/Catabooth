import { useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { ArrowLeft, Check, Sparkles, Timer, User, Users, type LucideIcon } from 'lucide-react'

import ScreenPlaceholder, { StubButton } from '../components/ui/ScreenPlaceholder'
import {
  BOOTH_MODES,
  FRAME_OPTIONS,
  type BoothMode,
  type FrameSelectionProps,
} from '../types/photobooth'

const MODE_CONFIG: Record<
  BoothMode,
  { Icon: LucideIcon; bg: string; badge: string; rotate: number }
> = {
  solo: {
    Icon: User,
    bg: 'bg-pop-cyan',
    badge: '3s Countdown',
    rotate: -1.5,
  },
  together: {
    Icon: Users,
    bg: 'bg-pop-magenta text-ink',
    badge: '5s Countdown + Group Badge',
    rotate: 1.5,
  },
}

const stepVariants: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 22 },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.96,
    transition: { duration: 0.16 },
  },
}

export default function FrameSelection({
  boothMode,
  selected,
  onSelectMode,
  onSelect,
  onBack,
}: FrameSelectionProps) {
  const [step, setStep] = useState<'mode' | 'shots'>('mode')

  const handleChooseMode = (mode: BoothMode) => {
    onSelectMode(mode)
    setStep('shots')
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'mode' ? (
        <motion.div
          key="step-mode"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <ScreenPlaceholder title="Who's in the Booth?">
            <div className="grid w-full gap-4 sm:grid-cols-2">
              {(['solo', 'together'] as const).map((modeId) => {
                const { label, subtitle } = BOOTH_MODES[modeId]
                const { Icon, bg, badge, rotate } = MODE_CONFIG[modeId]
                const isSelected = boothMode === modeId

                return (
                  <motion.button
                    key={modeId}
                    type="button"
                    onClick={() => handleChooseMode(modeId)}
                    style={{ rotate }}
                    whileHover={{ scale: 1.03, rotate: 0 }}
                    whileTap={{ x: 4, y: 4 }}
                    className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-4 border-ink p-5 text-center shadow-brutal transition-shadow active:shadow-none ${bg}`}
                  >
                    {isSelected && (
                      <span className="absolute -right-2.5 -top-2.5 flex h-8 w-8 items-center justify-center rounded-full border-3 border-ink bg-pop-yellow text-ink shadow-brutal-sm">
                        <Check className="h-4 w-4" strokeWidth={3.5} />
                      </span>
                    )}

                    <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-ink bg-white text-ink shadow-brutal-sm">
                      <Icon className="h-7 w-7" strokeWidth={2.75} />
                    </span>

                    <div>
                      <span className="block font-display text-3xl tracking-wider">
                        {label}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest opacity-90">
                        {subtitle}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full border-3 border-ink bg-pop-yellow px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
                      <Timer className="h-3.5 w-3.5" strokeWidth={3} />
                      {badge}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            <div className="mt-2 flex w-full justify-center">
              <StubButton onClick={onBack}>
                <span className="inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" strokeWidth={3} />
                  Back
                </span>
              </StubButton>
            </div>
          </ScreenPlaceholder>
        </motion.div>
      ) : (
        <motion.div
          key="step-shots"
          variants={stepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <ScreenPlaceholder title="How many shots?">
            <div className="mb-2 flex w-full items-center justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border-3 border-ink bg-pop-cyan px-4 py-1 text-xs font-bold uppercase tracking-widest text-ink shadow-brutal-sm">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={3} />
                Mode: {BOOTH_MODES[boothMode].label} ({BOOTH_MODES[boothMode].countdown}s Timer)
              </span>
            </div>

            <div className="flex w-full flex-wrap justify-center gap-3">
              {FRAME_OPTIONS.map((n) => (
                <StubButton key={n} onClick={() => onSelect(n)}>
                  {n} Shots {n === selected ? '★' : ''}
                </StubButton>
              ))}
            </div>

            <div className="mt-2 flex w-full flex-wrap justify-center gap-3">
              <StubButton onClick={() => setStep('mode')}>
                <span className="inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" strokeWidth={3} />
                  Change Mode
                </span>
              </StubButton>
              <StubButton onClick={onBack}>Back to Home</StubButton>
            </div>
          </ScreenPlaceholder>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
