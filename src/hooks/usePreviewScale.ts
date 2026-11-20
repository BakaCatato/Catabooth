import { useLayoutEffect, useRef, useState } from 'react'

/** Fit printable artwork into its viewport. The editor can keep phone photos
 * legible with a minimum scale and scroll the returned height inside that viewport.
 */
export function usePreviewScale(fitViewport = false, minimumMobileScale = 0) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ scale: 1, height: 300 })

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return
    const measure = () => {
      const availableHeight = fitViewport || window.innerWidth >= 768 ? viewport.clientHeight - 12 : Math.max(300, window.innerHeight * 0.8)
      const widthScale = Math.min(1, Math.max(1, viewport.clientWidth - 12) / Math.max(1, content.offsetWidth))
      const fitScale = Math.min(widthScale, Math.max(1, availableHeight) / Math.max(1, content.offsetHeight))
      const scale = window.innerWidth < 768 ? Math.min(widthScale, Math.max(minimumMobileScale, fitScale)) : fitScale
      const height = Math.ceil(content.offsetHeight * scale + 12)
      setSize((previous) => previous.scale === scale && previous.height === height ? previous : { scale, height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(content)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [fitViewport, minimumMobileScale])

  return { viewportRef, contentRef, ...size }
}
