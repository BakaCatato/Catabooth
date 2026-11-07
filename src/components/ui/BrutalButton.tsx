import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { LoaderCircle, type LucideIcon } from 'lucide-react'

const INK = '#0a0a0a'

type ButtonColor = 'magenta' | 'yellow' | 'cyan' | 'green' | 'white' | 'ink'
type ButtonSize = 'sm' | 'md' | 'lg'

const COLOR_CLASSES: Record<ButtonColor, string> = {
  magenta: 'bg-pop-magenta text-white text-outline-sm',
  yellow: 'bg-pop-yellow text-ink',
  cyan: 'bg-pop-cyan text-ink',
  green: 'bg-pop-green text-ink',
  white: 'bg-white text-ink',
  ink: 'bg-ink text-pop-yellow',
}

const SIZE: Record<ButtonSize, { className: string; icon: string; offset: number }> = {
  sm: { className: 'gap-2 rounded-lg border-4 px-3 py-1.5 text-lg', icon: 'h-4 w-4', offset: 4 },
  md: { className: 'gap-2.5 rounded-xl border-4 px-5 py-2.5 text-2xl', icon: 'h-5 w-5', offset: 6 },
  lg: {
    className: 'gap-3 rounded-2xl border-[5px] px-7 py-3.5 text-3xl md:px-10 md:text-4xl',
    icon: 'h-7 w-7 md:h-8 md:w-8',
    offset: 8,
  },
}

interface BrutalButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  color?: ButtonColor
  size?: ButtonSize
  icon?: LucideIcon
  /** Shows a spinner instead of the icon and blocks clicks */
  loading?: boolean
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/** Neo-brutalist push button: hard offset shadow that collapses on press */
export default function BrutalButton({
  children,
  onClick,
  type = 'button',
  color = 'yellow',
  size = 'md',
  icon,
  loading = false,
  disabled: disabledProp = false,
  className = '',
  'aria-label': ariaLabel,
}: BrutalButtonProps) {
  const { className: sizeClass, icon: iconClass, offset } = SIZE[size]
  const rest = `${offset}px ${offset}px 0px 0px ${INK}`
  const disabled = disabledProp || loading
  const Icon = loading ? LoaderCircle : icon

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={`flex cursor-pointer items-center justify-center border-ink font-display tracking-wider outline-none focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${COLOR_CLASSES[color]} ${className}`}
      initial={false}
      animate={{ x: 0, y: 0, boxShadow: rest }}
      whileHover={disabled ? undefined : { x: -2, y: -2, boxShadow: `${offset + 2}px ${offset + 2}px 0px 0px ${INK}` }}
      whileTap={disabled ? undefined : { x: offset, y: offset, boxShadow: `0px 0px 0px 0px ${INK}` }}
      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
    >
      {Icon && <Icon className={`shrink-0 ${iconClass} ${loading ? 'animate-spin' : ''}`} strokeWidth={3} />}
      {children}
    </motion.button>
  )
}

