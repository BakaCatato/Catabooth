import { useCallback, useEffect, useRef } from 'react'

type BoothSound = 'dispense' | 'insert'

export function useBoothSounds() {
  const contextRef = useRef<AudioContext | null>(null)

  useEffect(() => () => {
    const context = contextRef.current
    contextRef.current = null
    if (context && context.state !== 'closed') void context.close().catch(() => {})
  }, [])

  return useCallback((sound: BoothSound) => {
    // Only create/resume audio from an explicit pointer or keyboard gesture.
    try {
      if (!window.AudioContext) return
      const context = contextRef.current ?? new AudioContext()
      contextRef.current = context

      const play = () => {
        if (context.state !== 'running') return
        const notes = sound === 'dispense'
          ? [{ frequency: 180, end: 65, delay: 0, duration: 0.12 }, { frequency: 520, end: 180, delay: 0.13, duration: 0.08 }]
          : [{ frequency: 1320, end: 1100, delay: 0, duration: 0.32 }, { frequency: 2100, end: 1700, delay: 0.04, duration: 0.26 }, { frequency: 2800, end: 2400, delay: 0.08, duration: 0.2 }]

        for (const note of notes) {
          const oscillator = context.createOscillator()
          const gain = context.createGain()
          const start = context.currentTime + note.delay
          oscillator.type = sound === 'dispense' ? 'triangle' : 'sine'
          oscillator.frequency.setValueAtTime(note.frequency, start)
          oscillator.frequency.exponentialRampToValueAtTime(note.end, start + note.duration)
          gain.gain.setValueAtTime(0, start)
          gain.gain.linearRampToValueAtTime(sound === 'dispense' ? 0.07 : 0.035, start + 0.005)
          gain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration)
          oscillator.connect(gain)
          gain.connect(context.destination)
          oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
          oscillator.start(start)
          oscillator.stop(start + note.duration + 0.01)
        }
      }

      if (context.state === 'suspended') void context.resume().then(play).catch(() => {})
      else play()
    } catch {
      // Sound is decoration; a blocked audio context must never block entry.
    }
  }, [])
}
