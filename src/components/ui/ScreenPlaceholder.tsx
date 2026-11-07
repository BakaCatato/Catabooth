import type { ReactNode } from 'react'

/**
 * TEMPORARY neo-brutalist shell used by the not-yet-built screens so the
 * full flow is clickable end-to-end. Delete once each screen is implemented.
 */
export default function ScreenPlaceholder({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <section className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border-[5px] border-ink bg-paper p-8 text-center shadow-brutal-lg">
        <h2 className="mb-6 font-display text-5xl tracking-wide">{title}</h2>
        <div className="flex flex-wrap justify-center gap-3">{children}</div>
      </div>
    </section>
  )
}

export function StubButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-lg border-4 border-ink bg-pop-yellow px-4 py-2 font-bold uppercase shadow-brutal-sm transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none"
    >
      {children}
    </button>
  )
}

