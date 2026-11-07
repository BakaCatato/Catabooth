import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { LoaderCircle, type LucideIcon } from 'lucide-react'

const INK = '#2a211d'

type ButtonColor = 'rose' | 'butter' | 'mint' | 'cream' | 'magenta' | 'yellow' | 'cyan' | 'green' | 'white' | 'ink'
type ButtonSize = 'sm' | 'md' | 'lg'

const COLOR_CLASSES: Record<ButtonColor, string> = {
  rose: 'bg-rose text-ink',
  butter: 'bg-butter text-ink',
  mint: 'bg-mint text-ink',
  cream: 'bg-cream text-ink',
  magenta: 'bg-rose text-ink',
  yellow: 'bg-butter text-ink',
  cyan: 'bg-mint text-ink',
  green: 'bg-mint text-ink',
  white: 'bg-cream text-ink',
  ink: 'bg-ink text-cream',
}

const SIZE: Record<ButtonSize, { className: string; icon: string; offset: number }> = {
  sm: { className: 'min-h-11 gap-2 rounded-lg border-3 px-3 py-1 text-base', icon: 'h-4 w-4', offset: 3 },
  md: { className: 'min-h-11 gap-2 rounded-xl border-3 px-4 py-2 text-xl', icon: 'h-5 w-5', offset: 4 },
  lg: {
    className: 'min-h-12 gap-3 rounded-2xl border-3 px-6 py-2.5 text-2xl',
    icon: 'h-6 w-6',
    offset: 5,
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

/** Pastel doodle button with a warm ink shadow that presses down. */
export default function BrutalButton({
  children,
  onClick,
  type = 'button',
  color = 'butter',
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
      className={`doodle-button flex cursor-pointer items-center justify-center border-ink font-display tracking-wider outline-none focus-visible:ring-3 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${COLOR_CLASSES[color]} ${className}`}
      initial={false}
      animate={{ x: 0, y: 0, boxShadow: rest }}
      whileHover={disabled ? undefined : { x: -2, y: -2, boxShadow: `${offset + 2}px ${offset + 2}px 0px 0px ${INK}` }}
      whileTap={disabled ? undefined : { x: offset, y: offset, boxShadow: `0px 0px 0px 0px ${INK}` }}
      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
    >
      {Icon && <Icon aria-hidden="true" className={`shrink-0 ${iconClass} ${loading ? 'motion-safe:animate-spin' : ''}`} strokeWidth={2.3} />}
      {children}
    </motion.button>
  )
}

