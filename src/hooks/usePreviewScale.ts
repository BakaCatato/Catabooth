import { useLayoutEffect, useRef, useState } from 'react'

/** Fit a full-size printable preview into its allotted screen area. */
export function usePreviewScale() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ scale: 1, height: 300 })

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return
    const measure = () => {
      const availableHeight = window.innerWidth >= 768 ? viewport.clientHeight - 12 : Math.max(300, window.innerHeight * 0.8)
      const scale = Math.min(1, Math.max(1, availableHeight) / Math.max(1, content.offsetHeight), Math.max(1, viewport.clientWidth - 12) / Math.max(1, content.offsetWidth))
      const height = Math.ceil(content.offsetHeight * scale + 12)
      setSize((previous) => previous.scale === scale && previous.height === height ? previous : { scale, height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(content)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  return { viewportRef, contentRef, ...size }
}
