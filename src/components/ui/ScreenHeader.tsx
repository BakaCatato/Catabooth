import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star } from 'lucide-react'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backDisabled?: boolean
  /** Extra content on the right (badges, toggles…) */
  aside?: ReactNode
}

/** A compact cabin heading with a taped-on, handwritten subtitle. */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  backDisabled = false,
  aside,
}: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      {onBack && (
        <motion.button
          type="button"
          onClick={onBack}
          disabled={backDisabled}
          aria-label="Go back"
          className="screen-back flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-3 border-ink bg-cream shadow-brutal-sm outline-none focus-visible:ring-3 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          whileHover={backDisabled ? undefined : { rotate: -4, y: -1 }}
          whileTap={backDisabled ? undefined : { scale: 0.9 }}
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={3} />
        </motion.button>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="screen-title font-display">
          {title}
          <Star className="screen-title-star" aria-hidden="true" />
        </h1>
        {subtitle && (
          <p className="screen-subtitle">
            {subtitle}
          </p>
        )}
      </div>

      {aside && <div className="screen-header-aside">{aside}</div>}
    </header>
  )
}

