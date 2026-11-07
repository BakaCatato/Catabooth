import { motion, type Variants } from 'framer-motion'
import {
  Camera,
  Download,
  Film,
  Heart,
  Images,
  Palette,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import HalftoneBackground from '../components/ui/HalftoneBackground'
import type { HomeProps } from '../types/photobooth'

/* ------------------------------------------------------------------ */
/*  Static config                                                      */
/* ------------------------------------------------------------------ */

const INK = '#0a0a0a'
const LETTER_COLORS = [
  'text-pop-magenta',
  'text-pop-yellow',
  'text-pop-green',
  'text-white',
] as const

/** 20-point comic "POW!" starburst */
const STARBURST =
  'polygon(50% 0%, 61% 18%, 82% 7%, 79% 30%, 100% 35%, 84% 50%, 100% 65%, 79% 70%, 82% 93%, 61% 82%, 50% 100%, 39% 82%, 18% 93%, 21% 70%, 0% 65%, 16% 50%, 0% 35%, 21% 30%, 18% 7%, 39% 18%)'

interface FloatingSticker {
  Icon: LucideIcon
  position: string
  bg: string
  rotate: number
  duration: number
  delay: number
}

const FLOATING_STICKERS: FloatingSticker[] = [
  { Icon: Camera, position: 'left-[5%] top-[14%]', bg: 'bg-pop-yellow', rotate: -12, duration: 5, delay: 0 },
  { Icon: Star, position: 'right-[6%] top-[12%]', bg: 'bg-pop-green', rotate: 14, duration: 4.2, delay: 0.5 },
  { Icon: Heart, position: 'left-[8%] bottom-[14%]', bg: 'bg-pop-magenta', rotate: 10, duration: 4.6, delay: 1.1 },
  { Icon: Zap, position: 'right-[9%] bottom-[16%]', bg: 'bg-pop-yellow', rotate: -8, duration: 3.8, delay: 0.3 },
  { Icon: Sparkles, position: 'left-[24%] top-[6%] hidden md:block', bg: 'bg-white', rotate: 6, duration: 5.4, delay: 0.8 },
  { Icon: Film, position: 'right-[26%] bottom-[7%] hidden md:block', bg: 'bg-pop-green', rotate: -15, duration: 4.4, delay: 1.4 },
]

const FEATURES: { Icon: LucideIcon; label: string; bg: string; rotate: number }[] = [
  { Icon: Images, label: '2 – 8 Shots', bg: 'bg-pop-yellow', rotate: -3 },
  { Icon: Palette, label: 'Retro Filters', bg: 'bg-pop-green', rotate: 2 },
  { Icon: Download, label: 'Instant Download', bg: 'bg-white', rotate: -1 },
]

const MARQUEE_TEXT = 'SAY CHEESE! ★ STRIKE A POSE! ★ SMILE! ★ POP! ★ CLICK! ★ '

const SHADOW_REST = `10px 10px 0px 0px ${INK}`
const SHADOW_HOVER = `14px 14px 0px 0px ${INK}`
const SHADOW_PRESSED = `0px 0px 0px 0px ${INK}`

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.9 } },
}

