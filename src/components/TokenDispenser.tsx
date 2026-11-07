import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, type PanInfo } from 'framer-motion'
import { Cat, Check, Sparkles } from 'lucide-react'

export type TokenStep = 'need-token' | 'token-dispensed' | 'token-inserted'

interface TokenDispenserProps {
  tokenStep: TokenStep
  reducedMotion: boolean
  onDispense: () => void
  onInsertSound: () => void
  onInserted: () => void
}

interface CoinFlight { x: number; y: number; toX: number; toY: number; size: number }

export default function TokenDispenser({ tokenStep, reducedMotion, onDispense, onInsertSound, onInserted }: TokenDispenserProps) {
  const tokenRef = useRef<HTMLButtonElement>(null)
  const slotRef = useRef<HTMLButtonElement>(null)
  const insertingRef = useRef(false)
  const draggedRef = useRef(false)
  const [flight, setFlight] = useState<CoinFlight | null>(null)
  const [overSlot, setOverSlot] = useState(false)
  const ready = tokenStep === 'token-dispensed' && !flight

  useEffect(() => {
    if (tokenStep === 'token-dispensed') tokenRef.current?.focus({ preventScroll: true })
  }, [tokenStep])

  useEffect(() => {
    if (!flight) return
    // Keep progression independent of animation callbacks (including reduced motion).
    const timer = window.setTimeout(() => {
      setFlight(null)
      onInserted()
    }, reducedMotion ? 0 : 420)
    return () => window.clearTimeout(timer)
  }, [flight, reducedMotion, onInserted])

  const insertToken = () => {
    if (!ready || insertingRef.current || !tokenRef.current || !slotRef.current) return
    insertingRef.current = true
    const coin = tokenRef.current.getBoundingClientRect()
    const size = tokenRef.current.offsetWidth
    const slot = slotRef.current.getBoundingClientRect()
    onInsertSound()
    setOverSlot(false)
    setFlight({ x: coin.left, y: coin.top, toX: slot.left + slot.width / 2 - size / 2, toY: slot.top + slot.height / 2 - size / 2, size })
  }

  const isOverSlot = ({ point }: PanInfo) => {
    const slot = slotRef.current?.getBoundingClientRect()
    if (!slot) return false
    // Motion reports page coordinates; the target rectangle is viewport-relative.
    const x = point.x - window.scrollX
    const y = point.y - window.scrollY
    return x >= slot.left - 10 && x <= slot.right + 10 && y >= slot.top - 10 && y <= slot.bottom + 10
  }

  return (
    <div className="booth-token-station mt-5" data-token-step={tokenStep}>
      <div className="booth-token-panel">
        <div className="flex items-center justify-between gap-2 border-b-2 border-ink/20 pb-2">
          <span className="font-display text-lg tracking-widest">ONE HAPPY TOKEN</span>
          <Sparkles size={18} aria-hidden="true" />
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onDispense}
              disabled={tokenStep !== 'need-token'}
              className="booth-dispense-button"
            >
              {tokenStep === 'need-token' ? 'DISPENSE FREE COIN 🪙' : tokenStep === 'token-inserted' ? 'TOKEN ACCEPTED ✓' : 'YOUR COIN IS READY!'}
            </button>
            <div className="booth-token-tray" aria-hidden="true" />
          </div>
          <div className="text-center">
            <button
              ref={slotRef}
              type="button"
              className={`booth-coin-slot ${overSlot ? 'booth-coin-slot-active' : ''}`}
              disabled={!ready}
              onClick={insertToken}
              aria-label="Coin slot: insert token"
              aria-describedby="token-instructions"
            >
              <span />
            </button>
            <span className="mt-1 block text-[8px] font-bold tracking-widest">INSERT HERE</span>
          </div>
        </div>
        <div className="booth-token-pickup">
          {ready ? (
            <motion.button
              ref={tokenRef}
              type="button"
              className="booth-golden-token"
              aria-label="Golden Cat Token: insert coin"
              aria-describedby="token-instructions"
              drag
              dragSnapToOrigin
              dragMomentum={false}
              onPointerDown={() => { draggedRef.current = false }}
              onDragStart={() => { draggedRef.current = true }}
              onDrag={(_, info) => setOverSlot(isOverSlot(info))}
              onDragEnd={(_, info) => { setOverSlot(false); if (isOverSlot(info)) insertToken() }}
              onClick={(event) => { if (!draggedRef.current || event.detail === 0) insertToken() }}
              initial={reducedMotion ? false : { y: -20, scale: 0.6, rotate: -25 }}
              animate={{ y: 0, scale: 1, rotate: -8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              whileDrag={{ scale: 1.08, rotate: 8, cursor: 'grabbing' }}
            >
              <Cat size={30} strokeWidth={2.3} aria-hidden="true" />
              <span aria-hidden="true">CATA</span>
            </motion.button>
          ) : (
            <span className="booth-token-placeholder" aria-hidden="true">
              {tokenStep === 'token-inserted' ? <Check size={26} /> : <Cat size={26} />}
            </span>
          )}
          <p id="token-instructions" className="text-left text-[10px] font-bold leading-relaxed">
            {flight ? 'A little clink… a little magic!' : tokenStep === 'need-token' ? 'Your first little adventure: grab a free coin.' : tokenStep === 'token-dispensed' ? 'Drag into the slot, or tap the coin or slot to insert.' : 'All yours! Step inside & make a memory.'}
            <span className="mt-1 block text-[8px] tracking-[0.15em]">100% FREE · ALWAYS</span>
          </p>
        </div>
      </div>
      {flight && createPortal(
        <motion.div
          className="booth-golden-token booth-token-flight"
          style={{ width: flight.size, height: flight.size }}
          aria-hidden="true"
          initial={{ x: flight.x, y: flight.y, scaleX: 1, opacity: 1 }}
          animate={{ x: flight.toX, y: flight.toY, scaleX: 0.08, opacity: [1, 1, 0] }}
          transition={{ duration: reducedMotion ? 0 : 0.42, ease: 'easeInOut' }}
        >
          <Cat size={30} strokeWidth={2.3} /><span>CATA</span>
        </motion.div>,
        document.body,
      )}
    </div>
  )
}
