import { useEffect, useState } from 'react'
import { FILTERS, type FilterId, type PhotoDataUrl } from '../types/photobooth'

const PHOTO_ASPECT = 4 / 3

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load captured photo'))
    img.src = src
  })
}

/**
 * Bakes the chosen filter (including pixelation + CSS filter primitives) and
 * 4:3 center crop into an offscreen <canvas> for each photo.
 */
export async function bakeFilteredPhotos(
  photos: readonly PhotoDataUrl[],
  filter: FilterId,
): Promise<PhotoDataUrl[]> {
  const { css, pixelSize } = FILTERS[filter]

  return Promise.all(
    photos.map(async (src) => {
      const img = await loadImage(src)
      const iw = img.naturalWidth || 640
      const ih = img.naturalHeight || 480

      let sw = iw
      let sh = ih
      if (iw / ih > PHOTO_ASPECT) sw = Math.round(ih * PHOTO_ASPECT)
      else sh = Math.round(iw / PHOTO_ASPECT)
      const sx = Math.round((iw - sw) / 2)
      const sy = Math.round((ih - sh) / 2)

      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      const ctx = canvas.getContext('2d')
      if (!ctx) return src

      if (pixelSize && pixelSize > 1) {
        const tinyW = Math.max(16, Math.round(sw / pixelSize))
        const tinyH = Math.max(12, Math.round(sh / pixelSize))
        const tiny = document.createElement('canvas')
        tiny.width = tinyW
        tiny.height = tinyH
        const tinyCtx = tiny.getContext('2d')
        if (tinyCtx) {
          if (css !== 'none') tinyCtx.filter = css
          tinyCtx.drawImage(img, sx, sy, sw, sh, 0, 0, tinyW, tinyH)
          tinyCtx.filter = 'none'
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(tiny, 0, 0, tinyW, tinyH, 0, 0, sw, sh)
          return canvas.toDataURL('image/jpeg', 0.92)
        }
      }

      if (css !== 'none') {
        ctx.filter = css
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      ctx.filter = 'none'

      return canvas.toDataURL('image/jpeg', 0.92)
    }),
  )
}

/**
 * React hook that returns baked photos for a given filter.
 * For non-pixelated filters on the live preview, raw photos can be shown
 * immediately with CSS `filter`; for 'pixelate' or canvas export, the baked
 * data URLs provide the exact pixel blocks.
 */
export function useBakedPhotos(photos: readonly PhotoDataUrl[], filter: FilterId) {
  const [baked, setBaked] = useState<{
    source: readonly PhotoDataUrl[]
    filter: FilterId
    photos: PhotoDataUrl[]
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    bakeFilteredPhotos(photos, filter)
      .then((res) => {
        if (!cancelled) setBaked({ source: photos, filter, photos: res })
      })
      .catch(() => {
        if (!cancelled) setBaked(null)
      })
    return () => {
      cancelled = true
    }
  }, [photos, filter])

  // A new selection can render before its async bake finishes. Show that
  // selection's CSS preview instead of pixels from the previous filter.
  return baked?.source === photos && baked.filter === filter ? baked.photos : null
}