const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.4, y: 40 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 420, damping: 16 },
  },
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Marquee({ reverse = false, className = '' }: { reverse?: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative z-20 overflow-hidden border-y-4 border-ink py-2 ${className}`}
    >
      <motion.div
        className="flex w-max whitespace-nowrap font-display text-2xl tracking-widest md:text-3xl"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
      >
        {/* Two identical halves → seamless loop at -50% */}
        <span className="pr-4">{MARQUEE_TEXT.repeat(4)}</span>
        <span className="pr-4">{MARQUEE_TEXT.repeat(4)}</span>
      </motion.div>
    </div>
  )
}

function BouncyWord({ word, offset }: { word: string; offset: number }) {
  return (
    <span aria-hidden className="flex justify-center">
      {word.split('').map((char, i) => {
        const idx = offset + i
        return (
          // Outer span: one-time drop-in entrance
          <motion.span
            key={`${char}-${idx}`}
            className="inline-block"
            initial={{ y: -220, opacity: 0, rotate: -30 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 13, delay: 0.15 + idx * 0.06 }}
          >
            {/* Inner span: perpetual idle wobble */}
            <motion.span
              className={`inline-block px-0.5 text-outline text-shadow-brutal ${LETTER_COLORS[idx % LETTER_COLORS.length]}`}
              animate={{ y: [0, -10, 0], rotate: [0, idx % 2 === 0 ? -4 : 4, 0] }}
              transition={{
                duration: 1.8,
                ease: 'easeInOut',
                repeat: Infinity,
                delay: 1.2 + idx * 0.12,
              }}
            >
              {char}
            </motion.span>
          </motion.span>
        )
      })}
    </span>
  )
}

function PowBurst() {
  return (
    <motion.div
      aria-hidden
      className="absolute -right-4 -top-10 z-10 h-24 w-24 sm:-right-10 md:-right-20 md:-top-6 md:h-32 md:w-32"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 12 }}
      transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 1 }}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ scale: [1, 1.12, 1], rotate: [0, 8, 0] }}
        transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
      >
        <div className="absolute inset-0 bg-ink" style={{ clipPath: STARBURST }} />
        <div className="absolute inset-[6px] bg-pop-yellow" style={{ clipPath: STARBURST }} />
        <span className="absolute inset-0 flex items-center justify-center font-display text-2xl text-pop-magenta text-outline-sm md:text-4xl">
          POW!
        </span>
      </motion.div>
    </motion.div>
  )
}

function Polaroid({
  className,
  rotate,
  bg,
  caption,
  delay,
}: {
  className: string
  rotate: number
  bg: string
  caption: string
  delay: number
}) {
  return (
    <motion.div
      aria-hidden
      className={`absolute z-0 hidden w-40 border-4 border-ink bg-white p-2 pb-8 shadow-brutal lg:block ${className}`}
      initial={{ opacity: 0, y: 80, rotate: 0 }}
      animate={{ opacity: 1, y: [0, -14, 0], rotate: [rotate, rotate + 3, rotate] }}
      transition={{
        opacity: { duration: 0.4, delay },
        y: { duration: 5, ease: 'easeInOut', repeat: Infinity, delay },
        rotate: { duration: 6, ease: 'easeInOut', repeat: Infinity, delay },
      }}
    >
      <div className={`relative h-32 overflow-hidden border-4 border-ink ${bg}`}>
        <HalftoneBackground dotColor="rgba(10,10,10,0.35)" size={12} dotRadius={2.5} duration={3} />
        <Camera className="absolute inset-0 m-auto h-12 w-12 text-ink" strokeWidth={2.5} />
      </div>
      <p className="absolute bottom-1.5 left-0 right-0 text-center font-display text-lg tracking-wider">
        {caption}
      </p>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Home screen                                                        */
/* ------------------------------------------------------------------ */

export default function Home({ onStart }: HomeProps) {
  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-pop-cyan">
      {/* ---------- Background layers ---------- */}

      {/* Rotating comic sunburst rays */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[250vmax] w-[250vmax] -translate-x-1/2 -translate-y-1/2 opacity-40"
        style={{
          background:
            'repeating-conic-gradient(from 0deg, #ffffff 0deg 9deg, transparent 9deg 18deg)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 90, ease: 'linear', repeat: Infinity }}
      />

      {/* Global drifting halftone */}
      <HalftoneBackground dotColor="rgba(10,10,10,0.16)" size={22} dotRadius={3} duration={4} />

      {/* Big magenta halftone blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 overflow-hidden rounded-full [mask-image:radial-gradient(circle,black_30%,transparent_70%)]"
      >
        <HalftoneBackground dotColor="#ff2bd6" size={16} dotRadius={5} duration={5} direction={-1} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] overflow-hidden rounded-full [mask-image:radial-gradient(circle,black_30%,transparent_70%)]"
      >
        <HalftoneBackground dotColor="#ffe600" size={18} dotRadius={6} duration={6} />
      </div>

      {/* ---------- Top ticker ---------- */}
      <Marquee className="-rotate-1 bg-pop-yellow" />

      {/* ---------- Floating stickers ---------- */}
      {FLOATING_STICKERS.map(({ Icon, position, bg, rotate, duration, delay }) => (
        <motion.div
          key={position}
          aria-hidden
          className={`absolute z-10 ${position}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1, y: [0, -18, 0], rotate: [rotate, -rotate, rotate] }}
          transition={{
            scale: { type: 'spring', stiffness: 400, damping: 12, delay: 0.6 + delay },
            y: { duration, ease: 'easeInOut', repeat: Infinity, delay },
            rotate: { duration: duration * 1.3, ease: 'easeInOut', repeat: Infinity, delay },
          }}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border-4 border-ink shadow-brutal-sm md:h-16 md:w-16 md:shadow-brutal ${bg}`}
          >
            <Icon className="h-6 w-6 text-ink md:h-8 md:w-8" strokeWidth={2.75} />
          </div>
        </motion.div>
      ))}

      {/* ---------- Decorative polaroids ---------- */}
      <Polaroid className="left-[9%] top-[34%]" rotate={-10} bg="bg-pop-magenta" caption="CHEESE!" delay={1.3} />
      <Polaroid className="right-[9%] top-[30%]" rotate={9} bg="bg-pop-green" caption="POSE!" delay={1.5} />

      {/* ---------- Main content ---------- */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center gap-10 px-4 py-12">
        {/* Tagline badge */}
        <motion.div
          initial={{ opacity: 0, y: -30, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: -3 }}
          transition={{ type: 'spring', stiffness: 400, damping: 14, delay: 0.1 }}
          className="rounded-full border-4 border-ink bg-white px-5 py-1.5 font-body text-sm font-bold uppercase tracking-[0.2em] shadow-brutal-sm md:text-base"
        >
          ★ The Web Photobooth ★
        </motion.div>

        {/* Title */}
        <div className="relative">
          <h1 className="font-display text-[4.5rem] leading-[0.85] tracking-wide sm:text-8xl md:text-[9rem] lg:text-[11rem]">
            <span className="sr-only">Cata Booth!</span>
            <BouncyWord word="CATA" offset={0} />
            <BouncyWord word="BOOTH!" offset={4} />
          </h1>
          <PowBurst />
        </div>

        {/* CTA — wrapper handles idle bounce, button handles hover/tap physics */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 12, delay: 0.8 }}
        >
          <motion.div
            animate={{ y: [0, -12, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity, delay: 1.4 }}
          >
            <motion.button
              type="button"
              onClick={onStart}
              aria-label="Start Photobooth"
              className="group flex cursor-pointer items-center gap-4 rounded-2xl border-[5px] border-ink bg-pop-magenta px-7 py-4 font-display text-3xl tracking-wider text-white text-outline-sm outline-none focus-visible:ring-8 focus-visible:ring-pop-yellow sm:text-4xl md:gap-5 md:px-12 md:py-6 md:text-5xl"
              initial={{ boxShadow: SHADOW_REST }}
              animate={{ x: 0, y: 0, rotate: 0, boxShadow: SHADOW_REST }}
              whileHover={{ x: -4, y: -4, rotate: -2, boxShadow: SHADOW_HOVER }}
              whileTap={{ x: 10, y: 10, rotate: 0, boxShadow: SHADOW_PRESSED }}
              transition={{ type: 'spring', stiffness: 600, damping: 18 }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-ink bg-pop-yellow transition-transform duration-300 group-hover:rotate-[20deg] group-hover:scale-110 md:h-16 md:w-16">
                <Camera className="h-6 w-6 text-ink md:h-9 md:w-9" strokeWidth={2.75} />
              </span>
              Start Photobooth
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Feature chips */}
        <motion.ul
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-wrap items-center justify-center gap-3 md:gap-5"
        >
          {FEATURES.map(({ Icon, label, bg, rotate }) => (
            <motion.li
              key={label}
              variants={popIn}
              whileHover={{ rotate: 0, scale: 1.08 }}
              style={{ rotate }}
              className={`flex items-center gap-2 rounded-lg border-4 border-ink px-3 py-1.5 font-body text-sm font-bold uppercase shadow-brutal-sm md:text-base ${bg}`}
            >
              <Icon className="h-4 w-4 md:h-5 md:w-5" strokeWidth={3} />
              {label}
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* ---------- Bottom ticker ---------- */}
      <Marquee reverse className="rotate-1 bg-pop-magenta text-white" />
    </section>
  )
}

