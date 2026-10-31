// TODO: Full react-webcam + 3-second countdown implementation in a follow-up prompt.
import ScreenPlaceholder, { StubButton } from '../components/ui/ScreenPlaceholder'
import type { CameraScreenProps, PhotoDataUrl } from '../types/photobooth'

const STUB_COLORS = ['#00e5ff', '#ff2bd6', '#ffe600', '#39ff14']

/** Dev helper: fake "photos" so downstream screens can be built without a webcam */
function makeStubPhotos(count: number): PhotoDataUrl[] {
  return Array.from({ length: count }, (_, i) => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = STUB_COLORS[i % STUB_COLORS.length]
    ctx.fillRect(0, 0, 640, 480)
    ctx.fillStyle = '#0a0a0a'
    ctx.font = 'bold 160px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(i + 1), 320, 240)
    return canvas.toDataURL('image/jpeg', 0.9)
  })
}

export default function CameraScreen({ frameCount, onComplete, onBack }: CameraScreenProps) {
  return (
    <ScreenPlaceholder title={`Camera — ${frameCount} shots`}>
      <StubButton onClick={() => onComplete(makeStubPhotos(frameCount))}>Fake capture</StubButton>
      <StubButton onClick={onBack}>Back</StubButton>
    </ScreenPlaceholder>
  )
}

