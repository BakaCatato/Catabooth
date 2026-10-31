// TODO: Full html2canvas export + email implementation in a follow-up prompt.
import ScreenPlaceholder, { StubButton } from '../components/ui/ScreenPlaceholder'
import { FILTERS, type ResultProps } from '../types/photobooth'

export default function Result({ photos, layout, filter, onBack, onRestart }: ResultProps) {
  return (
    <ScreenPlaceholder title="Your Strip!">
      <p className="w-full font-bold">
        {photos.length} photos · {layout} · {FILTERS[filter].label}
      </p>
      <StubButton onClick={onBack}>Back</StubButton>
      <StubButton onClick={onRestart}>Start over</StubButton>
    </ScreenPlaceholder>
  )
}

