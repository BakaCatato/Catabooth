import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backDisabled?: boolean
  /** Extra content on the right (badges, toggles…) */
  aside?: ReactNode
}

/** Shared comic-panel header: back button, outlined title, optional aside */
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  backDisabled = false,
  aside,
}: ScreenHeaderProps) {
  return (
    <header className="flex flex-wrap items-center gap-4">
      {onBack && (
        <motion.button
          type="button"
          onClick={onBack}
          disabled={backDisabled}
          aria-label="Go back"
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border-4 border-ink bg-white shadow-brutal-sm outline-none focus-visible:ring-4 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          whileHover={backDisabled ? undefined : { rotate: -8, scale: 1.05 }}
          whileTap={backDisabled ? undefined : { scale: 0.9 }}
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={3} />
        </motion.button>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="font-display text-4xl leading-none tracking-wide text-white text-outline [text-shadow:4px_4px_0_#0a0a0a] sm:text-5xl md:text-6xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 inline-block -rotate-1 rounded-md border-[3px] border-ink bg-white px-2 py-0.5 text-sm font-bold uppercase tracking-widest md:text-base">
            {subtitle}
          </p>
        )}
      </div>

      {aside}
    </header>
  )
}

