import { motion } from 'framer-motion'

interface HalftoneBackgroundProps {
  /** Dot color (hex / rgba) */
  dotColor?: string
  /** Distance between dot centers in px */
  size?: number
  /** Dot radius in px */
  dotRadius?: number
  /** Seconds for one full tile shift — lower is faster */
  duration?: number
  /** Drift direction */
  direction?: 1 | -1
  className?: string
}

/**
 * Infinitely drifting halftone dot pattern.
 * Shifting background-position by exactly one tile makes the loop seamless.
 * Respects prefers-reduced-motion through <MotionConfig reducedMotion="user">.
 */
export default function HalftoneBackground({
  dotColor = 'rgba(10, 10, 10, 0.15)',
  size = 24,
  dotRadius = 3,
  duration = 6,
  direction = 1,
  className = '',
}: HalftoneBackgroundProps) {
  const shift = size * direction

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `radial-gradient(${dotColor} ${dotRadius}px, transparent ${dotRadius + 0.5}px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
      animate={{ backgroundPosition: ['0px 0px', `${shift}px ${shift}px`] }}
      transition={{ duration, ease: 'linear', repeat: Infinity }}
    />
  )
}

