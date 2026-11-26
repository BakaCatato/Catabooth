import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export const MUTE_STORAGE_KEY = 'catabooth_muted'
type BoothSound = 'dispense' | 'insert' | 'curtain' | 'print' | 'shutter'
type StopSound = () => void
const silent: StopSound = () => {}

function readMuted() {
  try { return localStorage.getItem(MUTE_STORAGE_KEY) === 'true' } catch { return false }
}

/** Disposable audio graphs; every sound passes through the shared mute gain. */
function synthesize(context: AudioContext, output: GainNode, sound: BoothSound, duration: number): StopSound {
  const nodes: AudioNode[] = []
  const sources: AudioScheduledSourceNode[] = []
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    for (const source of sources) { try { source.stop() } catch { /* Already ended. */ } }
    for (const node of nodes) node.disconnect()
  }
  const start = context.currentTime
  const envelope = (volume: number, delay: number, length: number, attack = 0.005) => {
    const gain = context.createGain()
    nodes.push(gain)
    gain.gain.setValueAtTime(0, start + delay)
    gain.gain.linearRampToValueAtTime(volume, start + delay + Math.min(attack, length / 3))
    gain.gain.exponentialRampToValueAtTime(0.0001, start + delay + length)
    gain.connect(output)
    return gain
  }
  const tone = (frequency: number, end: number, delay: number, length: number, volume: number, type: OscillatorType) => {
    const oscillator = context.createOscillator()
    nodes.push(oscillator)
    sources.push(oscillator)
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start + delay)
    oscillator.frequency.exponentialRampToValueAtTime(end, start + delay + length)
    oscillator.connect(envelope(volume, delay, length))
    oscillator.start(start + delay)
    oscillator.stop(start + delay + length + 0.01)
  }
  const noise = (length: number, volume: number, frequency: number, end: number, delay = 0) => {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * length), context.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    nodes.push(source, filter)
    sources.push(source)
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.Q.value = 0.7
    filter.frequency.setValueAtTime(frequency, start + delay)
    filter.frequency.exponentialRampToValueAtTime(end, start + delay + length)
    source.connect(filter)
    filter.connect(envelope(volume, delay, length, sound === 'shutter' ? 0.002 : 0.12))
    source.start(start + delay)
    source.stop(start + delay + length)
  }
  try {
    switch (sound) {
      case 'dispense':
        tone(180, 65, 0, 0.12, 0.07, 'triangle')
        tone(520, 180, 0.13, 0.08, 0.07, 'triangle')
        break
      case 'insert':
        tone(1320, 1100, 0, 0.32, 0.035, 'sine')
        tone(2100, 1700, 0.04, 0.26, 0.035, 'sine')
        tone(2800, 2400, 0.08, 0.2, 0.035, 'sine')
        break
      case 'curtain': noise(0.5, 0.09, 1100, 280); break
      case 'print':
        noise(duration, 0.045, 700, 420)
        tone(105, 80, 0, duration, 0.018, 'sawtooth')
        tone(210, 160, 0, duration, 0.012, 'sine')
        break
      case 'shutter':
        noise(0.065, 0.16, 2400, 1200)
        noise(0.07, 0.12, 1800, 900, 0.045)
        tone(1150, 650, 0, 0.1, 0.025, 'sine')
        break
    }
    let remaining = sources.length
    for (const source of sources) source.onended = () => { if (--remaining === 0) stop() }
    return stop
  } catch {
    stop()
    return silent
  }
}

/** App owns the audio context so it survives screen transitions. */
export function useBoothAudio() {
  const [muted, setMuted] = useState(readMuted)
  const mutedRef = useRef(muted)
  const contextRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const activeRef = useRef(new Set<StopSound>())

  const applyMuted = useCallback((next: boolean) => {
    mutedRef.current = next
    setMuted(next)
    if (gainRef.current) gainRef.current.gain.value = next ? 0 : 1
    if (next) {
      for (const stop of activeRef.current) stop()
      activeRef.current.clear()
    }
  }, [])

  const unlockAudio = useCallback(() => {
    if (mutedRef.current) return
    try {
      if (!window.AudioContext) return
      if (!contextRef.current || contextRef.current.state === 'closed') {
        const context = new AudioContext()
        const gain = context.createGain()
        gain.connect(context.destination)
        contextRef.current = context
        gainRef.current = gain
      }
      const context = contextRef.current
      if (context.state === 'suspended') void context.resume().catch(() => {})
    } catch { /* Blocked or unavailable audio must not interrupt the booth. */ }
  }, [])

  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current
    applyMuted(next)
    try { localStorage.setItem(MUTE_STORAGE_KEY, String(next)) } catch { /* Keep the in-memory preference. */ }
    if (!next) unlockAudio()
  }, [applyMuted, unlockAudio])

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === MUTE_STORAGE_KEY || event.key === null) applyMuted(readMuted())
    }
    window.addEventListener('storage', sync)
    const active = activeRef.current
    return () => {
      window.removeEventListener('storage', sync)
      for (const stop of active) stop()
      active.clear()
      const context = contextRef.current
      contextRef.current = null
      gainRef.current = null
      if (context && context.state !== 'closed') void context.close().catch(() => {})
    }
  }, [applyMuted])

  const playSound = useCallback((sound: BoothSound, duration = 2.8): StopSound => {
    if (mutedRef.current) return silent
    const context = contextRef.current
    const output = gainRef.current
    // Gestures unlock audio; never queue stale effects behind autoplay restrictions.
    if (!context || !output || context.state !== 'running') return silent
    const stopGraph = synthesize(context, output, sound, duration)
    const stop = () => {
      window.clearTimeout(timer)
      stopGraph()
      activeRef.current.delete(stop)
    }
    const timer = window.setTimeout(stop, (sound === 'print' ? duration + 0.1 : 0.7) * 1000)
    activeRef.current.add(stop)
    return stop
  }, [])
  const playCurtainSwoosh = useCallback(() => playSound('curtain'), [playSound])
  const playPrintWhir = useCallback((duration = 2.8) => playSound('print', duration), [playSound])
  const playShutterSound = useCallback(() => playSound('shutter'), [playSound])
  return useMemo(() => ({ muted, toggleMuted, unlockAudio, playSound, playCurtainSwoosh, playPrintWhir, playShutterSound }),
    [muted, toggleMuted, unlockAudio, playSound, playCurtainSwoosh, playPrintWhir, playShutterSound])
}

export const BoothSoundsContext = createContext<ReturnType<typeof useBoothAudio> | null>(null)

export function useBoothSounds() {
  const sounds = useContext(BoothSoundsContext)
  if (!sounds) throw new Error('Booth sounds must be used inside the audio provider.')
  return sounds
}
